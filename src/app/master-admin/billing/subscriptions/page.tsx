import type { Metadata } from "next";
import { requireMasterAdmin } from "@/lib/auth/rbac";
import { getAdminSubscriptions } from "@/services/billing/subscriptions";
import { getAdminPlans } from "@/services/billing/plans";
import { SubscriptionsListClient } from "./subscriptions-client";

export const metadata: Metadata = {
  title: "Subscriptions Management",
};

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireMasterAdmin();
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : undefined;
  const planId = typeof params.planId === "string" ? params.planId : undefined;

  const [subscriptionsData, plans] = await Promise.all([
    getAdminSubscriptions({ search, planId }),
    getAdminPlans(),
  ]);

  return <SubscriptionsListClient initialData={subscriptionsData} availablePlans={plans} />;
}
