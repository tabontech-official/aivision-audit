import type { Metadata } from "next";
import { requireMasterAdmin } from "@/lib/auth/rbac";
import { getAdminPlans } from "@/services/billing/plans";
import { PlansListClient } from "./plans-client";

export const metadata: Metadata = {
  title: "Subscription Plans",
};

export default async function PlansPage() {
  await requireMasterAdmin();
  const plans = await getAdminPlans();

  return <PlansListClient initialPlans={plans} />;
}
