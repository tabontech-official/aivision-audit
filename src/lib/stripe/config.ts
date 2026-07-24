/**
 * Stripe price/plan configuration, resolved from env with sane fallbacks.
 * The actual Premium price IDs live in Stripe; we reference them by env var.
 */

export const STRIPE_PRICES = {
  premiumMonthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY ?? "",
  premiumYearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY ?? "",
} as const;

export type BillingInterval = "monthly" | "yearly";

export function priceIdForInterval(interval: BillingInterval): string {
  return interval === "yearly" ? STRIPE_PRICES.premiumYearly : STRIPE_PRICES.premiumMonthly;
}

export function appUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}
