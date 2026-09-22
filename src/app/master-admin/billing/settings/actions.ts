"use server";

import { revalidatePath } from "next/cache";
import { requireMasterAdmin } from "@/lib/auth/rbac";
import {
  updateStripeSettings,
  testStripeConnection,
} from "@/services/billing/stripe-admin";

export async function saveStripeSettingsAction(formData: FormData) {
  const admin = await requireMasterAdmin();

  const mode = formData.get("mode") === "live" ? "live" : "test";
  const publishableKey = (formData.get("publishableKey") as string) ?? "";
  const secretKey = (formData.get("secretKey") as string) ?? "";
  const webhookSecret = (formData.get("webhookSecret") as string) ?? "";
  const currency = ((formData.get("currency") as string) || "usd").toLowerCase();
  const billingEnabled = formData.get("billingEnabled") === "true";

  const res = await updateStripeSettings(
    {
      mode,
      publishableKey,
      secretKey: secretKey.trim().length > 0 ? secretKey : undefined,
      webhookSecret: webhookSecret.trim().length > 0 ? webhookSecret : undefined,
      currency,
      billingEnabled,
    },
    admin.id,
  );

  if (!res.ok) {
    return { ok: false, error: res.error || "Failed to save Stripe settings" };
  }

  revalidatePath("/master-admin/billing/settings");
  return { ok: true, message: "Stripe & Billing settings saved successfully." };
}

export async function testStripeConnectionAction() {
  await requireMasterAdmin();
  return testStripeConnection();
}
