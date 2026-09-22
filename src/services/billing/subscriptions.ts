import "server-only";
import { db } from "@/lib/db/client";
import { getUserAuditAllowance } from "./entitlements";
import { requireDynamicStripe } from "./stripe-admin";
import type { SubscriptionStatus } from "@prisma/client";

export type AdminSubscriptionsFilter = {
  search?: string;
  planId?: string;
  status?: SubscriptionStatus;
  page?: number;
  limit?: number;
};

export async function getAdminSubscriptions(filter: AdminSubscriptionsFilter = {}) {
  const page = Math.max(1, filter.page ?? 1);
  const limit = Math.min(100, Math.max(1, filter.limit ?? 25));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (filter.status) {
    where.status = filter.status;
  }

  if (filter.planId) {
    where.planId = filter.planId;
  }

  if (filter.search && filter.search.trim().length > 0) {
    const q = filter.search.trim();
    where.user = {
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    };
  }

  const [totalCount, subscriptions] = await Promise.all([
    db.subscription.count({ where }),
    db.subscription.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            _count: {
              select: {
                reports: true,
                websites: true,
              },
            },
          },
        },
        plan: true,
        payments: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
    }),
  ]);

  // Enrich with live usage metrics & total spend
  const enriched = await Promise.all(
    subscriptions.map(async (sub) => {
      const allowance = await getUserAuditAllowance(sub.userId);
      const totalSpendCents = await db.payment.aggregate({
        where: { userId: sub.userId, status: "SUCCEEDED" },
        _sum: { amountCents: true },
      });

      return {
        ...sub,
        allowance,
        totalSpendCents: totalSpendCents._sum.amountCents ?? 0,
      };
    }),
  );

  return {
    items: enriched,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    page,
    limit,
  };
}

export async function adminChangeUserPlan(
  userId: string,
  newPlanId: string,
  actorId: string,
) {
  try {
    const [user, targetPlan] = await Promise.all([
      db.user.findUnique({ where: { id: userId } }),
      db.plan.findUnique({ where: { id: newPlanId } }),
    ]);

    if (!user) return { ok: false, error: "User not found" };
    if (!targetPlan) return { ok: false, error: "Target plan not found" };

    const activeSub = await db.subscription.findFirst({
      where: { userId, status: { in: ["ACTIVE", "TRIALING"] } },
      orderBy: { createdAt: "desc" },
    });

    if (activeSub) {
      await db.subscription.update({
        where: { id: activeSub.id },
        data: { planId: targetPlan.id },
      });
    } else {
      await db.subscription.create({
        data: {
          userId,
          planId: targetPlan.id,
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // Map plan to User.plan enum (PREMIUM if non-free, otherwise FREE)
    const userPlanEnum = targetPlan.key.toUpperCase() === "FREE" ? "FREE" : "PREMIUM";
    await db.user.update({
      where: { id: userId },
      data: { plan: userPlanEnum },
    });

    await db.notification.create({
      data: {
        userId,
        type: "PLAN_UPGRADED",
        title: "Your plan was updated",
        body: `Your plan has been changed to ${targetPlan.name} by support.`,
        linkUrl: "/dashboard/billing",
      },
    });

    await db.billingAuditLog.create({
      data: {
        actorId,
        action: "subscription.manual_plan_change",
        entityType: "user",
        entityId: userId,
        metadata: {
          previousPlan: user.plan,
          newPlanId: targetPlan.id,
          newPlanKey: targetPlan.key,
          newPlanName: targetPlan.name,
        },
      },
    });

    return { ok: true, message: `Successfully updated user plan to ${targetPlan.name}.` };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to change user plan",
    };
  }
}

export async function adminCancelSubscription(
  subscriptionId: string,
  immediately: boolean,
  actorId: string,
) {
  try {
    const sub = await db.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true },
    });

    if (!sub) return { ok: false, error: "Subscription not found" };

    if (sub.stripeSubscriptionId) {
      try {
        const stripe = await requireDynamicStripe();
        if (immediately) {
          await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
        } else {
          await stripe.subscriptions.update(sub.stripeSubscriptionId, {
            cancel_at_period_end: true,
          });
        }
      } catch (stripeErr) {
        console.warn("[Stripe] Failed to cancel in Stripe API directly:", stripeErr);
      }
    }

    if (immediately) {
      const freePlan = await db.plan.findUnique({ where: { key: "FREE" } });
      await db.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: "CANCELED",
          canceledAt: new Date(),
          cancelAtPeriodEnd: false,
          ...(freePlan ? { planId: freePlan.id } : {}),
        },
      });
      await db.user.update({
        where: { id: sub.userId },
        data: { plan: "FREE" },
      });
    } else {
      await db.subscription.update({
        where: { id: subscriptionId },
        data: {
          cancelAtPeriodEnd: true,
          canceledAt: new Date(),
        },
      });
    }

    await db.billingAuditLog.create({
      data: {
        actorId,
        action: immediately ? "subscription.cancelled_immediately" : "subscription.cancel_at_period_end_set",
        entityType: "subscription",
        entityId: subscriptionId,
        metadata: { userId: sub.userId, immediately },
      },
    });

    return { ok: true, message: immediately ? "Subscription canceled immediately." : "Subscription will cancel at end of period." };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to cancel subscription",
    };
  }
}
