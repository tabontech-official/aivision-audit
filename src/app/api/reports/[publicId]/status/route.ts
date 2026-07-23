import { NextResponse } from "next/server";
import { getReportForViewer } from "@/services/reports/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/reports/[publicId]/status — polled by the /analyze progress screen.
 * Returns only progress metadata; never report content.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await params;

  const access = await getReportForViewer(publicId);
  if (!access.ok) {
    return NextResponse.json({ error: "Report not found." }, { status: access.status });
  }

  const { report } = access;

  return NextResponse.json({
    status: report.status,
    stage: report.currentStage,
    progress: report.progressPercent,
    error: report.status === "FAILED" ? report.errorMessage : null,
  });
}
