import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db/client";
import { requireMasterAdmin } from "@/lib/auth/rbac";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

function statusBadge(status: string) {
  switch (status) {
    case "COMPLETED": return <Badge variant="enabled">Completed</Badge>;
    case "PARTIAL": return <Badge variant="medium">Partial</Badge>;
    case "FAILED": return <Badge variant="critical">Failed</Badge>;
    case "PROCESSING": return <Badge variant="info">Processing</Badge>;
    default: return <Badge variant="neutral">Queued</Badge>;
  }
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireMasterAdmin();
  const { page = "1" } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);

  const [reports, total] = await Promise.all([
    db.report.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        website: { select: { domain: true, url: true } },
        user: { select: { email: true } },
      },
    }),
    db.report.count({ where: { deletedAt: null } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Reports</h1>
        <p className="mt-1 text-sm text-ink-secondary">{total} audits across all users</p>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3 font-medium">Website</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-muted">
                  No reports yet.
                </td>
              </tr>
            )}
            {reports.map((r) => (
              <tr key={r.id} className="hover:bg-surface-subtle/60">
                <td className="px-4 py-3">
                  <Link
                    href={`/report/${r.publicId}`}
                    className="font-medium text-brand-600 hover:text-brand-700"
                  >
                    {r.website.domain}
                  </Link>
                  <div className="max-w-[240px] truncate text-xs text-ink-muted">
                    {r.website.url}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-ink-secondary">
                  {r.user?.email ?? <span className="text-ink-muted">anonymous</span>}
                </td>
                <td className="px-4 py-3">{statusBadge(r.status)}</td>
                <td className="px-4 py-3 tabular-nums text-ink-secondary">
                  {r.overallScore !== null ? Math.round(r.overallScore) : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-ink-muted">
                  {r.createdAt.toLocaleString("en-US", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-ink-secondary">
          <span>Page {pageNum} of {totalPages}</span>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <Link href={`/master-admin/reports?page=${pageNum - 1}`} className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50">
                Previous
              </Link>
            )}
            {pageNum < totalPages && (
              <Link href={`/master-admin/reports?page=${pageNum + 1}`} className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
