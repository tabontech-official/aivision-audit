"use server";

import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { isStripeConfigured } from "@/lib/stripe/client";
import { rateLimit } from "@/lib/security/rate-limit";
import {
  createCheckoutSession,
  createPortalSession,
} from "@/services/billing/billing";

export type BillingActionResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

const intervalSchema = z.enum(["monthly", "yearly"]);

/** Start Premium checkout; returns a Stripe-hosted URL to redirect to. */
export async function startCheckoutAction(interval: unknown): Promise<BillingActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "You must be logged in." };
  if (!isStripeConfigured()) {
    return { ok: false, error: "Billing isn't available yet. Please check back soon." };
  }
  if (!session.user.isEmailVerified) {
    return { ok: false, error: "Verify your email before subscribing." };
  }

  const parsed = intervalSchema.safeParse(interval);
  if (!parsed.success) return { ok: false, error: "Invalid plan interval." };

  const rl = await rateLimit(`billing:checkout:${session.user.id}`, 8, 60 * 60 * 1000);
  if (!rl.allowed) return { ok: false, error: "Too many attempts. Please try again shortly." };

  try {
    return await createCheckoutSession(session.user.id, parsed.data);
  } catch (err) {
    console.error("[billing] checkout failed:", err);
    return { ok: false, error: "We couldn't start checkout. Please try again." };
  }
}

/** Open the Stripe billing portal to manage/cancel a subscription. */
export async function openPortalAction(): Promise<BillingActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "You must be logged in." };
  if (!isStripeConfigured()) {
    return { ok: false, error: "Billing isn't available yet." };
  }

  const rl = await rateLimit(`billing:portal:${session.user.id}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) return { ok: false, error: "Too many attempts. Please try again shortly." };

  try {
    return await createPortalSession(session.user.id);
  } catch (err) {
    console.error("[billing] portal failed:", err);
    return { ok: false, error: "We couldn't open the billing portal. Please try again." };
  }
}
