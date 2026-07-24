"use server";

import { db } from "@/lib/db/client";
import { auth } from "@/lib/auth/auth";
import { createAudit } from "@/services/audits/create";
import type { UserPlan } from "@prisma/client";

export type RerunResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

/** Re-run an audit for the website behind a report the user owns (by publicId). */
export async function rerunAuditByPublicIdAction(publicId: string): Promise<RerunResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not authorized." };
  if (!publicId || publicId.length > 40) return { ok: false, error: "Invalid report." };

  const report = await db.report.findUnique({
    where: { publicId },
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
