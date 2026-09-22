"use server";

import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { rateLimit } from "@/lib/security/rate-limit";
import {
  createDynamicCheckoutSession,
  createPortalSession,
} from "@/services/billing/billing";

export type BillingActionResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

const intervalSchema = z.enum(["monthly", "yearly", "month", "year"]);

/** Start Dynamic Checkout for any selected plan tier */
export async function startDynamicCheckoutAction(
  planId: string,
  interval: unknown,
): Promise<BillingActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "You must be logged in." };

  const parsed = intervalSchema.safeParse(interval);
  if (!parsed.success) return { ok: false, error: "Invalid plan interval." };

  const rl = await rateLimit(`billing:checkout:${session.user.id}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) return { ok: false, error: "Too many attempts. Please try again shortly." };

  try {
    const normalizedInterval = parsed.data === "yearly" || parsed.data === "year" ? "year" : "month";
    return await createDynamicCheckoutSession(session.user.id, planId, normalizedInterval);
  } catch (err) {
    console.error("[billing] checkout failed:", err);
    return { ok: false, error: "We couldn't start checkout. Please try again." };
  }
}

/** Legacy wrapper */
export async function startCheckoutAction(interval: unknown): Promise<BillingActionResult> {
  return startDynamicCheckoutAction("PREMIUM", interval);
}

/** Open the Stripe billing portal to manage/cancel a subscription. */
export async function openPortalAction(): Promise<BillingActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "You must be logged in." };

  const rl = await rateLimit(`billing:portal:${session.user.id}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) return { ok: false, error: "Too many attempts. Please try again shortly." };

  try {
    return await createPortalSession(session.user.id);
  } catch (err) {
    console.error("[billing] portal failed:", err);
    return { ok: false, error: "We couldn't open the billing portal. Please try again." };
  }
}
