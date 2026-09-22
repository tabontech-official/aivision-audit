"use server";

import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { rateLimit } from "@/lib/security/rate-limit";
import { createDynamicCheckoutSession } from "@/services/billing/billing";

const intervalSchema = z.enum(["monthly", "yearly", "month", "year"]);

export async function startPublicCheckoutAction(
  planId: string,
  interval: unknown,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    // If not logged in, redirect to login with callback URL
    const callbackUrl = encodeURIComponent(`/pricing?plan=${planId}&interval=${interval}`);
    return { ok: true, url: `/login?callbackUrl=${callbackUrl}` };
  }

  const parsed = intervalSchema.safeParse(interval);
  if (!parsed.success) return { ok: false, error: "Invalid interval selected." };

  const rl = await rateLimit(`billing:checkout:${session.user.id}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) return { ok: false, error: "Too many attempts. Please wait a moment." };

  const normalizedInterval = parsed.data === "yearly" || parsed.data === "year" ? "year" : "month";
  return createDynamicCheckoutSession(session.user.id, planId, normalizedInterval);
}
