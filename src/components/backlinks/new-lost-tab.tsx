"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Globe2,
  ExternalLink,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { BacklinkItem } from "./backlinks-tab";

interface NewLostTabProps {
  newBacklinks: BacklinkItem[];
  lostBacklinks: BacklinkItem[];
  domain: string;
}

export function NewLostTab({ newBacklinks, lostBacklinks, domain }: NewLostTabProps) {
  const [activeView, setActiveView] = useState<"new" | "lost">("new");

  const netGrowth = newBacklinks.length - lostBacklinks.length;
  const isPositive = netGrowth >= 0;

  const formatDate = (date: Date | string | null) => {
    if (!date) return "—";
    const d = new Date(date);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getLossReasonBadge = (reason: string | null, httpStatus: number | null) => {
    const text = reason || (httpStatus === 404 ? "Target URL 404 Not Found" : "Link removed from source page");
    if (text.includes("404")) {
      return { text, color: "bg-rose-50 text-rose-700 border-rose-200" };
    }
    if (text.includes("removed")) {
      return { text, color: "bg-amber-50 text-amber-700 border-amber-200" };
    }
    return { text, color: "bg-slate-100 text-slate-700 border-slate-200" };
  };

  return (
    <div className="space-y-6">
      {/* 1. Velocity & Net Growth Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* New Backlinks Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 font-sans block">New Backlinks Discovered</span>
            <div className="font-display text-2xl font-black text-emerald-600 mt-1">
              +{newBacklinks.length.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 font-sans mt-0.5 block">Recent acquisition window</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        {/* Lost Backlinks Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 font-sans block">Lost Backlinks Identified</span>
            <div className="font-display text-2xl font-black text-rose-600 mt-1">
              -{lostBacklinks.length.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 font-sans mt-0.5 block">Links removed or broken</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
            <TrendingDown className="h-5 w-5" />
          </div>
        </div>

        {/* Net Growth Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 font-sans block">Net Link Velocity</span>
            <div
              className={cn(
                "font-display text-2xl font-black mt-1",
                isPositive ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {isPositive ? `+${netGrowth.toLocaleString()}` : netGrowth.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 font-sans mt-0.5 block">
              {isPositive ? "Positive link acquisition momentum" : "Link loss exceeds acquisition rate"}
            </span>
          </div>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border",
              isPositive
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : "bg-rose-50 text-rose-600 border-rose-200"
            )}
          >
            {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          </div>
        </div>
      </div>

      {/* 2. Sub-tab Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveView("new")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer",
            activeView === "new"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          <span>New Backlinks ({newBacklinks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView("lost")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer",
            activeView === "lost"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
        >
          <TrendingDown className="h-3.5 w-3.5" />
          <span>Lost Backlinks ({lostBacklinks.length})</span>
        </button>
      </div>

      {/* 3. Table of Active View */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-display font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Referring Page & Domain</th>
                <th className="py-3 px-4">Anchor Text & Target</th>
                <th className="py-3 px-4 text-center">DR</th>
                <th className="py-3 px-4 text-center">Type</th>
                {activeView === "lost" ? (
                  <th className="py-3 px-4">Loss Reason</th>
                ) : (
                  <th className="py-3 px-4">Discovered Date</th>
                )}
                <th className="py-3 px-4 text-right">Last Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(activeView === "new" ? newBacklinks : lostBacklinks).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    {activeView === "new"
                      ? "No new backlinks detected in the recent inspection window."
                      : "No lost backlinks recorded."}
                  </td>
                </tr>
              ) : (
                (activeView === "new" ? newBacklinks : lostBacklinks).map((item) => {
                  const badge = getLossReasonBadge(item.lossReason, item.httpStatus);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Referring Domain */}
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
                          {item.domainRank}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4 text-center">
                        {item.isDofollow ? (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            Dofollow
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                            Nofollow
                          </span>
                        )}
                      </td>

                      {/* Loss Reason or Discovered Date */}
                      {activeView === "lost" ? (
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border",
                              badge.color
                            )}
                          >
                            <AlertCircle className="h-3 w-3" />
                            <span>{badge.text}</span>
                          </span>
                        </td>
                      ) : (
                        <td className="py-3 px-4 text-slate-700 text-[11px] font-medium">
                          {formatDate(item.firstSeen)}
                        </td>
                      )}

                      {/* Last Seen */}
                      <td className="py-3 px-4 text-right text-slate-500 text-[11px]">
                        {formatDate(item.lastSeen)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
