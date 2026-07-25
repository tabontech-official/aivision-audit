import "server-only";
import { db } from "@/lib/db/client";
import type { Prisma } from "@prisma/client";

export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export type LogCategory =
  | "AUDIT_PIPELINE"
  | "FETCH_HTML"
  | "PLAYWRIGHT_RENDER"
  | "PAGESPEED_API"
  | "CRITERIA_EVAL"
  | "ADMIN_ACTION"
  | "SYSTEM_ERROR"
  | "AUTH";

interface SystemLogInput {
  level?: LogLevel;
  category: LogCategory;
  message: string;
  reportId?: string;
  websiteUrl?: string;
  stage?: string;
  durationMs?: number;
  meta?: Record<string, unknown>;
  error?: unknown;
}

/**
 * Global system execution logger. Writes detailed execution logs to SystemExecutionLog table in Neon DB.
 * Never throws — logging errors are swallowed to preserve application resilience.
 */
export async function logExecution(input: SystemLogInput): Promise<void> {
  try {
    let stackTrace: string | undefined;
    let errorMessage = input.message;

    if (input.error) {
      if (input.error instanceof Error) {
        stackTrace = input.error.stack;
        errorMessage = `${input.message} — Error: ${input.error.message}`;
      } else {
        errorMessage = `${input.message} — Error: ${String(input.error)}`;
      }
    }

    const level: LogLevel = input.level ?? (input.error ? "ERROR" : "INFO");

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const dbAny = db as any;
    if ("systemExecutionLog" in db && dbAny.systemExecutionLog) {
      await dbAny.systemExecutionLog.create({
        data: {
          level,
          category: input.category,
          message: errorMessage.slice(0, 1000),
          reportId: input.reportId ?? null,
          websiteUrl: input.websiteUrl ?? null,
          stage: input.stage ?? null,
          durationMs: input.durationMs ?? null,
          meta: (input.meta ?? {}) as Prisma.InputJsonValue,
          stackTrace: stackTrace ? stackTrace.slice(0, 4000) : null,
        },
      });
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */

    // Also output clean colored log to console stdout/stderr
    const prefix = `[${input.category}]${input.reportId ? ` [report:${input.reportId}]` : ""}`;
    if (level === "ERROR") {
      console.error(`${prefix} ${errorMessage}`, stackTrace ?? "");
    } else if (level === "WARN") {
      console.warn(`${prefix} ${errorMessage}`);
    } else {
      console.log(`${prefix} ${errorMessage}`);
    }
  } catch (err) {
    console.error("[logger] Failed to write SystemExecutionLog:", err);
  }
}
