import "server-only";
import { db } from "@/lib/db/client";
import { getSetting } from "@/services/settings/get";
import { STANDARD_FEATURE_KEYS, type FeatureKey } from "./constants";

export { STANDARD_FEATURE_KEYS, type FeatureKey };

export type AllowanceSummary = {
  limit: number;
  used: number;
  bonusCredits: number;
  remaining: number;
  isUnlimited: boolean;
  planKey: string;
  planName: string;
  limitType: string;
  periodResetsAt: Date | null;
};

/**
 * Calculates current audit allowance for a user based on their active subscription,
 * custom plan entitlements, usage events in period, and active non-expired bonus credits.
 */
export async function getUserAuditAllowance(userId: string): Promise<AllowanceSummary> {
  // 1. Check for an active or trialing subscription
  const activeSub = await db.subscription.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "TRIALING"] },
    },
    include: {
      plan: {
        include: {
          entitlements: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  let planKey = "FREE";
  let planName = "Free Plan";
  let limit = 3;
  let limitType = "MONTHLY";
  let resetPeriod = "MONTHLY";
  let isUnlimited = false;
  let periodStart: Date;
  let periodEnd: Date | null = null;

  if (activeSub && activeSub.plan) {
    const plan = activeSub.plan;
    planKey = plan.key;
    planName = plan.name;
    limit = plan.auditLimitPerMonth;
    limitType = plan.auditLimitType;
    resetPeriod = plan.auditResetPeriod;

    if (limitType === "UNLIMITED" || limit === -1) {
      isUnlimited = true;
    }

    if (resetPeriod === "BILLING_CYCLE" && activeSub.currentPeriodStart && activeSub.currentPeriodEnd) {
      periodStart = new Date(activeSub.currentPeriodStart);
      periodEnd = new Date(activeSub.currentPeriodEnd);
    } else {
      // Default monthly reset
      const now = new Date();
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    }
  } else {
    // Check fallback user plan from user record
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (user?.plan === "PREMIUM") {
      const premPlan = await db.plan.findUnique({ where: { key: "PREMIUM" } });
      limit = premPlan?.auditLimitPerMonth ?? (await getSetting("premium_audit_limit"));
      planKey = "PREMIUM";
      planName = premPlan?.name ?? "Premium Plan";
    } else {
      const freePlan = await db.plan.findUnique({ where: { key: "FREE" } });
      limit = freePlan?.auditLimitPerMonth ?? (await getSetting("free_audit_limit"));
      planKey = "FREE";
      planName = freePlan?.name ?? "Free Plan";
    }

    const now = new Date();
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  }

  // 2. Count audits run in this period (excluding SYSTEM failures which are free)
  const usedCount = await db.report.count({
    where: {
      userId,
      createdAt: { gte: periodStart },
      deletedAt: null,
      NOT: { status: "FAILED", failureCategory: "SYSTEM" },
    },
  });

  // 3. Count available active non-expired bonus credits
  const now = new Date();
  const bonusCredits = await db.bonusCredit.findMany({
    where: {
      userId,
      remainingUnits: { gt: 0 },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });

  const totalBonusCredits = bonusCredits.reduce((acc, b) => acc + b.remainingUnits, 0);

  const baseRemaining = isUnlimited ? 999999 : Math.max(0, limit - usedCount);
  const remaining = isUnlimited ? 999999 : baseRemaining + totalBonusCredits;

  return {
    limit,
    used: usedCount,
    bonusCredits: totalBonusCredits,
    remaining,
    isUnlimited,
    planKey,
    planName,
    limitType,
    periodResetsAt: periodEnd,
  };
}

/** Check whether user has access to a specific feature flag */
export async function checkUserFeatureAccess(
  userId: string,
  featureKey: string,
): Promise<{ allowed: boolean; limit?: number | null; reason?: string }> {
  // Master Admins and Admins have full access to everything
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, plan: true },
  });

  if (!user) return { allowed: false, reason: "User not found" };
  if (user.role === "MASTER_ADMIN" || user.role === "ADMIN") {
    return { allowed: true, limit: null };
  }

  // Find active subscription plan
  const sub = await db.subscription.findFirst({
    where: { userId, status: { in: ["ACTIVE", "TRIALING"] } },
    include: {
      plan: {
        include: {
          entitlements: {
            where: { featureKey },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (sub?.plan) {
    const entitlement = sub.plan.entitlements[0];
    if (entitlement) {
      return {
        allowed: entitlement.enabled,
        limit: entitlement.limit,
      };
    }
    // If not specifically configured in entitlements, default standard core features to true
    return { allowed: true };
  }

  // Fallback to Plan record matching user.plan or Free
  const fallbackPlan = await db.plan.findUnique({
    where: { key: user.plan },
    include: {
      entitlements: {
        where: { featureKey },
      },
    },
  });

  if (fallbackPlan) {
    const ent = fallbackPlan.entitlements[0];
    if (ent) {
      return { allowed: ent.enabled, limit: ent.limit };
    }
  }

  // Standard defaults for free tier
  if (featureKey === "backlinks" || featureKey === "keywords" || featureKey === "pdf_export") {
    return {
      allowed: user.plan === "PREMIUM",
      reason: "This feature requires an active premium subscription.",
    };
  }

  return { allowed: true };
}

/** Grant bonus credits to a user */
export async function grantUserBonusCredits(
  userId: string,
  units: number,
  reason: string,
  expiresAt: Date | null,
  grantedById?: string,
): Promise<{ ok: boolean; bonusCreditId?: string; error?: string }> {
  try {
    const bonus = await db.$transaction(async (tx) => {
      const row = await tx.bonusCredit.create({
        data: {
          userId,
          units,
          remainingUnits: units,
          reason,
          grantedById,
          expiresAt,
        },
      });

      await tx.usageEvent.create({
        data: {
          userId,
          type: "BONUS_CREDIT_GRANTED",
          units,
          featureKey: "WEBSITE_AUDIT",
          description: reason || `Granted ${units} bonus audit credits`,
        },
      });

      return row;
    });

    return { ok: true, bonusCreditId: bonus.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to grant bonus credits",
    };
  }
}

/** Reset user's usage for current period */
export async function resetUserUsage(
  userId: string,
  actorId?: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await db.usageEvent.create({
      data: {
        userId,
        type: "MANUAL_RESET",
        units: 0,
        featureKey: "WEBSITE_AUDIT",
        description: `Usage manually reset by admin`,
      },
    });

    if (actorId) {
      await db.billingAuditLog.create({
        data: {
          actorId,
          action: "user.usage_reset",
          entityType: "user",
          entityId: userId,
          metadata: { userId },
        },
      });
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to reset usage",
    };
  }
}
