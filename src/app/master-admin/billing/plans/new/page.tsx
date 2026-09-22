import type { Metadata } from "next";
import { requireMasterAdmin } from "@/lib/auth/rbac";
import { PlanEditorClient } from "../plan-editor-client";

export const metadata: Metadata = {
  title: "Create New Plan",
};

export default async function NewPlanPage() {
  await requireMasterAdmin();
  return <PlanEditorClient isNew={true} />;
}
