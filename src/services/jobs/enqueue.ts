import "server-only";
import { db } from "@/lib/db/client";
import { runAudit } from "./run-audit";
import { logExecution } from "@/services/system-log/log";

/**
 * Audit job dispatch.
 *
 * Durable path — Upstash QStash publishes to POST /api/jobs/run-audit with a
 * signed request. Configured via QSTASH_TOKEN + a public NEXT_PUBLIC_APP_URL.
 * QSTASH_URL overrides the publish endpoint: production logs showed
 * `404 … user not found in this region (eu-central-1)`, which is a
 * token/endpoint region mismatch — point QSTASH_URL at the region your token
 * belongs to.
 *
 * Inline path — `void runAudit()` fire-and-forget. This is CORRECT on a
 * long-lived server (local `next dev`, self-hosted node) and FATAL on
 * serverless, where the runtime freezes the moment the HTTP response returns:
 * exactly the "stuck at CHECKING_SEO forever" failure. So inline only ever
 * runs off-serverless; on serverless with no working queue the report FAILS
 * immediately and loudly (failureCategory SYSTEM → the credit is refunded)
 * instead of silently dying at 42%.
 */

const DEFAULT_QSTASH_URL = "https://qstash.upstash.io";

/** Frozen-after-response runtimes where fire-and-forget cannot survive. */
function isServerlessRuntime(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

export type DispatchMode = "qstash" | "inline" | "none";

/** What dispatch would use right now — shown in the Pipeline Console header. */
export function getDispatchMode(): DispatchMode {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const qstashConfigured =
    !!process.env.QSTASH_TOKEN &&
    !!appUrl &&
    !appUrl.includes("localhost") &&
    !appUrl.includes("127.0.0.1");
  if (qstashConfigured) return "qstash";
  return isServerlessRuntime() ? "none" : "inline";
}

/** Terminal, refunded, and loud — the opposite of dying silently at 42%. */
async function failDispatch(reportId: string, detail: string): Promise<void> {
  await logExecution({
    level: "ERROR",
    category: "AUDIT_PIPELINE",
    message: `Audit could not be dispatched: ${detail}`,
    reportId,
    meta: { dispatch: true, serverless: isServerlessRuntime() },
  });
  await db.report
    .update({
      where: { id: reportId },
      data: {
        status: "FAILED",
        errorMessage:
          "We couldn't start this audit. Please try again — you have not been charged an audit credit.",
        failureCategory: "SYSTEM",
        completedAt: new Date(),
      },
    })
    .catch(() => undefined);
}

function runInline(reportId: string): void {
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
          failureCategory: "SYSTEM",
        },
      })
      .catch(() => undefined);
  });
}

export async function enqueueAuditJob(reportId: string): Promise<void> {
  const mode = getDispatchMode();

  if (mode === "qstash") {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const qstashBase = (process.env.QSTASH_URL ?? DEFAULT_QSTASH_URL).replace(/\/$/, "");
    const destination = `${appUrl.replace(/\/$/, "")}/api/jobs/run-audit`;

    try {
      const res = await fetch(
        `${qstashBase}/v2/publish/${encodeURIComponent(destination)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.QSTASH_TOKEN}`,
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
      const regionHint = /not found in this region/i.test(text)
        ? " This is a token/endpoint region mismatch — set QSTASH_URL to your token's regional endpoint."
        : "";

      if (isServerlessRuntime()) {
        // No silent fallback: inline cannot survive a frozen runtime.
        return failDispatch(
          reportId,
          `QStash publish returned HTTP ${res.status}: ${text.slice(0, 200)}.${regionHint}`,
        );
      }

      await logExecution({
        level: "WARN",
        category: "AUDIT_PIPELINE",
        message: `QStash publish returned HTTP ${res.status}: ${text.slice(0, 200)}.${regionHint} Running inline (long-lived server).`,
        reportId,
        meta: { status: res.status, errorText: text.slice(0, 300) },
      });
    } catch (err) {
      if (isServerlessRuntime()) {
        return failDispatch(
          reportId,
          `QStash network error: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      await logExecution({
        level: "WARN",
        category: "AUDIT_PIPELINE",
        message: `QStash network dispatch error. Running inline (long-lived server).`,
        reportId,
        error: err,
      });
    }

    // Reachable only off-serverless, where inline execution actually works.
    runInline(reportId);
    return;
  }

  if (mode === "none") {
    // Serverless with no queue: refusing is the only honest option.
    return failDispatch(
      reportId,
      "No job queue is configured (QSTASH_TOKEN unset or NEXT_PUBLIC_APP_URL is localhost) and this is a serverless runtime where inline execution cannot complete.",
    );
  }

  // Long-lived server (dev, self-hosted): inline is legitimate.
  runInline(reportId);
}
