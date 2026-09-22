"use server";

import { revalidatePath } from "next/cache";
import { requireMasterAdmin } from "@/lib/auth/rbac";
import {
  createPlan,
  updatePlan,
  duplicatePlan,
  deletePlan,
  reorderPlans,
  type PlanInput,
} from "@/services/billing/plans";
import { syncPlanToStripe } from "@/services/billing/stripe-sync";

export async function createPlanAction(input: PlanInput) {
  const admin = await requireMasterAdmin();
  const res = await createPlan(input, admin.id);
  if (res.ok) {
    revalidatePath("/master-admin/billing/plans");
    revalidatePath("/pricing");
  }
  return res;
}

export async function updatePlanAction(id: string, input: Partial<PlanInput>) {
  const admin = await requireMasterAdmin();
  const res = await updatePlan(id, input, admin.id);
  if (res.ok) {
    revalidatePath("/master-admin/billing/plans");
    revalidatePath(`/master-admin/billing/plans/${id}`);
    revalidatePath("/pricing");
  }
  return res;
}

export async function duplicatePlanAction(id: string) {
  const admin = await requireMasterAdmin();
  const res = await duplicatePlan(id, admin.id);
  if (res.ok) {
    revalidatePath("/master-admin/billing/plans");
  }
  return res;
}

export async function deletePlanAction(id: string) {
  const admin = await requireMasterAdmin();
  const res = await deletePlan(id, admin.id);
  if (res.ok) {
    revalidatePath("/master-admin/billing/plans");
    revalidatePath("/pricing");
  }
  return res;
}

export async function syncPlanToStripeAction(id: string) {
  const admin = await requireMasterAdmin();
  const res = await syncPlanToStripe(id, admin.id);
  if (res.ok) {
    revalidatePath("/master-admin/billing/plans");
    revalidatePath(`/master-admin/billing/plans/${id}`);
  }
  return res;
}

export async function reorderPlansAction(orders: Array<{ id: string; displayOrder: number }>) {
  const admin = await requireMasterAdmin();
  const res = await reorderPlans(orders, admin.id);
  if (res.ok) {
    revalidatePath("/master-admin/billing/plans");
    revalidatePath("/pricing");
  }
  return res;
}
