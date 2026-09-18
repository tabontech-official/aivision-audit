"use server";

import { nanoid } from "nanoid";
import { db } from "@/lib/db/client";
import { auth } from "@/lib/auth/auth";
import { logAdminActivity } from "@/services/audit-log/log";
import { logExecution } from "@/services/system-log/log";
import { validateAndNormalizeUrl } from "@/lib/security/url";
import { assertPublicHost } from "@/lib/security/ssrf";
import { createAudit } from "@/services/audits/create";
import { enqueueAuditJob } from "@/services/jobs/enqueue";
import { isDevToolsEnabled } from "@/lib/dev/tools";
import { reconcileFindings } from "@/services/findings/reconcile";
import type { UserPlan } from "@prisma/client";

export type DevResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string };

/**
 * Every dev action re-checks the role *and* the tools gate server-side —
 * hiding the page is not a boundary.
 */
async function requireDevAdmin(): Promise<{ id: string; plan: UserPlan } | null> {
  if (!isDevToolsEnabled()) return null;
  const session = await auth();
  if (!session?.user || session.user.role !== "MASTER_ADMIN") return null;
  return { id: session.user.id, plan: (session.user.plan as UserPlan) ?? "FREE" };
}

/**
 * Start an audit and hand back the report id so the console can tail it.
 *
 * `ignoreLimits` skips the monthly allowance and the one-concurrent-audit rule
 * by writing the rows directly — everything else (URL validation, the SSRF
 * check, the pinned template version, the job dispatch) is the production path
 * unchanged, so what you watch is what a real visitor gets.
 */
export async function startDevAuditAction(
  rawUrl: string,
  options?: { ignoreLimits?: boolean },
): Promise<DevResult<{ reportId: string; publicId: string; url: string }>> {
  const admin = await requireDevAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const validated = validateAndNormalizeUrl(rawUrl);
  if (!validated.ok) return { ok: false, error: validated.error };

  const ssrf = await assertPublicHost(validated.value.hostname);
  if (!ssrf.ok) return { ok: false, error: ssrf.error };

  if (!options?.ignoreLimits) {
    const result = await createAudit(rawUrl, {
      kind: "user",
      userId: admin.id,
      plan: admin.plan,
    });
    if (!result.ok) return { ok: false, error: result.error };

    const report = await db.report.findUnique({
      where: { publicId: result.reportPublicId },
      select: { id: true, publicId: true, website: { select: { url: true } } },
    });
    if (!report) return { ok: false, error: "Report was created but could not be read back." };

    await logAdminActivity({
      actorId: admin.id,
      action: "dev.audit_start",
      entityType: "report",
      entityId: report.id,
      after: { url: report.website.url, mode: "intake" },
    });

    return {
      ok: true,
      message: "Audit queued through the normal intake path.",
      data: { reportId: report.id, publicId: report.publicId, url: report.website.url },
    };
  }

  /* ---- Direct run: same rows, no allowance or concurrency gate ---- */
  const templateVersion = await db.templateVersion.findFirst({
    where: { status: "PUBLISHED", template: { isDefault: true, deletedAt: null } },
    orderBy: { versionNumber: "desc" },
    select: { id: true, versionNumber: true },
  });
  if (!templateVersion) {
    return { ok: false, error: "No PUBLISHED template version exists — publish the draft first." };
  }

  const { url, domain } = validated.value;

  let website = await db.website.findFirst({
    where: { url, userId: admin.id, deletedAt: null },
  });
  if (!website) {
    website = await db.website.create({ data: { url, domain, userId: admin.id } });
  }

  const report = await db.report.create({
    data: {
      publicId: nanoid(21),
      websiteId: website.id,
      userId: admin.id,
      templateVersionId: templateVersion.id,
      status: "QUEUED",
      currentStage: "CONNECTING",
      planAtGeneration: admin.plan,
    },
  });

  await logExecution({
    level: "INFO",
    category: "AUDIT_PIPELINE",
    message: `Dev console started an audit for ${url} (limits bypassed, template v${templateVersion.versionNumber})`,
    reportId: report.id,
    websiteUrl: url,
    meta: { mode: "dev-direct", actorId: admin.id },
  });

  await logAdminActivity({
    actorId: admin.id,
    action: "dev.audit_start",
    entityType: "report",
    entityId: report.id,
    after: { url, mode: "direct" },
  });

  await enqueueAuditJob(report.id);

  return {
    ok: true,
    message: "Audit dispatched (allowance and concurrency limits bypassed).",
    data: { reportId: report.id, publicId: report.publicId, url },
  };
}

/**
 * Re-dispatch a report. The known failure mode on serverless is a run killed
 * mid-flight that sits in PROCESSING forever — this resets it and runs again
 * against the same pinned template version.
 */
export async function rerunReportAction(reportId: string): Promise<DevResult> {
  const admin = await requireDevAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const report = await db.report.findUnique({
    where: { id: reportId },
    include: { website: { select: { url: true } } },
  });
  if (!report) return { ok: false, error: "Report not found." };

  await db.report.update({
    where: { id: reportId },
    data: {
      status: "QUEUED",
      currentStage: "CONNECTING",
      progressPercent: 0,
      errorMessage: null,
      completedAt: null,
      startedAt: null,
    },
  });

  await logExecution({
    level: "WARN",
    category: "AUDIT_PIPELINE",
    message: `Dev console re-queued this report (was ${report.status} at ${report.currentStage ?? "no stage"}, ${report.progressPercent}%)`,
    reportId,
    websiteUrl: report.website.url,
    meta: { previousStatus: report.status, actorId: admin.id },
  });

  await logAdminActivity({
    actorId: admin.id,
    action: "dev.audit_rerun",
    entityType: "report",
    entityId: reportId,
    before: { status: report.status, stage: report.currentStage },
  });

  await enqueueAuditJob(reportId);
  return { ok: true, message: "Report re-queued — the trace below will pick it up." };
}

/** Force a stuck report into a terminal state so it stops being invisible. */
export async function failReportAction(reportId: string): Promise<DevResult> {
  const admin = await requireDevAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const report = await db.report.findUnique({
    where: { id: reportId },
    include: { website: { select: { url: true } } },
  });
  if (!report) return { ok: false, error: "Report not found." };
  if (report.status === "COMPLETED" || report.status === "PARTIAL") {
    return { ok: false, error: "This report finished successfully — nothing to terminate." };
  }

  await db.report.update({
    where: { id: reportId },
    data: {
      status: "FAILED",
      errorMessage: "This audit was terminated by an administrator.",
      completedAt: new Date(),
    },
  });

  await logExecution({
    level: "ERROR",
    category: "AUDIT_PIPELINE",
    message: `Dev console force-failed this report (was ${report.status} at ${report.currentStage ?? "no stage"}, ${report.progressPercent}%)`,
    reportId,
    websiteUrl: report.website.url,
    meta: { previousStatus: report.status, actorId: admin.id },
  });

  await logAdminActivity({
    actorId: admin.id,
    action: "dev.audit_force_fail",
    entityType: "report",
    entityId: reportId,
    before: { status: report.status, stage: report.currentStage },
  });

  return { ok: true, message: "Report marked FAILED." };
}

/**
 * Re-run findings reconciliation for a report (G.4's retryable admin action).
 * Safe to repeat: reconciliation rolls back its own prior events first.
 */
export async function reconcileReportAction(reportId: string): Promise<DevResult> {
  const admin = await requireDevAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const report = await db.report.findUnique({
    where: { id: reportId },
    select: { id: true, status: true, overallScore: true },
  });
  if (!report) return { ok: false, error: "Report not found." };
  if (report.status !== "COMPLETED" && report.status !== "PARTIAL") {
    return { ok: false, error: "Only finished reports can be reconciled." };
  }

  try {
    const summary = await reconcileFindings(report.id, report.overallScore);
    await logAdminActivity({
      actorId: admin.id,
      action: "dev.findings_reconcile",
      entityType: "report",
      entityId: reportId,
      after: summary as unknown as Record<string, unknown>,
    });
    if (summary.skipped === "anonymous") {
      return { ok: true, message: "Skipped — this website has no owner, so findings do not apply." };
    }
    return {
      ok: true,
      message: `Reconciled: ${summary.created} new, ${summary.verifiedFixed} verified fixed, ${summary.regressed} regressed, ${summary.staleMarked} stale.`,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message.slice(0, 200) : "Reconciliation failed." };
  }
}

/** Clear the execution log — for one report, or the whole tail. */
export async function clearTraceAction(reportId?: string | null): Promise<DevResult> {
  const admin = await requireDevAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const dbAny = db as any;
  if (!("systemExecutionLog" in db) || typeof dbAny.systemExecutionLog !== "object") {
    return { ok: false, error: "Execution log table is unavailable." };
  }

  const deleted = await dbAny.systemExecutionLog.deleteMany({
    where: reportId ? { reportId } : {},
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  await logAdminActivity({
    actorId: admin.id,
    action: "dev.trace_clear",
    entityType: "system_execution_log",
    entityId: reportId ?? undefined,
    before: { deleted: deleted.count as number },
  });

  return { ok: true, message: `Cleared ${deleted.count} log line(s).` };
}
