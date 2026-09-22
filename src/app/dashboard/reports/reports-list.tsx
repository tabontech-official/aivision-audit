"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, RotateCw, Trash2, FileSearch, ExternalLink } from "lucide-react";
import { ScorePill } from "@/components/report/score-ring";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { deleteReportAction, rerunAuditAction } from "./actions";

export type ReportRow = {
  id: string;
  publicId: string;
  domain: string;
  url: string;
  status: string;
  overallScore: number | null;
  grade: string | null;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  createdAt: string;
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PARTIAL", label: "Partial" },
  { value: "PROCESSING", label: "In progress" },
  { value: "FAILED", label: "Failed" },
];

function statusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return <Badge variant="enabled">Completed</Badge>;
    case "PARTIAL":
      return <Badge variant="medium">Partial</Badge>;
    case "FAILED":
      return <Badge variant="critical">Failed</Badge>;
    case "PROCESSING":
    case "QUEUED":
      return <Badge variant="info">In progress</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

export function ReportsList({
  reports,
  total,
  page,
  pageSize,
  query,
  statusFilter,
}: {
  reports: ReportRow[];
  total: number;
  page: number;
  pageSize: number;
  query: string;
  statusFilter: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState(query);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const applyFilters = (next: { q?: string; status?: string }) => {
    const params = new URLSearchParams();
    const qv = next.q ?? search;
    const sv = next.status ?? statusFilter;
    if (qv) params.set("q", qv);
    if (sv) params.set("status", sv);
    router.push(`/dashboard/reports${params.toString() ? `?${params}` : ""}`);
  };

  const del = (id: string) => {
    if (!confirm("Delete this audited site? This will remove the site and its reports from your account.")) return;
    setFlash(null);
    startTransition(async () => {
      const r = await deleteReportAction(id);
      if (r.ok) {
        setFlash({ kind: "success", text: r.message ?? "Site audit deleted." });
        router.refresh();
      } else setFlash({ kind: "error", text: r.error });
    });
  };

  const rerun = (id: string) => {
    setFlash(null);
    startTransition(async () => {
      const r = await rerunAuditAction(id);
      if (r.ok && r.redirectTo) router.push(r.redirectTo);
      else if (!r.ok) setFlash({ kind: "error", text: r.error });
    });
  };

  return (
    <div className="space-y-6 font-lazzer text-slate-800">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Audited Sites & Reports
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">{total} audited sites and live reports</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters({ q: search });
          }}
          className="relative flex-1 min-w-[200px]"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by domain…"
            aria-label="Search reports"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300/40"
          />
        </form>
        <select
          value={statusFilter}
          onChange={(e) => applyFilters({ status: e.target.value })}
          aria-label="Filter by status"
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300/40 cursor-pointer"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {flash && (
        <Alert variant={flash.kind === "success" ? "success" : "error"}>{flash.text}</Alert>
      )}

      {reports.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center shadow-xs">
          <FileSearch className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
          <p className="mt-3 text-xs sm:text-sm text-slate-500">
            {query || statusFilter ? "No reports match your filters." : "No reports generated yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reports.map((r) => {
            const done = r.status === "COMPLETED" || r.status === "PARTIAL";
            const href = done ? `/dashboard/reports/${r.publicId}` : `/analyze/${r.publicId}`;
            return (
              <div key={r.id} className="rounded-2xl border border-slate-200/80 bg-white flex flex-col p-5 shadow-xs transition-all hover:border-slate-300">
                <div className="flex items-start gap-4">
                  <ScorePill score={r.overallScore} />
                  <div className="min-w-0 flex-1">
                    <Link href={href} className="block truncate font-bold text-slate-900 hover:text-slate-700 text-sm sm:text-base">
                      {r.domain}
                    </Link>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      {statusBadge(r.status)}
                      <span>
                        {new Date(r.createdAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {done && (
                  <div className="mt-3.5 flex items-center gap-3 text-xs font-semibold text-slate-600">
                    <span className="text-emerald-600">{r.passedCount} passed</span>
                    <span className="text-amber-600">{r.warningCount} warnings</span>
                    <span className="text-rose-600">{r.failedCount} failed</span>
                    {r.grade && <span className="ml-auto font-bold text-slate-900">{r.grade}</span>}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                  <Link
                    href={href}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-slate-700"
                  >
                    <span>{done ? "Open report" : "View progress"}</span>
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </Link>
                  <div className="ml-auto flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => rerun(r.id)}
                      disabled={pending}
                      title="Re-run audit"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      <RotateCw className="h-3 w-3" aria-hidden />
                      <span>Re-run</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => del(r.id)}
                      disabled={pending}
                      aria-label={`Delete report for ${r.domain}`}
                      title="Delete"
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-500">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/dashboard/reports?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(statusFilter ? { status: statusFilter } : {}), page: String(page - 1) })}`}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/reports?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(statusFilter ? { status: statusFilter } : {}), page: String(page + 1) })}`}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
