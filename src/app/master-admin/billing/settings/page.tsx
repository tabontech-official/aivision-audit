import type { Metadata } from "next";
import { requireMasterAdmin } from "@/lib/auth/rbac";
import { getStripeSettings } from "@/services/billing/stripe-admin";
import { StripeSettingsClient } from "./settings-client";

export const metadata: Metadata = {
  title: "Stripe & Billing Settings",
};

export default async function StripeSettingsPage() {
  await requireMasterAdmin();
  const settings = await getStripeSettings();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return <StripeSettingsClient initialSettings={settings} appUrl={appUrl} />;
}
