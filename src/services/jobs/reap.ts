import "server-only";
import { db } from "@/lib/db/client";
import { logExecution } from "@/services/system-log/log";
import { enqueueAuditJob } from "./enqueue";

/**
 * Watchdog for orphaned audits.
 *
 * A serverless runtime can freeze an audit mid-flight, leaving the report in
 * PROCESSING forever with no error and no terminal status — invisible unless
 * someone goes looking. This reaps them:
 *
 *  - QUEUED/PROCESSING with no update for STUCK_AFTER_MINUTES → FAILED with
 *    `failureCategory: SYSTEM`, which refunds the user's allowance credit
 *    (the allowance query excludes SYSTEM failures).
 *  - First time a report is reaped it is automatically re-dispatched once
 *    (`retryCount` 0 → 1). A second death is terminal — retrying a run that
 *    has now died twice would just burn another 15 minutes.
 *
 * Idempotent and safe to run on any schedule; every action is logged to
 * SystemExecutionLog under category AUDIT_PIPELINE with meta.watchdog=true.
 */

const STUCK_AFTER_MINUTES = 15;

const REAP_MESSAGE =
  "This audit didn't complete. Please try again — you have not been charged an audit credit.";

export type ReapSummary = {
  examined: number;
  retried: number;
  failed: number;
};

export async function reapStuckReports(): Promise<ReapSummary> {
  const cutoff = new Date(Date.now() - STUCK_AFTER_MINUTES * 60 * 1000);

  const stuck = await db.report.findMany({
    where: {
      status: { in: ["QUEUED", "PROCESSING"] },
      updatedAt: { lt: cutoff },
      deletedAt: null,
    },
    select: {
      id: true,
      status: true,
      currentStage: true,
      progressPercent: true,
      retryCount: true,
      website: { select: { url: true } },
    },
    take: 50, // bound one sweep; the next run picks up the rest
  });

  let retried = 0;
  let failed = 0;

  for (const report of stuck) {
    const shouldRetry = report.retryCount < 1;

    if (shouldRetry) {
      // Reset to a clean queued state and dispatch again. runAudit() is
      // idempotent on terminal states, so a zombie of the original run that
      // somehow wakes up cannot double-finish.
      await db.report.update({
        where: { id: report.id },
        data: {
          status: "QUEUED",
          currentStage: "CONNECTING",
          progressPercent: 0,
          errorMessage: null,
          startedAt: null,
          completedAt: null,
          retryCount: { increment: 1 },
        },
      });

      await logExecution({
        level: "WARN",
        category: "AUDIT_PIPELINE",
        message: `Watchdog re-queued a stuck report (was ${report.status} at ${report.currentStage ?? "no stage"}, ${report.progressPercent}%, idle > ${STUCK_AFTER_MINUTES}m) — retry 1 of 1`,
        reportId: report.id,
        websiteUrl: report.website.url,
        meta: { watchdog: true, previousStatus: report.status, retryCount: report.retryCount + 1 },
      });

      await enqueueAuditJob(report.id);
      retried++;
      continue;
    }

    await db.report.update({
      where: { id: report.id },
      data: {
        status: "FAILED",
        errorMessage: REAP_MESSAGE,
        failureCategory: "SYSTEM",
        completedAt: new Date(),
      },
    });

    await logExecution({
      level: "ERROR",
      category: "AUDIT_PIPELINE",
      message: `Watchdog failed a stuck report after its retry also died (was ${report.status} at ${report.currentStage ?? "no stage"}, ${report.progressPercent}%) — allowance credit refunded`,
      reportId: report.id,
      websiteUrl: report.website.url,
      meta: { watchdog: true, previousStatus: report.status, retryCount: report.retryCount },
    });
    failed++;
  }

  if (stuck.length > 0) {
    await logExecution({
      level: "INFO",
      category: "AUDIT_PIPELINE",
      message: `Watchdog sweep complete: ${stuck.length} stuck report(s) — ${retried} re-queued, ${failed} failed terminally`,
      meta: { watchdog: true, examined: stuck.length, retried, failed },
    });
  }

  return { examined: stuck.length, retried, failed };
}
