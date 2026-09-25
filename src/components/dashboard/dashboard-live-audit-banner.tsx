"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Globe,
  FileCode2,
  Search,
  Gauge,
  Tags,
  Accessibility,
  Smartphone,
  MousePointerClick,
  Lightbulb,
  FileCheck2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  Layers,
} from "lucide-react";
import { StopAuditButton } from "@/components/dashboard/stop-audit-button";
import { cn } from "@/lib/utils/cn";

export const AUDIT_STAGES = [
  { key: "CONNECTING", label: "Connecting to website", icon: Globe },
  { key: "FETCHING_HTML", label: "Reading HTML", icon: FileCode2 },
  { key: "CHECKING_SEO", label: "Checking SEO setup", icon: Search },
  { key: "CHECKING_SPEED", label: "Checking website speed", icon: Gauge },
  { key: "INSPECTING_METADATA", label: "Inspecting metadata", icon: Tags },
  { key: "REVIEWING_ACCESSIBILITY", label: "Reviewing accessibility", icon: Accessibility },
  { key: "ANALYZING_MOBILE", label: "Analyzing mobile experience", icon: Smartphone },
  { key: "CHECKING_CONVERSION", label: "Checking conversion elements", icon: MousePointerClick },
  { key: "EVALUATING_PERFORMANCE", label: "Evaluating performance", icon: Lightbulb },
  { key: "GENERATING_REPORT", label: "Generating final report", icon: FileCheck2 },
];

const STAGE_ALIAS: Record<string, string> = {
  CONNECTING: "CONNECTING",
  FETCHING_HTML: "FETCHING_HTML",
  EXTRACTING_DATA: "CHECKING_SEO",
  CHECKING_SEO: "CHECKING_SEO",
  RUNNING_PAGESPEED: "CHECKING_SPEED",
  CHECKING_SPEED: "CHECKING_SPEED",
  INSPECTING_METADATA: "INSPECTING_METADATA",
  REVIEWING_ACCESSIBILITY: "REVIEWING_ACCESSIBILITY",
  ANALYZING_MOBILE: "ANALYZING_MOBILE",
  CHECKING_CONVERSION: "CHECKING_CONVERSION",
  EVALUATING_PERFORMANCE: "EVALUATING_PERFORMANCE",
  EVALUATING_SECTIONS: "GENERATING_REPORT",
  GENERATING_REPORT: "GENERATING_REPORT",
};

interface DashboardLiveAuditBannerProps {
  reportPublicId: string;
  reportId?: string | null;
  domain: string;
  initialProgress?: number;
  initialStage?: string | null;
  onCompleted?: () => void;
}

export function DashboardLiveAuditBanner({
  reportPublicId,
  reportId,
  domain,
  initialProgress = 15,
  initialStage,
  onCompleted,
}: DashboardLiveAuditBannerProps) {
  const router = useRouter();
  const [progress, setProgress] = useState(initialProgress);
  const [stageIndex, setStageIndex] = useState(0);
  const [status, setStatus] = useState<string>("PROCESSING");
  const [error, setError] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const pollFailures = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const res = await fetch(`/api/reports/${reportPublicId}/status`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as {
          status: string;
          stage?: string | null;
          progress?: number;
          error?: string | null;
        };

        pollFailures.current = 0;
        if (cancelled) return;

        if (data.status === "FAILED") {
          setStatus("FAILED");
          setError(data.error || "The audit encountered an error.");
          return;
        }

        if (data.status === "COMPLETED" || data.status === "PARTIAL") {
          setIsFinishing(true);
          setProgress(100);
          setStageIndex(AUDIT_STAGES.length);
          setStatus("COMPLETED");

          setTimeout(() => {
            if (!cancelled) {
              if (onCompleted) {
                onCompleted();
              } else {
                router.refresh();
              }
            }
          }, 800);
          return;
        }

        const serverStage = data.stage ? (STAGE_ALIAS[data.stage] ?? data.stage) : null;
        const idx = serverStage
          ? AUDIT_STAGES.findIndex((s) => s.key === serverStage)
          : 0;

        if (idx >= 0) setStageIndex((prev) => Math.max(prev, idx));
        if (typeof data.progress === "number") {
          setProgress((prev) => Math.max(prev, data.progress!));
        }
      } catch {
        pollFailures.current += 1;
        if (pollFailures.current >= 10 && !cancelled) {
          setError("Lost connection to live audit stream. Please refresh the page.");
          return;
        }
      }

      if (!cancelled) {
        timer = setTimeout(poll, 1500);
      }
    };

    void poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [reportPublicId, onCompleted, router]);

  if (status === "FAILED") {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5 font-lazzer shadow-xs mb-6 animate-in fade-in duration-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Audit for {domain} encountered an issue
              </h3>
              <p className="mt-1 text-xs text-rose-700 leading-relaxed">
                {error || "Could not complete the crawl for this website."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-[#f0fdf9] via-white to-white p-4 sm:p-5 shadow-xs font-lazzer mb-5 relative overflow-hidden animate-in fade-in duration-300">
      
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-100/50 blur-2xl" />

      <div className="relative z-10 space-y-3">
        
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  {isFinishing ? "Finalizing Report" : "Auditing"} <span className="text-emerald-900">{domain}</span>
                </h2>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-mono font-bold text-emerald-900 border border-emerald-200">
                  {Math.round(progress)}%
                </span>
                <span className="text-xs text-slate-500 font-sans hidden md:inline">
                  · Stage: <strong className="text-slate-700">{AUDIT_STAGES[Math.min(stageIndex, AUDIT_STAGES.length - 1)]?.label || "Processing"}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Full Screen Monitor + Stop Button */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <StopAuditButton identifier={reportId || reportPublicId} />

            <Link
              href={`/analyze/${reportPublicId}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-black text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer font-lazzer"
            >
              <span>View Full Progress Screen</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            </Link>
          </div>
        </div>

        {/* Live Progress Bar */}
        <div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
            />
          </div>
        </div>

        {/* Live Stages Header Pills (Compact Single Row) */}
        <div className="pt-1.5 flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 text-xs">
          {AUDIT_STAGES.slice(0, 6).map((stage, i) => {
            const isDone = stageIndex > i || isFinishing;
            const isCurrent = stageIndex === i && !isFinishing;
            const Icon = stage.icon;

            return (
              <div
                key={stage.key}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all text-[11px] font-medium whitespace-nowrap shrink-0",
                  isDone
                    ? "bg-emerald-50/70 border-emerald-200/60 text-emerald-900"
                    : isCurrent
                    ? "bg-white border-indigo-300 text-indigo-950 font-bold shadow-2xs ring-2 ring-indigo-500/10"
                    : "bg-slate-50/50 border-slate-200/50 text-slate-400 opacity-60",
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-3 h-3 text-indigo-600 animate-spin shrink-0" />
                ) : (
                  <Icon className="w-3 h-3 text-slate-400 shrink-0" />
                )}
                <span>{stage.label}</span>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
