import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/rbac";
import { db } from "@/lib/db/client";
import { ReportsList, type ReportRow } from "./reports-list";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; project?: string; section?: string; status?: string; page?: string }>;
}) {
  const user = await requireUser();
  const { q = "", project = "", section = "", status = "", page = "1" } = await searchParams;

  // If a project is specified (from sidebar or project selector), open its latest report directly
  if (project) {
    const activeWebsite = await db.website.findFirst({
      where: {
        userId: user.id,
        deletedAt: null,
        OR: [
          { domain: { contains: project, mode: "insensitive" } },
          { url: { contains: project, mode: "insensitive" } },
        ],
      },
      include: {
        reports: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const activeReport = activeWebsite?.reports[0];
    if (activeReport) {
      const sectionQuery = section ? `?section=${encodeURIComponent(section)}` : "";
      const targetPath = (activeReport.status === "COMPLETED" || activeReport.status === "PARTIAL")
        ? `/dashboard/reports/${activeReport.publicId}${sectionQuery}`
        : `/analyze/${activeReport.publicId}`;
      redirect(targetPath);
    }
  }

  const pageNum = Math.max(1, Number(page) || 1);

  const where: Prisma.ReportWhereInput = {
    userId: user.id,
    deletedAt: null,
    ...(q ? { website: { domain: { contains: q, mode: "insensitive" } } } : {}),
    ...(status && ["COMPLETED", "PARTIAL", "FAILED", "PROCESSING", "QUEUED"].includes(status)
      ? { status: status as Prisma.ReportWhereInput["status"] }
      : {}),
  };

  const [reports, total] = await Promise.all([
    db.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { website: { select: { domain: true, url: true } } },
    }),
    db.report.count({ where }),
  ]);

  const rows: ReportRow[] = reports.map((r) => ({
    id: r.id,
    publicId: r.publicId,
    domain: r.website.domain,
    url: r.website.url,
    status: r.status,
    overallScore: r.overallScore,
    grade: r.grade,
    passedCount: r.passedCount,
    failedCount: r.failedCount,
    warningCount: r.warningCount,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <ReportsList
      reports={rows}
      total={total}
      page={pageNum}
      pageSize={PAGE_SIZE}
      query={q}
      statusFilter={status}
    />
  );
}
