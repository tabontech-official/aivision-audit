import "server-only";
import { after } from "next/server";
import { db } from "@/lib/db/client";
import { runAudit } from "./run-audit";
import { logExecution } from "@/services/system-log/log";

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

function runInline(reportId: string): void {
  // Use Next.js 15 after() when in request context to keep serverless lambdas alive
  try {
    if (typeof after === "function") {
      after(async () => {
        try {
          await runAudit(reportId);
        } catch (err) {
          console.error("[jobs] audit execution crashed in after():", err);
          await logExecution({
            level: "ERROR",
            category: "AUDIT_PIPELINE",
            message: `Audit execution crashed`,
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
        }
      });
      return;
    }
  } catch {
    // outside request context or fallback
  }

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

      await logExecution({
        level: "WARN",
        category: "AUDIT_PIPELINE",
        message: `QStash publish returned HTTP ${res.status}: ${text.slice(0, 200)}.${regionHint} Falling back to direct execution.`,
        reportId,
        meta: { status: res.status, errorText: text.slice(0, 300) },
      });
    } catch (err) {
      await logExecution({
        level: "WARN",
        category: "AUDIT_PIPELINE",
        message: `QStash network dispatch error. Falling back to direct execution.`,
        reportId,
        error: err,
      });
    }

    // Gracefully execute direct / inline if QStash fails
    runInline(reportId);
    return;
  }

  // Direct execution with Next.js 15 background after()
  runInline(reportId);
}
