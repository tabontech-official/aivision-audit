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
  XCircle,
  Sparkles,
  ArrowRight,
  LayoutDashboard,
  KeyRound,
} from "lucide-react";
import { BrandIcon } from "@/components/ui/brand-icon";
import { cn } from "@/lib/utils/cn";
import { cancelAuditAction } from "@/app/dashboard/reports/actions";

/**
 * Animated audit progress screen built with the brand theme layout,
 * colors (#dff2ed backdrop, font-lazzer typography, brand icon logo,
 * rounded pill buttons & sleek progress indicators).
 */

const STAGES = [
  { key: "CONNECTING", label: "Connecting to website", icon: Globe },
  { key: "FETCHING_HTML", label: "Reading HTML", icon: FileCode2 },
  { key: "CHECKING_SEO", label: "Checking SEO setup", icon: Search },
  { key: "CHECKING_SPEED", label: "Checking website speed", icon: Gauge },
  { key: "INSPECTING_METADATA", label: "Inspecting metadata", icon: Tags },
  { key: "REVIEWING_ACCESSIBILITY", label: "Reviewing accessibility", icon: Accessibility },
  { key: "ANALYZING_MOBILE", label: "Analyzing mobile experience", icon: Smartphone },
  { key: "CHECKING_CONVERSION", label: "Checking conversion elements", icon: MousePointerClick },
  { key: "PREPARING_RECOMMENDATIONS", label: "Preparing recommendations", icon: Lightbulb },
  { key: "GENERATING_REPORT", label: "Generating report", icon: FileCheck2 },
] as const;

// RENDERING (Playwright) maps onto the FETCHING_HTML visual slot
const STAGE_ALIAS: Record<string, string> = { RENDERING: "FETCHING_HTML" };

type StatusPayload = {
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "PARTIAL";
  stage: string | null;
  progress: number;
  error: string | null;
};

export function AnalysisProgress({
  publicId,
  domain,
  initialProgress,
}: {
  publicId: string;
  domain: string;
  initialProgress: number;
}) {
  const router = useRouter();
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(initialProgress);
  const [failed, setFailed] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const pollFailures = useRef(0);

  const handleStopAudit = async () => {
    if (cancelling) return;
    setCancelling(true);
    try {
      await cancelAuditAction(publicId);
      router.push("/dashboard");
    } catch {
      router.push("/dashboard");
    }
  };

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const res = await fetch(`/api/reports/${publicId}/status`, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as StatusPayload;
        pollFailures.current = 0;
        if (cancelled) return;

        if (data.status === "FAILED") {
          setFailed(data.error ?? "The audit could not be completed.");
          return;
        }

        if (data.status === "COMPLETED" || data.status === "PARTIAL") {
          // Sweep remaining stages quickly, then navigate
          setFinishing(true);
          setProgress(100);
          setStageIndex(STAGES.length);
          setTimeout(() => {
            if (!cancelled) router.push(`/dashboard?project=${encodeURIComponent(domain)}`);
          }, 900);
          return;
        }

        const serverStage = data.stage ? (STAGE_ALIAS[data.stage] ?? data.stage) : null;
        const idx = serverStage
          ? STAGES.findIndex((s) => s.key === serverStage)
          : 0;
        if (idx >= 0) setStageIndex((prev) => Math.max(prev, idx));
        setProgress((prev) => Math.max(prev, data.progress));
      } catch {
        pollFailures.current += 1;
        if (pollFailures.current >= 8 && !cancelled) {
          setFailed("We lost connection to the audit. Refresh the page to check its status.");
          return;
        }
      }
      timer = setTimeout(poll, 1500);
    };

    void poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [publicId, router]);

  if (failed) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#dff2ed] px-4 py-12 font-lazzer">
        <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-4">
            <AlertCircle className="h-6 w-6" aria-hidden />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Audit failed</h1>
          <p className="mt-2 text-sm text-slate-600">{failed}</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 hover:bg-slate-800 active:bg-slate-950 px-6 py-3 text-sm font-bold text-white transition-all shadow-xs"
          >
            Try another website
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#dff2ed] px-4 py-12 font-lazzer relative selection:bg-slate-200">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/40 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="w-full max-w-md relative z-10">
        {/* Header with App Logo & Title */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2.5 shadow-md border border-slate-200/80 transition-transform hover:scale-105">
            <BrandIcon className="h-full w-full" />
          </div>
          <h1 className="mt-5 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {finishing ? "Your report is ready" : "Analyzing your website"}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            {finishing ? (
              "Taking you to the results…"
            ) : (
              <>
                Running a full audit of <strong className="font-semibold text-slate-900">{domain}</strong>
              </>
            )}
          </p>
        </div>

        {/* Progress Bar Section */}
        <div className="mt-7">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-700 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-900"></span>
              </span>
              {finishing ? "Complete" : "In progress"}
            </span>
            <span className="tabular-nums font-bold text-slate-900">{Math.round(progress)}%</span>
          </div>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-slate-200/90 shadow-inner"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Audit progress"
          >
            <div
              className="h-full rounded-full bg-slate-900 transition-all duration-700 ease-out shadow-xs"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Checklist Card */}
        <ol className="mt-6 rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.04)] divide-y divide-slate-100 overflow-hidden">
          {STAGES.map((stage, i) => {
            const done = i < stageIndex || finishing;
            const active = i === stageIndex && !finishing;
            return (
              <li
                key={stage.key}
                className={cn(
                  "flex items-center gap-3.5 px-5 py-3.5 text-sm transition-all duration-200",
                  done && "text-slate-900 bg-white",
                  active && "bg-slate-50 font-semibold text-slate-950",
                  !done && !active && "text-slate-400 bg-white",
                )}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 transition-transform" aria-hidden />
                  ) : active ? (
                    <Loader2 className="h-5 w-5 animate-spin text-slate-900" aria-hidden />
                  ) : (
                    <stage.icon className="h-4 w-4 text-slate-300" aria-hidden />
                  )}
                </span>
                <span
                  className={cn(
                    "flex-1",
                    done
                      ? "text-slate-900 font-medium"
                      : active
                      ? "text-slate-950 font-bold"
                      : "text-slate-400 font-normal",
                  )}
                >
                  {stage.label}
                </span>
                {active && (
                  <span className="text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 rounded-full">
                    Analyzing…
                  </span>
                )}
                {active && <span className="sr-only">(in progress)</span>}
                {done && <span className="sr-only">(complete)</span>}
              </li>
            );
          })}
        </ol>

        {/* Run in Background & Browse Platform Card */}
        <div className="mt-6 rounded-2xl border border-emerald-200/90 bg-[#f0fdf9] p-4 shadow-sm text-left">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 mt-0.5">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                You can browse the platform while this runs
              </h3>
              <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                This audit continues automatically in the background. Feel free to explore other tools or analyze another site—we&apos;ll notify you in real-time the moment this report is ready.
              </p>
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-emerald-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#181818] hover:bg-black text-white px-4 py-2 text-xs font-bold transition-all shadow-xs"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Continue to Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <div className="flex items-center justify-center gap-2">
              <Link
                href="/dashboard/keywords"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white/80 border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-2xs transition-colors"
              >
                <KeyRound className="h-3 w-3 text-slate-500" />
                <span>Keyword Tools</span>
              </Link>
              <Link
                href="/dashboard/websites"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white/80 border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-2xs transition-colors"
              >
                <Globe className="h-3 w-3 text-slate-500" />
                <span>Websites</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Stop Audit Button */}
        <div className="mt-4 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleStopAudit}
            disabled={cancelling || finishing}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-300/60 bg-white/70 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 px-3.5 py-1 text-[11px] font-semibold text-slate-500 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <XCircle className="h-3 w-3" />
            <span>{cancelling ? "Stopping audit..." : "Cancel / Stop this audit"}</span>
          </button>
        </div>
      </div>
    </main>
  );
}
