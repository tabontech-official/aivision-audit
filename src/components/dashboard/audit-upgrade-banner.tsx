"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  RotateCw,
  ShieldCheck,
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface AuditUpgradeBannerProps {
  domain: string;
  healthScore: number;
  criticalIssues: number;
  highIssues: number;
  totalIssues: number;
  pagesCrawled: number;
  totalDetectedPages: number;
  siteRemaining: number;
  planCreditsRemaining: number;
  hasMoreAvailableUnderPlan: boolean;
  planLimitReached: boolean;
  isContinuing?: boolean;
  onContinueAudit?: () => void;
  onOpenUpgradeModal: () => void;
}

export function AuditUpgradeBanner({
  domain: _domain,
  healthScore,
  criticalIssues,
  highIssues,
  totalIssues,
  pagesCrawled,
  totalDetectedPages,
  siteRemaining,
  planCreditsRemaining,
  hasMoreAvailableUnderPlan,
  planLimitReached,
  isContinuing = false,
  onContinueAudit,
  onOpenUpgradeModal,
}: AuditUpgradeBannerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // If all pages have been crawled, nothing remains unknown
  if (siteRemaining <= 0) {
    return null;
  }

  const percentCrawled = totalDetectedPages > 0 ? Math.min(100, Math.round((pagesCrawled / totalDetectedPages) * 100)) : 100;
  const issuesFoundText =
    totalIssues === 1
      ? `We found 1 issue in just ${pagesCrawled.toLocaleString()} ${pagesCrawled === 1 ? "page" : "pages"}.`
      : totalIssues > 1
      ? `We found ${totalIssues.toLocaleString()} issues in just ${pagesCrawled.toLocaleString()} pages.`
      : `We checked ${pagesCrawled.toLocaleString()} pages (Health Score: ${healthScore}%).`;

  // Collapsed View
  if (isCollapsed) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-r from-white via-slate-50 to-slate-100/60 p-3.5 sm:p-4 shadow-xs transition-all animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left Summary */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 text-white px-2.5 py-0.5 text-[11px] font-bold shadow-2xs">
              <Activity className="h-3 w-3 text-amber-400" />
              <span>Partial Crawl</span>
            </span>

            <span className="rounded-full bg-amber-100 text-amber-900 border border-amber-200/80 px-2 py-0.5 text-[11px] font-bold">
              {siteRemaining.toLocaleString()} pages unchecked
            </span>

            <span className="text-xs sm:text-sm font-bold text-slate-900 ml-1">
              {issuesFoundText}
            </span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {hasMoreAvailableUnderPlan && onContinueAudit ? (
              <button
                type="button"
                onClick={onContinueAudit}
                disabled={isContinuing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 hover:bg-black text-white px-3.5 py-1.5 text-xs font-bold shadow-xs cursor-pointer disabled:opacity-60"
              >
                <RotateCw className={cn("h-3.5 w-3.5", isContinuing && "animate-spin")} />
                <span>{isContinuing ? "Crawling..." : "Check More Pages"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenUpgradeModal}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 hover:bg-black text-white px-3.5 py-1.5 text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer group"
              >
                <span>Start Monitoring My Site</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            <Link
              href="/dashboard/billing"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 px-3 py-1.5 text-xs font-bold transition-colors"
            >
              View Plans
            </Link>

            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-slate-100 text-slate-700 px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
              title="Expand Details"
            >
              <ChevronDown className="h-4 w-4" />
              <span className="hidden sm:inline">Details</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Expanded View
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white via-slate-50/60 to-slate-100/40 p-5 sm:p-6 shadow-sm transition-all animate-in fade-in duration-200">
      {/* Decorative ambient background accents */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-indigo-200/25 blur-3xl" />

      {/* Header Bar with Collapse Button */}
      <div className="relative z-10 flex items-center justify-between gap-2 mb-3">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 text-white px-3 py-1 text-[11px] font-bold shadow-2xs">
            <Activity className="h-3 w-3 text-amber-400" />
            <span>Partial Crawl Completed</span>
          </span>

          <span className="rounded-full bg-amber-100 text-amber-900 border border-amber-200/80 px-2.5 py-0.5 text-[11px] font-bold">
            {siteRemaining.toLocaleString()} pages unchecked
          </span>

          {planLimitReached && (
            <span className="rounded-full bg-rose-100 text-rose-800 border border-rose-200/80 px-2.5 py-0.5 text-[11px] font-bold">
              Crawl limit reached
            </span>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          type="button"
          onClick={() => setIsCollapsed(true)}
          className="inline-flex items-center gap-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer"
          title="Collapse Banner"
        >
          <span className="text-xs">Collapse</span>
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        
        {/* Left Section: Real Audit Results & Unchecked Impact */}
        <div className="flex-1 space-y-4">

          {/* Main Hook Headline */}
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-950">
              {issuesFoundText}
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              We found <span className="text-slate-950 font-bold">{totalDetectedPages.toLocaleString()} URLs</span> on your website. You’ve audited <span className="text-slate-950 font-bold">{pagesCrawled.toLocaleString()} {pagesCrawled === 1 ? "page" : "pages"}</span> so far.{" "}
              <span className="text-amber-700 font-bold">{siteRemaining.toLocaleString()} pages are still outside your current audit coverage</span>.
            </p>
          </div>

          {/* Real Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-1">
            <div className="rounded-xl bg-white border border-slate-200/90 p-2.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Health Score</span>
              <span className={cn(
                "text-base sm:text-lg font-black",
                healthScore >= 80 ? "text-emerald-600" : healthScore >= 60 ? "text-amber-600" : "text-rose-600"
              )}>
                {healthScore}%
              </span>
            </div>

            <div className="rounded-xl bg-white border border-slate-200/90 p-2.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Critical Issues</span>
              <span className={cn(
                "text-base sm:text-lg font-black",
                criticalIssues > 0 ? "text-rose-600" : "text-slate-700"
              )}>
                {criticalIssues.toLocaleString()}
              </span>
            </div>

            <div className="rounded-xl bg-white border border-slate-200/90 p-2.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">High Issues</span>
              <span className={cn(
                "text-base sm:text-lg font-black",
                highIssues > 0 ? "text-amber-600" : "text-slate-700"
              )}>
                {highIssues.toLocaleString()}
              </span>
            </div>

            <div className="rounded-xl bg-white border border-slate-200/90 p-2.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Issues</span>
              <span className="text-base sm:text-lg font-black text-slate-900">
                {totalIssues.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Crawl Coverage Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Crawl Coverage: <strong className="text-slate-900">{pagesCrawled.toLocaleString()}</strong> of <strong className="text-slate-900">{totalDetectedPages.toLocaleString()}</strong> pages</span>
              <span>{percentCrawled}% checked</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-indigo-600 transition-all duration-500"
                style={{ width: `${Math.max(4, percentCrawled)}%` }}
              />
            </div>
          </div>

          {/* Why That Matters */}
          <div className="bg-amber-50/80 border border-amber-200/70 rounded-xl p-3.5 space-y-1 text-xs sm:text-[13px] text-slate-700 leading-relaxed">
            <p>
              <strong className="text-amber-950 font-bold">Why this matters:</strong> The pages we haven’t analysed may still contain issues affecting search visibility, speed, accessibility, technical SEO, and overall site health.
            </p>
            <p className="text-amber-900 font-medium">
              Keep your full site checked and monitor future changes automatically.
            </p>
          </div>

          {/* What Ongoing Monitoring Unlocks */}
          <div className="pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              What ongoing monitoring unlocks:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Audit all <strong>{siteRemaining.toLocaleString()}</strong> remaining pages</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Recheck fixes &amp; confirm resolution live</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Track health score &amp; compare changes over time</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Continuous recurring scheduled site monitoring</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Section: CTAs & Action Card */}
        <div className="lg:w-72 shrink-0 flex flex-col justify-between rounded-2xl bg-white border border-slate-200/90 p-5 shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Continuous Site Health
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {hasMoreAvailableUnderPlan
                ? `You have ${planCreditsRemaining.toLocaleString()} remaining plan credits to check more pages.`
                : `Keep your full site checked and monitor future changes automatically.`}
            </p>
          </div>

          <div className="pt-5 space-y-2.5">
            {hasMoreAvailableUnderPlan && onContinueAudit ? (
              <button
                type="button"
                onClick={onContinueAudit}
                disabled={isContinuing}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 hover:bg-black text-white px-4 py-3 text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                <RotateCw className={cn("h-4 w-4", isContinuing && "animate-spin")} />
                <span>{isContinuing ? "Crawling Pages..." : "Check More Pages"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenUpgradeModal}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 hover:bg-black text-white px-4 py-3 text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer group"
              >
                <span>Start Monitoring My Site</span>
                <ArrowRight className="h-4 w-4 text-white group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            <Link
              href="/dashboard/billing"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer text-center"
            >
              <span>View Plans</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
