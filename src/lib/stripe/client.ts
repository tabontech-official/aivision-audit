import "server-only";
import Stripe from "stripe";

/**
 * Stripe client singleton. Uses the API version pinned by the installed SDK
 * (do not hardcode — the SDK's types match its own pinned version).
 *
 * When STRIPE_SECRET_KEY is unset (local dev without billing configured),
 * `stripe` is null and billing features degrade gracefully.
 */
const secretKey = process.env.STRIPE_SECRET_KEY;

export const stripe: Stripe | null = secretKey
  ? new Stripe(secretKey, {
      typescript: true,
      appInfo: { name: "AI Vision Audit", version: "1.0.0" },
    })
  : null;

export function requireStripe(): Stripe {
  if (!stripe) {
    throw new Error("Stripe is not configured (STRIPE_SECRET_KEY missing).");
  }
  return stripe;
}

export function isStripeConfigured(): boolean {
  return stripe !== null;
}
