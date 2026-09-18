import "server-only";
import { db } from "@/lib/db/client";
import { logExecution } from "@/services/system-log/log";
import { reconcileFindings } from "./reconcile";

/**
 * One-time finding seeding after claim (§2.10 + G.2.2).
 *
 * Anonymous audits skip reconciliation entirely (no owner to act on
 * findings). When `claimAnonymousReports()` transfers reports to a new
 * account, this runs reconciliation over the claimed terminal reports in
 * chronological order, seeding the baseline exactly as if the user had owned
 * the website all along. Best-effort per report — a seeding failure never
 * blocks a signup or login.
 */
export async function seedFindingsForUser(userId: string): Promise<number> {
  const unreconciled = await db.report.findMany({
    where: {
      userId,
      findingsReconciledAt: null,
      status: { in: ["COMPLETED", "PARTIAL"] },
      deletedAt: null,
      website: { userId, deletedAt: null },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, overallScore: true },
  });

  let seeded = 0;
  for (const report of unreconciled) {
    try {
      const summary = await reconcileFindings(report.id, report.overallScore);
      if (!summary.skipped) seeded++;
    } catch (err) {
      await logExecution({
        level: "ERROR",
        category: "FINDINGS",
        message: "Post-claim finding seeding failed for a report — continuing with the rest",
        reportId: report.id,
        error: err,
      });
    }
  }
  return seeded;
}
