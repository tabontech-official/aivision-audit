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

/** Soft-delete a report and its associated website if applicable. */
export async function deleteReportAction(reportId: string): Promise<ReportActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not authorized." };
  if (!idSchema.safeParse(reportId).success) return { ok: false, error: "Invalid report." };

  const report = await db.report.findUnique({ where: { id: reportId } });
  if (!report || report.deletedAt || report.userId !== session.user.id) {
    return { ok: false, error: "Report not found." };
  }

  const now = new Date();
  await db.$transaction([
    db.report.update({ where: { id: reportId }, data: { deletedAt: now } }),
    db.website.update({ where: { id: report.websiteId }, data: { deletedAt: now } }),
  ]);

  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/websites");
  return { ok: true, message: "Site audit deleted successfully." };
}

/** Re-run an audit for the same website (subject to allowance). */
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
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reports");
  return { ok: true, redirectTo: `/analyze/${result.reportPublicId}` };
}

/** Trigger a fresh re-scan for a website domain or URL. */
export async function rescanWebsiteAction(domainOrUrl: string): Promise<ReportActionResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not authorized." };
  if (!domainOrUrl || !domainOrUrl.trim()) return { ok: false, error: "Invalid domain or URL." };

  const formattedUrl = domainOrUrl.startsWith("http://") || domainOrUrl.startsWith("https://")
    ? domainOrUrl
    : `https://${domainOrUrl}`;

  const result = await createAudit(formattedUrl, {
    kind: "user",
    userId: session.user.id,
    plan: session.user.plan as UserPlan,
  });

  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reports");
  return { ok: true, redirectTo: `/analyze/${result.reportPublicId}` };
}
