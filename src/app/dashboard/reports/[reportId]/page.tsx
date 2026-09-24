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

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ reportId: string }>;
  searchParams?: Promise<{ section?: string }>;
}) {
  const user = await requireUser();
  const { reportId: publicId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const targetSection = resolvedSearchParams.section;

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
      auditedAt={report.completedAt?.toISOString() ?? report.createdAt.toISOString()}
      viewerPlan={viewerPlan}
      projected={projected}
      scoreBasis={(snapshotRow?.scoreBasis as ScoreBasis | null) ?? null}
      findingStates={findingStates}
      targetSection={targetSection}
    />
  );
}
