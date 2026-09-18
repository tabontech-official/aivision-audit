"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Filter,
  ListChecks,
  RotateCw,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ScoreRing, scoreColor } from "@/components/report/score-ring";
import { Badge, severityBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { findingActionAction, setAuditScheduleAction } from "./actions";

export type SerializedFinding = {
  id: string;
  checkName: string;
  sectionName: string;
  sectionSlug: string;
  pillar: string;
  severity: string;
  state: string;
  userNote: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  stale: boolean;
  lastReportId: string | null;
};

export type TrendPoint = { publicId: string; score: number; date: string; coverage: number };

export type ReportRow = {
  publicId: string;
  status: string;
  overallScore: number | null;
  grade: string | null;
  scoreDelta: number | null;
  hasComparison: boolean;
  createdAt: string;
};

const OPEN_STATES = ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "STILL_FAILING", "REGRESSED"];
const SEVERITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"];
const PILLAR_ORDER = [
  "FOUNDATIONS", "SPEED_VITALS", "ONPAGE_CONTENT", "AI_ANSWER_ENGINES",
  "TRUST_COMPLIANCE", "CONVERSION_UX",
];
const PILLAR_LABELS: Record<string, string> = {
  FOUNDATIONS: "Foundations", SPEED_VITALS: "Speed & Vitals",
  ONPAGE_CONTENT: "On-page Content", AI_ANSWER_ENGINES: "AI & Answer Engines",
  TRUST_COMPLIANCE: "Trust & Compliance", CONVERSION_UX: "Conversion & UX",
};
const STATE_LABELS: Record<string, string> = {
  OPEN: "Open", ACKNOWLEDGED: "Acknowledged", IN_PROGRESS: "In progress",
  MARKED_FIXED: "Marked fixed", VERIFIED_FIXED: "Verified fixed",
  STILL_FAILING: "Still failing", REGRESSED: "Regressed",
  WONT_FIX: "Won't fix", FALSE_POSITIVE: "False positive",
};

const ACTIONS: Array<{ id: string; label: string; needsNote?: boolean }> = [
  { id: "acknowledge", label: "Acknowledge" },
  { id: "start_work", label: "Start work" },
  { id: "mark_fixed", label: "Mark as fixed" },
  { id: "wont_fix", label: "Won't fix" },
  { id: "false_positive", label: "False positive", needsNote: true },
  { id: "reopen", label: "Reopen" },
];

function ageDays(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

export function WebsiteDetail(props: {
  websiteId: string;
  domain: string;
  url: string;
  latestScore: number | null;
  latestGrade: string | null;
  latestDelta: number | null;
  latestReportPublicId: string | null;
  platform: string | null;
  themeName: string | null;
  appCount: number | null;
  auditSchedule: string;
  userPlan: string;
  trend: TrendPoint[];
  findings: SerializedFinding[];
  reports: ReportRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"fixlist" | "reports" | "settings">("fixlist");
  const [showResolved, setShowResolved] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [noteFor, setNoteFor] = useState<string | null>(null); // action id awaiting note
  const [flash, setFlash] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const visible = useMemo(() => {
    const list = props.findings.filter((f) =>
      showResolved ? true : OPEN_STATES.includes(f.state),
    );
    // Sort: severity desc, then firstSeenAt asc (H.2)
    return [...list].sort((a, b) => {
      const sev = SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity);
      if (sev !== 0) return sev;
      return a.firstSeenAt.localeCompare(b.firstSeenAt);
    });
  }, [props.findings, showResolved]);

  const byPillar = useMemo(() => {
    const groups = PILLAR_ORDER.filter((p) => visible.some((f) => f.pillar === p)).map((p) => ({
      pillar: p,
      findings: visible.filter((f) => f.pillar === p),
    }));
    const other = visible.filter((f) => !PILLAR_ORDER.includes(f.pillar));
    if (other.length) groups.push({ pillar: "OTHER", findings: other });
    return groups;
  }, [visible]);

  const openCount = props.findings.filter((f) => OPEN_STATES.includes(f.state)).length;
  const staleCount = props.findings.filter((f) => f.stale && OPEN_STATES.includes(f.state)).length;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const runAction = (actionId: string, ids: string[], actionNote?: string) => {
    setFlash(null);
    startTransition(async () => {
      const r = await findingActionAction({
        findingIds: ids,
        action: actionId,
        note: actionNote,
      });
      if (r.ok) {
        setFlash({ kind: "success", text: r.message ?? "Updated." });
        setSelected(new Set());
        setNote("");
        setNoteFor(null);
        router.refresh();
      } else {
        setFlash({ kind: "error", text: r.error });
      }
    });
  };

  return (
    <div className="space-y-6">
      <Link href="/dashboard/websites" className="text-sm text-ink-secondary hover:text-ink">
        ← All websites
      </Link>

      {/* Header (H.1) */}
      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <ScoreRing score={props.latestScore} size={72} label={props.latestGrade ?? undefined} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-bold text-ink">{props.domain}</h1>
            {props.latestDelta !== null && props.latestDelta !== 0 && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                  props.latestDelta > 0 ? "bg-success-50 text-success-700" : "bg-danger-50 text-danger-600",
                )}
              >
                {props.latestDelta > 0 ? (
                  <ArrowUpRight className="h-3 w-3" aria-hidden />
                ) : (
                  <ArrowDownRight className="h-3 w-3" aria-hidden />
                )}
                {props.latestDelta > 0 ? "+" : ""}
                {props.latestDelta}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {props.platform && props.platform !== "UNKNOWN" && (
              <Badge variant="neutral">{props.platform}</Badge>
            )}
            {props.themeName && <Badge variant="neutral">theme: {props.themeName}</Badge>}
            {props.appCount !== null && <Badge variant="neutral">{props.appCount} apps</Badge>}
            {props.auditSchedule !== "NONE" && (
              <Badge variant="enabled">{props.auditSchedule.toLowerCase()} audits</Badge>
            )}
          </div>
        </div>
        {props.latestReportPublicId && (
          <Link
            href={`/dashboard/reports/${props.latestReportPublicId}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-ink-secondary hover:bg-slate-50"
          >
            Latest report
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        )}
      </div>

      {/* Score trend (H.1) */}
      {props.trend.length > 1 && <TrendChart points={props.trend} />}

      {staleCount > 0 && (
        <Alert variant="info">
          {staleCount} finding{staleCount === 1 ? " wasn't" : "s weren't"} checked in the latest
          audit — the check may have been disabled or the template changed. They stay tracked, not
          silently dropped.
        </Alert>
      )}
      {flash && <Alert variant={flash.kind === "success" ? "success" : "error"}>{flash.text}</Alert>}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(
          [
            ["fixlist", "Fix List", ListChecks],
            ["reports", "Reports", RotateCw],
            ["settings", "Settings", Settings2],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              tab === id
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-ink-secondary hover:text-ink",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
            {id === "fixlist" && openCount > 0 && (
              <span className="rounded-full bg-slate-100 px-1.5 text-xs tabular-nums">{openCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ---- Fix List (H.2) ---- */}
      {tab === "fixlist" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Mobile: filters collapse into a sheet-style block */}
            <button
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-ink-secondary sm:hidden"
              onClick={() => setFiltersOpen((v) => !v)}
            >
              <Filter className="h-3.5 w-3.5" aria-hidden />
              Filters
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", filtersOpen && "rotate-180")} />
            </button>
            <label
              className={cn(
                "items-center gap-2 text-sm text-ink-secondary",
                filtersOpen ? "flex w-full" : "hidden sm:flex",
              )}
            >
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
              />
              Show resolved &amp; suppressed
            </label>

            {selected.size > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-ink-muted">{selected.size} selected</span>
                {ACTIONS.map((a) => (
                  <Button
                    key={a.id}
                    size="sm"
                    variant="secondary"
                    loading={pending}
                    onClick={() => {
                      if (a.needsNote) setNoteFor(a.id);
                      else runAction(a.id, [...selected]);
                    }}
                  >
                    {a.label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {noteFor && (
            <div className="card flex flex-wrap items-center gap-2 p-3">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Why is this a false positive? (required — it helps us fix the check)"
                className="h-9 min-w-64 flex-1 rounded-lg border border-slate-300 px-3 text-sm"
              />
              <Button size="sm" loading={pending} disabled={!note.trim()} onClick={() => runAction(noteFor, [...selected], note)}>
                Apply
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setNoteFor(null)}>
                Cancel
              </Button>
            </div>
          )}

          {visible.length === 0 ? (
            <div className="card px-5 py-14 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-success-500" aria-hidden />
              <p className="mt-3 font-semibold text-ink">No open issues — nice work.</p>
              <p className="mt-1 text-sm text-ink-muted">
                {props.auditSchedule !== "NONE"
                  ? `Next scheduled audit runs ${props.auditSchedule.toLowerCase()}.`
                  : "Re-run an audit after making changes, or schedule automatic re-audits in Settings."}
              </p>
            </div>
          ) : (
            byPillar.map((group) => (
              <div key={group.pillar} className="card overflow-hidden">
                <div className="bg-surface-subtle px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  {PILLAR_LABELS[group.pillar] ?? "Other"} · {group.findings.length}
                </div>
                <ul className="divide-y divide-slate-100">
                  {group.findings.map((f) => (
                    <li key={f.id} className="flex items-start gap-3 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(f.id)}
                        onChange={() => toggle(f.id)}
                        aria-label={`Select ${f.checkName}`}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-medium text-ink">{f.checkName}</span>
                          <Badge variant={severityBadgeVariant(f.severity)}>{f.severity.toLowerCase()}</Badge>
                          <StateChip state={f.state} />
                          {f.stale && <Badge variant="disabled">not checked lately</Badge>}
                        </div>
                        <div className="mt-0.5 text-xs text-ink-muted">
                          {f.sectionName} · open {ageDays(f.firstSeenAt)} day{ageDays(f.firstSeenAt) === 1 ? "" : "s"}
                          {f.userNote ? ` · note: ${f.userNote.slice(0, 80)}` : ""}
                        </div>
                      </div>
                      <FindingMenu
                        onAction={(actionId, needsNote) => {
                          setSelected(new Set([f.id]));
                          if (needsNote) setNoteFor(actionId);
                          else runAction(actionId, [f.id]);
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}

      {/* ---- Reports tab ---- */}
      {tab === "reports" && (
        <div className="card divide-y divide-slate-100">
          {props.reports.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-ink-muted">No audits yet.</p>
          )}
          {props.reports.map((r) => (
            <div key={r.publicId} className="flex items-center gap-3 px-5 py-3">
              <span
                className="w-10 text-right font-bold tabular-nums"
                style={{ color: scoreColor(r.overallScore) }}
              >
                {r.overallScore !== null ? Math.round(r.overallScore) : "—"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-ink">
                    {new Date(r.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </span>
                  <Badge variant={r.status === "COMPLETED" ? "enabled" : r.status === "FAILED" ? "disabled" : "draft"}>
                    {r.status.toLowerCase()}
                  </Badge>
                  {r.scoreDelta !== null && r.scoreDelta !== 0 && (
                    <span className={cn("text-xs font-semibold", r.scoreDelta > 0 ? "text-success-600" : "text-danger-600")}>
                      {r.scoreDelta > 0 ? "+" : ""}
                      {r.scoreDelta}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {r.hasComparison && (
                  <Link
                    href={`/dashboard/reports/${r.publicId}/compare`}
                    className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-ink-secondary hover:bg-slate-50"
                  >
                    What changed
                  </Link>
                )}
                <Link
                  href={`/dashboard/reports/${r.publicId}`}
                  className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-medium text-ink-secondary hover:bg-slate-50"
                >
                  Report
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---- Settings tab (schedule, §2.9) ---- */}
      {tab === "settings" && (
        <div className="card space-y-4 p-5">
          <h2 className="font-semibold text-ink">Scheduled re-audits</h2>
          <p className="text-sm text-ink-secondary">
            Automatic audits keep the Fix List honest — fixes get verified and regressions get
            caught without you remembering to re-run. Scheduled audits use your monthly allowance;
            if it runs out, the run is skipped and you&apos;re notified once.
          </p>
          <div className="flex flex-wrap gap-2">
            {(["NONE", "MONTHLY", "WEEKLY"] as const).map((option) => {
              const locked = option === "WEEKLY" && props.userPlan !== "PREMIUM";
              return (
                <button
                  key={option}
                  disabled={pending || locked}
                  onClick={() => {
                    setFlash(null);
                    startTransition(async () => {
                      const r = await setAuditScheduleAction(props.websiteId, option);
                      setFlash(
                        r.ok
                          ? { kind: "success", text: r.message ?? "Saved." }
                          : { kind: "error", text: r.error },
                      );
                      if (r.ok) router.refresh();
                    });
                  }}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                    props.auditSchedule === option
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-slate-300 text-ink-secondary hover:bg-slate-50",
                    locked && "cursor-not-allowed opacity-50",
                  )}
                >
                  {option === "NONE" ? "Off" : option === "MONTHLY" ? "Monthly" : "Weekly"}
                  {locked && " (Premium)"}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StateChip({ state }: { state: string }) {
  const tone: Record<string, string> = {
    OPEN: "bg-danger-50 text-danger-600",
    ACKNOWLEDGED: "bg-slate-100 text-ink-secondary",
    IN_PROGRESS: "bg-brand-50 text-brand-700",
    MARKED_FIXED: "bg-warning-50 text-warning-700",
    VERIFIED_FIXED: "bg-success-50 text-success-700",
    STILL_FAILING: "bg-danger-50 text-danger-600",
    REGRESSED: "bg-danger-50 text-danger-600",
    WONT_FIX: "bg-slate-100 text-ink-muted",
    FALSE_POSITIVE: "bg-slate-100 text-ink-muted",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", tone[state] ?? "bg-slate-100")}>
      {STATE_LABELS[state] ?? state}
    </span>
  );
}

function FindingMenu({
  onAction,
}: {
  onAction: (actionId: string, needsNote: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Finding actions"
        className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-ink-secondary hover:bg-slate-50"
      >
        Actions
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-modal">
          {ACTIONS.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                setOpen(false);
                onAction(a.id, a.needsNote ?? false);
              }}
              className="block w-full px-3 py-1.5 text-left text-sm text-ink-secondary hover:bg-slate-50 hover:text-ink"
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Inline SVG sparkline — every terminal audit, tooltip carries coverage. */
function TrendChart({ points }: { points: TrendPoint[] }) {
  const width = 600;
  const height = 80;
  const pad = 6;
  const xs = points.map((_, i) => pad + (i * (width - pad * 2)) / Math.max(1, points.length - 1));
  const ys = points.map((p) => {
    const clamped = Math.max(0, Math.min(100, p.score));
    return height - pad - (clamped / 100) * (height - pad * 2);
  });
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i]!.toFixed(1)}`).join(" ");

  return (
    <div className="card p-4">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-muted">
        Score trend · {points.length} audits
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-20 w-full" role="img" aria-label="Score trend">
        <path d={path} fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={p.publicId} cx={xs[i]} cy={ys[i]} r="3.5" fill={p.coverage < 1 ? "#f59e0b" : "#4f46e5"}>
            <title>
              {`${Math.round(p.score)} on ${new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}${p.coverage < 1 ? ` — score covered ${Math.round(p.coverage * 100)}% of the model` : ""}`}
            </title>
          </circle>
        ))}
      </svg>
      <div className="mt-1 text-[11px] text-ink-muted">
        Amber points scored on partial coverage — not directly comparable to full audits.
      </div>
    </div>
  );
}
