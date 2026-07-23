import "server-only";
import { db } from "@/lib/db/client";
import { runAudit } from "./run-audit";

/**
 * Audit job dispatch.
 *
 * Production (QSTASH_TOKEN + public app URL): publishes to Upstash QStash,
 * which calls back POST /api/jobs/run-audit with a signed request.
 *
 * Development (no QStash or localhost URL — QStash cannot reach localhost):
 * runs the real audit engine inline, detached from the request, so the
 * intake response returns immediately and the progress UI polls live stages.
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
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[jobs] QStash publish failed ${res.status}: ${text.slice(0, 300)}`);
      await db.report.update({
        where: { id: reportId },
        data: {
          status: "FAILED",
          errorMessage: "We couldn't start the audit. Please try again.",
        },
      });
    }
    return;
  }

  // Dev: run the real engine inline, fire-and-forget
  void runAudit(reportId).catch(async (err) => {
    console.error("[jobs] inline audit crashed:", err);
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
