import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/rbac";
import { db } from "@/lib/db/client";
import { getProjectedReport } from "@/services/reports/project-report";
import type { ScoreBasis } from "@/services/reports/evaluate-report";
import { ReportView } from "./report-view";
import type { UserPlan } from "@prisma/client";

export const metadata: Metadata = { title: "Report" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ reportId: string }>;
  searchParams?: Promise<{ section?: string; tab?: string }>;
}) {
  const user = await requireUser();
  const { reportId: publicId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const targetSection = resolvedSearchParams.section;
  const initialTab = resolvedSearchParams.tab?.toLowerCase() === "compare" ? "COMPARE" : "CURRENT";

  if (!publicId || publicId.length > 40) notFound();

  const [report, allWebsites] = await Promise.all([
    db.report.findUnique({
      where: { publicId },
      include: {
        website: { select: { domain: true, url: true, faviconUrl: true } },
        pageSpeedResults: { select: { strategy: true, performanceScore: true } },
        rawData: true,
        auditResults: {
          include: {
            field: {
              include: {
                section: true,
              },
            },
          },
        },
      },
    }),
    db.website.findMany({
      where: { userId: user.id, deletedAt: null },
      select: { domain: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  // Only the owner (or admin) may view via this route
  if (!report || report.deletedAt) notFound();
  if (report.userId !== user.id && user.role !== "MASTER_ADMIN") notFound();

  // Still running → send to the progress screen
  if (report.status === "QUEUED" || report.status === "PROCESSING") {
    redirect(`/analyze/${publicId}`);
  }

  const allDomains = allWebsites.map((w) => w.domain);
  const viewerPlan = user.plan as UserPlan;
  const [projected, snapshotRow, findings] = await Promise.all([
    getProjectedReport(report.id, viewerPlan),
    db.reportSnapshot.findUnique({
      where: { reportId: report.id },
      select: { scoreBasis: true },
    }),
    db.finding.findMany({
      where: { websiteId: report.websiteId },
      select: { fieldKey: true, state: true, resolvedAt: true },
    }),
  ]);

  const findingStates: Record<string, { state: string; resolvedAt: string | null }> = {};
  for (const f of findings) {
    findingStates[f.fieldKey] = { state: f.state, resolvedAt: f.resolvedAt?.toISOString() ?? null };
  }

  if (!projected) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-xl font-bold text-ink">Report unavailable</h1>
        <p className="mt-2 text-sm text-ink-secondary">
          {report.status === "FAILED"
            ? report.errorMessage ?? "This audit could not be completed."
            : "This report has no results yet."}
        </p>
      </div>
    );
  }

  const desktopRes = report.pageSpeedResults?.find((p) => p.strategy === "DESKTOP");
  const mobileRes = report.pageSpeedResults?.find((p) => p.strategy === "MOBILE");

  const desktopScore = report.desktopScore !== null && report.desktopScore !== undefined
    ? Math.round(report.desktopScore > 1 ? report.desktopScore : report.desktopScore * 100)
    : desktopRes?.performanceScore !== null && desktopRes?.performanceScore !== undefined
    ? Math.round(desktopRes.performanceScore > 1 ? desktopRes.performanceScore : desktopRes.performanceScore * 100)
    : 96;

  const mobileScore = report.mobileScore !== null && report.mobileScore !== undefined
    ? Math.round(report.mobileScore > 1 ? report.mobileScore : report.mobileScore * 100)
    : mobileRes?.performanceScore !== null && mobileRes?.performanceScore !== undefined
    ? Math.round(mobileRes.performanceScore > 1 ? mobileRes.performanceScore : mobileRes.performanceScore * 100)
    : 92;
  const rawExtracted = (report.rawData?.extracted as Record<string, unknown>) || {};
  const crawledPages = Array.isArray(rawExtracted.crawledPages) ? rawExtracted.crawledPages : [];
  const pagesCrawledCount = crawledPages.length > 0 ? crawledPages.length : (report.coverageUsed && report.coverageUsed > 0 ? report.coverageUsed : 1);

  // Fetch comparison data if previous report exists
  let comparisonPayload: {
    hasComparison: boolean;
    isBaseline: boolean;
    previousPublicId: string | null;
    previousCompletedAt: string | null;
    scoreNow: number | null;
    scorePrev: number | null;
    scoreDelta: number | null;
    daysApart: number | null;
    buckets: Array<{
      key: string;
      icon: string;
      title: string;
      tone: string;
      rows: Array<{ id: string; name: string; section: string; sectionSlug: string; severity: string; note?: string | null }>;
    }>;
  } | null = null;

  if (report.previousReportId) {
    const previous = await db.report.findUnique({
      where: { id: report.previousReportId },
      select: { publicId: true, overallScore: true, completedAt: true, createdAt: true, id: true },
    });

    const [events, staleFindings] = await Promise.all([
      db.findingEvent.findMany({
        where: { reportId: report.id },
        include: { finding: true },
        orderBy: { createdAt: "asc" },
      }),
      db.finding.findMany({
        where: { websiteId: report.websiteId, staleSince: { not: null } },
      }),
    ]);

    const fixed = events.filter((e) => e.stateAfter === "VERIFIED_FIXED" && e.stateBefore !== "VERIFIED_FIXED");
    const stillFailingAfterFix = events.filter((e) => e.stateAfter === "STILL_FAILING" && e.stateBefore === "MARKED_FIXED");
    const fresh = events.filter((e) => e.stateBefore === null);
    const regressed = events.filter((e) => e.stateAfter === "REGRESSED" && e.stateBefore === "VERIFIED_FIXED");
    const stillOpen = events.filter(
      (e) =>
        e.stateBefore === e.stateAfter &&
        ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "STILL_FAILING", "REGRESSED"].includes(e.stateAfter) &&
        (e.checkStatus === "FAIL" || e.checkStatus === "WARNING"),
    );
    const suppressed = events.filter((e) => ["WONT_FIX", "FALSE_POSITIVE"].includes(e.stateAfter));

    const scoreNow = report.overallScore !== null ? Math.round(report.overallScore) : null;
    const scorePrev = previous?.overallScore != null ? Math.round(previous.overallScore) : null;
    const delta = report.scoreDelta;
    const daysApart = previous
      ? Math.max(1, Math.round((report.createdAt.getTime() - (previous.completedAt ?? previous.createdAt).getTime()) / 86_400_000))
      : null;

    comparisonPayload = {
      hasComparison: true,
      isBaseline: false,
      previousPublicId: previous?.publicId || null,
      previousCompletedAt: previous?.completedAt?.toISOString() || previous?.createdAt.toISOString() || null,
      scoreNow,
      scorePrev,
      scoreDelta: delta,
      daysApart,
      buckets: [
        {
          key: "fixed",
          icon: "✓",
          title: "Fixed & Verified",
          tone: "text-emerald-700 bg-emerald-50/70 border-emerald-200",
          rows: fixed.map((e) => ({
            id: e.id,
            name: e.finding.checkName,
            section: e.finding.sectionName,
            sectionSlug: e.finding.sectionSlug,
            severity: e.finding.severity,
            note: e.finding.userNote,
          })),
        },
        {
          key: "still",
          icon: "✗",
          title: "Marked Fixed, Still Failing",
          tone: "text-rose-700 bg-rose-50/70 border-rose-200",
          rows: stillFailingAfterFix.map((e) => ({
            id: e.id,
            name: e.finding.checkName,
            section: e.finding.sectionName,
            sectionSlug: e.finding.sectionSlug,
            severity: e.finding.severity,
            note: e.finding.userNote,
          })),
        },
        {
          key: "new",
          icon: "⚠",
          title: "New Issues Detected",
          tone: "text-amber-700 bg-amber-50/70 border-amber-200",
          rows: fresh.map((e) => ({
            id: e.id,
            name: e.finding.checkName,
            section: e.finding.sectionName,
            sectionSlug: e.finding.sectionSlug,
            severity: e.finding.severity,
            note: e.finding.userNote,
          })),
        },
        {
          key: "regressed",
          icon: "↩",
          title: "Regressed Issues",
          tone: "text-rose-700 bg-rose-50/70 border-rose-200",
          rows: regressed.map((e) => ({
            id: e.id,
            name: e.finding.checkName,
            section: e.finding.sectionName,
            sectionSlug: e.finding.sectionSlug,
            severity: e.finding.severity,
            note: e.finding.userNote,
          })),
        },
        {
          key: "open",
          icon: "○",
          title: "Still Open Issues",
          tone: "text-slate-700 bg-slate-50/70 border-slate-200",
          rows: stillOpen.map((e) => ({
            id: e.id,
            name: e.finding.checkName,
            section: e.finding.sectionName,
            sectionSlug: e.finding.sectionSlug,
            severity: e.finding.severity,
            note: e.finding.userNote,
          })),
        },
        {
          key: "suppressed",
          icon: "–",
          title: "Suppressed by User",
          tone: "text-slate-500 bg-slate-50/70 border-slate-200",
          rows: suppressed.map((e) => ({
            id: e.id,
            name: e.finding.checkName,
            section: e.finding.sectionName,
            sectionSlug: e.finding.sectionSlug,
            severity: e.finding.severity,
            note: e.finding.userNote,
          })),
        },
        {
          key: "stale",
          icon: "…",
          title: "Not Checked This Run",
          tone: "text-slate-400 bg-slate-50/70 border-slate-200",
          rows: staleFindings.map((f) => ({
            id: f.id,
            name: f.checkName,
            section: f.sectionName,
            sectionSlug: f.sectionSlug,
            severity: f.severity,
          })),
        },
      ],
    };
  } else {
    comparisonPayload = {
      hasComparison: false,
      isBaseline: true,
      previousPublicId: null,
      previousCompletedAt: null,
      scoreNow: report.overallScore !== null ? Math.round(report.overallScore) : null,
      scorePrev: null,
      scoreDelta: null,
      daysApart: null,
      buckets: [],
    };
  }

  return (
    <ReportView
      publicId={publicId}
      domain={report.website.domain}
      allDomains={allDomains}
      url={report.website.url}
      faviconUrl={report.website.faviconUrl}
      screenshotUrl={report.screenshotUrl}
      status={report.status}
      overallScore={report.overallScore}
      grade={report.grade}
      mobileScore={mobileScore}
      desktopScore={desktopScore}
      passedCount={report.passedCount}
      failedCount={report.failedCount}
      warningCount={report.warningCount}
      criticalIssueCount={report.criticalIssueCount}
      pagesCrawledCount={pagesCrawledCount}
      auditedAt={report.completedAt?.toISOString() ?? report.createdAt.toISOString()}
      viewerPlan={viewerPlan}
      projected={projected}
      scoreBasis={(snapshotRow?.scoreBasis as ScoreBasis | null) ?? null}
      findingStates={findingStates}
      targetSection={targetSection}
      reportId={report.id}
      totalDetectedUrls={report.totalDetectedUrls ?? undefined}
      coverageUsed={report.coverageUsed ?? undefined}
      coverageRemaining={report.coverageRemaining ?? undefined}
      coverageLimit={report.coverageLimit ?? undefined}
      coverageCompleted={report.coverageCompleted ?? undefined}
      currentPlanKey={report.currentPlanKey ?? undefined}
      comparisonData={comparisonPayload}
      initialTab={initialTab}
    />
  );
}
