import "server-only";
import { db } from "@/lib/db/client";
import { runAudit } from "./run-audit";
import { logExecution } from "@/services/system-log/log";

/**
 * Audit job dispatch.
 *
 * Production (QSTASH_TOKEN + public app URL): publishes to Upstash QStash,
 * which calls back POST /api/jobs/run-audit with a signed request.
 *
 * Fallback (Dev or if QStash publish fails): runs the audit engine inline asynchronously.
 */

export async function enqueueAuditJob(reportId: string): Promise<void> {
  const qstashToken = process.env.QSTASH_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const canUseQstash =
    !!qstashToken &&
    !!appUrl &&
    !appUrl.includes("localhost") &&
    !appUrl.includes("127.0.0.1");

  if (canUseQstash) {
    const destination = `${appUrl.replace(/\/$/, "")}/api/jobs/run-audit`;
    try {
      const res = await fetch(
        `https://qstash.upstash.io/v2/publish/${encodeURIComponent(destination)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${qstashToken}`,
            "Content-Type": "application/json",
            "Upstash-Retries": "2",
          },
          body: JSON.stringify({ reportId }),
        },
      );

      if (res.ok) {
        await logExecution({
          level: "INFO",
          category: "AUDIT_PIPELINE",
          message: `Dispatched audit job to Upstash QStash (destination: ${destination})`,
          reportId,
        });
        return;
      }

      const text = await res.text().catch(() => "");
      console.error(`[jobs] QStash publish failed ${res.status}: ${text.slice(0, 300)}`);
      
      await logExecution({
        level: "WARN",
        category: "AUDIT_PIPELINE",
        message: `QStash publish returned HTTP ${res.status}: ${text.slice(0, 200)}. Falling back to inline async execution.`,
        reportId,
        meta: { status: res.status, errorText: text },
      });
    } catch (err) {
      await logExecution({
        level: "WARN",
        category: "AUDIT_PIPELINE",
        message: `QStash network dispatch error. Falling back to inline async execution.`,
        reportId,
        error: err,
      });
    }
  }

  // Fallback: run the real audit engine inline, fire-and-forget
  void runAudit(reportId).catch(async (err) => {
    console.error("[jobs] inline audit crashed:", err);
    await logExecution({
      level: "ERROR",
      category: "AUDIT_PIPELINE",
      message: `Inline audit execution crashed`,
      reportId,
      error: err,
    });
    await db.report
      .update({
        where: { id: reportId },
        data: {
          status: "FAILED",
          errorMessage: "Something went wrong while auditing this website.",
        },
      })
      .catch(() => undefined);
  });
}

