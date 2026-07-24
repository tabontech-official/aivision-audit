"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auth } from "@/lib/auth/auth";
import { createAudit } from "@/services/audits/create";
import type { UserPlan } from "@prisma/client";

export type ReportActionResult =
  | { ok: true; message?: string; redirectTo?: string }
  | { ok: false; error: string };

const idSchema = z.string().uuid();

/** Soft-delete a report the user owns. */
export async function deleteReportAction(reportId: string): Promise<ReportActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not authorized." };
  if (!idSchema.safeParse(reportId).success) return { ok: false, error: "Invalid report." };

  const report = await db.report.findUnique({ where: { id: reportId } });
  if (!report || report.deletedAt || report.userId !== session.user.id) {
    return { ok: false, error: "Report not found." };
  }

  await db.report.update({ where: { id: reportId }, data: { deletedAt: new Date() } });
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard");
  return { ok: true, message: "Report deleted." };
}

/** Re-run an audit for the same website (subject to the user's allowance). */
export async function rerunAuditAction(reportId: string): Promise<ReportActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not authorized." };
  if (!idSchema.safeParse(reportId).success) return { ok: false, error: "Invalid report." };

  const report = await db.report.findUnique({
    where: { id: reportId },
    include: { website: true },
  });
  if (!report || report.deletedAt || report.userId !== session.user.id) {
    return { ok: false, error: "Report not found." };
  }

  const result = await createAudit(report.website.url, {
    kind: "user",
    userId: session.user.id,
    plan: session.user.plan as UserPlan,
  });

  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, redirectTo: `/analyze/${result.reportPublicId}` };
}
