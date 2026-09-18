"use client";

import { createContext, useContext, useState, useTransition } from "react";
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
  ListChecks,
  FileDown,
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
import type { ScoreBasis } from "@/services/reports/evaluate-report";

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
  scoreBasis: ScoreBasis | null;
  /** Live Fix Loop state by fieldKey (§2.14) — frozen status + live badge. */
  findingStates?: Record<string, { state: string; resolvedAt: string | null }>;
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
    <FindingStatesContext.Provider value={props.findingStates ?? {}}>
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/reports"
        className="inline-flex items-center gap-1 text-sm text-ink-secondary hover:text-ink"
      >
        ← All reports
      </Link>

      {/* Non-Shopify: honest explanation, never a low score from inapplicable checks */}
      {projected.site && !projected.site.isShopify && (
        <Alert variant="info">
          <strong className="font-semibold">This isn&apos;t a Shopify store</strong>
          {projected.site.platform !== "UNKNOWN"
            ? ` — it looks like ${platformLabel(projected.site.platform)}.`
            : "."}{" "}
          We&apos;ve run our universal checks — SEO, speed, security, and AI readiness — and
          they&apos;re all below. Our Shopify-specific analysis (theme performance, app bloat,
          product schema, checkout signals) only applies to Shopify stores, and your score is
          computed over the applicable checks only.
        </Alert>
      )}

      {(() => {
        // Coverage warning: platform-gated exclusions are by design and covered
        // by the banner above; only degraded coverage (missing PSI data,
        // misconfigured checks) makes the score non-comparable.
        const degraded = props.scoreBasis?.excludedSections.filter(
          (s) => s.reason !== "NOT_APPLICABLE_PLATFORM",
        );
        if (props.scoreBasis && degraded && degraded.length > 0) {
          return (
            <Alert variant="warning">
              {degraded.some((s) => s.reason === "NO_PSI_DATA")
                ? "Speed data was unavailable for this audit. "
                : ""}
              Your score excludes {degraded.map((s) => s.name).join(", ")} and is not directly
              comparable to audits that include {degraded.length === 1 ? "it" : "them"}.
            </Alert>
          );
        }
        if (!props.scoreBasis && props.status === "PARTIAL") {
          return (
            <Alert variant="warning">
              Speed metrics were unavailable for this run, so this report is partial. Re-run the
              audit to try again.
            </Alert>
          );
        }
        return null;
      })()}
      {error && <Alert variant="error">{error}</Alert>}

      {/* Header */}
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          {/* Opportunistic store screenshot — captured only when a render ran
              anyway (B.10.3); absent on the ~85% of audits that skip it. */}
          {props.screenshotUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={props.screenshotUrl}
              alt={`Screenshot of ${props.domain}`}
              className="hidden h-24 w-40 shrink-0 rounded-lg border border-slate-200 object-cover object-top sm:block"
            />
          )}
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
              {/* Detected store context — proves the tool understands the store */}
              {projected.site && projected.site.platform !== "UNKNOWN" && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge variant="neutral">{platformLabel(projected.site.platform)}</Badge>
                  {projected.site.themeName && (
                    <Badge variant="neutral">
                      theme: {projected.site.themeName}
                      {projected.site.isOfficialTheme ? " (official)" : ""}
                    </Badge>
                  )}
                  {projected.site.isShopify && (
                    <Badge variant={projected.site.blockingAppScripts > 0 ? "medium" : "neutral"}>
                      {projected.site.appCount} app script host{projected.site.appCount === 1 ? "" : "s"}
                      {projected.site.blockingAppScripts > 0
                        ? ` · ${projected.site.blockingAppScripts} blocking`
                        : ""}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            {props.viewerPlan === "PREMIUM" ? (
              <Link
                href={`/dashboard/reports/${props.publicId}/pdf`}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-slate-50"
              >
                <FileDown className="h-4 w-4" aria-hidden />
                Download PDF
              </Link>
            ) : (
              <Link
                href="/dashboard/billing"
                title="PDF export is included with Premium"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-slate-50"
              >
                <Lock className="h-3.5 w-3.5" aria-hidden />
                PDF export
              </Link>
            )}
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

      {/* Prioritized action plan — top of the report, before the detail */}
      <ActionPlan rows={buildActionPlan(projected.sections)} />

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
          {groupByPillar(projected.sections).map((group) =>
            group.pillar === null ? (
              // v1 snapshots (no pillar data): the flat list, exactly as before
              group.sections.map((section) =>
                section.locked ? (
                  <LockedSection key={section.sectionId} section={section} />
                ) : (
                  <SectionCard key={section.sectionId} section={section} />
                ),
              )
            ) : (
              <PillarGroup
                key={group.pillar}
                group={group}
                scoreBasis={props.scoreBasis}
              />
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
    </FindingStatesContext.Provider>
  );
}

/* ---------------- live Fix Loop state (§2.14) ---------------- */

const FindingStatesContext = createContext<
  Record<string, { state: string; resolvedAt: string | null }>
>({});

/**
 * Frozen snapshot status + live finding badge. The snapshot is never
 * rewritten; the badge says what has happened SINCE this audit ran. Only
 * rendered when it adds information beyond the frozen status.
 */
function LiveStateBadge({ fieldKey, frozenStatus }: { fieldKey: string; frozenStatus: string }) {
  const states = useContext(FindingStatesContext);
  const live = states[fieldKey];
  if (!live) return null;

  const wasIssue = frozenStatus === "FAIL" || frozenStatus === "WARNING";
  if (wasIssue && live.state === "VERIFIED_FIXED") {
    return (
      <span className="inline-flex items-center rounded-full bg-success-50 px-2 py-0.5 text-[11px] font-medium text-success-700">
        ✓ verified fixed since this audit
      </span>
    );
  }
  if (wasIssue && live.state === "MARKED_FIXED") {
    return (
      <span className="inline-flex items-center rounded-full bg-warning-50 px-2 py-0.5 text-[11px] font-medium text-warning-700">
        marked fixed — awaiting verification
      </span>
    );
  }
  if (wasIssue && (live.state === "WONT_FIX" || live.state === "FALSE_POSITIVE")) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-ink-muted">
        {live.state === "WONT_FIX" ? "dismissed (won't fix)" : "disputed as false positive"}
      </span>
    );
  }
  if (frozenStatus === "PASS" && (live.state === "REGRESSED" || live.state === "OPEN")) {
    return (
      <span className="inline-flex items-center rounded-full bg-danger-50 px-2 py-0.5 text-[11px] font-medium text-danger-600">
        ↩ regressed since this audit
      </span>
    );
  }
  return null;
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
        <>
          {groupChecksByCategory(
            section.checks.filter((c) => c.locked || c.status !== "NOT_APPLICABLE"),
          ).map((group, gi) => (
            <div key={`${section.sectionId}-cat-${gi}`}>
              {group.label && (
                <div className="flex items-center gap-2 border-t border-slate-200/70 bg-slate-50 px-5 py-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-secondary">
                    {group.label}
                  </span>
                  <span className="text-[11px] text-ink-muted">
                    {group.passed} passed
                    {group.warning > 0 ? ` · ${group.warning} warning${group.warning === 1 ? "" : "s"}` : ""}
                    {group.failed > 0 ? ` · ${group.failed} failed` : ""}
                  </span>
                </div>
              )}
              <ul className="divide-y divide-slate-100 border-t border-slate-100">
                {group.checks.map((check) => (
                  <li key={check.fieldId}>
                    {check.locked ? <LockedCheck check={check} /> : <CheckCard check={check} />}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <SkippedChecks
            checks={section.checks.filter(
              (c): c is Extract<ProjectedCheck, { locked: false }> =>
                !c.locked && c.status === "NOT_APPLICABLE",
            )}
          />
        </>
      )}
    </section>
  );
}

/**
 * Checks that resolved NOT_APPLICABLE — platform-gated or missing PSI data.
 * Collapsed by default: they are honest disclosure, not findings.
 */
function SkippedChecks({
  checks,
}: {
  checks: Array<Extract<ProjectedCheck, { locked: false }>>;
}) {
  if (checks.length === 0) return null;
  const platformGated = checks.filter(
    (c) => c.expectedSummary === "Not applicable to this platform",
  );
  const label =
    platformGated.length === checks.length
      ? `${checks.length} check${checks.length === 1 ? "" : "s"} skipped — not applicable to this platform`
      : `${checks.length} check${checks.length === 1 ? "" : "s"} skipped — not applicable to this audit`;
  return (
    <details className="border-t border-slate-100 bg-surface-subtle/60 px-5 py-3">
      <summary className="cursor-pointer text-xs font-medium text-ink-muted hover:text-ink">
        {label}
      </summary>
      <ul className="mt-2 space-y-1">
        {checks.map((check) => (
          <li key={check.fieldId} className="text-xs text-ink-muted">
            {check.name}
          </li>
        ))}
      </ul>
    </details>
  );
}

/* ---------------- prioritized action plan (3.5) ---------------- */

type PlanRow = {
  check: Extract<ProjectedCheck, { locked: false }>;
  sectionName: string;
  sectionSlug: string;
  reason: "critical" | "quick-win" | "high";
};

/**
 * Top five by impact-to-effort, using the definitions the engine already
 * computes (§7c): critical issues first (FAILING + CRITICAL severity), then
 * quick wins (FAIL/WARNING at LOW/MEDIUM — high impact for one-line changes),
 * then remaining HIGH failures. Flat and ordered, not grouped — a to-do list,
 * not another taxonomy.
 */
function buildActionPlan(sections: ProjectedSection[]): PlanRow[] {
  const critical: PlanRow[] = [];
  const quickWins: PlanRow[] = [];
  const highs: PlanRow[] = [];

  for (const section of sections) {
    if (section.locked) continue;
    for (const check of section.checks) {
      if (check.locked) continue;
      if (check.status !== "FAIL" && check.status !== "WARNING") continue;
      const row = { check, sectionName: section.name, sectionSlug: section.slug };
      if (check.status === "FAIL" && check.severity === "CRITICAL") {
        critical.push({ ...row, reason: "critical" });
      } else if (check.isQuickWin) {
        quickWins.push({ ...row, reason: "quick-win" });
      } else if (check.severity === "HIGH" && check.status === "FAIL") {
        highs.push({ ...row, reason: "high" });
      }
    }
  }
  return [...critical, ...quickWins, ...highs].slice(0, 5);
}

function ActionPlan({ rows }: { rows: PlanRow[] }) {
  if (rows.length === 0) return null;
  const labels: Record<PlanRow["reason"], string> = {
    critical: "Critical",
    "quick-win": "Quick win",
    high: "High impact",
  };
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
        <ListChecks className="h-4 w-4 text-brand-600" aria-hidden />
        <h2 className="text-sm font-bold text-ink">Fix these first</h2>
        <span className="text-xs text-ink-muted">
          the {rows.length} highest impact-to-effort {rows.length === 1 ? "item" : "items"}
        </span>
      </div>
      <ol className="divide-y divide-slate-100">
        {rows.map((row, i) => (
          <li key={row.check.fieldId} className="flex items-start gap-3 px-5 py-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-ink-secondary">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <a
                href={`#section-${row.sectionSlug}`}
                className="flex flex-wrap items-center gap-2 hover:underline"
              >
                <span className="font-medium text-ink">{row.check.name}</span>
                <Badge
                  variant={row.reason === "critical" ? "high" : row.reason === "quick-win" ? "info" : "medium"}
                >
                  {labels[row.reason]}
                </Badge>
                <span className="text-xs text-ink-muted">{row.sectionName}</span>
              </a>
              {row.check.suggestion && (
                <p className="mt-1 text-sm text-ink-secondary">{row.check.suggestion}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------------- category sub-groups (F.3) ---------------- */

type CategoryGroup = {
  label: string | null;
  checks: ProjectedCheck[];
  passed: number;
  failed: number;
  warning: number;
};

/** Contiguous runs sharing a `category` get a header with a pass/warn/fail
 *  count; checks with no category render ungrouped, exactly as before. */
function groupChecksByCategory(checks: ProjectedCheck[]): CategoryGroup[] {
  const groups: CategoryGroup[] = [];
  for (const check of checks) {
    const label = !check.locked && check.category?.trim() ? check.category.trim() : null;
    let current = groups[groups.length - 1];
    if (!current || current.label !== label) {
      current = { label, checks: [], passed: 0, failed: 0, warning: 0 };
      groups.push(current);
    }
    current.checks.push(check);
    if (!check.locked) {
      if (check.status === "PASS") current.passed++;
      else if (check.status === "FAIL") current.failed++;
      else if (check.status === "WARNING") current.warning++;
    }
  }
  return groups;
}

/* ---------------- pillar grouping (F.2) ---------------- */

const PILLAR_ORDER = [
  "FOUNDATIONS", "SPEED_VITALS", "ONPAGE_CONTENT", "AI_ANSWER_ENGINES",
  "TRUST_COMPLIANCE", "CONVERSION_UX",
] as const;

const PILLAR_LABELS: Record<string, string> = {
  FOUNDATIONS: "Foundations",
  SPEED_VITALS: "Speed & Vitals",
  ONPAGE_CONTENT: "On-page Content",
  AI_ANSWER_ENGINES: "AI & Answer Engines",
  TRUST_COMPLIANCE: "Trust & Compliance",
  CONVERSION_UX: "Conversion & UX",
};

type PillarBucket = { pillar: string | null; sections: ProjectedSection[] };

/**
 * v2 snapshots (every section carries a pillar) group in enum order; any
 * pre-pillar snapshot falls back to one flat `pillar: null` bucket so old
 * reports render exactly as they always did.
 */
function groupByPillar(sections: ProjectedSection[]): PillarBucket[] {
  if (sections.length === 0 || sections.some((s) => !s.pillar)) {
    return [{ pillar: null, sections }];
  }
  return PILLAR_ORDER.filter((p) => sections.some((s) => s.pillar === p)).map((p) => ({
    pillar: p,
    sections: sections.filter((s) => s.pillar === p),
  }));
}

function PillarGroup({
  group,
  scoreBasis,
}: {
  group: PillarBucket;
  scoreBasis: ScoreBasis | null;
}) {
  const pillar = group.pillar!;
  const excludedSlugs = new Set(scoreBasis?.excludedSections.map((s) => s.slug) ?? []);

  // Aggregate = weighted average of section percentages, same arithmetic as
  // the overall score, honouring scoreBasis exclusions.
  let weightedSum = 0;
  let weightTotal = 0;
  let passed = 0;
  let failed = 0;
  let warning = 0;
  for (const s of group.sections) {
    if (s.locked) continue;
    passed += s.passedCount;
    failed += s.failedCount;
    warning += s.warningCount;
    if (s.score === null || excludedSlugs.has(s.slug)) continue;
    const w = s.weight ?? 1;
    weightedSum += s.score * w;
    weightTotal += w;
  }
  const aggregate = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : null;

  // A pillar whose sections are ALL excluded renders collapsed with the
  // reason — never with a score of zero.
  const allExcluded =
    aggregate === null &&
    group.sections.every((s) => s.locked || s.score === null || excludedSlugs.has(s.slug));
  if (allExcluded) {
    const reasons = new Set(
      (scoreBasis?.excludedSections ?? [])
        .filter((e) => group.sections.some((s) => s.slug === e.slug))
        .map((e) => e.reason),
    );
    const reasonText = reasons.has("NOT_APPLICABLE_PLATFORM")
      ? "Not applicable to this platform"
      : reasons.has("NO_PSI_DATA")
        ? "Speed data was unavailable for this audit"
        : "No measurable checks in this audit";
    return (
      <details className="card px-5 py-4">
        <summary className="cursor-pointer text-sm font-semibold text-ink-muted">
          {PILLAR_LABELS[pillar] ?? pillar}
          <span className="ml-2 font-normal">— {reasonText}</span>
        </summary>
        <div className="mt-3 space-y-4">
          {group.sections.map((section) =>
            section.locked ? (
              <LockedSection key={section.sectionId} section={section} />
            ) : (
              <SectionCard key={section.sectionId} section={section} />
            ),
          )}
        </div>
      </details>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <div className="flex items-baseline gap-2.5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
            {PILLAR_LABELS[pillar] ?? pillar}
          </h2>
          <span className="text-xs text-ink-muted">
            {passed} passed{warning > 0 ? ` · ${warning} warning${warning === 1 ? "" : "s"}` : ""}
            {failed > 0 ? ` · ${failed} failed` : ""}
          </span>
        </div>
        {aggregate !== null && (
          <span
            className="text-base font-bold tabular-nums"
            style={{ color: scoreColor(aggregate) }}
          >
            {aggregate}
          </span>
        )}
      </div>
      <div className="space-y-4">
        {group.sections.map((section) =>
          section.locked ? (
            <LockedSection key={section.sectionId} section={section} />
          ) : (
            <SectionCard key={section.sectionId} section={section} />
          ),
        )}
      </div>
    </div>
  );
}

function platformLabel(platform: string): string {
  const labels: Record<string, string> = {
    WORDPRESS: "WordPress",
    WOOCOMMERCE: "WooCommerce",
    WEBFLOW: "Webflow",
    WIX: "Wix",
    SQUARESPACE: "Squarespace",
    NEXTJS: "a Next.js site",
    HYDROGEN: "Shopify Hydrogen",
    SHOPIFY: "Shopify",
  };
  return labels[platform] ?? platform.toLowerCase();
}

/** Evidence payload shape written by services/reports/evidence.ts. */
type EvidencePayload = {
  items?: Array<{ label: string; value: string }>;
  samples?: string[];
  source?: string;
};

function CheckCard({ check }: { check: Extract<ProjectedCheck, { locked: false }> }) {
  const evidence = (check.evidence ?? null) as EvidencePayload | null;
  const hasEvidence = Boolean(evidence?.items?.length || evidence?.samples?.length);
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
            <LiveStateBadge fieldKey={check.fieldKey} frozenStatus={check.status} />
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

          {hasEvidence && evidence && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-medium text-ink-muted hover:text-ink">
                How do we know?
              </summary>
              <div className="mt-1.5 rounded-lg bg-slate-50 p-3">
                {evidence.items && evidence.items.length > 0 && (
                  <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                    {evidence.items.map((item) => (
                      <div key={item.label} className="flex items-baseline justify-between gap-3">
                        <dt className="text-xs text-ink-muted">{item.label}</dt>
                        <dd className="truncate text-xs font-medium text-ink" title={item.value}>
                          {item.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
                {evidence.samples && evidence.samples.length > 0 && (
                  <ul className="mt-2 space-y-0.5 border-t border-slate-200 pt-2">
                    {evidence.samples.map((sample, i) => (
                      <li key={`${sample}-${i}`} className="truncate font-mono text-[11px] text-ink-secondary" title={sample}>
                        {sample}
                      </li>
                    ))}
                  </ul>
                )}
                {evidence.source && (
                  <p className="mt-2 text-[11px] text-ink-muted">
                    Measured from <code className="rounded bg-white px-1">{evidence.source}</code>
                  </p>
                )}
              </div>
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
