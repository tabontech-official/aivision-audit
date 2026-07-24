"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RotateCw,
  Lock,
  Sparkles,
  ChevronDown,
  ExternalLink,
  Zap,
  Smartphone,
  Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ScoreRing, scoreColor } from "@/components/report/score-ring";
import { StatusIcon, severityLabel } from "@/components/report/status-icon";
import { Badge, severityBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { rerunAuditByPublicIdAction } from "./actions";
import type {
  ProjectedReport,
  ProjectedSection,
  ProjectedCheck,
} from "@/services/reports/project-report";

export function ReportView(props: {
  publicId: string;
  domain: string;
  url: string;
  faviconUrl: string | null;
  screenshotUrl: string | null;
  status: string;
  overallScore: number | null;
  grade: string | null;
  mobileScore: number | null;
  desktopScore: number | null;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  criticalIssueCount: number;
  auditedAt: string;
  viewerPlan: "FREE" | "PREMIUM";
  projected: ProjectedReport;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { projected } = props;

  const rerun = () => {
    setError(null);
    startTransition(async () => {
      const r = await rerunAuditByPublicIdAction(props.publicId);
      if (r.ok && r.redirectTo) router.push(r.redirectTo);
      else if (!r.ok) setError(r.error);
    });
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/reports"
        className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink"
      >
        ← All reports
      </Link>

      {props.status === "PARTIAL" && (
        <Alert variant="warning">
          Speed metrics were unavailable for this run, so this report is partial. Re-run the
          audit to try again.
        </Alert>
      )}
      {error && <Alert variant="error">{error}</Alert>}

      {/* Header */}
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-5">
            <ScoreRing score={props.overallScore} size={104} label={props.grade ?? undefined} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-xl font-bold text-ink">{props.domain}</h1>
                <a
                  href={props.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-ink-muted hover:text-ink"
                  aria-label="Open website"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
              </div>
              {props.grade && (
                <div
                  className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{
                    color: scoreColor(props.overallScore),
                    backgroundColor: `${scoreColor(props.overallScore)}1a`,
                  }}
                >
                  {props.grade}
                </div>
              )}
              <div className="mt-1.5 text-xs text-ink-muted">
                Audited{" "}
                {new Date(props.auditedAt).toLocaleString("en-US", {
                  month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-2">
            <Button variant="secondary" onClick={rerun} loading={pending}>
              <RotateCw className="h-4 w-4" aria-hidden />
              Re-audit
            </Button>
          </div>
        </div>

        {/* Mobile/desktop speed strip */}
        {(props.mobileScore !== null || props.desktopScore !== null) && (
          <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100">
            <SpeedTile icon={Smartphone} label="Mobile" score={props.mobileScore} />
            <SpeedTile icon={Monitor} label="Desktop" score={props.desktopScore} />
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Passed" value={projected.visiblePassed} tone="success" />
        <SummaryCard label="Warnings" value={projected.visibleWarning} tone="warning" />
        <SummaryCard label="Failed" value={projected.visibleFailed} tone="danger" />
        <SummaryCard label="Critical issues" value={props.criticalIssueCount} tone="danger" />
      </div>

      {/* Layout: sidebar nav + sections */}
      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <nav
          className="sticky top-6 hidden h-fit space-y-0.5 lg:block"
          aria-label="Report sections"
        >
          {projected.sections.map((s) => (
            <a
              key={s.sectionId}
              href={`#section-${s.slug}`}
              className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-ink-secondary hover:bg-white hover:text-ink"
            >
              <span className="truncate">{s.name}</span>
              {s.locked ? (
                <Lock className="h-3.5 w-3.5 shrink-0 text-premium-600" aria-hidden />
              ) : (
                <span
                  className="shrink-0 text-xs font-semibold tabular-nums"
                  style={{ color: scoreColor(s.score) }}
                >
                  {s.score !== null ? Math.round(s.score) : "—"}
                </span>
              )}
            </a>
          ))}
        </nav>

        <div className="space-y-4">
          {projected.sections.map((section) =>
            section.locked ? (
              <LockedSection key={section.sectionId} section={section} />
            ) : (
              <SectionCard key={section.sectionId} section={section} />
            ),
          )}

          {props.viewerPlan === "FREE" && projected.hasLockedContent && (
            <UpgradeCta
              lockedSections={projected.lockedSectionCount}
              lockedChecks={projected.lockedCheckCount}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function SpeedTile({
  icon: Icon,
  label,
  score,
}: {
  icon: typeof Zap;
  label: string;
  score: number | null;
}) {
  return (
    <div className="flex items-center gap-3 px-6 py-4">
      <Icon className="h-5 w-5 text-ink-muted" aria-hidden />
      <div>
        <div className="text-xs text-ink-muted">{label} performance</div>
        <div className="text-lg font-bold tabular-nums" style={{ color: scoreColor(score) }}>
          {score !== null ? Math.round(score) : "—"}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "warning" | "danger";
}) {
  const toneCls = {
    success: "text-success-600",
    warning: "text-warning-600",
    danger: "text-danger-600",
  }[tone];
  return (
    <div className="card p-4">
      <div className={cn("text-2xl font-bold tabular-nums", toneCls)}>{value}</div>
      <div className="text-xs text-ink-muted">{label}</div>
    </div>
  );
}

function SectionCard({ section }: { section: Extract<ProjectedSection, { locked: false }> }) {
  const [open, setOpen] = useState(section.defaultExpanded);

  return (
    <section id={`section-${section.slug}`} className="card scroll-mt-6 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <span
          className="h-9 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: section.accentColor ?? "#cbd5e1" }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-ink">{section.name}</h2>
            {section.lockedCheckCount > 0 && (
              <Badge variant="premium">
                <Lock className="h-3 w-3" aria-hidden />
                {section.lockedCheckCount} premium
              </Badge>
            )}
          </div>
          <div className="text-xs text-ink-muted">{section.summary}</div>
        </div>
        <span
          className="shrink-0 text-lg font-bold tabular-nums"
          style={{ color: scoreColor(section.score) }}
        >
          {section.score !== null ? Math.round(section.score) : "—"}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-ink-muted transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <ul className="divide-y divide-slate-100 border-t border-slate-100">
          {section.checks.map((check) => (
            <li key={check.fieldId}>
              {check.locked ? (
                <LockedCheck check={check} />
              ) : (
                <CheckCard check={check} />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CheckCard({ check }: { check: Extract<ProjectedCheck, { locked: false }> }) {
  const hasEvidence = check.evidence && Object.keys(check.evidence).length > 0;
  return (
    <div className="px-5 py-4">
      <div className="flex items-start gap-3">
        <StatusIcon status={check.status} className="mt-0.5 h-5 w-5" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-ink">{check.name}</span>
            <Badge variant={severityBadgeVariant(check.severity)}>
              {severityLabel(check.severity)}
            </Badge>
            {check.isQuickWin && (
              <Badge variant="info">
                <Zap className="h-3 w-3" aria-hidden />
                Quick win
              </Badge>
            )}
          </div>

          {check.message && <p className="mt-1 text-sm text-ink-secondary">{check.message}</p>}

          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
            {check.actualValue !== null && (
              <span>
                Detected:{" "}
                <code className="rounded bg-slate-100 px-1 py-0.5 text-ink">
                  {check.actualValue.length > 80
                    ? `${check.actualValue.slice(0, 80)}…`
                    : check.actualValue}
                </code>
              </span>
            )}
            {check.expectedSummary && <span>Expected: {check.expectedSummary}</span>}
          </div>

          {check.suggestion && (check.status === "FAIL" || check.status === "WARNING") && (
            <div className="mt-2 rounded-lg border border-brand-100 bg-brand-50/60 px-3 py-2 text-sm text-ink-secondary">
              <span className="font-medium text-brand-700">How to fix: </span>
              {check.suggestion}
            </div>
          )}

          {hasEvidence && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-medium text-ink-muted hover:text-ink">
                Evidence
              </summary>
              <pre className="mt-1.5 overflow-x-auto rounded-lg bg-slate-50 p-2.5 text-xs text-ink-secondary">
                {JSON.stringify(check.evidence, null, 2)}
              </pre>
            </details>
          )}

          {check.helpArticleUrl && (
            <a
              href={check.helpArticleUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              Learn more <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function LockedCheck({ check }: { check: Extract<ProjectedCheck, { locked: true }> }) {
  return (
    <div className="flex items-center gap-3 bg-premium-50/30 px-5 py-4">
      <Lock className="h-5 w-5 shrink-0 text-premium-600" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-ink">{check.name}</span>
          <Badge variant="premium">Premium</Badge>
        </div>
        {check.description && (
          <p className="mt-0.5 truncate text-sm text-ink-muted">{check.description}</p>
        )}
        <div className="mt-1.5 h-2 w-2/3 rounded bg-slate-200 blur-[2px]" aria-hidden />
      </div>
    </div>
  );
}

function LockedSection({ section }: { section: Extract<ProjectedSection, { locked: true }> }) {
  return (
    <section
      id={`section-${section.slug}`}
      className="card scroll-mt-6 border-premium-100 bg-premium-50/30 p-5"
    >
      <div className="flex items-center gap-3">
        <span
          className="h-9 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: section.accentColor ?? "#a855f7" }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-ink">{section.name}</h2>
            <Badge variant="premium">
              <Lock className="h-3 w-3" aria-hidden />
              Premium
            </Badge>
          </div>
          {section.shortDescription && (
            <p className="mt-0.5 text-sm text-ink-secondary">{section.shortDescription}</p>
          )}
        </div>
        <span className="shrink-0 text-xs text-ink-muted">{section.checkCount} checks</span>
      </div>
      <div className="mt-3 space-y-1.5" aria-hidden>
        <div className="h-2.5 w-full rounded bg-slate-200 blur-[2px]" />
        <div className="h-2.5 w-4/5 rounded bg-slate-200 blur-[2px]" />
        <div className="h-2.5 w-2/3 rounded bg-slate-200 blur-[2px]" />
      </div>
    </section>
  );
}

function UpgradeCta({
  lockedSections,
  lockedChecks,
}: {
  lockedSections: number;
  lockedChecks: number;
}) {
  const parts: string[] = [];
  if (lockedSections > 0) parts.push(`${lockedSections} section${lockedSections > 1 ? "s" : ""}`);
  if (lockedChecks > 0) parts.push(`${lockedChecks} check${lockedChecks > 1 ? "s" : ""}`);

  return (
    <div className="rounded-card border-2 border-premium-600 bg-white p-6 text-center shadow-card">
      <Sparkles className="mx-auto h-6 w-6 text-premium-600" aria-hidden />
      <h3 className="mt-2 text-lg font-bold text-ink">Unlock your full report</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-ink-secondary">
        {parts.join(" and ")} {parts.length ? "are" : "is"} locked. Upgrade to Premium for full
        evidence, detailed recommendations, and PDF exports.
      </p>
      <Link
        href="/dashboard/billing"
        className="mt-4 inline-block rounded-lg bg-premium-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-premium-600"
      >
        Upgrade to Premium
      </Link>
    </div>
  );
}
