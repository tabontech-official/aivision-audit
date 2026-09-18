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
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Animated audit progress screen.
 * Polls /api/reports/[publicId]/status every 1.5s; the visual stage list is
 * driven by the server's real currentStage, with smooth per-stage animation.
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

/**
 * Purely a progress screen. The email ask that used to appear here was
 * removed: it produced a Lead but not an account, and everything of value
 * downstream — the Fix Loop, scheduled re-audits, comparisons — needs an
 * account. The ask now happens at the teaser, the highest-intent moment,
 * where the visitor has just seen their score and wants the rest.
 */
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
  const pollFailures = useRef(0);

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
            if (!cancelled) router.push(`/report/${publicId}`);
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
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="card w-full max-w-md p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-danger-500" aria-hidden />
          <h1 className="mt-4 text-xl font-bold text-ink">Audit failed</h1>
          <p className="mt-2 text-sm text-ink-secondary">{failed}</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Try another website
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-xl font-bold text-white">
            A
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink">
            {finishing ? "Your report is ready" : "Analyzing your website"}
          </h1>
          <p className="mt-1.5 text-sm text-ink-secondary">
            {finishing ? "Taking you to the results…" : <>Running a full audit of <strong>{domain}</strong></>}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mt-8">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>{finishing ? "Complete" : "In progress"}</span>
            <span className="tabular-nums">{Math.round(progress)}%</span>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Audit progress"
          >
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stage list */}
        <ol className="card mt-6 divide-y divide-slate-100">
          {STAGES.map((stage, i) => {
            const done = i < stageIndex || finishing;
            const active = i === stageIndex && !finishing;
            return (
              <li
                key={stage.key}
                className={cn(
                  "flex items-center gap-3 px-5 py-3 text-sm transition-colors",
                  done && "text-ink",
                  active && "bg-brand-50/50 font-medium text-ink",
                  !done && !active && "text-ink-muted",
                )}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 text-success-600" aria-hidden />
                  ) : active ? (
                    <Loader2 className="h-5 w-5 animate-spin text-brand-600" aria-hidden />
                  ) : (
                    <stage.icon className="h-4 w-4" aria-hidden />
                  )}
                </span>
                {stage.label}
                {active && <span className="sr-only">(in progress)</span>}
                {done && <span className="sr-only">(complete)</span>}
              </li>
            );
          })}
        </ol>

        <p className="mt-5 text-center text-xs text-ink-muted">
          This usually takes one to three minutes. Keep this tab open.
        </p>
      </div>
    </main>
  );
}
