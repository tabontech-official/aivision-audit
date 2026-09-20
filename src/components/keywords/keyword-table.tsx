"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Bookmark, 
  BookmarkCheck, 
  Globe, 
  Copy, 
  Check, 
  Filter,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { KeywordIdeaItem, KeywordIntent } from "@/services/keywords/types";
import { KeywordSerpModal } from "./keyword-serp-modal";
import { cn } from "@/lib/utils/cn";

interface KeywordTableProps {
  keywords: KeywordIdeaItem[];
  websiteId?: string;
  onTrackToggle?: (keyword: string, isTracked: boolean) => void;
}

type SortField = "keyword" | "searchVolume" | "cpc" | "difficulty" | "ppc";
type SortDirection = "asc" | "desc";

export function KeywordTable({ keywords, websiteId, onTrackToggle }: KeywordTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "easy" | "high_volume" | "commercial">("all");
  const [sortField, setSortField] = useState<SortField>("searchVolume");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedSerpKeyword, setSelectedSerpKeyword] = useState<string | null>(null);
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);
  const [trackedSet, setTrackedSet] = useState<Set<string>>(
    () => new Set(keywords.filter(k => k.isTracked).map(k => k.keyword))
  );
  const [trackingLoading, setTrackingLoading] = useState<string | null>(null);

  // Intent badge styling
  const getIntentBadge = (intent: KeywordIntent) => {
    switch (intent) {
      case "Informational":
        return "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "Commercial":
        return "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "Transactional":
        return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
      case "Navigational":
        return "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
      default:
        return "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";
    }
  };

  // KD styling
  const getDifficultyBadge = (kd: number) => {
    if (kd <= 29) {
      return {
        bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        label: "Easy",
      };
    }
    if (kd <= 49) {
      return {
        bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        label: "Possible",
      };
    }
    if (kd <= 69) {
      return {
        bg: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
        label: "Hard",
      };
    }
    return {
      bg: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      label: "Very Hard",
    };
  };

  // Copy keyword helper
  const handleCopy = (kw: string) => {
    navigator.clipboard.writeText(kw);
    setCopiedKeyword(kw);
    setTimeout(() => setCopiedKeyword(null), 1800);
  };

  // Handle tracking toggle
  const handleTrack = async (kw: KeywordIdeaItem) => {
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
          const updated = new Set(prev);
          if (newTracked) updated.add(kw.keyword);
          else updated.delete(kw.keyword);
          return updated;
        });
        if (onTrackToggle) onTrackToggle(kw.keyword, newTracked);
      }
    } catch (e) {
      console.error("Failed to toggle track:", e);
    } finally {
      setTrackingLoading(null);
    }
  };

  // Sorting handler
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Filter and sort items
  const filteredKeywords = useMemo(() => {
    return keywords
      .filter((k) => {
        // Text filter
        if (searchTerm && !k.keyword.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        // Category filter
        if (activeFilter === "easy" && k.difficulty > 29) return false;
        if (activeFilter === "high_volume" && k.searchVolume < 1000) return false;
        if (activeFilter === "commercial" && k.intent !== "Commercial" && k.intent !== "Transactional") return false;
        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField] ?? 0;
        let valB = b[sortField] ?? 0;

        if (typeof valA === "string") {
          return sortDirection === "asc"
            ? (valA as string).localeCompare(valB as string)
            : (valB as string).localeCompare(valA as string);
        }

        return sortDirection === "asc" ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [keywords, searchTerm, activeFilter, sortField, sortDirection]);

  // Mini SVG Sparkline generator
  const renderSparkline = (trend: number[]) => {
    if (!trend || trend.length === 0) return null;
    const max = Math.max(...trend, 1);
    const min = Math.min(...trend, 0);
    const range = max - min || 1;
    const height = 24;
    const width = 64;
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
      <svg className="w-16 h-6 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <polyline
          fill="none"
          stroke={isGrowing ? "#10b981" : "#6366f1"}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Top Filter and Search Bar */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-950/30">
        {/* Search inside table */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Filter keywords in this view..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
          />
        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveFilter("all")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
              activeFilter === "all"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            )}
          >
            All ({keywords.length})
          </button>
          <button
            onClick={() => setActiveFilter("easy")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1",
              activeFilter === "easy"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100"
            )}
          >
            <Sparkles className="w-3 h-3" />
            Easy KD (≤29)
          </button>
          <button
            onClick={() => setActiveFilter("high_volume")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
              activeFilter === "high_volume"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 hover:bg-blue-100"
            )}
          >
            High Volume (≥1k)
          </button>
          <button
            onClick={() => setActiveFilter("commercial")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
              activeFilter === "commercial"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 hover:bg-purple-100"
            )}
          >
            Buyer Intent
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[11px] bg-zinc-50/70 dark:bg-zinc-900/60">
              <th className="py-3 px-4">
                <button
                  onClick={() => toggleSort("keyword")}
                  className="flex items-center gap-1 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                >
                  Keyword
                  {sortField === "keyword" ? (
                    sortDirection === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </button>
              </th>
              <th className="py-3 px-3 text-right">
                <button
                  onClick={() => toggleSort("searchVolume")}
                  className="flex items-center justify-end gap-1 ml-auto hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                >
                  Search Volume
                  {sortField === "searchVolume" ? (
                    sortDirection === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </button>
              </th>
              <th className="py-3 px-3 text-center">12M Trend</th>
              <th className="py-3 px-3 text-right">
                <button
                  onClick={() => toggleSort("cpc")}
                  className="flex items-center justify-end gap-1 ml-auto hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                >
                  CPC
                  {sortField === "cpc" ? (
                    sortDirection === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </button>
              </th>
              <th className="py-3 px-3 text-center">
                <button
                  onClick={() => toggleSort("difficulty")}
                  className="flex items-center justify-center gap-1 mx-auto hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                >
                  Difficulty (KD)
                  {sortField === "difficulty" ? (
                    sortDirection === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </button>
              </th>
              <th className="py-3 px-3 text-center">Intent</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {filteredKeywords.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-400">
                  <Search className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  No keywords match your active search filters.
                </td>
              </tr>
            ) : (
              filteredKeywords.map((item, idx) => {
                const isTracked = trackedSet.has(item.keyword);
                const kdInfo = getDifficultyBadge(item.difficulty);

                return (
                  <tr
                    key={item.id || `${item.keyword}-${idx}`}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group"
                  >
                    {/* Keyword name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-[13px]">
                          {item.keyword}
                        </span>
                        <button
                          onClick={() => handleCopy(item.keyword)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all rounded hover:bg-zinc-200 dark:hover:bg-zinc-800"
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

                    {/* Search Volume */}
                    <td className="py-3 px-3 text-right font-bold text-zinc-800 dark:text-zinc-200">
                      {item.searchVolume.toLocaleString()}
                    </td>

                    {/* 12-Month Trend Sparkline */}
                    <td className="py-3 px-3">
                      <div className="flex justify-center items-center">
                        {renderSparkline(item.trend)}
                      </div>
                    </td>

                    {/* CPC */}
                    <td className="py-3 px-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                      ${item.cpc.toFixed(2)}
                    </td>

                    {/* Keyword Difficulty */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-md font-bold text-[11px] border",
                            kdInfo.bg
                          )}
                        >
                          {item.difficulty}
                        </span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                          {kdInfo.label}
                        </span>
                      </div>
                    </td>

                    {/* Intent Badge */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full font-medium text-[10px] border tracking-wide uppercase",
                          getIntentBadge(item.intent)
                        )}
                      >
                        {item.intent}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* SERP Competitor Button */}
                        <button
                          onClick={() => setSelectedSerpKeyword(item.keyword)}
                          className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium text-xs flex items-center gap-1 transition-colors border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
                          title="Inspect top 10 SERP competitors"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">SERP</span>
                        </button>

                        {/* Track / Bookmark Button */}
                        <button
                          onClick={() => handleTrack(item)}
                          disabled={trackingLoading === item.keyword}
                          className={cn(
                            "p-1.5 rounded-lg border transition-colors",
                            isTracked
                              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700"
                              : "bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 border-zinc-200 dark:border-zinc-700"
                          )}
                          title={isTracked ? "Tracked in project" : "Track keyword"}
                        >
                          {isTracked ? (
                            <BookmarkCheck className="w-3.5 h-3.5" />
                          ) : (
                            <Bookmark className="w-3.5 h-3.5" />
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

      {/* Table Footer */}
      <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 flex items-center justify-between text-xs text-zinc-500">
        <div>
          Showing <span className="font-semibold text-zinc-700 dark:text-zinc-300">{filteredKeywords.length}</span> of{" "}
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">{keywords.length}</span> keywords
        </div>
        <div className="text-[11px] text-zinc-400">
          Click column headers to sort • Click SERP to inspect live Google rankings
        </div>
      </div>

      {/* SERP Modal */}
      {selectedSerpKeyword && (
        <KeywordSerpModal
          keyword={selectedSerpKeyword}
          onClose={() => setSelectedSerpKeyword(null)}
        />
      )}
    </div>
  );
}
