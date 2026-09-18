"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  RefreshCw,
  Trash2,
  Download,
  ChevronRight,
  CircleCheck,
  CircleAlert,
  CircleDot,
  Loader2,
  Radio,
  Terminal,
  ExternalLink,
  RotateCcw,
  OctagonX,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { PIPELINE_STAGES } from "@/lib/dev/tools";
import {
  startDevAuditAction,
  rerunReportAction,
  failReportAction,
  clearTraceAction,
  reconcileReportAction,
} from "./actions";
import type {
  DevLogEntry,
  DevReportListItem,
  DevReportSnapshot,
  DevTraceResponse,
} from "./types";

const POLL_MS = 1500;
const MAX_BUFFER = 800;
const LEVELS = ["INFO", "WARN", "ERROR", "DEBUG"] as const;
type Level = (typeof LEVELS)[number];

const LEVEL_STYLES: Record<Level, string> = {
  INFO: "text-sky-300",
  WARN: "text-amber-300",
  ERROR: "text-rose-400",
  DEBUG: "text-slate-400",
};

const TERMINAL_STATUSES = new Set(["COMPLETED", "FAILED", "PARTIAL"]);

function formatClock(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(
    d.getSeconds(),
  ).padStart(2, "0")}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
}

export function DevConsole({
  recentReports,
  initialReportId,
  inFlightCount,
  environment,
  queueMode,
  pageSpeedConfigured,
  renderStats,
}: {
  recentReports: DevReportListItem[];
  initialReportId: string | null;
  inFlightCount: number;
  environment: string;
  queueMode: string;
  pageSpeedConfigured: boolean;
  renderStats: {
    sampled: number;
    attempted: number;
    benefited: number;
    meanMs: number | null;
    p95Ms: number | null;
    browserMode: string;
  };
}) {
  const [url, setUrl] = useState("");
  const [ignoreLimits, setIgnoreLimits] = useState(true);
  const [reportId, setReportId] = useState<string | null>(initialReportId);
  const [report, setReport] = useState<DevReportSnapshot | null>(null);
  const [logs, setLogs] = useState<DevLogEntry[]>([]);
  const [live, setLive] = useState(true);
  const [follow, setFollow] = useState(true);
  const [levelFilter, setLevelFilter] = useState<Set<Level>>(new Set(LEVELS));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [flash, setFlash] = useState<{ kind: "success" | "error" | "info"; text: string } | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [starting, setStarting] = useState(false);

  const seenIds = useRef<Set<string>>(new Set());
  const cursor = useRef<string | null>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

  /** Drop every buffered line — used when the scope changes or on Clear. */
  const resetBuffer = useCallback(() => {
    seenIds.current = new Set();
    cursor.current = null;
    setLogs([]);
    setReport(null);
  }, []);

  const poll = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (reportId) params.set("reportId", reportId);
      if (cursor.current) params.set("after", cursor.current);

      const res = await fetch(`/api/master-admin/dev/trace?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setPollError(body.error ?? `Trace endpoint returned ${res.status}.`);
        return;
      }
      setPollError(null);

      const data = (await res.json()) as DevTraceResponse;
      setReport(data.report);

      const fresh = data.logs.filter((l) => !seenIds.current.has(l.id));
      if (fresh.length) {
        fresh.forEach((l) => seenIds.current.add(l.id));
        const newest = data.logs[data.logs.length - 1];
        if (newest) cursor.current = newest.createdAt;
        setLogs((prev) => [...prev, ...fresh].slice(-MAX_BUFFER));
      } else if (!cursor.current && data.logs.length) {
        cursor.current = data.logs[data.logs.length - 1]!.createdAt;
      }
    } catch (err) {
      setPollError(err instanceof Error ? err.message : "Trace request failed.");
    }
  }, [reportId]);

  // Live tail. Keeps running after a report finishes so the closing lines land.
  useEffect(() => {
    if (!live) return;
    void poll();
    const id = setInterval(() => void poll(), POLL_MS);
    return () => clearInterval(id);
  }, [live, poll]);

  useEffect(() => {
    if (!follow) return;
    const el = consoleRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs, follow]);

  const visibleLogs = logs.filter((l) => levelFilter.has(l.level));

  const toggleLevel = (level: Level) =>
    setLevelFilter((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next.size ? next : new Set(LEVELS);
    });

  const scopeTo = (id: string | null) => {
    resetBuffer();
    setReportId(id);
    setLive(true);
  };

  const startRun = async () => {
    if (!url.trim()) return;
    setFlash(null);
    setStarting(true);
    try {
      const r = await startDevAuditAction(url.trim(), { ignoreLimits });
      if (r.ok && r.data) {
        resetBuffer();
        setReportId(r.data.reportId);
        setLive(true);
        setFollow(true);
        setFlash({ kind: "success", text: `${r.message ?? "Audit started."} Tracing ${r.data.url}` });
      } else {
        setFlash({ kind: "error", text: r.ok ? "Audit started but returned no report." : r.error });
      }
    } catch (err) {
      setFlash({ kind: "error", text: err instanceof Error ? err.message : "Failed to start the audit." });
    } finally {
      setStarting(false);
    }
  };

  const runAction = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) => {
    setFlash(null);
    startTransition(async () => {
      try {
        const r = await fn();
        setFlash(
          r.ok
            ? { kind: "success", text: r.message ?? "Done." }
            : { kind: "error", text: r.error ?? "Action failed." },
        );
        if (r.ok) void poll();
      } catch (err) {
        setFlash({ kind: "error", text: err instanceof Error ? err.message : "Action failed." });
      }
    });
  };

  const downloadTrace = () => {
    const payload = JSON.stringify({ report, logs: visibleLogs }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `pipeline-trace-${reportId ?? "system"}.json`;
    a.click();
    URL.revokeObjectURL(href);
  };

  const isRunning = report ? !TERMINAL_STATUSES.has(report.status) : false;
  const elapsedMs =
    report?.startedAt
      ? new Date(report.completedAt ?? Date.now()).getTime() - new Date(report.startedAt).getTime()
      : null;

  return (
    <div className="space-y-6">
      {/* ---------- Header ---------- */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-ink">
            <Terminal className="h-6 w-6 text-brand-600" aria-hidden />
            Pipeline Console
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-secondary">
            Give it a URL and watch the audit engine work — every stage transition, fetch, render,
            PageSpeed call and evaluation as the backend writes it. Development instrument: it is not
            linked for regular admins and can force-fail or re-queue reports.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="draft">env: {environment}</Badge>
            <Badge variant="neutral">dispatch: {queueMode}</Badge>
            <Badge variant={pageSpeedConfigured ? "enabled" : "disabled"}>
              PageSpeed key: {pageSpeedConfigured ? "configured" : "missing"}
            </Badge>
            <Badge variant={inFlightCount > 0 ? "draft" : "neutral"}>
              {inFlightCount} report{inFlightCount === 1 ? "" : "s"} in flight
            </Badge>
            <Badge variant="neutral">browser: {renderStats.browserMode}</Badge>
            {renderStats.sampled > 0 && (
              <Badge variant="neutral">
                render rate: {renderStats.attempted}/{renderStats.sampled}
                {renderStats.attempted > 0
                  ? ` · benefit: ${Math.round((renderStats.benefited / renderStats.attempted) * 100)}%`
                  : ""}
                {renderStats.meanMs !== null
                  ? ` · ${(renderStats.meanMs / 1000).toFixed(1)}s mean / ${((renderStats.p95Ms ?? 0) / 1000).toFixed(1)}s p95`
                  : ""}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {flash && (
        <Alert variant={flash.kind === "success" ? "success" : flash.kind === "error" ? "error" : "info"}>
          {flash.text}
        </Alert>
      )}
      {!pageSpeedConfigured && (
        <Alert variant="info">
          No PageSpeed Insights key is configured, so the CHECKING_SPEED stage will return nothing and
          the run will finish as <strong>PARTIAL</strong> rather than COMPLETED. That is expected, not a bug.
        </Alert>
      )}

      {/* ---------- Run a URL ---------- */}
      <div className="card p-4">
        <label htmlFor="dev-url" className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
          Run the pipeline against a URL
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            id="dev-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void startRun();
            }}
            placeholder="https://example.com"
            className="h-10 min-w-64 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-ink placeholder:text-ink-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <Button loading={starting} disabled={!url.trim()} onClick={() => void startRun()}>
            <Play className="h-4 w-4" aria-hidden />
            Run &amp; trace
          </Button>
        </div>
        <label className="mt-3 flex items-start gap-2 text-sm text-ink-secondary">
          <input
            type="checkbox"
            checked={ignoreLimits}
            onChange={(e) => setIgnoreLimits(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
          />
          <span>
            Bypass the monthly allowance and the one-audit-at-a-time rule
            <span className="block text-xs text-ink-muted">
              URL validation and the SSRF host check always run. Untick to go through the exact intake path a
              visitor uses, allowance included.
            </span>
          </span>
        </label>
      </div>

      {/* ---------- Scope ---------- */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            What am I watching
          </div>
          <button
            type="button"
            onClick={() => scopeTo(null)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
              reportId ? "text-ink-secondary hover:bg-slate-100" : "bg-brand-50 text-brand-700",
            )}
          >
            Everything (system-wide tail)
          </button>
        </div>
        <div className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-slate-200">
          {recentReports.length === 0 && (
            <p className="px-3 py-3 text-sm text-ink-muted">No reports yet — run a URL above.</p>
          )}
          <ul className="divide-y divide-slate-100">
            {recentReports.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => scopeTo(r.id)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50",
                    reportId === r.id && "bg-brand-50/60",
                  )}
                >
                  <StatusDot status={r.status} />
                  <span className="min-w-0 flex-1 truncate text-ink">{r.url}</span>
                  <span className="shrink-0 text-xs text-ink-muted">
                    {r.status}
                    {r.currentStage ? ` · ${r.currentStage} ${r.progressPercent}%` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ---------- Live report state ---------- */}
      {report && (
        <div className="card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusDot status={report.status} />
                <span className="truncate font-semibold text-ink">{report.url}</span>
                <Badge variant={report.status === "FAILED" ? "disabled" : "enabled"}>{report.status}</Badge>
                {isRunning && (
                  <span className="flex items-center gap-1 text-xs text-brand-700">
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                    {report.currentStage ?? "starting"} · {report.progressPercent}%
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                <span>report {report.id.slice(0, 8)}…</span>
                {elapsedMs !== null && <span>elapsed {formatDuration(elapsedMs)}</span>}
                {report.overallScore !== null && (
                  <span>
                    score {report.overallScore} ({report.grade ?? "—"})
                  </span>
                )}
                <span>
                  {report.passedCount} pass · {report.failedCount} fail · {report.warningCount} warn ·{" "}
                  {report.criticalIssueCount} critical
                </span>
              </div>
              {report.errorMessage && (
                <p className="mt-2 text-sm text-danger-600">{report.errorMessage}</p>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Link
                href={`/analyze/${report.publicId}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-ink-secondary hover:bg-slate-50"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                Progress UI
              </Link>
              <Link
                href={`/report/${report.publicId}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-ink-secondary hover:bg-slate-50"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                Report
              </Link>
              <Button
                variant="secondary"
                size="sm"
                loading={pending}
                onClick={() => runAction(() => rerunReportAction(report.id))}
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                Re-run
              </Button>
              <Button
                variant="secondary"
                size="sm"
                loading={pending}
                disabled={TERMINAL_STATUSES.has(report.status) && report.status !== "FAILED"}
                onClick={() => {
                  if (confirm("Force this report into FAILED?")) {
                    runAction(() => failReportAction(report.id));
                  }
                }}
              >
                <OctagonX className="h-3.5 w-3.5" aria-hidden />
                Force fail
              </Button>
              {(report.status === "COMPLETED" || report.status === "PARTIAL") && (
                <Button
                  variant="secondary"
                  size="sm"
                  loading={pending}
                  onClick={() => runAction(() => reconcileReportAction(report.id))}
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  Re-run findings
                </Button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                report.status === "FAILED" ? "bg-danger-500" : "bg-brand-500",
              )}
              style={{ width: `${Math.min(100, report.progressPercent)}%` }}
            />
          </div>

          {/* Stage timeline */}
          <ol className="mt-4 space-y-1">
            {PIPELINE_STAGES.map((s) => {
              const state = stageState(s.percent, report);
              const stageLog = logs.find((l) => l.stage === s.stage);
              return (
                <li key={s.stage} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 shrink-0">
                    {state === "done" && <CircleCheck className="h-4 w-4 text-success-600" aria-hidden />}
                    {state === "active" && (
                      <Loader2 className="h-4 w-4 animate-spin text-brand-600" aria-hidden />
                    )}
                    {state === "pending" && <CircleDot className="h-4 w-4 text-slate-300" aria-hidden />}
                    {state === "stopped" && <CircleAlert className="h-4 w-4 text-danger-500" aria-hidden />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "font-medium",
                        state === "pending" ? "text-ink-muted" : "text-ink",
                        state === "stopped" && "text-danger-600",
                      )}
                    >
                      {s.label}
                    </span>
                    <span className="ml-2 text-xs text-ink-muted">{s.detail}</span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-ink-muted">
                    {stageLog ? formatClock(stageLog.createdAt) : `${s.percent}%`}
                  </span>
                </li>
              );
            })}
          </ol>

          {/* What the run actually left behind */}
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
            <Artefact label="Raw crawl data" ok={report.artefacts.rawData} />
            <Artefact label="Screenshot" ok={report.artefacts.screenshot} />
            <Artefact label={`PageSpeed rows (${report.artefacts.pageSpeedRows})`} ok={report.artefacts.pageSpeedRows > 0} />
            <Artefact label={`Section results (${report.artefacts.sectionResults})`} ok={report.artefacts.sectionResults > 0} />
            <Artefact label={`Check results (${report.artefacts.auditResults})`} ok={report.artefacts.auditResults > 0} />
            <Artefact label="Report snapshot" ok={report.artefacts.snapshot} />
          </div>
        </div>
      )}

      {/* ---------- Console ---------- */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2.5">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Radio className={cn("h-4 w-4", live ? "text-success-600" : "text-ink-muted")} aria-hidden />
            {reportId ? "Trace for this report" : "System-wide trace"}
          </span>
          <span className="text-xs text-ink-muted">
            {visibleLogs.length} line{visibleLogs.length === 1 ? "" : "s"}
            {logs.length !== visibleLogs.length ? ` (${logs.length - visibleLogs.length} filtered)` : ""}
          </span>

          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => toggleLevel(level)}
                className={cn(
                  "rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors",
                  levelFilter.has(level)
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-ink-muted hover:bg-slate-200",
                )}
              >
                {level}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setLive((v) => !v)}
              title={live ? "Pause the tail" : "Resume the tail"}
              className="rounded-lg p-1.5 text-ink-muted hover:bg-slate-100 hover:text-ink"
            >
              {live ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => void poll()}
              title="Poll once now"
              className="rounded-lg p-1.5 text-ink-muted hover:bg-slate-100 hover:text-ink"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={downloadTrace}
              title="Download this trace as JSON"
              className="rounded-lg p-1.5 text-ink-muted hover:bg-slate-100 hover:text-ink"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm(reportId ? "Delete the stored log lines for this report?" : "Delete ALL stored log lines?")) {
                  runAction(async () => {
                    const r = await clearTraceAction(reportId);
                    if (r.ok) resetBuffer();
                    return r;
                  });
                }
              }}
              title="Delete the stored log lines"
              className="rounded-lg p-1.5 text-ink-muted hover:bg-danger-50 hover:text-danger-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {pollError && (
          <div className="border-b border-danger-100 bg-danger-50 px-4 py-2 text-xs text-danger-700">
            Trace poll failed: {pollError}
          </div>
        )}

        <div
          ref={consoleRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            setFollow(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
          }}
          className="h-96 overflow-y-auto bg-slate-950 p-3 font-mono text-xs leading-relaxed"
        >
          {visibleLogs.length === 0 && (
            <p className="text-slate-500">
              {live
                ? "Waiting for the backend to say something…"
                : "Tail paused. Press play to resume."}
            </p>
          )}
          {visibleLogs.map((log) => {
            const isOpen = expanded.has(log.id);
            const hasDetail = Boolean(log.stackTrace) || (log.meta && Object.keys(log.meta).length > 0);
            return (
              <div key={log.id} className="group">
                <button
                  type="button"
                  onClick={() =>
                    setExpanded((prev) => {
                      const next = new Set(prev);
                      if (next.has(log.id)) next.delete(log.id);
                      else next.add(log.id);
                      return next;
                    })
                  }
                  className="flex w-full items-start gap-2 rounded px-1 py-0.5 text-left hover:bg-white/5"
                >
                  <ChevronRight
                    className={cn(
                      "mt-0.5 h-3 w-3 shrink-0 transition-transform",
                      hasDetail ? "text-slate-500" : "invisible",
                      isOpen && "rotate-90",
                    )}
                    aria-hidden
                  />
                  <span className="shrink-0 tabular-nums text-slate-500">{formatClock(log.createdAt)}</span>
                  <span className={cn("w-12 shrink-0 font-semibold", LEVEL_STYLES[log.level])}>
                    {log.level}
                  </span>
                  <span className="shrink-0 text-violet-300">[{log.category}]</span>
                  <span className="min-w-0 flex-1 whitespace-pre-wrap break-words text-slate-200">
                    {log.message}
                  </span>
                  {log.durationMs !== null && (
                    <span className="shrink-0 text-emerald-400">{formatDuration(log.durationMs)}</span>
                  )}
                </button>
                {isOpen && hasDetail && (
                  <div className="mb-1 ml-6 space-y-1 border-l border-slate-700 pl-3">
                    {log.websiteUrl && <div className="text-slate-400">url: {log.websiteUrl}</div>}
                    {log.stage && <div className="text-slate-400">stage: {log.stage}</div>}
                    {log.meta && Object.keys(log.meta).length > 0 && (
                      <pre className="whitespace-pre-wrap break-words text-slate-400">
                        {JSON.stringify(log.meta, null, 2)}
                      </pre>
                    )}
                    {log.stackTrace && (
                      <pre className="whitespace-pre-wrap break-words text-rose-300/80">{log.stackTrace}</pre>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2 text-xs text-ink-muted">
          <span>
            Polling every {POLL_MS / 1000}s · buffer holds the last {MAX_BUFFER} lines
          </span>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={follow}
              onChange={(e) => setFollow(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
            />
            Follow output
          </label>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Where a stage stands. Progress is the report's own percent, so a run killed
 * mid-flight shows the stage it died on as `stopped` rather than pretending to
 * still be working — that is the whole point of watching this page.
 */
function stageState(
  percent: number,
  report: DevReportSnapshot,
): "done" | "active" | "pending" | "stopped" {
  const current = report.progressPercent;
  if (current > percent) return "done";
  if (current < percent) return "pending";
  if (report.status === "FAILED") return "stopped";
  if (TERMINAL_STATUSES.has(report.status)) return "done";
  return "active";
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "COMPLETED"
      ? "bg-success-500"
      : status === "PARTIAL"
        ? "bg-amber-500"
        : status === "FAILED"
          ? "bg-danger-500"
          : "bg-brand-500 animate-pulse";
  return <span className={cn("h-2 w-2 shrink-0 rounded-full", color)} aria-hidden />;
}

function Artefact({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        ok ? "bg-success-50 text-success-700" : "bg-slate-100 text-ink-muted",
      )}
    >
      {ok ? <CircleCheck className="h-3.5 w-3.5" aria-hidden /> : <CircleDot className="h-3.5 w-3.5" aria-hidden />}
      {label}
    </span>
  );
}
