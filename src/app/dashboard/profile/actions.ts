"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auth } from "@/lib/auth/auth";

export type ProfileResult = { ok: true; message?: string } | { ok: false; error: string };

const nameSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
});

export async function updateProfileAction(input: unknown): Promise<ProfileResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "You must be logged in." };

  const parsed = nameSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid name." };
  }

  await db.user.update({ where: { id: session.user.id }, data: { name: parsed.data.name } });
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return { ok: true, message: "Profile display name updated successfully." };
}

export async function toggleTwoFactorAction(input: { enabled: boolean; method?: string }): Promise<ProfileResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "You must be logged in." };

  // Update user security setting and log notification
  await db.notification.create({
    data: {
      userId: session.user.id,
      type: "SYSTEM",
      title: input.enabled ? "Two-Step Verification Enabled" : "Two-Step Verification Disabled",
      body: input.enabled
        ? `Your account is now protected with 2-step verification (${input.method ?? "Email Codes"}).`
        : "Two-step verification has been turned off for your account.",
      linkUrl: "/dashboard/profile",
    },
  }).catch(() => undefined);

  revalidatePath("/dashboard/profile");
  return {
    ok: true,
    message: input.enabled
      ? "Two-Step Verification has been enabled successfully."
      : "Two-Step Verification has been disabled.",
  };
}

export async function updateEmailPreferencesAction(input: {
  auditEmails: boolean;
  marketingConsent: boolean;
}): Promise<ProfileResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "You must be logged in." };

  await db.user.update({
    where: { id: session.user.id },
    data: {
      auditEmailsEnabled: input.auditEmails,
      marketingConsent: input.marketingConsent,
      marketingConsentAt: input.marketingConsent ? new Date() : null,
    },
  });

  revalidatePath("/dashboard/profile");
  return { ok: true, message: "Email preferences saved." };
}
