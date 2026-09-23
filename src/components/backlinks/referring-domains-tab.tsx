"use client";

import React, { useState, useMemo } from "react";
import { Search, ExternalLink, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from "lucide-react";

export interface ReferringDomainRow {
  id: string;
  domain: string;
  backlinksCount: number;
  dofollowCount: number;
  nofollowCount: number;
  domainRank: number;
  ip: string | null;
  country: string | null;
  firstSeen: Date | string | null;
  lastSeen: Date | string | null;
}

interface ReferringDomainsTabProps {
  referringDomains: ReferringDomainRow[];
}

export function ReferringDomainsTab({ referringDomains }: ReferringDomainsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"backlinksCount" | "dofollowCount" | "nofollowCount">("backlinksCount");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const filtered = useMemo(() => {
    return referringDomains.filter((d) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return d.domain.toLowerCase().includes(q);
    });
  }, [referringDomains, searchQuery]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const valA = a[sortBy] || 0;
      const valB = b[sortBy] || 0;
      return sortOrder === "asc" ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
    });
  }, [filtered, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
            placeholder="Search referring domains..."
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
                if (sb === "backlinksCount" || sb === "dofollowCount" || sb === "nofollowCount") {
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
              <option value="dofollowCount_desc">Most Dofollow</option>
              <option value="nofollowCount_desc">Most Nofollow</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Referring Domains Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-display font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Referring Domain</th>
                <th className="py-3 px-4 text-center">Total Inbound Links</th>
                <th className="py-3 px-4 text-center">Dofollow Links</th>
                <th className="py-3 px-4 text-center">Nofollow Links</th>
                <th className="py-3 px-4 text-center">Equity Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                    No referring domains found matching your search.
                  </td>
                </tr>
              ) : (
                paginated.map((item) => {
                  const dofollowPct =
                    item.backlinksCount > 0
                      ? Math.round((item.dofollowCount / item.backlinksCount) * 100)
                      : 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Domain Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#dff2ed] text-slate-900 shrink-0 font-bold text-xs">
                            {item.domain.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <a
                              href={`https://${item.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-slate-900 hover:text-emerald-700 flex items-center gap-1.5 transition-colors"
                            >
                              <span>{item.domain}</span>
                              <ExternalLink className="h-3 w-3 text-slate-400" />
                            </a>
                            <span className="text-[11px] text-slate-400">Root Domain</span>
                          </div>
                        </div>
                      </td>

                      {/* Total Backlinks */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-display font-bold text-sm text-slate-900">
                          {item.backlinksCount.toLocaleString()}
                        </span>
                      </td>

                      {/* Dofollow */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>{item.dofollowCount.toLocaleString()}</span>
                        </span>
                      </td>

                      {/* Nofollow */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                          <XCircle className="h-3 w-3" />
                          <span>{item.nofollowCount.toLocaleString()}</span>
                        </span>
                      </td>

                      {/* Equity Share */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              style={{ width: `${dofollowPct}%` }}
                              className="h-full bg-emerald-500 rounded-full"
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-600">
                            {dofollowPct}%
                          </span>
                        </div>
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
            of <strong className="text-slate-800 font-medium">{sorted.length}</strong> referring domains
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
