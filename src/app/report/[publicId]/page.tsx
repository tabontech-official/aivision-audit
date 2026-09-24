import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { getReportForViewer } from "@/services/reports/access";

export const metadata: Metadata = { title: "Your store audit" };
export const dynamic = "force-dynamic";

/**
 * Public report entry point.
 *
 * Audits require an account, so there is no anonymous teaser: an
 * unauthenticated visitor is sent to sign in and returned here afterwards,
 * and an authenticated owner goes straight to the full report in the
 * dashboard. This route exists mainly so links shared or emailed before
 * sign-in still land somewhere sensible.
 *
 * The anonymous ownership path in `getReportForViewer()` is left intact but
 * is not reachable through the normal flow.
 */
export default async function ReportGatePage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;

  const session = await auth();
  if (!session?.user) {
    redirect(`/login?next=${encodeURIComponent(`/report/${publicId}`)}`);
  }

  const access = await getReportForViewer(publicId);
  if (!access.ok) notFound();

  const { report } = access;

  if (report.status === "QUEUED" || report.status === "PROCESSING") {
    redirect(`/analyze/${publicId}`);
  }

  const website = await db.website.findUnique({
    where: { id: report.websiteId },
    select: { domain: true },
  });

  if (website?.domain) {
    redirect(`/dashboard?project=${encodeURIComponent(website.domain)}`);
  }

  redirect(`/dashboard/reports/${publicId}`);
}
