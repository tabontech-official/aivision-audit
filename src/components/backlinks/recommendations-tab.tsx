"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Sparkles,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Info,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Layers,
  Globe2,
  Tag,
  FileCode2,
  Link2,
  SlidersHorizontal,
  Filter,
  ChevronDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { RecommendationSeverity } from "@/services/backlinks/recommendations/types";

export interface BacklinkRecommendationItem {
  id: string;
  ruleKey: string;
  title: string;
  severity: RecommendationSeverity | string;
  priorityScore: number;
  confidence: string;
  status: string;
  whatWeFound: string;
  whyItMatters: string;
  howToImprove: string;
  targetTab?: string | null;
  filterParamsJson?: unknown;
  evidenceJson?: unknown;
  actionsJson?: unknown;
  createdAt?: Date | string;
}

interface RecommendationsTabProps {
  recommendations: BacklinkRecommendationItem[];
  domain: string;
  onNavigateTab: (tab: string, filterParams?: Record<string, unknown>) => void;
}

export function RecommendationsTab({
  recommendations,
  domain,
  onNavigateTab,
}: RecommendationsTabProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<"ALL" | "CRITICAL_HIGH" | "MEDIUM" | "OPPORTUNITY_GOOD">("ALL");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Summary counts
  const summary = useMemo(() => {
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let opportunityCount = 0;
    let goodCount = 0;

    recommendations.forEach((r) => {
      const s = r.severity.toUpperCase();
      if (s === "CRITICAL") criticalCount++;
      else if (s === "HIGH") highCount++;
      else if (s === "MEDIUM") mediumCount++;
      else if (s === "OPPORTUNITY") opportunityCount++;
      else if (s === "GOOD") goodCount++;
    });

    return {
      total: recommendations.length,
      criticalHigh: criticalCount + highCount,
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      opportunityGood: opportunityCount + goodCount,
      opportunity: opportunityCount,
      good: goodCount,
    };
  }, [recommendations]);

  const filterOptions = [
    { id: "ALL" as const, label: "All Recommendations", count: summary.total, dotColor: "bg-slate-400" },
    { id: "CRITICAL_HIGH" as const, label: "Action Required", count: summary.criticalHigh, dotColor: "bg-rose-500" },
    { id: "MEDIUM" as const, label: "Medium Priority", count: summary.medium, dotColor: "bg-blue-500" },
    { id: "OPPORTUNITY_GOOD" as const, label: "Opportunities & Healthy", count: summary.opportunityGood, dotColor: "bg-emerald-500" },
  ];
  const defaultOption = { id: "ALL" as const, label: "All Recommendations", count: summary.total, dotColor: "bg-slate-400" };
  const currentOption = filterOptions.find((o) => o.id === selectedSeverity) ?? defaultOption;

  // Filter recommendations based on selected severity
  const filteredRecs = useMemo(() => {
    if (selectedSeverity === "ALL") return recommendations;
    if (selectedSeverity === "CRITICAL_HIGH") {
      return recommendations.filter(
        (r) => r.severity.toUpperCase() === "CRITICAL" || r.severity.toUpperCase() === "HIGH"
      );
    }
    if (selectedSeverity === "MEDIUM") {
      return recommendations.filter((r) => r.severity.toUpperCase() === "MEDIUM");
    }
    if (selectedSeverity === "OPPORTUNITY_GOOD") {
      return recommendations.filter(
        (r) => r.severity.toUpperCase() === "OPPORTUNITY" || r.severity.toUpperCase() === "GOOD" || r.severity.toUpperCase() === "LOW"
      );
    }
    return recommendations;
  }, [recommendations, selectedSeverity]);

  // Severity style helper
  const getSeverityBadge = (severity: string) => {
    const s = severity.toUpperCase();
    switch (s) {
      case "CRITICAL":
        return {
          label: "Critical Priority",
          icon: AlertOctagon,
          badge: "bg-rose-50 text-rose-700 border-rose-200",
          cardBorder: "border-rose-200/80 hover:border-rose-300",
          leftBar: "bg-rose-500",
          headerBg: "bg-rose-50/40",
        };
      case "HIGH":
        return {
          label: "High Priority",
          icon: AlertTriangle,
          badge: "bg-amber-50 text-amber-700 border-amber-200",
          cardBorder: "border-amber-200/80 hover:border-amber-300",
          leftBar: "bg-amber-500",
          headerBg: "bg-amber-50/40",
        };
      case "MEDIUM":
        return {
          label: "Medium Attention",
          icon: Info,
          badge: "bg-blue-50 text-blue-700 border-blue-200",
          cardBorder: "border-blue-100 hover:border-blue-200",
          leftBar: "bg-blue-500",
          headerBg: "bg-blue-50/30",
        };
      case "LOW":
        return {
          label: "Low Priority",
          icon: Info,
          badge: "bg-slate-100 text-slate-700 border-slate-200",
          cardBorder: "border-slate-200 hover:border-slate-300",
          leftBar: "bg-slate-400",
          headerBg: "bg-slate-50/50",
        };
      case "OPPORTUNITY":
        return {
          label: "Growth Opportunity",
          icon: TrendingUp,
          badge: "bg-purple-50 text-purple-700 border-purple-200",
          cardBorder: "border-purple-100 hover:border-purple-200",
          leftBar: "bg-purple-500",
          headerBg: "bg-purple-50/30",
        };
      case "GOOD":
        return {
          label: "Healthy Signal",
          icon: CheckCircle2,
          badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
          cardBorder: "border-emerald-100 hover:border-emerald-200",
          leftBar: "bg-emerald-500",
          headerBg: "bg-emerald-50/30",
        };
      default:
        return {
          label: severity,
          icon: Info,
          badge: "bg-slate-100 text-slate-700 border-slate-200",
          cardBorder: "border-slate-200",
          leftBar: "bg-slate-400",
          headerBg: "bg-slate-50",
        };
    }
  };

  const getTargetTabLabel = (targetTab: string | null | undefined) => {
    switch (targetTab) {
      case "backlinks":
        return "View Affected Backlinks";
      case "referring_domains":
        return "View Referring Domains";
      case "anchors":
        return "View Anchor Text Profile";
      case "top_pages":
        return "View Top Pages";
      case "new_lost":
        return "View Lost Backlinks";
      default:
        return "View Data";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Priority Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Recommendations */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-600 font-sans">Total Recommendations</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold tracking-tight text-slate-900">
              {summary.total}
            </span>
            <span className="text-xs text-slate-500 font-sans">Action items generated</span>
          </div>
        </div>

        {/* Critical & High Priority */}
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/30 p-4 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-rose-800 font-sans">Action Required</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
              <AlertOctagon className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold tracking-tight text-rose-900">
              {summary.criticalHigh}
            </span>
            <span className="text-xs text-rose-700 font-sans">Critical & High priority</span>
          </div>
        </div>

        {/* Medium Attention */}
        <div className="rounded-2xl border border-blue-200/80 bg-blue-50/30 p-4 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-blue-800 font-sans">Medium Priority</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold tracking-tight text-blue-900">
              {summary.medium}
            </span>
            <span className="text-xs text-blue-700 font-sans">Optimization recommendations</span>
          </div>
        </div>

        {/* Growth Opportunities & Good */}
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/30 p-4 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-emerald-800 font-sans">Opportunities & Good</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold tracking-tight text-emerald-900">
              {summary.opportunityGood}
            </span>
            <span className="text-xs text-emerald-700 font-sans">Positive signals & expansion</span>
          </div>
        </div>
      </div>

      {/* 2. Filter Toolbar with Dropdown Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative" ref={filterDropdownRef}>
          <button
            type="button"
            onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-display font-bold transition-all cursor-pointer border shadow-2xs",
              selectedSeverity !== "ALL"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
            )}
          >
            <Filter className="h-3.5 w-3.5 text-[#FF4D00]" />
            <span>Filter: {currentOption.label} ({currentOption.count})</span>
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform opacity-70", isFilterDropdownOpen && "rotate-180")} />
          </button>

          {isFilterDropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 z-30 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in duration-100 font-sans">
              <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                Filter by Priority
              </div>
              <div className="space-y-0.5">
                {filterOptions.map((opt) => {
                  const isSelected = selectedSeverity === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSelectedSeverity(opt.id);
                        setIsFilterDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left",
                        isSelected
                          ? "bg-slate-100 text-slate-900 font-bold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full shrink-0", opt.dotColor)} />
                        <span>{opt.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                          {opt.count}
                        </span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-slate-900" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="text-[11px] font-medium text-slate-500 font-sans pr-1">
          Showing <strong className="text-slate-900 font-bold">{filteredRecs.length}</strong> recommendations
        </div>
      </div>

      {/* 4. Recommendation Cards List */}
      <div className="space-y-4">
        {filteredRecs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3 font-sans shadow-xs">
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="font-display text-base font-bold text-slate-900">
              Your analyzed backlink profile has no major issues in this category.
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Based on the available backlink data, no issues matching this filter criteria were detected.
            </p>
          </div>
        ) : (
          filteredRecs.map((rec) => {
            const style = getSeverityBadge(rec.severity);
            const SeverityIcon = style.icon;

            const evidenceList = Array.isArray(rec.evidenceJson)
              ? (rec.evidenceJson as Array<{ label: string; value: string | number; highlight?: boolean }>)
              : [];

            const actionsList = Array.isArray(rec.actionsJson)
              ? (rec.actionsJson as string[])
              : [];

            return (
              <div
                key={rec.id || rec.ruleKey}
                className={cn(
                  "relative rounded-2xl border bg-white shadow-xs hover:shadow-sm transition-all overflow-hidden font-sans",
                  style.cardBorder
                )}
              >
                {/* Left accent bar */}
                <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", style.leftBar)} />

                {/* Card Header */}
                <div className={cn("px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3", style.headerBg)}>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-display font-bold uppercase tracking-wider border",
                        style.badge
                      )}
                    >
                      <SeverityIcon className="h-3.5 w-3.5" />
                      <span>{style.label}</span>
                    </span>

                    <h3 className="font-display text-sm font-bold text-slate-900 tracking-tight">
                      {rec.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-white/80 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      {rec.confidence} Confidence
                    </span>
                    <span className="rounded-md bg-slate-900 text-white px-2 py-0.5 text-[10px] font-bold">
                      Score {rec.priorityScore}/100
                    </span>
                  </div>
                </div>

                {/* Card Body Grid */}
                <div className="p-5 pl-7 space-y-4">
                  {/* What We Found & Why It Matters */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs leading-relaxed">
                    <div className="space-y-1 rounded-xl bg-slate-50/70 p-3.5 border border-slate-100">
                      <span className="font-display font-bold uppercase tracking-wider text-[10px] text-slate-500 block">
                        What We Found
                      </span>
                      <p className="text-slate-800 font-medium">{rec.whatWeFound}</p>
                    </div>

                    <div className="space-y-1 rounded-xl bg-slate-50/70 p-3.5 border border-slate-100">
                      <span className="font-display font-bold uppercase tracking-wider text-[10px] text-slate-500 block">
                        Why It Matters
                      </span>
                      <p className="text-slate-600">{rec.whyItMatters}</p>
                    </div>
                  </div>

                  {/* How To Improve */}
                  <div className="space-y-1.5">
                    <span className="font-display font-bold uppercase tracking-wider text-[10px] text-slate-500 block">
                      How To Improve
                    </span>
                    <p className="text-xs text-slate-800 font-medium leading-relaxed">
                      {rec.howToImprove}
                    </p>
                  </div>

                  {/* Recommended Action Checklist */}
                  {actionsList.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="font-display font-bold uppercase tracking-wider text-[10px] text-slate-500 block">
                        Recommended Actions
                      </span>
                      <div className="space-y-1.5">
                        {actionsList.map((act, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{act}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Evidence & Action Navigation Footer */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Evidence tags */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-400 mr-1">Evidence:</span>
                      {evidenceList.map((ev, i) => (
                        <span
                          key={i}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-sans border",
                            ev.highlight
                              ? "bg-orange-50 border-orange-200 text-orange-900 font-bold"
                              : "bg-slate-50 border-slate-200 text-slate-700 font-medium"
                          )}
                        >
                          <span className="text-slate-500 font-normal">{ev.label}:</span>
                          <span>{ev.value}</span>
                        </span>
                      ))}
                    </div>

                    {/* Contextual Action Button */}
                    {rec.targetTab && (
                      <button
                        type="button"
                        onClick={() => {
                          const filterParams = rec.filterParamsJson && typeof rec.filterParamsJson === "object"
                            ? (rec.filterParamsJson as Record<string, unknown>)
                            : undefined;
                          onNavigateTab(rec.targetTab!, filterParams);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 text-xs font-display font-bold shadow-2xs transition-colors shrink-0 cursor-pointer"
                      >
                        <span>{getTargetTabLabel(rec.targetTab)}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
