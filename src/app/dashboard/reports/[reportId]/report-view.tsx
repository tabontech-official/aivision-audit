"use client";

import { createContext, useContext, useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RotateCw,
  Lock,
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
  targetSection?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { projected } = props;

  const hasTargetSection = Boolean(
    props.targetSection && projected.sections.some((s) => s.slug === props.targetSection)
  );

  const sectionsToRender = hasTargetSection
    ? projected.sections.filter((s) => s.slug === props.targetSection)
    : projected.sections;

  // Accurate section-level or total audit metrics calculation
  const activePassed = hasTargetSection
    ? sectionsToRender.reduce((acc, s) => (s.locked ? acc : acc + s.passedCount), 0)
    : projected.visiblePassed;
  const activeWarning = hasTargetSection
    ? sectionsToRender.reduce((acc, s) => (s.locked ? acc : acc + s.warningCount), 0)
    : projected.visibleWarning;
  const activeFailed = hasTargetSection
    ? sectionsToRender.reduce((acc, s) => (s.locked ? acc : acc + s.failedCount), 0)
    : projected.visibleFailed;
  const activeCritical = hasTargetSection
    ? sectionsToRender.reduce(
        (acc, s) =>
          s.locked
            ? acc
            : acc +
              s.checks.filter(
                (c) =>
                  !c.locked &&
                  c.status === "FAIL" &&
                  (c.severity === "CRITICAL" || c.severity === "HIGH")
              ).length,
        0
      )
    : props.criticalIssueCount;

  const firstSection = sectionsToRender[0];
  const activeOverallScore =
    hasTargetSection && firstSection && !firstSection.locked && firstSection.score !== null && firstSection.score !== undefined
      ? Math.round(firstSection.score)
      : props.overallScore;

  useEffect(() => {
    if (props.targetSection) {
      const targetId = `section-${props.targetSection}`;
      const element = document.getElementById(targetId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }
    }
  }, [props.targetSection]);

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
      <div className="space-y-6 font-lazzer text-slate-800">
        {/* Back link */}
        <Link
          href="/dashboard/reports"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          ← All reports
        </Link>

        {/* Non-Shopify: honest explanation */}
        {projected.site && !projected.site.isShopify && (
          <Alert variant="info">
            <strong className="font-semibold">This isn&apos;t a Shopify store</strong>
            {projected.site.platform !== "UNKNOWN"
              ? ` — it looks like ${platformLabel(projected.site.platform)}.`
              : "."}{" "}
            We&apos;ve run universal checks — SEO, speed, security, and AI readiness.
          </Alert>
        )}

        {(() => {
          const degraded = props.scoreBasis?.excludedSections.filter(
            (s) => s.reason !== "NOT_APPLICABLE_PLATFORM"
          );
          if (props.scoreBasis && degraded && degraded.length > 0) {
            return (
              <Alert variant="warning">
                {degraded.some((s) => s.reason === "NO_PSI_DATA")
                  ? "Speed data was unavailable for this audit. "
                  : ""}
                Your score excludes {degraded.map((s) => s.name).join(", ")}.
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
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs overflow-hidden">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {props.screenshotUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={props.screenshotUrl}
                alt={`Screenshot of ${props.domain}`}
                className="hidden h-24 w-40 shrink-0 rounded-xl border border-slate-200 object-cover object-top sm:block"
              />
            )}
            <div className="flex items-center gap-5">
              <ScoreRing score={activeOverallScore} size={100} label={props.grade ?? undefined} />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="truncate text-xl sm:text-2xl font-bold text-slate-900">{props.domain}</h1>
                  {hasTargetSection && sectionsToRender[0] && (
                    <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
                      {sectionsToRender[0].name}
                    </span>
                  )}
                  <a
                    href={props.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-slate-400 hover:text-slate-700 transition-colors"
                    aria-label="Open website"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden />
                  </a>
                </div>
                {props.grade && (
                  <div
                    className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold"
                    style={{
                      color: scoreColor(activeOverallScore),
                      backgroundColor: `${scoreColor(activeOverallScore)}1a`,
                    }}
                  >
                    {props.grade}
                  </div>
                )}
                <div className="mt-1 text-xs text-slate-500">
                  Audited{" "}
                  {new Date(props.auditedAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                {projected.site && projected.site.platform !== "UNKNOWN" && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200">
                      {platformLabel(projected.site.platform)}
                    </span>
                    {projected.site.themeName && (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200">
                        theme: {projected.site.themeName}
                        {projected.site.isOfficialTheme ? " (official)" : ""}
                      </span>
                    )}
                    {projected.site.isShopify && (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200">
                        {projected.site.appCount} app script host{projected.site.appCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-1 flex-wrap items-center justify-end gap-2.5">
              {props.viewerPlan === "PREMIUM" ? (
                <Link
                  href={`/dashboard/reports/${props.publicId}/pdf`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 shadow-2xs"
                >
                  <FileDown className="h-4 w-4" aria-hidden />
                  Download PDF
                </Link>
              ) : (
                <Link
                  href="/dashboard/billing"
                  title="PDF export is included with Premium"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-50 shadow-2xs"
                >
                  <Lock className="h-3.5 w-3.5" aria-hidden />
                  PDF export
                </Link>
              )}
              <button
                type="button"
                onClick={rerun}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={cn("h-4 w-4", pending && "animate-spin")} aria-hidden />
                <span>{pending ? "Re-auditing..." : "Re-audit"}</span>
              </button>
            </div>
          </div>

          {/* Mobile/desktop speed strip */}
          {(props.mobileScore !== null || props.desktopScore !== null) && (
            <div className="mt-5 grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 pt-3">
              <SpeedTile icon={Smartphone} label="Mobile" score={props.mobileScore} />
              <SpeedTile icon={Monitor} label="Desktop" score={props.desktopScore} />
            </div>
          )}
        </div>

        {/* 4 Summary cards - Fully reactive to target section */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="Passed" value={activePassed} tone="success" />
          <SummaryCard label="Warnings" value={activeWarning} tone="warning" />
          <SummaryCard label="Failed" value={activeFailed} tone="danger" />
          <SummaryCard label="Critical issues" value={activeCritical} tone="danger" />
        </div>

        {/* Prioritized action plan — top of the report, before the detail */}
        <ActionPlan rows={buildActionPlan(sectionsToRender)} />

        {/* Section Filter Indicator Banner */}
        {hasTargetSection && sectionsToRender.length === 1 && (
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-4 text-sm text-slate-800 shadow-xs">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-semibold text-slate-500">Showing Section:</span>
              <span className="font-bold text-slate-900">{sectionsToRender[0]?.name}</span>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200">
                {activePassed} passed · {activeWarning} warning{activeWarning === 1 ? "" : "s"} · {activeFailed} failed
              </span>
            </div>
            <Link
              href={`/dashboard/reports/${props.publicId}`}
              className="text-xs font-bold text-slate-900 hover:text-slate-700 underline"
            >
              Show all sections →
            </Link>
          </div>
        )}

        {/* Report sections detail */}
        <div className="space-y-4">
          {groupByPillar(sectionsToRender).map((group) =>
            group.pillar === null ? (
              group.sections.map((section) =>
                section.locked ? (
                  <LockedSection key={section.sectionId} section={section} />
                ) : (
                  <SectionCard key={section.sectionId} section={section} targetSection={props.targetSection} />
                )
              )
            ) : (
              <PillarGroup
                key={group.pillar}
                group={group}
                scoreBasis={props.scoreBasis}
                targetSection={props.targetSection}
              />
            )
          )}

          {props.viewerPlan === "FREE" && projected.hasLockedContent && (
            <UpgradeCta
              lockedSections={projected.lockedSectionCount}
              lockedChecks={projected.lockedCheckCount}
            />
          )}
        </div>
      </div>
    </FindingStatesContext.Provider>
  );
}

/* ---------------- live Fix Loop state (§2.14) ---------------- */

const FindingStatesContext = createContext<
  Record<string, { state: string; resolvedAt: string | null }>
>({});

function LiveStateBadge({ fieldKey, frozenStatus }: { fieldKey: string; frozenStatus: string }) {
  const states = useContext(FindingStatesContext);
  const live = states[fieldKey];
  if (!live) return null;

  const wasIssue = frozenStatus === "FAIL" || frozenStatus === "WARNING";
  if (wasIssue && live.state === "VERIFIED_FIXED") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
        ✓ verified fixed
      </span>
    );
  }
  if (wasIssue && live.state === "MARKED_FIXED") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
        marked fixed
      </span>
    );
  }
  if (wasIssue && (live.state === "WONT_FIX" || live.state === "FALSE_POSITIVE")) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
        {live.state === "WONT_FIX" ? "dismissed" : "false positive"}
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
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div>
        <div className="text-[11px] font-medium text-slate-500">{label} Performance</div>
        <div className="text-base font-bold tabular-nums" style={{ color: scoreColor(score) }}>
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
    success: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-rose-600",
  }[tone];
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-slate-300">
      <div className={cn("text-2xl sm:text-3xl font-black tabular-nums", toneCls)}>{value}</div>
      <div className="text-xs font-semibold text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function SectionCard({
  section,
  targetSection,
}: {
  section: Extract<ProjectedSection, { locked: false }>;
  targetSection?: string;
}) {
  const isMatch = Boolean(
    targetSection &&
      (section.slug === targetSection ||
        section.slug.includes(targetSection) ||
        targetSection.includes(section.slug))
  );

  const [open, setOpen] = useState(section.defaultExpanded || isMatch);

  useEffect(() => {
    if (isMatch) setOpen(true);
  }, [isMatch]);

  return (
    <section id={`section-${section.slug}`} className="rounded-2xl border border-slate-200/80 bg-white scroll-mt-6 overflow-hidden shadow-xs">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50/50 cursor-pointer"
      >
        <span
          className="h-8 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: section.accentColor ?? "#0f172a" }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-900 text-sm sm:text-base">{section.name}</h2>
            {section.lockedCheckCount > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                <Lock className="inline h-2.5 w-2.5 mr-1" aria-hidden />
                {section.lockedCheckCount} premium
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{section.summary}</div>
        </div>
        <span
          className="shrink-0 text-base font-black tabular-nums"
          style={{ color: scoreColor(section.score) }}
        >
          {section.score !== null ? Math.round(section.score) : "—"}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <>
          {groupChecksByCategory(
            section.checks.filter((c) => c.locked || c.status !== "NOT_APPLICABLE")
          ).map((group, gi) => (
            <div key={`${section.sectionId}-cat-${gi}`}>
              {group.label && (
                <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {group.label}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
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
                !c.locked && c.status === "NOT_APPLICABLE"
            )}
          />
        </>
      )}
    </section>
  );
}

function SkippedChecks({
  checks,
}: {
  checks: Array<Extract<ProjectedCheck, { locked: false }>>;
}) {
  if (checks.length === 0) return null;
  const platformGated = checks.filter(
    (c) => c.expectedSummary === "Not applicable to this platform"
  );
  const label =
    platformGated.length === checks.length
      ? `${checks.length} check${checks.length === 1 ? "" : "s"} skipped — not applicable to this platform`
      : `${checks.length} check${checks.length === 1 ? "" : "s"} skipped — not applicable to this audit`;
  return (
    <details className="border-t border-slate-100 bg-slate-50/40 px-5 py-3">
      <summary className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-800">
        {label}
      </summary>
      <ul className="mt-2 space-y-1">
        {checks.map((check) => (
          <li key={check.fieldId} className="text-xs text-slate-500">
            {check.name}
          </li>
        ))}
      </ul>
    </details>
  );
}

type PlanRow = {
  check: Extract<ProjectedCheck, { locked: false }>;
  sectionName: string;
  sectionSlug: string;
  reason: "critical" | "quick-win" | "high";
};

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
    <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3 bg-slate-50/60">
        <ListChecks className="h-4 w-4 text-slate-900" aria-hidden />
        <h2 className="text-xs sm:text-sm font-bold text-slate-900">Fix these first</h2>
        <span className="text-xs text-slate-500">
          — {rows.length} highest impact-to-effort {rows.length === 1 ? "item" : "items"}
        </span>
      </div>
      <ol className="divide-y divide-slate-100">
        {rows.map((row, i) => (
          <li key={row.check.fieldId} className="flex items-start gap-3 px-5 py-3.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <a
                href={`#section-${row.sectionSlug}`}
                className="flex flex-wrap items-center gap-2 hover:underline"
              >
                <span className="font-bold text-slate-900 text-xs sm:text-sm">{row.check.name}</span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                  {labels[row.reason]}
                </span>
                <span className="text-xs text-slate-400 font-medium">{row.sectionName}</span>
              </a>
              {row.check.suggestion && (
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">{row.check.suggestion}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

type CategoryGroup = {
  label: string | null;
  checks: ProjectedCheck[];
  passed: number;
  failed: number;
  warning: number;
};

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

const PILLAR_ORDER = [
  "FOUNDATIONS",
  "SPEED_VITALS",
  "ONPAGE_CONTENT",
  "AI_ANSWER_ENGINES",
  "TRUST_COMPLIANCE",
  "CONVERSION_UX",
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
  targetSection,
}: {
  group: PillarBucket;
  scoreBasis: ScoreBasis | null;
  targetSection?: string;
}) {
  const pillar = group.pillar!;
  const excludedSlugs = new Set(scoreBasis?.excludedSections.map((s) => s.slug) ?? []);

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

  const allExcluded =
    aggregate === null &&
    group.sections.every((s) => s.locked || s.score === null || excludedSlugs.has(s.slug));
  if (allExcluded) {
    const reasons = new Set(
      (scoreBasis?.excludedSections ?? [])
        .filter((e) => group.sections.some((s) => s.slug === e.slug))
        .map((e) => e.reason)
    );
    const reasonText = reasons.has("NOT_APPLICABLE_PLATFORM")
      ? "Not applicable to this platform"
      : reasons.has("NO_PSI_DATA")
      ? "Speed data was unavailable for this audit"
      : "No measurable checks in this audit";
    return (
      <details className="rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-xs">
        <summary className="cursor-pointer text-sm font-bold text-slate-600">
          {PILLAR_LABELS[pillar] ?? pillar}
          <span className="ml-2 font-normal text-slate-400">— {reasonText}</span>
        </summary>
        <div className="mt-3 space-y-4">
          {group.sections.map((section) =>
            section.locked ? (
              <LockedSection key={section.sectionId} section={section} />
            ) : (
              <SectionCard key={section.sectionId} section={section} targetSection={targetSection} />
            )
          )}
        </div>
      </details>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-baseline gap-2.5">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900">
            {PILLAR_LABELS[pillar] ?? pillar}
          </h2>
          <span className="text-xs text-slate-500 font-semibold">
            {passed} passed{warning > 0 ? ` · ${warning} warning${warning === 1 ? "" : "s"}` : ""}
            {failed > 0 ? ` · ${failed} failed` : ""}
          </span>
        </div>
        {aggregate !== null && (
          <span
            className="text-base font-black tabular-nums"
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
            <SectionCard key={section.sectionId} section={section} targetSection={targetSection} />
          )
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
    NEXTJS: "Next.js",
    HYDROGEN: "Shopify Hydrogen",
    SHOPIFY: "Shopify",
  };
  return labels[platform] ?? platform.toLowerCase();
}

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
            <span className="font-bold text-slate-900 text-xs sm:text-sm">{check.name}</span>
            <Badge variant={severityBadgeVariant(check.severity)}>
              {severityLabel(check.severity)}
            </Badge>
            {check.isQuickWin && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                <Zap className="h-3 w-3" aria-hidden />
                Quick win
              </span>
            )}
            <LiveStateBadge fieldKey={check.fieldKey} frozenStatus={check.status} />
          </div>

          {check.message && <p className="mt-1 text-xs sm:text-sm text-slate-600">{check.message}</p>}

          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            {check.actualValue !== null && (
              <span>
                Detected:{" "}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-800 text-[11px] font-mono">
                  {check.actualValue.length > 80
                    ? `${check.actualValue.slice(0, 80)}…`
                    : check.actualValue}
                </code>
              </span>
            )}
            {check.expectedSummary && <span>Expected: {check.expectedSummary}</span>}
          </div>

          {check.suggestion && (check.status === "FAIL" || check.status === "WARNING") && (
            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-700 leading-relaxed">
              <span className="font-bold text-slate-900">How to fix: </span>
              {check.suggestion}
            </div>
          )}

          {hasEvidence && evidence && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-semibold text-slate-500 hover:text-slate-800">
                How do we know?
              </summary>
              <div className="mt-1.5 rounded-xl bg-slate-50 p-3 border border-slate-100">
                {evidence.items && evidence.items.length > 0 && (
                  <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                    {evidence.items.map((item) => (
                      <div key={item.label} className="flex items-baseline justify-between gap-3">
                        <dt className="text-xs text-slate-500">{item.label}</dt>
                        <dd className="truncate text-xs font-semibold text-slate-800" title={item.value}>
                          {item.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
                {evidence.samples && evidence.samples.length > 0 && (
                  <ul className="mt-2 space-y-0.5 border-t border-slate-200 pt-2">
                    {evidence.samples.map((sample, i) => (
                      <li key={`${sample}-${i}`} className="truncate font-mono text-[11px] text-slate-600" title={sample}>
                        {sample}
                      </li>
                    ))}
                  </ul>
                )}
                {evidence.source && (
                  <p className="mt-2 text-[11px] text-slate-500">
                    Measured from <code className="rounded bg-white px-1 border border-slate-200">{evidence.source}</code>
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
              className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:underline"
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
    <div className="flex items-center gap-3 bg-slate-50/50 px-5 py-4">
      <Lock className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 text-xs sm:text-sm">{check.name}</span>
          <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-600">
            Premium
          </span>
        </div>
        {check.description && (
          <p className="mt-0.5 truncate text-xs text-slate-500">{check.description}</p>
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
      className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 shadow-xs"
    >
      <div className="flex items-center gap-3">
        <span
          className="h-8 w-1.5 shrink-0 rounded-full bg-slate-400"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-800 text-sm sm:text-base">{section.name}</h2>
            <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              Premium
            </span>
          </div>
          {section.shortDescription && (
            <p className="mt-0.5 text-xs text-slate-500">{section.shortDescription}</p>
          )}
        </div>
        <span className="shrink-0 text-xs text-slate-400 font-semibold">{section.checkCount} checks</span>
      </div>
      <div className="mt-3 space-y-1.5" aria-hidden>
        <div className="h-2.5 w-full rounded bg-slate-200 blur-[2px]" />
        <div className="h-2.5 w-4/5 rounded bg-slate-200 blur-[2px]" />
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
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 text-center shadow-xs font-lazzer">
      <Lock className="mx-auto h-6 w-6 text-slate-900" aria-hidden />
      <h3 className="mt-2 text-lg font-bold text-slate-900">Unlock your full report</h3>
      <p className="mx-auto mt-1 max-w-md text-xs sm:text-sm text-slate-500">
        {parts.join(" and ")} {parts.length ? "are" : "is"} locked. Upgrade to Premium for full
        evidence, detailed recommendations, and PDF exports.
      </p>
      <Link
        href="/dashboard/billing"
        className="mt-4 inline-block rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-colors"
      >
        Upgrade to Premium
      </Link>
    </div>
  );
}
