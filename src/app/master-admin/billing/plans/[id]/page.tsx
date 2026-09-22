import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireMasterAdmin } from "@/lib/auth/rbac";
import { getPlanById } from "@/services/billing/plans";
import { PlanEditorClient } from "../plan-editor-client";

export const metadata: Metadata = {
  title: "Edit Plan",
};

export default async function EditPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireMasterAdmin();
  const { id } = await params;
  const plan = await getPlanById(id);

  if (!plan) notFound();

  return <PlanEditorClient initialPlan={plan} isNew={false} />;
}
