"use client";

import React, { useEffect, useState } from "react";
import { X, Globe, ExternalLink, ShieldCheck, Link2, Eye, RefreshCw } from "lucide-react";
import { SerpPositionResult } from "@/services/keywords/types";

interface KeywordSerpModalProps {
  keyword: string;
  onClose: () => void;
}

export function KeywordSerpModal({ keyword, onClose }: KeywordSerpModalProps) {
  const [serp, setSerp] = useState<SerpPositionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSerp() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/keywords/serp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyword }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch SERP breakdown");
        setSerp(data.serp || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "SERP error");
      } finally {
        setLoading(false);
      }
    }

    loadSerp();
  }, [keyword]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-500" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Top 10 Google SERP Competitors
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Live ranking results for query: <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono">"{keyword}"</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
              <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Fetching Real-Time SERP Positions...
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Analyzing domain authorities and ranking competitor URLs
              </div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 text-center">
              {error}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3 w-12 text-center">Pos</th>
                    <th className="py-3 px-4">Ranking URL & Title</th>
                    <th className="py-3 px-3 text-center">Domain Rank</th>
                    <th className="py-3 px-3 text-center">Page Rank</th>
                    <th className="py-3 px-3 text-center">Backlinks</th>
                    <th className="py-3 px-3 text-right">Est. Visits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {serp.map((item) => (
                    <tr
                      key={item.position}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-3 text-center font-bold text-zinc-700 dark:text-zinc-300">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          item.position <= 3
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}>
                          {item.position}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm truncate">
                          {item.title}
                        </div>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-0.5 truncate font-mono"
                        >
                          <span className="truncate">{item.url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                        </a>
                      </td>
                      <td className="py-3.5 px-3 text-center font-semibold text-zinc-800 dark:text-zinc-200">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px]">
                          DR {item.domainRank}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-semibold text-zinc-800 dark:text-zinc-200">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px]">
                          PR {item.pageRank}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-semibold text-zinc-800 dark:text-zinc-200">
                        {item.backlinksCount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        ~{item.estimatedVisits.toLocaleString()} /mo
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
