import "server-only";
import { db } from "@/lib/db/client";
import type Stripe from "stripe";
import type { SubscriptionStatus, UserPlan } from "@prisma/client";

const STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: "ACTIVE",
  trialing: "TRIALING",
  past_due: "PAST_DUE",
  canceled: "CANCELED",
  incomplete: "INCOMPLETE",
  incomplete_expired: "INCOMPLETE_EXPIRED",
  unpaid: "UNPAID",
  paused: "PAUSED",
};

const PREMIUM_STATUSES: SubscriptionStatus[] = ["ACTIVE", "TRIALING"];

function tsToDate(ts: number | null | undefined): Date | null {
  return typeof ts === "number" ? new Date(ts * 1000) : null;
}

async function resolveUserId(
  subscription: Stripe.Subscription,
  customerId: string,
): Promise<string | null> {
  const metaUserId = subscription.metadata?.userId;
  if (metaUserId) return metaUserId;

  const existing = await db.subscription.findFirst({
    where: { stripeCustomerId: customerId },
    select: { userId: true },
  });
  return existing?.userId ?? null;
}

async function resolvePlan(subscription: Stripe.Subscription) {
  // 1. Check subscription metadata for planId or planKey
  if (subscription.metadata?.planId) {
    const plan = await db.plan.findUnique({ where: { id: subscription.metadata.planId } });
    if (plan) return plan;
  }

  if (subscription.metadata?.planKey) {
    const plan = await db.plan.findUnique({ where: { key: subscription.metadata.planKey } });
    if (plan) return plan;
  }

  // 2. Check price ID from subscription items
  const priceId = subscription.items?.data?.[0]?.price?.id;
  if (priceId) {
    const planByPrice = await db.plan.findFirst({
      where: {
        OR: [
          { stripePriceMonthlyId: priceId },
          { stripePriceYearlyId: priceId },
          { prices: { some: { stripePriceId: priceId } } },
        ],
      },
    });
    if (planByPrice) return planByPrice;
  }

  // 3. Check product ID from subscription items
  const productId = subscription.items?.data?.[0]?.price?.product;
  if (productId && typeof productId === "string") {
    const planByProduct = await db.plan.findFirst({
      where: { stripeProductId: productId },
    });
    if (planByProduct) return planByProduct;
  }

  // 4. Fallback to PREMIUM plan or first non-free plan
  const fallbackPlan =
    (await db.plan.findUnique({ where: { key: "PREMIUM" } })) ||
    (await db.plan.findFirst({ where: { key: { not: "FREE" } } })) ||
    (await db.plan.findFirst());

  return fallbackPlan;
}

async function setUserPlan(userId: string, plan: UserPlan, planName: string): Promise<void> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { plan: true } });
  if (!user || user.plan === plan) return;

  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { plan } }),
    db.notification.create({
      data: {
        userId,
        type: plan === "PREMIUM" ? "PLAN_UPGRADED" : "PLAN_DOWNGRADED",
        title: plan === "PREMIUM" ? `Welcome to ${planName}` : "Your plan changed",
        body:
          plan === "PREMIUM"
            ? `Your subscription to ${planName} is active. All plan features and audit limits are unlocked.`
            : "Your plan has been changed to Free.",
        linkUrl: "/dashboard/billing",
      },
    }),
  ]);
}

/** Upsert a Subscription row from a Stripe subscription and sync the user's plan. */
export async function syncSubscription(subscription: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const userId = await resolveUserId(subscription, customerId);
  if (!userId) {
    console.error(`[billing] cannot resolve user for subscription ${subscription.id}`);
    return;
  }

  const status = STATUS_MAP[subscription.status] ?? "INCOMPLETE";
  const matchedPlan = await resolvePlan(subscription);

  const item = subscription.items?.data?.[0];
  const periodStart = tsToDate(
    (item as unknown as { current_period_start?: number })?.current_period_start ??
      (subscription as unknown as { current_period_start?: number }).current_period_start,
  );
  const periodEnd = tsToDate(
    (item as unknown as { current_period_end?: number })?.current_period_end ??
      (subscription as unknown as { current_period_end?: number }).current_period_end,
  );

  const data = {
    userId,
    planId: matchedPlan?.id,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    status,
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    canceledAt: tsToDate(subscription.canceled_at),
  };

  await db.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    update: {
      status: data.status,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd,
      canceledAt: data.canceledAt,
      ...(matchedPlan ? { planId: matchedPlan.id } : {}),
    },
    create: {
      userId: data.userId,
      planId: matchedPlan!.id,
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      status: data.status,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd,
      canceledAt: data.canceledAt,
    },
  });

  const hasActivePaidPlan =
    PREMIUM_STATUSES.includes(status) ||
    (await db.subscription.count({
      where: {
        userId,
        status: { in: PREMIUM_STATUSES },
        stripeSubscriptionId: { not: subscription.id },
      },
    })) > 0;

  const userPlanEnum: UserPlan = hasActivePaidPlan ? "PREMIUM" : "FREE";
  await setUserPlan(userId, userPlanEnum, matchedPlan?.name ?? "Premium");
}

/** Record a successful/failed invoice as a Payment + Invoice row. */
export async function syncInvoice(invoice: Stripe.Invoice): Promise<void> {
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const sub = await db.subscription.findFirst({
    where: { stripeCustomerId: customerId },
    select: { userId: true, id: true },
  });
  if (!sub) return;

  const paid = invoice.status === "paid";
  const paymentIntentId =
    typeof (invoice as unknown as { payment_intent?: string | { id: string } }).payment_intent ===
    "string"
      ? ((invoice as unknown as { payment_intent?: string }).payment_intent as string)
      : (invoice as unknown as { payment_intent?: { id: string } }).payment_intent?.id ?? null;

  let paymentId: string | null = null;
  if (paymentIntentId) {
    const payment = await db.payment.upsert({
      where: { stripePaymentIntentId: paymentIntentId },
      update: {
        status: paid ? "SUCCEEDED" : "FAILED",
        paidAt: paid ? new Date() : null,
      },
      create: {
        userId: sub.userId,
        subscriptionId: sub.id,
        stripePaymentIntentId: paymentIntentId,
        amountCents: invoice.amount_paid ?? invoice.amount_due ?? 0,
        currency: invoice.currency ?? "usd",
        status: paid ? "SUCCEEDED" : "FAILED",
        paidAt: paid ? new Date() : null,
      },
    });
    paymentId = payment.id;
  }

  if (invoice.id) {
    await db.invoice.upsert({
      where: { stripeInvoiceId: invoice.id },
      update: {
        amountCents: invoice.amount_paid ?? invoice.amount_due ?? 0,
        pdfUrl: invoice.invoice_pdf ?? null,
        hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
        issuedAt: tsToDate(invoice.created),
        ...(paymentId ? { paymentId } : {}),
      },
      create: {
        userId: sub.userId,
        paymentId,
        stripeInvoiceId: invoice.id,
        invoiceNumber: invoice.number ?? null,
        amountCents: invoice.amount_paid ?? invoice.amount_due ?? 0,
        currency: invoice.currency ?? "usd",
        pdfUrl: invoice.invoice_pdf ?? null,
        hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
        issuedAt: tsToDate(invoice.created),
      },
    });
  }

  if (!paid && invoice.status === "open") {
    await db.notification.create({
      data: {
        userId: sub.userId,
        type: "PAYMENT_FAILED",
        title: "Payment failed",
        body: "We couldn't process your latest payment. Update your payment method to keep your subscription active.",
        linkUrl: "/dashboard/billing",
      },
    });
  }
}
