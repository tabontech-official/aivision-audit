"use client";

import React, { useState } from "react";
import {
  X,
  Search,
  Key,
  Layers,
  HelpCircle,
  ListTree,
  Download,
  RefreshCw,
  AlertCircle,
  Globe,
  Bookmark,
  BookmarkCheck,
  Copy,
  Check,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { KeywordSearchResult, KeywordIdeaItem, KeywordIntent } from "@/services/keywords/types";
import { KeywordMetricsOverview } from "./keyword-metrics-overview";
import { KeywordSerpModal } from "./keyword-serp-modal";
import { cn } from "@/lib/utils/cn";

interface KeywordSearchModalProps {
  websiteId?: string;
  isOpen: boolean;
  onClose: () => void;
  onTrackChanged?: () => void;
}

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "UK", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "GLOBAL", name: "Worldwide" },
];

const SUGGESTED_SEARCHES = [
  "technical seo audit",
  "saas keyword research",
  "digital marketing agency",
  "core web vitals test",
  "ecommerce conversion rate",
];

type SortField = "keyword" | "searchVolume" | "cpc" | "difficulty";
type SortDirection = "asc" | "desc";

export function KeywordSearchModal({
  websiteId,
  isOpen,
  onClose,
  onTrackChanged,
}: KeywordSearchModalProps) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("US");
  const [language, setLanguage] = useState("en");
  const [activeTab, setActiveTab] = useState<"related" | "questions" | "autocomplete">("related");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<KeywordSearchResult | null>(null);

  const [trackedSet, setTrackedSet] = useState<Set<string>>(new Set());
  const [trackingLoading, setTrackingLoading] = useState<string | null>(null);
  const [selectedSerpKeyword, setSelectedSerpKeyword] = useState<string | null>(null);
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);

  const [sortField, setSortField] = useState<SortField>("searchVolume");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [tableFilter, setTableFilter] = useState("");

  if (!isOpen) return null;

  const handleSearch = async (overrideQuery?: string) => {
    const q = (overrideQuery || query).trim();
    if (!q) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/keywords/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          location,
          language,
          websiteId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to conduct keyword research.");
      }

      setSearchResult(data);
      if (overrideQuery) setQuery(overrideQuery);

      // Tracked set initialization
      const allFound: KeywordIdeaItem[] = [
        ...(data.related || []),
        ...(data.questions || []),
        ...(data.autocomplete || []),
      ];
      const initialTracked = new Set(allFound.filter((k) => k.isTracked).map((k) => k.keyword));
      setTrackedSet(initialTracked);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Keyword search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleTrackToggle = async (kw: KeywordIdeaItem) => {
    if (trackingLoading) return;
    setTrackingLoading(kw.keyword);
    const isCurrentlyTracked = trackedSet.has(kw.keyword);
    const newTracked = !isCurrentlyTracked;

    try {
      const res = await fetch("/api/keywords/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteId,
          keyword: kw.keyword,
          searchVolume: kw.searchVolume,
          cpc: kw.cpc,
          difficulty: kw.difficulty,
          action: newTracked ? "track" : "untrack",
        }),
      });

      if (res.ok) {
        setTrackedSet((prev) => {
          const next = new Set(prev);
          if (newTracked) next.add(kw.keyword);
          else next.delete(kw.keyword);
          return next;
        });
        if (onTrackChanged) onTrackChanged();
      }
    } catch (err) {
      console.error("Failed to track keyword:", err);
    } finally {
      setTrackingLoading(null);
    }
  };

  const handleCopy = (kw: string) => {
    navigator.clipboard.writeText(kw);
    setCopiedKeyword(kw);
    setTimeout(() => setCopiedKeyword(null), 1800);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Sparkline generator
  const renderSparkline = (trend: number[]) => {
    if (!trend || trend.length === 0) return null;
    const max = Math.max(...trend, 1);
    const min = Math.min(...trend, 0);
    const range = max - min || 1;
    const height = 20;
    const width = 56;
    const step = width / (trend.length - 1 || 1);

    const points = trend
      .map((val, idx) => {
        const x = idx * step;
        const y = height - ((val - min) / range) * (height - 4) - 2;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

    const isGrowing = (trend[trend.length - 1] ?? 0) >= (trend[0] ?? 0);

    return (
      <svg className="w-14 h-5 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <polyline
          fill="none"
          stroke={isGrowing ? "#10b981" : "#FF4D00"}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  const getIntentBadge = (intent: KeywordIntent) => {
    switch (intent) {
      case "Informational":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Commercial":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Transactional":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Navigational":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getDifficultyBadge = (kd: number) => {
    if (kd <= 29) return { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Easy" };
    if (kd <= 49) return { bg: "bg-amber-50 text-amber-700 border-amber-200", label: "Possible" };
    if (kd <= 69) return { bg: "bg-orange-50 text-orange-700 border-orange-200", label: "Hard" };
    return { bg: "bg-rose-50 text-rose-700 border-rose-200", label: "Very Hard" };
  };

  const currentKeywords: KeywordIdeaItem[] = searchResult
    ? activeTab === "related"
      ? searchResult.related
      : activeTab === "questions"
      ? searchResult.questions
      : searchResult.autocomplete
    : [];

  const filteredAndSorted = currentKeywords
    .filter((k) => {
      if (!tableFilter) return true;
      return k.keyword.toLowerCase().includes(tableFilter.toLowerCase());
    })
    .sort((a, b) => {
      const valA = a[sortField] ?? 0;
      const valB = b[sortField] ?? 0;
      if (typeof valA === "string") {
        return sortDirection === "asc"
          ? (valA as string).localeCompare(valB as string)
          : (valB as string).localeCompare(valA as string);
      }
      return sortDirection === "asc" ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

  const avgCpc =
    currentKeywords.length > 0
      ? currentKeywords.reduce((acc, k) => acc + (k.cpc || 0), 0) / currentKeywords.length
      : 0;

  const exportCsv = () => {
    if (!searchResult) return;
    const headers = ["Keyword", "Search Volume", "CPC ($)", "PPC", "Difficulty (KD)", "Intent", "Category"];
    const rows = currentKeywords.map((k) => [
      `"${k.keyword.replace(/"/g, '""')}"`,
      k.searchVolume,
      k.cpc,
      k.ppc,
      k.difficulty,
      k.intent,
      k.category,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `keyword-search-${query.replace(/\s+/g, "-")}-${activeTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-150 font-sans">
      <div className="bg-white border border-slate-200 rounded-[8px] w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-orange-50 text-[#FF4D00] border border-orange-200 shrink-0">
              <Key className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 leading-tight">
                Keyword Research & Opportunity Finder
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Explore high-intent keyword variations, search volume, KD difficulty, and top SERP competitors
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-[8px] text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Search Controls */}
        <div className="p-5 border-b border-slate-200 bg-white space-y-3.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Enter seed keyword or topic (e.g. 'seo audit tool', 'marketing agency')..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF4D00] text-slate-900 placeholder-slate-400"
              />
            </div>

            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF4D00] shrink-0"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-[#FF6B00] to-[#FF3D00] hover:opacity-95 text-white font-display font-bold text-xs rounded-[8px] transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shrink-0"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Find Keywords</span>
                </>
              )}
            </button>
          </form>

          {/* Suggested searches */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 font-medium">Quick suggestions:</span>
            {SUGGESTED_SEARCHES.map((s) => (
              <button
                key={s}
                onClick={() => handleSearch(s)}
                className="px-2 py-0.5 rounded-[8px] bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-medium transition-colors cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-[8px] flex items-center gap-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal Body / Results */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/40">
          {loading ? (
            <div className="py-20 text-center">
              <RefreshCw className="w-8 h-8 text-[#FF4D00] animate-spin mx-auto mb-3" />
              <div className="text-sm font-bold text-slate-900">
                Searching Global Keyword Database...
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Analyzing search volumes, KD competition, 12-month trends, and intent
              </div>
            </div>
          ) : !searchResult ? (
            <div className="py-20 text-center">
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <div className="text-sm font-bold text-slate-800">
                Ready to explore keyword opportunities
              </div>
              <div className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Type a keyword query above or click a suggestion to see search volume, keyword difficulty, intent, and competitor SERPs.
              </div>
            </div>
          ) : (
            <>
              {/* Metrics Header Cards */}
              <KeywordMetricsOverview
                totalResults={currentKeywords.length}
                avgSearchVolume={
                  currentKeywords.length > 0
                    ? Math.round(currentKeywords.reduce((a, b) => a + b.searchVolume, 0) / currentKeywords.length)
                    : 0
                }
                avgDifficulty={
                  currentKeywords.length > 0
                    ? Math.round(currentKeywords.reduce((a, b) => a + b.difficulty, 0) / currentKeywords.length)
                    : 0
                }
                avgCpc={avgCpc}
              />

              {/* Tabs + Filter Bar + Export */}
              <div className="bg-white p-3 rounded-[8px] border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Category Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab("related")}
                    className={cn(
                      "px-3 py-1.5 rounded-[8px] text-xs font-bold font-sans transition-all flex items-center gap-1.5 cursor-pointer",
                      activeTab === "related"
                        ? "bg-gradient-to-r from-[#FF6B00] to-[#FF3D00] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Related ({searchResult.related.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("questions")}
                    className={cn(
                      "px-3 py-1.5 rounded-[8px] text-xs font-bold font-sans transition-all flex items-center gap-1.5 cursor-pointer",
                      activeTab === "questions"
                        ? "bg-gradient-to-r from-[#FF6B00] to-[#FF3D00] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    Questions ({searchResult.questions.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("autocomplete")}
                    className={cn(
                      "px-3 py-1.5 rounded-[8px] text-xs font-bold font-sans transition-all flex items-center gap-1.5 cursor-pointer",
                      activeTab === "autocomplete"
                        ? "bg-gradient-to-r from-[#FF6B00] to-[#FF3D00] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    <ListTree className="w-3.5 h-3.5" />
                    Autocomplete ({searchResult.autocomplete.length})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Filter results..."
                    value={tableFilter}
                    onChange={(e) => setTableFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-[8px] text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#FF4D00] w-36 sm:w-44"
                  />
                  <button
                    onClick={exportCsv}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[8px] text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                  >
                    <Download className="w-3 h-3" />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Keyword Table inside Modal */}
              <div className="bg-white border border-slate-200 rounded-[8px] shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px] bg-slate-50/70 whitespace-nowrap">
                        <th className="py-2.5 px-3.5 whitespace-nowrap">
                          <button
                            onClick={() => toggleSort("keyword")}
                            className="flex items-center gap-1 hover:text-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Keyword
                            {sortField === "keyword" ? (
                              sortDirection === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-40" />
                            )}
                          </button>
                        </th>
                        <th className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => toggleSort("searchVolume")}
                            className="flex items-center justify-end gap-1 ml-auto hover:text-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Volume
                            {sortField === "searchVolume" ? (
                              sortDirection === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-40" />
                            )}
                          </button>
                        </th>
                        <th className="py-2.5 px-3 text-center whitespace-nowrap">12M Trend</th>
                        <th className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => toggleSort("cpc")}
                            className="flex items-center justify-end gap-1 ml-auto hover:text-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            CPC
                            {sortField === "cpc" ? (
                              sortDirection === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-40" />
                            )}
                          </button>
                        </th>
                        <th className="py-2.5 px-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => toggleSort("difficulty")}
                            className="flex items-center justify-center gap-1 mx-auto hover:text-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            KD
                            {sortField === "difficulty" ? (
                              sortDirection === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-40" />
                            )}
                          </button>
                        </th>
                        <th className="py-2.5 px-3 text-center whitespace-nowrap">Intent</th>
                        <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAndSorted.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            No keywords match your search filter.
                          </td>
                        </tr>
                      ) : (
                        filteredAndSorted.map((item, idx) => {
                          const isTracked = trackedSet.has(item.keyword);
                          const kdInfo = getDifficultyBadge(item.difficulty);

                          return (
                            <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="py-2.5 px-3.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-900 text-xs">
                                    {item.keyword}
                                  </span>
                                  <button
                                    onClick={() => handleCopy(item.keyword)}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-slate-700 transition-all rounded-[6px] hover:bg-slate-200 cursor-pointer"
                                    title="Copy keyword"
                                  >
                                    {copiedKeyword === item.keyword ? (
                                      <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                                {item.searchVolume.toLocaleString()}
                              </td>

                              <td className="py-2.5 px-3 text-center">
                                <div className="flex justify-center items-center">
                                  {renderSparkline(item.trend)}
                                </div>
                              </td>

                              <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                                ${item.cpc.toFixed(2)}
                              </td>

                              <td className="py-2.5 px-3 text-center">
                                <span className={cn("px-1.5 py-0.5 rounded-[6px] font-bold text-[10px] border", kdInfo.bg)}>
                                  {item.difficulty}
                                </span>
                              </td>

                              <td className="py-2.5 px-3 text-center">
                                <span className={cn("px-2 py-0.5 rounded-full font-semibold text-[10px] border tracking-wide uppercase", getIntentBadge(item.intent))}>
                                  {item.intent}
                                </span>
                              </td>

                              <td className="py-2.5 px-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setSelectedSerpKeyword(item.keyword)}
                                    className="px-2 py-1 rounded-[6px] bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-[#FF4D00] font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer border border-transparent hover:border-orange-200"
                                    title="Inspect top 10 SERP competitors"
                                  >
                                    <Globe className="w-3 h-3" />
                                    <span>SERP</span>
                                  </button>

                                  <button
                                    onClick={() => handleTrackToggle(item)}
                                    disabled={trackingLoading === item.keyword}
                                    className={cn(
                                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[11px] font-bold transition-all cursor-pointer border",
                                      isTracked
                                        ? "bg-amber-50 text-amber-700 border-amber-300 shadow-2xs"
                                        : "bg-orange-50 hover:bg-orange-100 text-[#FF4D00] border-orange-200"
                                    )}
                                  >
                                    {isTracked ? (
                                      <>
                                        <BookmarkCheck className="w-3 h-3 text-amber-600" />
                                        <span>Tracked</span>
                                      </>
                                    ) : (
                                      <>
                                        <Bookmark className="w-3 h-3" />
                                        <span>+ Track</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Nested SERP Modal */}
      {selectedSerpKeyword && (
        <KeywordSerpModal
          keyword={selectedSerpKeyword}
          onClose={() => setSelectedSerpKeyword(null)}
        />
      )}
    </div>
  );
}
