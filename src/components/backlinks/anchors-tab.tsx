"use client";

import React, { useState, useMemo } from "react";
import { Search, Tag, Percent, PieChart, Layers, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AnchorType } from "@prisma/client";

export interface AnchorRow {
  id: string;
  anchor: string;
  backlinksCount: number;
  referringDomainsCount: number;
  percentage: number;
  classification: AnchorType;
}

interface AnchorsTabProps {
  anchors: AnchorRow[];
  totalBacklinks: number;
}

export function AnchorsTab({ anchors, totalBacklinks }: AnchorsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"backlinksCount" | "referringDomainsCount" | "percentage">("backlinksCount");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Group classification counts & percentages
  const classBreakdown = useMemo(() => {
    const counts: Record<AnchorType, { backlinks: number; anchorsCount: number }> = {
      BRANDED: { backlinks: 0, anchorsCount: 0 },
      EXACT_MATCH: { backlinks: 0, anchorsCount: 0 },
      PARTIAL_MATCH: { backlinks: 0, anchorsCount: 0 },
      NAKED_URL: { backlinks: 0, anchorsCount: 0 },
      GENERIC: { backlinks: 0, anchorsCount: 0 },
      OTHER: { backlinks: 0, anchorsCount: 0 },
    };

    let totalBL = 0;
    anchors.forEach((a) => {
      if (counts[a.classification]) {
        counts[a.classification].backlinks += a.backlinksCount;
        counts[a.classification].anchorsCount += 1;
        totalBL += a.backlinksCount;
      }
    });

    const total = totalBL || totalBacklinks || 1;

    return {
      BRANDED: { ...counts.BRANDED, pct: Math.round((counts.BRANDED.backlinks / total) * 100) },
      EXACT_MATCH: { ...counts.EXACT_MATCH, pct: Math.round((counts.EXACT_MATCH.backlinks / total) * 100) },
      PARTIAL_MATCH: { ...counts.PARTIAL_MATCH, pct: Math.round((counts.PARTIAL_MATCH.backlinks / total) * 100) },
      NAKED_URL: { ...counts.NAKED_URL, pct: Math.round((counts.NAKED_URL.backlinks / total) * 100) },
      GENERIC: { ...counts.GENERIC, pct: Math.round((counts.GENERIC.backlinks / total) * 100) },
      OTHER: { ...counts.OTHER, pct: Math.round((counts.OTHER.backlinks / total) * 100) },
    };
  }, [anchors, totalBacklinks]);

  // Classification styling helper
  const getBadgeStyle = (classification: AnchorType) => {
    switch (classification) {
      case "BRANDED":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "EXACT_MATCH":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "PARTIAL_MATCH":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "NAKED_URL":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "GENERIC":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const filtered = useMemo(() => {
    return anchors.filter((a) => {
      if (selectedClass !== "ALL" && a.classification !== selectedClass) return false;
      if (searchQuery.trim() && !a.anchor.toLowerCase().includes(searchQuery.toLowerCase().trim())) {
        return false;
      }
      return true;
    });
  }, [anchors, selectedClass, searchQuery]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      return sortOrder === "asc" ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
    });
  }, [filtered, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* 1. Anchor Classification Breakdown Visual Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="h-4 w-4 text-slate-900" />
            <h3 className="font-display text-sm font-bold text-slate-900">
              Anchor Text Classification & Profile Diversity
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500 font-sans">
            {anchors.length} Unique Anchors
          </span>
        </div>

        {/* Stacked Classification Bar */}
        <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
          <div style={{ width: `${classBreakdown.BRANDED.pct}%` }} className="bg-purple-500" title={`Branded: ${classBreakdown.BRANDED.pct}%`} />
          <div style={{ width: `${classBreakdown.NAKED_URL.pct}%` }} className="bg-emerald-500" title={`Naked URL: ${classBreakdown.NAKED_URL.pct}%`} />
          <div style={{ width: `${classBreakdown.EXACT_MATCH.pct}%` }} className="bg-blue-500" title={`Exact Match: ${classBreakdown.EXACT_MATCH.pct}%`} />
          <div style={{ width: `${classBreakdown.PARTIAL_MATCH.pct}%` }} className="bg-indigo-500" title={`Partial Match: ${classBreakdown.PARTIAL_MATCH.pct}%`} />
          <div style={{ width: `${classBreakdown.GENERIC.pct}%` }} className="bg-slate-400" title={`Generic: ${classBreakdown.GENERIC.pct}%`} />
          <div style={{ width: `${classBreakdown.OTHER.pct}%` }} className="bg-slate-300" title={`Other: ${classBreakdown.OTHER.pct}%`} />
        </div>

        {/* Classification Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          {[
            { key: "BRANDED", label: "Branded", pct: classBreakdown.BRANDED.pct, bl: classBreakdown.BRANDED.backlinks, dot: "bg-purple-500" },
            { key: "NAKED_URL", label: "Naked URL", pct: classBreakdown.NAKED_URL.pct, bl: classBreakdown.NAKED_URL.backlinks, dot: "bg-emerald-500" },
            { key: "EXACT_MATCH", label: "Exact Match", pct: classBreakdown.EXACT_MATCH.pct, bl: classBreakdown.EXACT_MATCH.backlinks, dot: "bg-blue-500" },
            { key: "PARTIAL_MATCH", label: "Partial Match", pct: classBreakdown.PARTIAL_MATCH.pct, bl: classBreakdown.PARTIAL_MATCH.backlinks, dot: "bg-indigo-500" },
            { key: "GENERIC", label: "Generic", pct: classBreakdown.GENERIC.pct, bl: classBreakdown.GENERIC.backlinks, dot: "bg-slate-400" },
            { key: "OTHER", label: "Other / Empty", pct: classBreakdown.OTHER.pct, bl: classBreakdown.OTHER.backlinks, dot: "bg-slate-300" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setSelectedClass(selectedClass === item.key ? "ALL" : item.key);
                setCurrentPage(1);
              }}
              className={cn(
                "p-3 rounded-xl border text-left transition-all cursor-pointer font-sans",
                selectedClass === item.key
                  ? "border-slate-900 bg-slate-100 shadow-2xs"
                  : "border-slate-100 bg-slate-50/70 hover:bg-slate-100/70"
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full shrink-0", item.dot)} />
                <span className="text-[11px] font-bold text-slate-700 truncate">{item.label}</span>
              </div>
              <div className="font-display font-black text-base text-slate-900 mt-1">
                {item.pct}%
              </div>
              <span className="text-[10px] text-slate-400 block font-medium">
                {item.bl.toLocaleString()} links
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Toolbar & Search */}
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
            placeholder="Search anchor keywords..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-300/40 font-sans"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Classification Filter Dropdown */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700">
            <span className="font-semibold text-slate-500 text-[11px]">Type:</span>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL">All Classifications</option>
              <option value="BRANDED">Branded</option>
              <option value="NAKED_URL">Naked URL</option>
              <option value="EXACT_MATCH">Exact Match</option>
              <option value="PARTIAL_MATCH">Partial Match</option>
              <option value="GENERIC">Generic</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700">
            <span className="font-semibold text-slate-500 text-[11px]">Sort:</span>
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split("_");
                if (sb === "backlinksCount" || sb === "referringDomainsCount" || sb === "percentage") {
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
              <option value="referringDomainsCount_desc">Most Ref Domains</option>
              <option value="percentage_desc">Highest Percentage</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Anchors Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-display font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Anchor Text</th>
                <th className="py-3 px-4 text-center">Classification</th>
                <th className="py-3 px-4 text-center">Backlinks</th>
                <th className="py-3 px-4 text-center">Referring Domains</th>
                <th className="py-3 px-4">Profile Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                    No anchor texts found matching your filter.
                  </td>
                </tr>
              ) : (
                paginated.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 max-w-sm">
                      <span className="font-bold text-slate-900 block truncate" title={item.anchor}>
                        &quot;{item.anchor}&quot;
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border uppercase tracking-wide",
                          getBadgeStyle(item.classification)
                        )}
                      >
                        {item.classification.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="font-display font-bold text-sm text-slate-900">
                        {item.backlinksCount.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="font-display font-bold text-xs text-slate-700">
                        {item.referringDomainsCount.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 max-w-xs">
                        <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, item.percentage * 2)}%` }}
                            className="h-full bg-slate-900 rounded-full"
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-800 tabular-nums w-10 text-right">
                          {item.percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
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
            of <strong className="text-slate-800 font-medium">{sorted.length}</strong> anchor records
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
