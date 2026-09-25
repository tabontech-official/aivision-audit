"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  X,
  CheckCircle2,
  Zap,
  ArrowRight,
  ShieldCheck,
  Globe,
  Loader2,
  Layers,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import {
  getUpgradeOptionsAction,
  upgradePlanCheckoutAction,
  type UpgradePlanOption,
} from "./upgrade-actions";
import { cn } from "@/lib/utils/cn";

export interface AuditSummaryForUpgrade {
  domain?: string;
  healthScore?: number;
  criticalIssues?: number;
  highIssues?: number;
  totalIssues?: number;
  pagesCrawled?: number;
  totalDetectedPages?: number;
  siteRemaining?: number;
}

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string | null;
  auditSummary?: AuditSummaryForUpgrade | null;
}

export function UpgradePlanModal({ isOpen, onClose, reason, auditSummary }: UpgradePlanModalProps) {
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<UpgradePlanOption[]>([]);
  const [nextPlan, setNextPlan] = useState<UpgradePlanOption | null>(null);
  const [currentPlanName, setCurrentPlanName] = useState("Free Plan");
  const [currentQuota, setCurrentQuota] = useState(10);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    getUpgradeOptionsAction().then((res) => {
      if (res.ok) {
        setPlans(res.allPlans);
        setNextPlan(res.nextPlan);
        setCurrentPlanName(res.currentPlanName);
        setCurrentQuota(res.pageCreditsLimit);
        if (res.nextPlan) {
          setSelectedPlanId(res.nextPlan.id);
        } else if (res.allPlans.length > 0) {
          setSelectedPlanId(res.allPlans[1]?.id || res.allPlans[0]?.id || null);
        }
      } else {
        setError(res.error || "Failed to load upgrade options.");
      }
      setLoading(false);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const activeTargetPlan = plans.find((p) => p.id === selectedPlanId) || nextPlan || plans[1] || plans[0];

  const handleUpgrade = (planId: string) => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await upgradePlanCheckoutAction(planId, interval);
        if (res.ok && res.url) {
          window.location.href = res.url;
        } else {
          setError(res.error || "Could not start checkout. Please try again.");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      }
    });
  };

  const getPrice = (plan: UpgradePlanOption) => {
    if (interval === "year") {
      return plan.priceYearly > 0 ? plan.priceYearly : plan.priceMonthly * 10;
    }
    return plan.priceMonthly;
  };

  // Dynamic audit copy
  const hasAuditResults =
    auditSummary &&
    typeof auditSummary.pagesCrawled === "number" &&
    auditSummary.pagesCrawled > 0;

  const totalIssuesCount = auditSummary?.totalIssues ?? (
    (auditSummary?.criticalIssues ?? 0) + (auditSummary?.highIssues ?? 0)
  );

  const headlineText = hasAuditResults
    ? totalIssuesCount > 0
      ? `We found ${totalIssuesCount.toLocaleString()} issues in just ${auditSummary.pagesCrawled?.toLocaleString()} pages.`
      : `We audited ${auditSummary.pagesCrawled?.toLocaleString()} pages with a ${auditSummary.healthScore ?? 100}% health score.`
    : "Upgrade Your Plan";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200 font-lazzer overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 overflow-hidden my-8">
        
        {/* Decorative background glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-100/50 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-emerald-100/40 blur-3xl" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer z-10"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative z-10">
          
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/60">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                {auditSummary?.domain ? `${auditSummary.domain} Audit Results` : "Site Audit Intelligence"}
              </span>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
            {headlineText}
          </h2>

          {/* Audit Results Context Breakdown */}
          {hasAuditResults ? (
            <div className="mt-3 space-y-3">
              {/* Dynamic Issue Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Health Score</span>
                  <span className={cn(
                    "text-base font-black",
                    (auditSummary.healthScore ?? 100) >= 80 ? "text-emerald-600" : (auditSummary.healthScore ?? 100) >= 60 ? "text-amber-600" : "text-rose-600"
                  )}>
                    {auditSummary.healthScore ?? 100}%
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Critical Issues</span>
                  <span className={cn(
                    "text-base font-black",
                    (auditSummary.criticalIssues ?? 0) > 0 ? "text-rose-600" : "text-slate-700"
                  )}>
                    {(auditSummary.criticalIssues ?? 0).toLocaleString()}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">High Issues</span>
                  <span className={cn(
                    "text-base font-black",
                    (auditSummary.highIssues ?? 0) > 0 ? "text-amber-600" : "text-slate-700"
                  )}>
                    {(auditSummary.highIssues ?? 0).toLocaleString()}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Issues</span>
                  <span className="text-base font-black text-slate-900">
                    {totalIssuesCount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Unchecked Pages Explanatory Callout */}
              {(auditSummary.siteRemaining ?? 0) > 0 && (
                <div className="rounded-xl bg-amber-50/80 border border-amber-200/70 p-3.5 text-xs text-slate-700 leading-relaxed space-y-1">
                  <p className="font-bold text-amber-950 text-[13px]">
                    Your website has {(auditSummary.totalDetectedPages ?? (auditSummary.pagesCrawled! + auditSummary.siteRemaining!)).toLocaleString()} pages.{" "}
                    <span className="text-amber-700">{(auditSummary.siteRemaining ?? 0).toLocaleString()} are still unchecked.</span>
                  </p>
                  <p className="text-slate-600">
                    The pages we haven’t analysed may still contain issues affecting search visibility, speed, accessibility, technical SEO, and overall site health.
                  </p>
                </div>
              )}

              {/* What Paid Unlocks Feature Checklist */}
              <div className="py-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  What paid plan unlocks:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Audit all <strong>{(auditSummary.siteRemaining ?? 0).toLocaleString()}</strong> remaining pages</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Recheck fixes &amp; instant live verification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Compare crawl diffs &amp; track progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Scheduled continuous site monitoring</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
              {reason || `You have reached your limit of ${currentQuota.toLocaleString()} pages on the ${currentPlanName}. Upgrade to continue crawling pages, run scheduled re-audits, and unlock all features.`}
            </p>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
              <span className="text-xs font-medium text-slate-500">Loading plan options...</span>
            </div>
          ) : error && !activeTargetPlan ? (
            <div className="my-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {error}
            </div>
          ) : (
            <>
              {/* Billing Interval Switcher */}
              <div className="mt-4 flex items-center justify-center">
                <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setInterval("month")}
                    className={cn(
                      "px-4 py-1.5 rounded-lg transition-all cursor-pointer",
                      interval === "month"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800",
                    )}
                  >
                    Monthly Billing
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterval("year")}
                    className={cn(
                      "px-4 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                      interval === "year"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800",
                    )}
                  >
                    <span>Yearly Billing</span>
                    <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 font-extrabold">
                      Save 20%
                    </span>
                  </button>
                </div>
              </div>

              {/* Target Plan Featured Card */}
              {activeTargetPlan && (
                <div className="mt-4 rounded-2xl border-2 border-emerald-500/80 bg-gradient-to-b from-[#f0fdf9] via-white to-white p-5 shadow-md relative">
                  
                  {/* Top Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-base sm:text-lg">
                        {activeTargetPlan.name}
                      </span>
                      {activeTargetPlan.badgeText && (
                        <span className="rounded-full bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5">
                          {activeTargetPlan.badgeText}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-xl sm:text-2xl font-black text-slate-950">
                        ${getPrice(activeTargetPlan)}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        /{interval === "year" ? "year" : "mo"}
                      </span>
                    </div>
                  </div>

                  {/* Highlights Grid */}
                  <div className="space-y-2 text-xs text-slate-700 py-3 border-y border-emerald-100/80">
                    <div className="flex items-center gap-2 font-bold text-emerald-950">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{activeTargetPlan.pageAuditLimit.toLocaleString()} Monthly Crawl Credits</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{activeTargetPlan.websiteLimit === -1 ? "Unlimited" : activeTargetPlan.websiteLimit} Monitored Projects</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{activeTargetPlan.schemaMonthlyLimit === -1 ? "Unlimited" : activeTargetPlan.schemaMonthlyLimit} Schema Generations / Month</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Scheduled Audits &amp; Historical Issue Comparison</span>
                    </div>
                  </div>

                  {/* Upgrade Action Button */}
                  <div className="mt-4">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleUpgrade(activeTargetPlan.id)}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold px-6 py-3 text-sm shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 group"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Initiating Checkout...</span>
                        </>
                      ) : (
                        <>
                          <span>Continue Full Website Audit</span>
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <p className="mt-3 text-xs font-semibold text-rose-600 text-center">
                  {error}
                </p>
              )}

              {/* Bottom Footer */}
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <Link
                  href="/pricing"
                  onClick={onClose}
                  className="hover:text-slate-900 underline font-semibold"
                >
                  View Plans
                </Link>

                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                >
                  Close
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
