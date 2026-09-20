import React, { useState, useMemo, useEffect, useTransition } from "react";
import {
  Search,
  ExternalLink,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  X,
  Globe2,
  RotateCw,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getFilteredBacklinksAction } from "@/app/dashboard/backlinks/actions";

export interface BacklinkItem {
  id: string;
  referringDomain: string;
  referringUrl: string;
  targetUrl: string;
  anchor: string | null;
  isDofollow: boolean;
  domainRank: number;
  pageRank: number;
  httpStatus: number | null;
  isNew: boolean;
  isLost: boolean;
  isBroken: boolean;
  isSuspicious: boolean;
  lossReason: string | null;
  firstSeen: Date | string | null;
  lastSeen: Date | string | null;
}

interface BacklinksTabProps {
  backlinks: BacklinkItem[];
  domain: string;
  totalIndexedBacklinks?: number;
  detailedBacklinksAvailable?: number;
  detailedBacklinksFetched?: number;
  totalBacklinks?: number;
  status?: string;
  onResumeFetch?: () => void;
  isResuming?: boolean;
}

export function BacklinksTab({
  backlinks: initialBacklinks,
  domain,
  totalIndexedBacklinks,
  detailedBacklinksAvailable,
  detailedBacklinksFetched,
  totalBacklinks,
  status,
  onResumeFetch,
  isResuming,
}: BacklinksTabProps) {
  const totalIndexed = totalIndexedBacklinks ?? totalBacklinks ?? initialBacklinks.length;
  const detailedAvailable = detailedBacklinksAvailable ?? (detailedBacklinksFetched || initialBacklinks.length);
  const detailedFetched = detailedBacklinksFetched ?? initialBacklinks.length;
  const isPartial = status === "partially_completed" || (detailedFetched < detailedAvailable && detailedAvailable > 0);

  const [items, setItems] = useState<BacklinkItem[]>(initialBacklinks);
  const [totalCount, setTotalCount] = useState<number>(detailedFetched);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "dofollow" | "nofollow" | "new" | "lost" | "broken" | "suspicious">("all");
  const [minRankFilter, setMinRankFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"domainRank" | "pageRank" | "firstSeen" | "lastSeen">("domainRank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [inspectItem, setInspectItem] = useState<BacklinkItem | null>(null);
  const [isPending, startTransition] = useTransition();

  // Fetch paginated & filtered records from server
  const fetchPage = (
    page: number,
    size: number,
    type: "all" | "dofollow" | "nofollow" | "new" | "lost" | "broken" | "suspicious",
    search: string,
    minRank: number,
    sort: "domainRank" | "pageRank" | "firstSeen" | "lastSeen",
    order: "asc" | "desc"
  ) => {
    startTransition(async () => {
      const res = await getFilteredBacklinksAction(domain, {
        page,
        pageSize: size,
        type: type === "all" ? undefined : type,
        search: search.trim() || undefined,
        minRank: minRank > 0 ? minRank : undefined,
        sortBy: sort,
        sortOrder: order,
      });

      if (res.ok && Array.isArray(res.items)) {
        setItems(res.items as BacklinkItem[]);
        setTotalCount(res.totalCount);
      }
    });
  };

  // Trigger server fetch on filter change
  useEffect(() => {
    // Only perform fetch if filters or page changes from defaults
    const debounce = setTimeout(() => {
      fetchPage(currentPage, pageSize, selectedType, searchQuery, minRankFilter, sortBy, sortOrder);
    }, 250);
    return () => clearTimeout(debounce);
  }, [currentPage, pageSize, selectedType, searchQuery, minRankFilter, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const formatDate = (date: Date | string | null) => {
    if (!date) return "—";
    const d = new Date(date);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const fromRow = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toRow = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by domain, URL, target, or anchor text..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#FF4D00] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 font-sans"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Min Rank Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700">
            <span className="font-semibold text-slate-500 text-[11px]">Min DR:</span>
            <select
              value={minRankFilter}
              onChange={(e) => {
                setMinRankFilter(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs"
            >
              <option value={0}>All Ranks</option>
              <option value={20}>DR 20+</option>
              <option value={40}>DR 40+</option>
              <option value={60}>DR 60+</option>
              <option value={80}>DR 80+</option>
            </select>
          </div>

          {/* Sort By Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700">
            <span className="font-semibold text-slate-500 text-[11px]">Sort:</span>
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split("_");
                if (sb === "domainRank" || sb === "pageRank" || sb === "firstSeen" || sb === "lastSeen") {
                  setSortBy(sb);
                }
                if (so === "asc" || so === "desc") {
                  setSortOrder(so);
                }
                setCurrentPage(1);
              }}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs"
            >
              <option value="domainRank_desc">Highest DR</option>
              <option value="domainRank_asc">Lowest DR</option>
              <option value="lastSeen_desc">Last Seen</option>
              <option value="firstSeen_desc">First Seen</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Type Filter Pills & Count Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: "all" as const, label: "All Backlinks" },
            { key: "dofollow" as const, label: "Dofollow" },
            { key: "nofollow" as const, label: "Nofollow" },
            { key: "broken" as const, label: "Broken (404)" },
            { key: "new" as const, label: "New Links" },
            { key: "lost" as const, label: "Lost Links" },
          ].map((pill) => {
            const isSelected = selectedType === pill.key;
            return (
              <button
                key={pill.key}
                type="button"
                onClick={() => {
                  setSelectedType(pill.key);
                  setCurrentPage(1);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold font-sans transition-all cursor-pointer",
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <span>{pill.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 font-sans">
          {isPending && <RotateCw className="h-3.5 w-3.5 animate-spin text-[#FF4D00]" />}
          <span>
            Total: <strong className="text-slate-900 font-bold">{totalCount.toLocaleString()}</strong> backlinks
          </span>
        </div>
      </div>

      {/* 3. Backlinks Table Notice Banner */}
      <div
        className={cn(
          "flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs font-sans",
          isPartial
            ? "bg-amber-50/70 border-amber-200 text-amber-900"
            : "bg-slate-50/80 border-slate-200 text-slate-700"
        )}
      >
        <div className="flex items-center gap-2.5">
          <Info className={cn("h-4 w-4 shrink-0", isPartial ? "text-amber-600" : "text-slate-500")} />
          <span className="font-medium">
            {totalCount === 0
              ? "No backlinks found for this domain."
              : isPartial
              ? `Showing ${items.length} of ${totalCount.toLocaleString()} backlinks loaded for ${domain}.`
              : `Showing all ${totalCount.toLocaleString()} analyzed backlinks for ${domain}.`}
          </span>
        </div>

        {isPartial && onResumeFetch && (
          <button
            type="button"
            onClick={onResumeFetch}
            disabled={isResuming || isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <RotateCw className={cn("h-3 w-3", (isResuming || isPending) && "animate-spin")} />
            <span>{isResuming ? "Resuming..." : "Resume Fetch"}</span>
          </button>
        )}
      </div>

      {/* 4. Backlinks Data Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-display font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Referring Page & Domain</th>
                <th className="py-3 px-4">Anchor Text & Target</th>
                <th className="py-3 px-4 text-center">DR</th>
                <th className="py-3 px-4 text-center">Type</th>
                <th className="py-3 px-4">Crawled Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No backlinks found matching your filters.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Referring Page */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex items-start gap-2">
                        <Globe2 className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                        <div className="truncate">
                          <span className="font-bold text-slate-900 block truncate">
                            {item.referringDomain}
                          </span>
                          <a
                            href={item.referringUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-slate-500 hover:text-[#FF4D00] truncate block flex items-center gap-1"
                          >
                            <span className="truncate">{item.referringUrl}</span>
                            <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                          </a>
                        </div>
                      </div>
                    </td>

                    {/* Anchor Text & Target */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="truncate">
                        <span className="font-semibold text-slate-900 block truncate" title={item.anchor || "(empty anchor)"}>
                          {item.anchor ? `"${item.anchor}"` : <em className="text-slate-400">No anchor text</em>}
                        </span>
                        <a
                          href={item.targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-slate-400 hover:text-[#FF4D00] truncate block flex items-center gap-1"
                        >
                          <span className="truncate">{item.targetUrl}</span>
                          <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                        </a>
                      </div>
                    </td>

                    {/* Domain Rank */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center justify-center font-display font-bold px-2 py-0.5 rounded-lg text-xs",
                          item.domainRank >= 70
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : item.domainRank >= 40
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        )}
                      >
                        {item.domainRank > 0 ? item.domainRank : "—"}
                      </span>
                    </td>

                    {/* Link Type (Dofollow / Nofollow) */}
                    <td className="py-3 px-4 text-center">
                      {item.isDofollow ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Dofollow</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                          <XCircle className="h-3 w-3" />
                          <span>Nofollow</span>
                        </span>
                      )}
                    </td>

                    {/* Dates */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 text-[11px]">
                      <span className="font-medium text-slate-800">{formatDate(item.lastSeen)}</span>
                    </td>

                    {/* Status Tags */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {item.isBroken && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200" title="Broken link (404)">
                            404
                          </span>
                        )}
                        {item.isSuspicious && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200" title="Suspicious domain">
                            Spam
                          </span>
                        )}
                        {item.isNew && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200" title="New link">
                            New
                          </span>
                        )}
                        {item.isLost && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200" title="Lost link">
                            Lost
                          </span>
                        )}
                        {!item.isBroken && !item.isSuspicious && !item.isNew && !item.isLost && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-400">
                            Active
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setInspectItem(item)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-[#FF4D00] p-1 rounded transition-colors cursor-pointer"
                        title="View Backlink Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Table Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 bg-slate-50/50">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-sans">
            <span>
              Showing{" "}
              <strong className="text-slate-800 font-medium">
                {fromRow}
              </strong>{" "}
              to{" "}
              <strong className="text-slate-800 font-medium">
                {toRow}
              </strong>{" "}
              of <strong className="text-slate-800 font-medium">{totalCount.toLocaleString()}</strong> backlinks
            </span>
            {isPending && (
              <RotateCw className="h-3 w-3 animate-spin text-[#FF4D00]" />
            )}
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
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>

            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(1)}
              title="First Page"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              title="Previous Page"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="text-xs font-bold text-slate-700 px-1">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              title="Next Page"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              title="Last Page"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Backlink Detail Modal Drawer */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-sans">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-slate-100 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-[#FF4D00]" />
                <h3 className="font-display text-base font-bold text-slate-900">
                  Backlink Details: {inspectItem.referringDomain}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Referring Source URL</span>
                <a
                  href={inspectItem.referringUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-slate-800 hover:text-[#FF4D00] break-all block flex items-center gap-1"
                >
                  <span>{inspectItem.referringUrl}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Target Destination URL</span>
                <a
                  href={inspectItem.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-slate-800 hover:text-[#FF4D00] break-all block flex items-center gap-1"
                >
                  <span>{inspectItem.targetUrl}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Anchor Text</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {inspectItem.anchor || "—"}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Link Equity Type</span>
                  <span className="font-bold text-emerald-700 text-sm mt-0.5 block">
                    {inspectItem.isDofollow ? "Dofollow (Equity Passing)" : "Nofollow"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Domain Rank</span>
                  <span className="font-display font-black text-base text-slate-900 mt-0.5 block">
                    {inspectItem.domainRank}/100
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">HTTP Status</span>
                  <span className="font-display font-black text-base text-slate-900 mt-0.5 block">
                    {inspectItem.httpStatus || 200}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Link Status</span>
                  <span className="font-bold text-slate-800 text-xs mt-1 block">
                    {inspectItem.isBroken ? "Broken (404)" : inspectItem.isLost ? "Lost" : "Active"}
                  </span>
                </div>
              </div>

              {inspectItem.lossReason && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="text-[11px] font-bold text-rose-700 uppercase block">Loss Reason</span>
                  <span className="text-xs text-rose-800 mt-0.5 block font-medium">
                    {inspectItem.lossReason}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectItem(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
