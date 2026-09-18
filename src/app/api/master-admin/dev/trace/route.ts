import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { getMasterAdmin } from "@/lib/auth/rbac";
import { isDevToolsEnabled } from "@/lib/dev/tools";
import type {
  DevLogEntry,
  DevReportSnapshot,
  DevTraceResponse,
} from "@/app/master-admin/dev/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LOGS = 200;

/**
 * GET /api/master-admin/dev/trace — one poll of the live pipeline trace.
 *
 * `reportId` scopes to a single audit; without it the whole system's execution
 * log is tailed. `after` is the newest timestamp the client already holds; rows
 * on that exact millisecond are returned again and de-duplicated by id on the
 * client, so a tie can never swallow a line.
 */
export async function GET(req: Request) {
  const admin = await getMasterAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!isDevToolsEnabled()) {
    return NextResponse.json({ error: "Developer tools are disabled." }, { status: 404 });
  }

  const url = new URL(req.url);
  const reportId = url.searchParams.get("reportId")?.trim() || null;
  const after = url.searchParams.get("after")?.trim() || null;
  const levels = url.searchParams.get("levels")?.trim() || null;

  const where: Record<string, unknown> = {};
  if (reportId) where.reportId = reportId;
  if (after) {
    const parsed = new Date(after);
    if (!Number.isNaN(parsed.getTime())) where.createdAt = { gte: parsed };
  }
  if (levels) {
    const list = levels.split(",").map((l) => l.trim().toUpperCase()).filter(Boolean);
    if (list.length) where.level = { in: list };
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const dbAny = db as any;
  const hasLogModel =
    "systemExecutionLog" in db && typeof dbAny.systemExecutionLog === "object";

  const rows: Array<Record<string, unknown>> = hasLogModel
    ? await dbAny.systemExecutionLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: MAX_LOGS,
      })
    : [];
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // Oldest-first is how a console reads.
  const logs: DevLogEntry[] = rows
    .map((row) => ({
      id: String(row.id ?? ""),
      level: (row.level as DevLogEntry["level"]) ?? "INFO",
      category: String(row.category ?? "SYSTEM"),
      message: String(row.message ?? ""),
      reportId: (row.reportId as string | null) ?? null,
      websiteUrl: (row.websiteUrl as string | null) ?? null,
      stage: (row.stage as string | null) ?? null,
      durationMs: (row.durationMs as number | null) ?? null,
      meta: (row.meta as Record<string, unknown> | null) ?? null,
      stackTrace: (row.stackTrace as string | null) ?? null,
      createdAt: new Date(row.createdAt as string).toISOString(),
    }))
    .reverse();

  let report: DevReportSnapshot | null = null;

  if (reportId) {
    const found = await db.report.findUnique({
      where: { id: reportId },
      include: {
        website: { select: { url: true } },
        _count: { select: { auditResults: true, sectionResults: true, pageSpeedResults: true } },
        rawData: { select: { id: true } },
        snapshot: { select: { id: true } },
      },
    });

    if (found) {
      report = {
        id: found.id,
        publicId: found.publicId,
        url: found.website.url,
        status: found.status,
        currentStage: found.currentStage,
        progressPercent: found.progressPercent,
        errorMessage: found.errorMessage,
        overallScore: found.overallScore,
        grade: found.grade,
        passedCount: found.passedCount,
        failedCount: found.failedCount,
        warningCount: found.warningCount,
        criticalIssueCount: found.criticalIssueCount,
        startedAt: found.startedAt?.toISOString() ?? null,
        completedAt: found.completedAt?.toISOString() ?? null,
        createdAt: found.createdAt.toISOString(),
        updatedAt: found.updatedAt.toISOString(),
        artefacts: {
          rawData: found.rawData !== null,
          screenshot: found.screenshotUrl !== null,
          pageSpeedRows: found._count.pageSpeedResults,
          auditResults: found._count.auditResults,
          sectionResults: found._count.sectionResults,
          snapshot: found.snapshot !== null,
        },
      };
    }
  }

  const body: DevTraceResponse = {
    serverTime: new Date().toISOString(),
    report,
    logs,
  };

  return NextResponse.json(body, {
    headers: { "Cache-Control": "no-store" },
  });
}
