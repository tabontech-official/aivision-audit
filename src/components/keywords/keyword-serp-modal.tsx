"use client";

import React, { useEffect, useState } from "react";
import { X, Globe, ExternalLink, RefreshCw } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-150 font-sans">
      <div className="bg-white border border-slate-200 rounded-[8px] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-orange-50 text-[#FF4D00] border border-orange-200 shrink-0">
              <Globe className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display leading-tight">
                Top 10 Google SERP Competitors
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-sans">
                Live ranking results for query: <span className="font-semibold text-slate-800 font-mono">&quot;{keyword}&quot;</span>
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 text-[#FF4D00] animate-spin mx-auto mb-3" />
              <div className="text-sm font-semibold text-slate-800">
                Fetching Real-Time SERP Positions...
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Analyzing domain authorities and ranking competitor URLs
              </div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-[8px] text-xs text-red-600 text-center">
              {error}
            </div>
          ) : (
            <div className="overflow-x-auto bg-white border border-slate-200 rounded-[8px] shadow-2xs">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px] bg-slate-50/70 whitespace-nowrap">
                    <th className="py-3 px-3 w-12 text-center whitespace-nowrap">Pos</th>
                    <th className="py-3 px-4 whitespace-nowrap">Ranking URL & Title</th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">Domain Rank</th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">Page Rank</th>
                    <th className="py-3 px-3 text-center whitespace-nowrap">Backlinks</th>
                    <th className="py-3 px-3 text-right whitespace-nowrap">Est. Visits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {serp.map((item) => (
                    <tr
                      key={item.position}
                      className="hover:bg-slate-50/80 transition-colors whitespace-nowrap"
                    >
                      <td className="py-3 px-3 text-center font-bold text-slate-700 whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold font-display ${
                          item.position <= 3
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {item.position}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs sm:max-w-md">
                        <div className="font-semibold text-slate-900 text-xs truncate">
                          {item.title}
                        </div>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5 truncate font-mono"
                        >
                          <span className="truncate">{item.url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                        </a>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-800 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-[6px] bg-slate-100 text-[11px] font-bold">
                          DR {item.domainRank}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-800 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-[6px] bg-slate-100 text-[11px] font-bold">
                          PR {item.pageRank}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-800 whitespace-nowrap">
                        {item.backlinksCount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600 whitespace-nowrap">
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
