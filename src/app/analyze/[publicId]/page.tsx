import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db/client";
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
