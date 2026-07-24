import "server-only";
import { db } from "@/lib/db/client";
import { requireStripe } from "@/lib/stripe/client";
import { priceIdForInterval, appUrl, type BillingInterval } from "@/lib/stripe/config";

/**
 * Billing service: Stripe customer lifecycle, checkout, and portal.
 *
 * The Stripe customer id is stored on the user's Subscription rows and reused;
 * we look it up from any existing subscription before creating a new customer,
 * so a user never ends up with duplicate Stripe customers.
 */

async function findStripeCustomerId(userId: string): Promise<string | null> {
  const sub = await db.subscription.findFirst({
    where: { userId, stripeCustomerId: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { stripeCustomerId: true },
  });
  return sub?.stripeCustomerId ?? null;
}

/** Return an existing Stripe customer id for the user, or create one. */
export async function ensureStripeCustomer(userId: string): Promise<string> {
  const existing = await findStripeCustomerId(userId);
  if (existing) return existing;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (!user) throw new Error("User not found");

  const stripe = requireStripe();
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
 * Create a Checkout Session for a Premium subscription.
 * Already-premium users are redirected to the portal instead (idempotency).
 */
export async function createCheckoutSession(
  userId: string,
  interval: BillingInterval,
): Promise<CheckoutResult> {
  const priceId = priceIdForInterval(interval);
  if (!priceId) {
    return { ok: false, error: "This plan is not available yet. Please contact support." };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });
  if (!user) return { ok: false, error: "Account not found." };
  if (user.plan === "PREMIUM") {
    return { ok: false, error: "You're already on Premium." };
  }

  const stripe = requireStripe();
  const customerId = await ensureStripeCustomer(userId);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    // The webhook is the source of truth; metadata lets it map back to our user.
    subscription_data: { metadata: { userId } },
    metadata: { userId },
    client_reference_id: userId,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    success_url: appUrl("/dashboard/billing?checkout=success"),
    cancel_url: appUrl("/dashboard/billing?checkout=canceled"),
  });

  if (!session.url) return { ok: false, error: "Could not start checkout. Please try again." };
  return { ok: true, url: session.url };
}

export type PortalResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/** Create a Billing Portal session so the user can manage/cancel their plan. */
export async function createPortalSession(userId: string): Promise<PortalResult> {
  const customerId = await findStripeCustomerId(userId);
  if (!customerId) {
    return { ok: false, error: "No billing account found. Subscribe to Premium first." };
  }

  const stripe = requireStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: appUrl("/dashboard/billing"),
  });

  return { ok: true, url: session.url };
}
