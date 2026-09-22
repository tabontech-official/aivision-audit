"use server";

import { revalidatePath } from "next/cache";
import { requireMasterAdmin } from "@/lib/auth/rbac";
import {
  adminChangeUserPlan,
  adminCancelSubscription,
} from "@/services/billing/subscriptions";
import {
  grantUserBonusCredits,
  resetUserUsage,
} from "@/services/billing/entitlements";

export async function changeUserPlanAction(userId: string, newPlanId: string) {
  const admin = await requireMasterAdmin();
  const res = await adminChangeUserPlan(userId, newPlanId, admin.id);
  if (res.ok) {
    revalidatePath("/master-admin/billing/subscriptions");
  }
  return res;
}

export async function cancelSubscriptionAction(subscriptionId: string, immediately: boolean) {
  const admin = await requireMasterAdmin();
  const res = await adminCancelSubscription(subscriptionId, immediately, admin.id);
  if (res.ok) {
    revalidatePath("/master-admin/billing/subscriptions");
  }
  return res;
}

export async function grantBonusCreditsAction(
  userId: string,
  units: number,
  reason: string,
  expiresAt: string | null,
) {
  const admin = await requireMasterAdmin();
  const expiryDate = expiresAt ? new Date(expiresAt) : null;
  const res = await grantUserBonusCredits(userId, units, reason, expiryDate, admin.id);
  if (res.ok) {
    revalidatePath("/master-admin/billing/subscriptions");
  }
  return res;
}

export async function resetUserUsageAction(userId: string) {
  const admin = await requireMasterAdmin();
  const res = await resetUserUsage(userId, admin.id);
  if (res.ok) {
    revalidatePath("/master-admin/billing/subscriptions");
  }
  return res;
}
