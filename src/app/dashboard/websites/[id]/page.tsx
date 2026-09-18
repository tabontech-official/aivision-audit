import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/rbac";
import { db } from "@/lib/db/client";
import type { ReportSnapshotPayload } from "@/services/reports/snapshot";
import type { ScoreBasis } from "@/services/reports/evaluate-report";
import { WebsiteDetail, type SerializedFinding, type TrendPoint, type ReportRow } from "./website-detail";

export const metadata: Metadata = { title: "Website" };
export const dynamic = "force-dynamic";

/**
 * The Fix List is the daily-use surface; the report is the artifact (H.1).
 * Header · score trend · tabs: Fix List (default) | Reports | Settings.
 */
export default async function WebsiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const website = await db.website.findUnique({
    where: { id },
    include: {
      reports: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, publicId: true, status: true, overallScore: true, grade: true,
          scoreDelta: true, previousReportId: true, createdAt: true, completedAt: true,
        },
      },
      findings: { orderBy: [{ severity: "asc" }, { firstSeenAt: "asc" }] },
    },
  });
  if (!website || website.deletedAt) notFound();
  if (website.userId !== user.id && user.role !== "MASTER_ADMIN") notFound();

  /* ---- trend: every COMPLETED/PARTIAL audit, oldest first, with coverage ---- */
  const terminal = website.reports
    .filter((r) => (r.status === "COMPLETED" || r.status === "PARTIAL") && r.overallScore !== null)
    .reverse();
  const snapshots = await db.reportSnapshot.findMany({
    where: { reportId: { in: terminal.map((r) => r.id) } },
    select: { reportId: true, scoreBasis: true, payload: true },
  });
  const basisByReport = new Map(
    snapshots.map((s) => [s.reportId, s.scoreBasis as ScoreBasis | null]),
  );

  const trend: TrendPoint[] = terminal.map((r) => ({
    publicId: r.publicId,
    score: r.overallScore!,
    date: (r.completedAt ?? r.createdAt).toISOString(),
    coverage: basisByReport.get(r.id)?.coverage ?? 1,
  }));

  /* ---- platform context from the newest snapshot ---- */
  const newestSnapshot = snapshots.find((s) => s.reportId === terminal[terminal.length - 1]?.id);
  const site = (newestSnapshot?.payload as unknown as ReportSnapshotPayload | null)?.site ?? null;

  const findings: SerializedFinding[] = website.findings.map((f) => ({
    id: f.id,
    checkName: f.checkName,
    sectionName: f.sectionName,
    sectionSlug: f.sectionSlug,
    pillar: f.pillar,
    severity: f.severity,
    state: f.state,
    userNote: f.userNote,
    firstSeenAt: f.firstSeenAt.toISOString(),
    lastSeenAt: f.lastSeenAt.toISOString(),
    stale: f.staleSince !== null,
    lastReportId: f.lastReportId,
  }));

  const reports: ReportRow[] = website.reports.map((r) => ({
    publicId: r.publicId,
    status: r.status,
    overallScore: r.overallScore,
    grade: r.grade,
    scoreDelta: r.scoreDelta,
    hasComparison: r.previousReportId !== null,
    createdAt: r.createdAt.toISOString(),
  }));

  const latest = terminal[terminal.length - 1] ?? null;
  const latestDelta = latest?.scoreDelta ?? null;

  return (
    <WebsiteDetail
      websiteId={website.id}
      domain={website.domain}
      url={website.url}
      latestScore={latest?.overallScore ?? null}
      latestGrade={latest?.grade ?? null}
      latestDelta={latestDelta}
      latestReportPublicId={latest?.publicId ?? null}
      platform={site?.platform ?? null}
      themeName={site?.themeName ?? null}
      appCount={site?.isShopify ? site.appCount : null}
      auditSchedule={website.auditSchedule}
      userPlan={user.plan as string}
      trend={trend}
      findings={findings}
      reports={reports}
    />
  );
}
