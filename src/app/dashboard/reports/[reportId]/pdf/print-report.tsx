"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { scoreColor } from "@/components/report/score-ring";
import type { ProjectedReport, ProjectedCheck, ProjectedSection } from "@/services/reports/project-report";
import type { ScoreBasis } from "@/services/reports/evaluate-report";

/**
 * The printable document. Everything is expanded — no accordions, no
 * interactive chrome — because a PDF that hides half its content is not a
 * report. Screen-only controls carry `print:hidden`.
 */

const PILLAR_ORDER = [
  "FOUNDATIONS", "SPEED_VITALS", "ONPAGE_CONTENT", "AI_ANSWER_ENGINES",
  "TRUST_COMPLIANCE", "CONVERSION_UX",
];
const PILLAR_LABELS: Record<string, string> = {
  FOUNDATIONS: "Foundations", SPEED_VITALS: "Speed & Vitals",
  ONPAGE_CONTENT: "On-page Content", AI_ANSWER_ENGINES: "AI & Answer Engines",
  TRUST_COMPLIANCE: "Trust & Compliance", CONVERSION_UX: "Conversion & UX",
};
const STATUS_LABEL: Record<string, string> = {
  PASS: "Pass", FAIL: "Fail", WARNING: "Warning",
  NOT_APPLICABLE: "Not applicable", ERROR: "Not measured", INFO: "Info",
};

type EvidencePayload = {
  items?: Array<{ label: string; value: string }>;
  samples?: string[];
  source?: string;
};

export function PrintReport(props: {
  publicId: string;
  domain: string;
  url: string;
  overallScore: number | null;
  grade: string | null;
  status: string;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  criticalIssueCount: number;
  auditedAt: string;
  platform: string | null;
  themeName: string | null;
  appCount: number | null;
  scoreBasis: ScoreBasis | null;
  projected: ProjectedReport;
}) {
  const [ready, setReady] = useState(false);

  // Give fonts and layout a beat before opening the print dialog, so the
  // first paint the PDF captures is the finished one.
  useEffect(() => {
    setReady(true);
    const timer = setTimeout(() => window.print(), 700);
    return () => clearTimeout(timer);
  }, []);

  const sections = props.projected.sections.filter(
    (s): s is Extract<ProjectedSection, { locked: false }> => !s.locked,
  );
  const groups = PILLAR_ORDER.filter((p) => sections.some((s) => s.pillar === p)).map((p) => ({
    pillar: p,
    sections: sections.filter((s) => s.pillar === p),
  }));
  const ungrouped = sections.filter((s) => !s.pillar || !PILLAR_ORDER.includes(s.pillar));
  if (ungrouped.length) groups.push({ pillar: "OTHER", sections: ungrouped });

  const degraded = props.scoreBasis?.excludedSections.filter(
    (s) => s.reason !== "NOT_APPLICABLE_PLATFORM",
  );

  /* ---- action plan, same rules as the on-screen report ---- */
  const issues: Array<{ check: Extract<ProjectedCheck, { locked: false }>; section: string }> = [];
  for (const section of sections) {
    for (const check of section.checks) {
      if (check.locked) continue;
      if (check.status === "FAIL" || check.status === "WARNING") {
        issues.push({ check, section: section.name });
      }
    }
  }
  const plan = [
    ...issues.filter((i) => i.check.status === "FAIL" && i.check.severity === "CRITICAL"),
    ...issues.filter((i) => i.check.isQuickWin && !(i.check.status === "FAIL" && i.check.severity === "CRITICAL")),
    ...issues.filter((i) => i.check.severity === "HIGH" && i.check.status === "FAIL" && !i.check.isQuickWin),
  ].slice(0, 5);

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-ink print:max-w-none print:p-0">
      {/* Screen-only toolbar */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/dashboard/reports/${props.publicId}`}
          className="inline-flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to the report
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Printer className="h-4 w-4" aria-hidden />
          {ready ? "Print / Save as PDF" : "Preparing…"}
        </button>
      </div>

      {/* Cover */}
      <header className="border-b-2 border-slate-200 pb-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
              Store Audit Report
            </p>
            <h1 className="mt-1 text-3xl font-bold">{props.domain}</h1>
            <p className="mt-1 text-sm text-ink-secondary">{props.url}</p>
            <p className="mt-2 text-xs text-ink-muted">
              Audited{" "}
              {new Date(props.auditedAt).toLocaleDateString("en-US", {
                month: "long", day: "numeric", year: "numeric",
              })}
              {props.platform && props.platform !== "UNKNOWN" ? ` · ${props.platform}` : ""}
              {props.themeName ? ` · theme ${props.themeName}` : ""}
              {props.appCount !== null ? ` · ${props.appCount} app script hosts` : ""}
            </p>
          </div>
          <div className="text-right">
            <div
              className="text-5xl font-bold tabular-nums"
              style={{ color: scoreColor(props.overallScore) }}
            >
              {props.overallScore !== null ? Math.round(props.overallScore) : "—"}
            </div>
            {props.grade && <div className="text-sm font-medium text-ink-secondary">{props.grade}</div>}
          </div>
        </div>

        <div className="mt-4 flex gap-6 text-sm">
          <span><strong className="tabular-nums">{props.passedCount}</strong> passed</span>
          <span><strong className="tabular-nums">{props.warningCount}</strong> warnings</span>
          <span><strong className="tabular-nums">{props.failedCount}</strong> failed</span>
          <span><strong className="tabular-nums">{props.criticalIssueCount}</strong> critical</span>
        </div>
      </header>

      {degraded && degraded.length > 0 && (
        <p className="mt-4 rounded border border-warning-100 bg-warning-50 px-3 py-2 text-xs text-warning-700">
          This score excludes {degraded.map((s) => s.name).join(", ")} and is not directly
          comparable to audits that include {degraded.length === 1 ? "it" : "them"}.
        </p>
      )}

      {/* Action plan */}
      {plan.length > 0 && (
        <section className="mt-7 break-inside-avoid">
          <h2 className="text-base font-bold uppercase tracking-wide">Fix these first</h2>
          <ol className="mt-2 space-y-2">
            {plan.map((row, i) => (
              <li key={row.check.fieldId} className="flex gap-3 break-inside-avoid text-sm">
                <span className="font-bold text-ink-muted">{i + 1}.</span>
                <div>
                  <span className="font-semibold">{row.check.name}</span>
                  <span className="ml-2 text-xs text-ink-muted">
                    {row.section} · {row.check.severity.toLowerCase()}
                  </span>
                  {row.check.suggestion && (
                    <p className="mt-0.5 text-ink-secondary">{row.check.suggestion}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Detail */}
      {groups.map((group) => (
        <section key={group.pillar} className="mt-8">
          <h2 className="border-b border-slate-200 pb-1 text-base font-bold uppercase tracking-wide">
            {PILLAR_LABELS[group.pillar] ?? "Other"}
          </h2>

          {group.sections.map((section) => (
            <div key={section.sectionId} className="mt-4 break-inside-avoid-page">
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-bold">{section.name}</h3>
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{ color: scoreColor(section.score) }}
                >
                  {section.score !== null ? Math.round(section.score) : "—"}
                </span>
              </div>

              <table className="mt-1.5 w-full border-collapse text-xs">
                <tbody>
                  {section.checks.map((check) => {
                    if (check.locked) {
                      return (
                        <tr key={check.fieldId} className="border-t border-slate-100">
                          <td className="w-20 py-1.5 align-top text-ink-muted">Locked</td>
                          <td className="py-1.5 align-top text-ink-muted">{check.name}</td>
                        </tr>
                      );
                    }
                    const evidence = (check.evidence ?? null) as EvidencePayload | null;
                    return (
                      <tr key={check.fieldId} className="break-inside-avoid border-t border-slate-100">
                        <td
                          className="w-20 py-1.5 align-top font-semibold"
                          style={{
                            color:
                              check.status === "PASS" ? "#15803d"
                                : check.status === "FAIL" ? "#b91c1c"
                                  : check.status === "WARNING" ? "#b45309"
                                    : "#94a3b8",
                          }}
                        >
                          {STATUS_LABEL[check.status] ?? check.status}
                        </td>
                        <td className="py-1.5 align-top">
                          <div className="font-medium">
                            {check.name}
                            {check.category ? (
                              <span className="ml-1.5 text-[10px] uppercase tracking-wide text-ink-muted">
                                {check.category}
                              </span>
                            ) : null}
                          </div>
                          {check.message && <div className="text-ink-secondary">{check.message}</div>}
                          {check.suggestion && (check.status === "FAIL" || check.status === "WARNING") && (
                            <div className="mt-0.5">
                              <span className="font-semibold">Fix: </span>
                              <span className="text-ink-secondary">{check.suggestion}</span>
                            </div>
                          )}
                          {evidence?.items && evidence.items.length > 0 && (
                            <div className="mt-0.5 text-[10px] text-ink-muted">
                              {evidence.items.map((it) => `${it.label}: ${it.value}`).join(" · ")}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </section>
      ))}

      <footer className="mt-10 border-t border-slate-200 pt-3 text-[10px] text-ink-muted">
        Generated by AuditFlow on{" "}
        {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.
        Scores reflect the checks that could be measured at the time of the audit.
      </footer>
    </div>
  );
}
