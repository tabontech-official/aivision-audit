import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { auth } from "@/lib/auth/auth";
import { getReportForViewer } from "@/services/reports/access";
import { AnalysisProgress } from "./analysis-progress";

export const metadata: Metadata = { title: "Analyzing your website" };
export const dynamic = "force-dynamic";

export default async function AnalyzePage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  // Audits require an account, so this screen is only ever reachable signed
  // in. Redirect rather than 404 so a visitor who followed a link mid-audit
  // is returned here after authenticating.
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?next=${encodeURIComponent(`/analyze/${publicId}`)}`);
  }

  const access = await getReportForViewer(publicId);
  if (!access.ok) notFound();

  const { report } = access;

  // Already done? Skip the theater and go straight to the report.
  if (report.status === "COMPLETED" || report.status === "PARTIAL") {
    redirect(`/report/${publicId}`);
  }

  const website = await db.website.findUnique({
    where: { id: report.websiteId },
    select: { domain: true, url: true },
  });

  return (
    <AnalysisProgress
      publicId={publicId}
      domain={website?.domain ?? "your website"}
      initialProgress={report.progressPercent}
    />
  );
}
