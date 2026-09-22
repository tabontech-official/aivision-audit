import "server-only";
import { db } from "@/lib/db/client";
import { requireDynamicStripe } from "./stripe-admin";
import { appUrl, type BillingInterval } from "@/lib/stripe/config";

async function findStripeCustomerId(userId: string): Promise<string | null> {
  const sub = await db.subscription.findFirst({
    where: { userId, stripeCustomerId: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { stripeCustomerId: true },
  });
  return sub?.stripeCustomerId ?? null;
}

export async function ensureStripeCustomer(userId: string): Promise<string> {
  const existing = await findStripeCustomerId(userId);
  if (existing) return existing;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (!user) throw new Error("User not found");

  const stripe = await requireDynamicStripe();
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { userId },
  });
  return customer.id;
}

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Creates a Stripe Checkout session for a specific dynamic plan and interval.
 */
export async function createDynamicCheckoutSession(
  userId: string,
  planIdOrKey: string,
  interval: "month" | "year" | "monthly" | "yearly" = "month",
): Promise<CheckoutResult> {
  const normalizedInterval = interval === "yearly" || interval === "year" ? "year" : "month";

  // Find plan by ID or Key
  const plan = await db.plan.findFirst({
    where: {
      OR: [{ id: planIdOrKey }, { key: planIdOrKey.toLowerCase() }, { key: planIdOrKey.toUpperCase() }],
      isActive: true,
    },
    include: {
      prices: { where: { isActive: true } },
    },
  });

  if (!plan) {
    return { ok: false, error: "Selected plan is not currently available." };
  }

  // Free plans do not go through Stripe checkout
  if (plan.priceMonthlyCents === 0 && plan.priceYearlyCents === 0) {
    // Switch plan directly
    await db.user.update({
      where: { id: userId },
      data: { plan: "FREE" },
    });
    return { ok: true, url: appUrl("/dashboard/billing?downgraded=true") };
  }

  // Resolve Stripe Price ID
  let stripePriceId: string | null = null;
  if (normalizedInterval === "year") {
    stripePriceId = plan.stripePriceYearlyId || plan.prices.find((p) => p.interval === "year")?.stripePriceId || null;
  } else {
    stripePriceId = plan.stripePriceMonthlyId || plan.prices.find((p) => p.interval === "month")?.stripePriceId || null;
  }

  if (!stripePriceId) {
    return {
      ok: false,
      error: "This plan has not been synced to Stripe yet. Please contact support.",
    };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });
  if (!user) return { ok: false, error: "Account not found." };

  const stripe = await requireDynamicStripe();
  const customerId = await ensureStripeCustomer(userId);

  const subscriptionData: any = {
    metadata: { userId, planId: plan.id, planKey: plan.key },
  };

  if (plan.trialDays > 0) {
    subscriptionData.trial_period_days = plan.trialDays;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: stripePriceId, quantity: 1 }],
    subscription_data: subscriptionData,
    metadata: { userId, planId: plan.id, planKey: plan.key },
    client_reference_id: userId,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    success_url: appUrl("/dashboard/billing?checkout=success"),
    cancel_url: appUrl("/dashboard/billing?checkout=canceled"),
  });

  if (!session.url) return { ok: false, error: "Could not initiate checkout. Please try again." };
  return { ok: true, url: session.url };
}

/** Legacy wrapper for backwards compatibility */
export async function createCheckoutSession(
  userId: string,
  interval: BillingInterval,
): Promise<CheckoutResult> {
  const premiumPlan = await db.plan.findUnique({ where: { key: "PREMIUM" } });
  const planId = premiumPlan ? premiumPlan.id : "premium";
  return createDynamicCheckoutSession(userId, planId, interval);
}

export type PortalResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/** Create a Billing Portal session so the user can manage/cancel their plan. */
export async function createPortalSession(userId: string): Promise<PortalResult> {
  const customerId = await findStripeCustomerId(userId);
  if (!customerId) {
    return { ok: false, error: "No billing account found. Subscribe to a paid plan first." };
  }

  const stripe = await requireDynamicStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: appUrl("/dashboard/billing"),
  });

  return { ok: true, url: session.url };
}
