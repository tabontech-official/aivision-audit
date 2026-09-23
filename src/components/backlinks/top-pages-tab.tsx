"use client";

import React, { useState, useMemo } from "react";
import { Search, ExternalLink, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface TopPageRow {
  id: string;
  targetUrl: string;
  backlinksCount: number;
  referringDomainsCount: number;
  dofollowCount: number;
  nofollowCount: number;
  brokenCount: number;
  httpStatus: number | null;
}

interface TopPagesTabProps {
  topPages: TopPageRow[];
}

export function TopPagesTab({ topPages }: TopPagesTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"backlinksCount" | "referringDomainsCount">("backlinksCount");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const filtered = useMemo(() => {
    return topPages.filter((p) => {
      if (!searchQuery.trim()) return true;
      return p.targetUrl.toLowerCase().includes(searchQuery.toLowerCase().trim());
    });
  }, [topPages, searchQuery]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const valA = a[sortBy] || 0;
      const valB = b[sortBy] || 0;
      return sortOrder === "asc" ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
    });
  }, [filtered, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getStatusBadge = (status: number | null) => {
    const code = status || 200;
    if (code >= 200 && code < 300) {
      return { text: `${code} OK`, color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }
    if (code >= 300 && code < 400) {
      return { text: `${code} Redirect`, color: "bg-blue-50 text-blue-700 border-blue-200" };
    }
    if (code === 404) {
      return { text: "404 Not Found", color: "bg-rose-50 text-rose-700 border-rose-200" };
    }
    return { text: `${code} Error`, color: "bg-rose-50 text-rose-700 border-rose-200" };
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search target pages by URL path..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-300/40 font-sans"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700">
            <span className="font-semibold text-slate-500 text-[11px]">Sort By:</span>
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split("_");
                if (sb === "backlinksCount" || sb === "referringDomainsCount") {
                  setSortBy(sb);
                }
                if (so === "asc" || so === "desc") {
                  setSortOrder(so);
                }
                setCurrentPage(1);
              }}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs"
            >
              <option value="backlinksCount_desc">Most Backlinks</option>
              <option value="backlinksCount_asc">Fewest Backlinks</option>
              <option value="referringDomainsCount_desc">Most Ref Domains</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Top Pages Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-display font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Target Destination Page</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Inbound Backlinks</th>
                <th className="py-3 px-4 text-center">Referring Domains</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                    No target pages found matching your search.
                  </td>
                </tr>
              ) : (
                paginated.map((page) => {
                  const statusBadge = getStatusBadge(page.httpStatus);
                  return (
                    <tr key={page.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Target Page URL */}
                      <td className="py-3 px-4 max-w-md">
                        <div className="flex items-center gap-2.5">
                          <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                          <div className="truncate">
                            <a
                              href={page.targetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-slate-900 hover:text-emerald-700 flex items-center gap-1.5 transition-colors truncate"
                            >
                              <span className="truncate">{page.targetUrl}</span>
                              <ExternalLink className="h-3 w-3 text-slate-400 shrink-0" />
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* Status Code */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border",
                            statusBadge.color
                          )}
                        >
                          {statusBadge.text}
                        </span>
                      </td>

                      {/* Backlinks */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-display font-bold text-sm text-slate-900">
                          {page.backlinksCount.toLocaleString()}
                        </span>
                      </td>

                      {/* Referring Domains */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-display font-bold text-xs text-slate-700">
                          {page.referringDomainsCount.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 bg-slate-50/50">
          <div className="text-xs text-slate-500 font-sans">
            Showing{" "}
            <strong className="text-slate-800 font-medium">
              {sorted.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>{" "}
            to{" "}
            <strong className="text-slate-800 font-medium">
              {Math.min(currentPage * pageSize, sorted.length)}
            </strong>{" "}
            of <strong className="text-slate-800 font-medium">{sorted.length}</strong> linked pages
          </div>

          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value={10}>10 / page</option>
              <option value={15}>15 / page</option>
              <option value={25}>25 / page</option>
            </select>

            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="text-xs font-bold text-slate-700 px-1">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
