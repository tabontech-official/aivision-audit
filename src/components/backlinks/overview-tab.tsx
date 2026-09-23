"use client";

import React, { useState } from "react";
import {
  Link2,
  Globe2,
  CheckCircle2,
  XCircle,
  Award,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Percent,
  ShieldAlert,
  Layers,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { BacklinkRecommendationItem } from "./recommendations-tab";

interface BacklinkAuditData {
  id: string;
  domain: string;
  totalBacklinks: number;
  totalIndexedBacklinks?: number;
  detailedBacklinksAvailable?: number;
  detailedBacklinksFetched?: number;
  fetchedRowsCount?: number;
  referringDomains: number;
  referringPages: number;
  dofollowBacklinks: number | null;
  nofollowBacklinks: number | null;
  newBacklinks: number | null;
  lostBacklinks: number | null;
  referringIps: number | null;
  referringSubnets: number | null;
  domainRank: number | null;
  brokenBacklinks: number;
  suspiciousBacklinks: number;
  healthStatus: string;
  metricsJson?: unknown;
  fetchedAt: Date | string;
  expiresAt: Date | string;
  recommendations?: BacklinkRecommendationItem[];
}

interface OverviewTabProps {
  audit: BacklinkAuditData;
  onNavigateTab: (tab: string) => void;
}

export function OverviewTab({ audit, onNavigateTab }: OverviewTabProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const total = audit.totalBacklinks || 1;
  const hasDofollow = audit.dofollowBacklinks !== null && audit.dofollowBacklinks !== undefined;
  const hasNofollow = audit.nofollowBacklinks !== null && audit.nofollowBacklinks !== undefined;

  const dofollowPct =
    hasDofollow && audit.totalBacklinks > 0
      ? Math.min(
          100,
          Math.round(
            ((audit.dofollowBacklinks ?? 0) /
              ((audit.dofollowBacklinks ?? 0) + (audit.nofollowBacklinks ?? 0) || total)) *
              100
          )
        )
      : null;

  const nofollowPct =
    hasNofollow && audit.totalBacklinks > 0 && dofollowPct !== null
      ? Math.max(0, 100 - dofollowPct)
      : null;

  const brokenPct = ((audit.brokenBacklinks / total) * 100).toFixed(1);

  // Status computation for cards
  const getCardStatus = (type: string, val: number | null) => {
    if (val === null || val === undefined) {
      return { label: "Unavailable", color: "text-slate-500 bg-slate-50 border-slate-200" };
    }
    if (type === "broken") {
      if (val === 0) return { label: "Good", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
      if (val / total > 0.08) return { label: "Critical", color: "text-rose-700 bg-rose-50 border-rose-200" };
      return { label: "Needs Attention", color: "text-amber-700 bg-amber-50 border-amber-200" };
    }
    if (type === "dofollow") {
      if (dofollowPct !== null && dofollowPct >= 55) return { label: "Good", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
      if (dofollowPct !== null && dofollowPct >= 35) return { label: "Needs Attention", color: "text-amber-700 bg-amber-50 border-amber-200" };
      if (dofollowPct !== null) return { label: "Critical", color: "text-rose-700 bg-rose-50 border-rose-200" };
      return { label: "Active", color: "text-slate-700 bg-slate-50 border-slate-200" };
    }
    if (type === "rank") {
      if (val >= 60) return { label: "Excellent", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
      if (val >= 30) return { label: "Good", color: "text-blue-700 bg-blue-50 border-blue-200" };
      return { label: "Growing", color: "text-amber-700 bg-amber-50 border-amber-200" };
    }
    return { label: "Active", color: "text-slate-700 bg-slate-50 border-slate-200" };
  };

  const metricCards = [
    {
      id: "total_backlinks",
      label: "Total Backlinks",
      value: audit.totalBacklinks.toLocaleString(),
      subtext: `${audit.referringDomains.toLocaleString()} referring domains`,
      icon: Link2,
      status: getCardStatus("default", audit.totalBacklinks),
      tooltip: "Total count of external hyperlinks analyzed and inspectable for this domain.",
      tabAction: "backlinks",
    },
    {
      id: "referring_domains",
      label: "Referring Domains",
      value: audit.referringDomains.toLocaleString(),
      subtext:
        audit.totalBacklinks > 0
          ? `${((audit.referringDomains / total) * 100).toFixed(1)}% diversity ratio`
          : "Distinct root domains",
      icon: Globe2,
      status: getCardStatus("default", audit.referringDomains),
      tooltip: "Distinct root domains that link to at least one page on your website.",
      tabAction: "referring_domains",
    },
    {
      id: "domain_rank",
      label: "Domain Rank / Authority",
      value: audit.domainRank !== null ? `${audit.domainRank}/100` : "Unavailable",
      subtext:
        audit.domainRank !== null
          ? audit.domainRank > 50
            ? "High authority profile"
            : "Moderate authority profile"
          : "Metric unavailable from provider",
      icon: Award,
      status: getCardStatus("rank", audit.domainRank),
      tooltip: "Domain authority score (0-100) evaluating overall web link equity and trustworthiness.",
      tabAction: "overview",
    },
    {
      id: "dofollow_backlinks",
      label: "Dofollow Backlinks",
      value: audit.dofollowBacklinks !== null ? audit.dofollowBacklinks.toLocaleString() : "Unavailable",
      subtext: dofollowPct !== null ? `${dofollowPct}% of link profile` : "Metric unavailable",
      icon: CheckCircle2,
      status: getCardStatus("dofollow", audit.dofollowBacklinks),
      tooltip: "Links that pass SEO ranking equity to your destination pages.",
      tabAction: "backlinks",
    },
    {
      id: "nofollow_backlinks",
      label: "Nofollow Backlinks",
      value: audit.nofollowBacklinks !== null ? audit.nofollowBacklinks.toLocaleString() : "Unavailable",
      subtext: nofollowPct !== null ? `${nofollowPct}% of link profile` : "Metric unavailable",
      icon: XCircle,
      status: getCardStatus("default", audit.nofollowBacklinks),
      tooltip: "Links with rel='nofollow' that do not pass direct algorithmic ranking equity.",
      tabAction: "backlinks",
    },
    {
      id: "broken_backlinks",
      label: "Broken Backlinks",
      value: audit.brokenBacklinks.toLocaleString(),
      subtext: `${brokenPct}% of total links`,
      icon: AlertTriangle,
      status: getCardStatus("broken", audit.brokenBacklinks),
      tooltip: "Inbound links pointing to dead destination pages (404 status codes) on your domain.",
      tabAction: "top_pages",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Overview Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((card) => {
          const IconComponent = card.icon;
          const isTooltipOpen = activeTooltip === card.id;

          return (
            <div
              key={card.id}
              className="relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#dff2ed] text-slate-900">
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 truncate font-sans">
                      {card.label}
                    </span>
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveTooltip(isTooltipOpen ? null : card.id)}
                      onMouseEnter={() => setActiveTooltip(card.id)}
                      onMouseLeave={() => setActiveTooltip(null)}
                      className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors cursor-pointer"
                      aria-label="Info"
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                    </button>

                    {isTooltipOpen && (
                      <div className="absolute right-0 top-6 z-30 w-56 rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-[11px] text-slate-100 shadow-xl animate-in fade-in duration-150">
                        {card.tooltip}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-baseline justify-between gap-2 mt-1">
                  <span className="font-display text-2xl font-black tracking-tight text-slate-900">
                    {card.value}
                  </span>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[10px] font-bold font-sans border uppercase tracking-wider",
                      card.status.color
                    )}
                  >
                    {card.status.label}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 font-sans mt-1 truncate">
                  {card.subtext}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => onNavigateTab(card.tabAction)}
                  className="text-[11px] font-bold text-slate-900 hover:text-emerald-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>View Details</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Link Distribution & Authority Ratio Progress Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dofollow vs Nofollow Ratio Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-slate-900" />
              <h3 className="font-display text-sm font-bold text-slate-900">
                Link Attribute Distribution
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {audit.totalBacklinks.toLocaleString()} Total Links
            </span>
          </div>

          {dofollowPct !== null && nofollowPct !== null ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-sans font-bold">
                <span className="text-emerald-700 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                  Dofollow ({dofollowPct}%)
                </span>
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-400 inline-block" />
                  Nofollow ({nofollowPct}%)
                </span>
              </div>

              {/* Visual stacked progress bar */}
              <div className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${dofollowPct}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                  title={`Dofollow: ${audit.dofollowBacklinks?.toLocaleString()}`}
                />
                <div
                  style={{ width: `${nofollowPct}%` }}
                  className="bg-slate-400 transition-all duration-500"
                  title={`Nofollow: ${audit.nofollowBacklinks?.toLocaleString()}`}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center">
              <span className="text-xs font-medium text-slate-500">Distribution breakdown unavailable from provider</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <span className="text-[11px] font-medium text-slate-500 font-sans block">
                Passing Equity (Dofollow)
              </span>
              <span className="font-display text-lg font-bold text-slate-900 mt-0.5 block">
                {audit.dofollowBacklinks !== null ? audit.dofollowBacklinks.toLocaleString() : "Unavailable"}
              </span>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <span className="text-[11px] font-medium text-slate-500 font-sans block">
                Non-equity (Nofollow)
              </span>
              <span className="font-display text-lg font-bold text-slate-900 mt-0.5 block">
                {audit.nofollowBacklinks !== null ? audit.nofollowBacklinks.toLocaleString() : "Unavailable"}
              </span>
            </div>
          </div>
        </div>

        {/* Quality & Risk Summary Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-slate-900" />
              <h3 className="font-display text-sm font-bold text-slate-900">
                Link Health & Status
              </h3>
            </div>
            <span className="text-xs font-semibold text-emerald-600">
              {audit.brokenBacklinks === 0 ? "Clean Inbound Targets" : "Broken Targets Detected"}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-slate-700 font-sans">
                  Active Inbound Links
                </span>
              </div>
              <span className="font-display text-xs font-bold text-slate-900">
                {(total - audit.brokenBacklinks).toLocaleString()} (
                {(((total - audit.brokenBacklinks) / total) * 100).toFixed(1)}%)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-rose-100 bg-rose-50/40">
              <div className="flex items-center gap-2.5">
                <div className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="text-xs font-semibold text-slate-700 font-sans">
                  Broken Inbound Links (404 targets)
                </span>
              </div>
              <span className="font-display text-xs font-bold text-rose-600">
                {audit.brokenBacklinks.toLocaleString()} ({brokenPct}%)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-xs font-semibold text-slate-700 font-sans">
                  Distinct Referring Domains
                </span>
              </div>
              <span className="font-display text-xs font-bold text-slate-900">
                {audit.referringDomains.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
