"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Sparkles, 
  Globe, 
  Download, 
  RefreshCw, 
  Layers, 
  HelpCircle, 
  ListTree, 
  Bookmark, 
  TrendingUp,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Database
} from "lucide-react";
import { KeywordSearchResult, KeywordIdeaItem, TrackedKeywordItem } from "@/services/keywords/types";
import { KeywordMetricsOverview } from "./keyword-metrics-overview";
import { KeywordTable } from "./keyword-table";
import { cn } from "@/lib/utils/cn";

interface KeywordDashboardProps {
  websiteId?: string;
  initialQuery?: string;
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
  "ai website builder",
  "core web vitals test",
  "ecommerce conversion rate",
];

export function KeywordDashboard({ websiteId, initialQuery }: KeywordDashboardProps) {
  const [query, setQuery] = useState(initialQuery || "");
  const [location, setLocation] = useState("US");
  const [language, setLanguage] = useState("en");
  const [activeTab, setActiveTab] = useState<"related" | "questions" | "autocomplete" | "tracked">("related");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<KeywordSearchResult | null>(null);
  
  // Tracked keywords tab state
  const [trackedKeywords, setTrackedKeywords] = useState<TrackedKeywordItem[]>([]);
  const [trackedLoading, setTrackedLoading] = useState(false);

  // Trigger search
  const handleSearch = async (overrideQuery?: string) => {
    const q = overrideQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/keywords/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q.trim(),
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
      if (overrideQuery) {
        setQuery(overrideQuery);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Keyword search failed");
    } finally {
      setLoading(false);
    }
  };

  // Fetch tracked keywords
  const loadTrackedKeywords = async () => {
    setTrackedLoading(true);
    try {
      const url = websiteId ? `/api/keywords/tracked?websiteId=${websiteId}` : `/api/keywords/tracked`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setTrackedKeywords(data.tracked || []);
      }
    } catch (err) {
      console.error("Failed to load tracked keywords:", err);
    } finally {
      setTrackedLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
    loadTrackedKeywords();
  }, [initialQuery]);

  // Export to CSV
  const exportToCsv = () => {
    if (!searchResult) return;
    const currentList =
      activeTab === "related"
        ? searchResult.related
        : activeTab === "questions"
        ? searchResult.questions
        : searchResult.autocomplete;

    const headers = ["Keyword", "Search Volume", "CPC ($)", "PPC", "Difficulty (KD)", "Intent", "Category"];
    const rows = currentList.map((k) => [
      `"${k.keyword.replace(/"/g, '""')}"`,
      k.searchVolume,
      k.cpc,
      k.ppc,
      k.difficulty,
      k.intent,
      k.category,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `keyword-research-${query.replace(/\s+/g, "-")}-${activeTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate stats for active tab
  const activeKeywords: KeywordIdeaItem[] = searchResult
    ? activeTab === "related"
      ? searchResult.related
      : activeTab === "questions"
      ? searchResult.questions
      : searchResult.autocomplete
    : [];

  const avgCpc =
    activeKeywords.length > 0
      ? activeKeywords.reduce((acc, k) => acc + (k.cpc || 0), 0) / activeKeywords.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Search Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Enhanced Keyword Intelligence & SERP Explorer
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Keyword Research & SERP Insights
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
            Discover high-intent keyword opportunities, inspect real-time competitor Google SERPs, analyze 12-month historical search trends, and track high-value ranking targets.
          </p>
        </div>

        {/* Search Bar Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="mt-6 flex flex-col md:flex-row gap-3"
        >
          {/* Query input */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Enter target keyword, phrase, or topic (e.g. 'b2b seo software')..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 transition-all"
            />
          </div>

          {/* Country Selector */}
          <div className="flex gap-2">
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="px-3.5 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>

            {/* Search Button */}
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-2xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shrink-0"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Researching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Find Keywords</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Suggested searches */}
        {!searchResult && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-zinc-400 font-medium">Try searching:</span>
            {SUGGESTED_SEARCHES.map((s) => (
              <button
                key={s}
                onClick={() => handleSearch(s)}
                className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-medium transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Results Section */}
      {searchResult && (
        <div className="space-y-6">
          {/* Metrics Overview Cards */}
          <KeywordMetricsOverview
            totalResults={activeKeywords.length}
            avgSearchVolume={
              activeKeywords.length > 0
                ? Math.round(activeKeywords.reduce((a, b) => a + b.searchVolume, 0) / activeKeywords.length)
                : 0
            }
            avgDifficulty={
              activeKeywords.length > 0
                ? Math.round(activeKeywords.reduce((a, b) => a + b.difficulty, 0) / activeKeywords.length)
                : 0
            }
            avgCpc={avgCpc}
          />

          {/* Tab navigation & export header */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            {/* Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab("related")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                  activeTab === "related"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                Related Keywords
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                  {searchResult.related.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("questions")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                  activeTab === "questions"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                )}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Questions
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                  {searchResult.questions.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("autocomplete")}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                  activeTab === "autocomplete"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                )}
              >
                <ListTree className="w-3.5 h-3.5" />
                Autocomplete
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                  {searchResult.autocomplete.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("tracked");
                  loadTrackedKeywords();
                }}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                  activeTab === "tracked"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                )}
              >
                <Bookmark className="w-3.5 h-3.5" />
                Tracked in Project
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 dark:bg-white/10">
                  {trackedKeywords.length}
                </span>
              </button>
            </div>

            {/* Export CSV button */}
            {activeTab !== "tracked" && (
              <button
                onClick={exportToCsv}
                className="px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Export {activeTab} (CSV)
              </button>
            )}
          </div>

          {/* Active Tab View */}
          {activeTab === "tracked" ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Tracked Project Keywords
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Keywords saved to your project for continuous rank tracking and performance auditing.
                  </p>
                </div>
                <button
                  onClick={loadTrackedKeywords}
                  disabled={trackedLoading}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <RefreshCw className={cn("w-4 h-4", trackedLoading && "animate-spin")} />
                </button>
              </div>

              {trackedLoading ? (
                <div className="py-12 text-center text-zinc-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                  Loading tracked keywords...
                </div>
              ) : trackedKeywords.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 text-xs">
                  <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-500" />
                  No keywords are currently tracked in this project.
                  <div className="mt-1 text-zinc-500">
                    Click the bookmark icon next to any keyword in the search results to start tracking it.
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Tracked Keyword</th>
                        <th className="py-3 px-3 text-right">Search Volume</th>
                        <th className="py-3 px-3 text-right">CPC</th>
                        <th className="py-3 px-3 text-center">Difficulty (KD)</th>
                        <th className="py-3 px-3 text-center">Current Rank</th>
                        <th className="py-3 px-4 text-right">Date Added</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                      {trackedKeywords.map((tk) => (
                        <tr key={tk.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                          <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                            {tk.keyword}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-zinc-800 dark:text-zinc-200">
                            {tk.searchVolume.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                            ${tk.cpc.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-zinc-100 dark:bg-zinc-800">
                              {tk.difficulty}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {tk.currentPosition ? (
                              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                #{tk.currentPosition}
                              </span>
                            ) : (
                              <span className="text-zinc-400">Tracking...</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right text-zinc-400">
                            {new Date(tk.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <KeywordTable
              keywords={activeKeywords}
              websiteId={websiteId}
              onTrackToggle={() => loadTrackedKeywords()}
            />
          )}
        </div>
      )}
    </div>
  );
}
