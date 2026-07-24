import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/rbac";
import { db } from "@/lib/db/client";
import { getProjectedReport } from "@/services/reports/project-report";
import { ReportView } from "./report-view";
import type { UserPlan } from "@prisma/client";

export const metadata: Metadata = { title: "Report" };
export const dynamic = "force-dynamic";

/**
 * Full report page for authenticated owners.
 * Ownership is enforced here; the snapshot is projected server-side by the
 * viewer's plan, so premium detail never reaches a free user's browser.
 */
export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const user = await requireUser();
  const { reportId: publicId } = await params;

  if (!publicId || publicId.length > 40) notFound();

  const report = await db.report.findUnique({
    where: { publicId },
    include: {
      website: { select: { domain: true, url: true, faviconUrl: true } },
      pageSpeedResults: { select: { strategy: true, performanceScore: true } },
    },
  });

  // Only the owner (or admin) may view via this route
  if (!report || report.deletedAt) notFound();
  if (report.userId !== user.id && user.role !== "MASTER_ADMIN") notFound();

  // Still running → send to the progress screen
  if (report.status === "QUEUED" || report.status === "PROCESSING") {
    redirect(`/analyze/${publicId}`);
  }

  const viewerPlan = user.plan as UserPlan;
  const projected = await getProjectedReport(report.id, viewerPlan);

  if (!projected) {
    // Failed audit or missing snapshot
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

  return (
    <ReportView
      publicId={publicId}
      domain={report.website.domain}
      url={report.website.url}
      faviconUrl={report.website.faviconUrl}
      screenshotUrl={report.screenshotUrl}
      status={report.status}
      overallScore={report.overallScore}
      grade={report.grade}
      mobileScore={report.mobileScore}
      desktopScore={report.desktopScore}
      passedCount={report.passedCount}
      failedCount={report.failedCount}
      warningCount={report.warningCount}
      criticalIssueCount={report.criticalIssueCount}
      auditedAt={report.completedAt?.toISOString() ?? report.createdAt.toISOString()}
      viewerPlan={viewerPlan}
      projected={projected}
    />
  );
}
