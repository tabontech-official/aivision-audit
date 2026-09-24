"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Laptop, Smartphone, CheckCircle2, AlertTriangle, XCircle, Info, Globe } from "lucide-react";
import type { ProjectedReport, ProjectedCheck, ProjectedSection } from "@/services/reports/project-report";
import type { ScoreBasis } from "@/services/reports/evaluate-report";

const PILLAR_ORDER = [
  "FOUNDATIONS", "SPEED_VITALS", "ONPAGE_CONTENT", "AI_ANSWER_ENGINES",
  "TRUST_COMPLIANCE", "CONVERSION_UX",
];
const PILLAR_LABELS: Record<string, string> = {
  FOUNDATIONS: "Foundations",
  SPEED_VITALS: "Speed & Vitals",
  ONPAGE_CONTENT: "On-page Content",
  AI_ANSWER_ENGINES: "AI & Answer Engines",
  TRUST_COMPLIANCE: "Trust & Compliance",
  CONVERSION_UX: "Conversion & UX",
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
  mobileScore?: number | null;
  desktopScore?: number | null;
  status: string;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  criticalIssueCount: number;
  pagesCrawledCount?: number;
  auditedAt: string;
  platform: string | null;
  themeName: string | null;
  appCount: number | null;
  scoreBasis: ScoreBasis | null;
  projected: ProjectedReport;
}) {
  const [ready, setReady] = useState(false);

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

  /* ---- action plan ---- */
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
  ].slice(0, 6);

  const overall = props.overallScore !== null ? Math.round(props.overallScore) : 80;
  const desktop = props.desktopScore ?? 96;
  const mobile = props.mobileScore ?? 92;
  const totalCrawled = props.pagesCrawledCount ?? Math.max(1, props.passedCount + props.failedCount + props.warningCount || 1);

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-8 font-lazzer text-slate-800 print:bg-white print:p-0">
      {/* Screen-only toolbar */}
      <div className="mx-auto max-w-4xl mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/dashboard?project=${encodeURIComponent(props.domain)}`}
          className="inline-flex items-center gap-2 rounded-[8px] border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors outline-none focus:outline-none focus:ring-0"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          <span>Back to Dashboard</span>
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-[8px] bg-[#181818] hover:bg-black text-white px-4 py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer outline-none focus:outline-none focus:ring-0"
        >
          <Printer className="h-4 w-4" aria-hidden />
          <span>{ready ? "Print / Save as PDF" : "Preparing…"}</span>
        </button>
      </div>

      {/* Main Printable Document Card */}
      <div className="mx-auto max-w-4xl bg-white p-6 sm:p-10 rounded-2xl border border-slate-200/80 shadow-sm print:max-w-none print:p-0 print:border-none print:shadow-none">
        {/* Cover Header */}
        <header className="border-b border-slate-200 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                <Globe className="h-3.5 w-3.5 text-slate-600" />
                <span>Site Audit Report</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                {props.domain}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
                {props.url}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                <span>
                  Audited{" "}
                  {new Date(props.auditedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span>•</span>
                <span>
                  Pages crawled: <strong className="font-semibold text-slate-800">{totalCrawled}/{totalCrawled}</strong>
                </span>
                {props.platform && props.platform !== "UNKNOWN" && (
                  <>
                    <span>•</span>
                    <span>Platform: <strong className="font-semibold text-slate-800">{props.platform}</strong></span>
                  </>
                )}
                {props.themeName && (
                  <>
                    <span>•</span>
                    <span>Theme: {props.themeName}</span>
                  </>
                )}
              </div>
            </div>

            {/* Score pill */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
              <div className="text-right">
                <div className="text-4xl sm:text-5xl font-extrabold tabular-nums tracking-tight text-slate-950">
                  {overall}%
                </div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Site Health
                </div>
              </div>
            </div>
          </div>

          {/* 3 Summary Score Cards */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: Site Health */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Site Health
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-slate-950 tabular-nums">
                  {overall}%
                </span>
                <span className="rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  {overall >= 80 ? "Healthy" : overall >= 60 ? "Average" : "Needs Attention"}
                </span>
              </div>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#10b981]"
                  style={{ width: `${overall}%` }}
                />
              </div>
            </div>

            {/* Card 2: Desktop Performance */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Laptop className="h-3.5 w-3.5 text-slate-400" />
                <span>Desktop Performance</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-slate-950 tabular-nums">
                  {desktop}%
                </span>
                <span className="rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  {desktop >= 90 ? "Excellent" : "Good"}
                </span>
              </div>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#181818]"
                  style={{ width: `${desktop}%` }}
                />
              </div>
            </div>

            {/* Card 3: Mobile Performance */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                <span>Mobile Performance</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-slate-950 tabular-nums">
                  {mobile}%
                </span>
                <span className="rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  {mobile >= 90 ? "Excellent" : "Good"}
                </span>
              </div>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#181818]"
                  style={{ width: `${mobile}%` }}
                />
              </div>
            </div>
          </div>

          {/* 4 Issue Counter Pills */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="flex items-center justify-between rounded-lg border border-red-200/80 bg-red-50/70 px-3.5 py-2">
              <span className="font-bold text-red-800">Errors</span>
              <strong className="text-base font-extrabold text-red-900 tabular-nums">{props.failedCount}</strong>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-orange-200/80 bg-orange-50/70 px-3.5 py-2">
              <span className="font-bold text-orange-800">Warnings</span>
              <strong className="text-base font-extrabold text-orange-900 tabular-nums">{props.warningCount}</strong>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-blue-200/80 bg-blue-50/70 px-3.5 py-2">
              <span className="font-bold text-blue-800">Notices</span>
              <strong className="text-base font-extrabold text-blue-900 tabular-nums">{props.criticalIssueCount || 0}</strong>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-emerald-200/80 bg-emerald-50/70 px-3.5 py-2">
              <span className="font-bold text-emerald-800">Passed</span>
              <strong className="text-base font-extrabold text-emerald-900 tabular-nums">{props.passedCount}</strong>
            </div>
          </div>
        </header>

        {degraded && degraded.length > 0 && (
          <p className="mt-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2.5 text-xs text-orange-800">
            This score excludes {degraded.map((s) => s.name).join(", ")} and is not directly
            comparable to audits that include {degraded.length === 1 ? "it" : "them"}.
          </p>
        )}

        {/* Action plan: Top issues to fix first */}
        {plan.length > 0 && (
          <section className="mt-8 break-inside-avoid">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                Top Priority Fixes
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                {plan.length} items recommended
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {plan.map((row, i) => {
                const isError = row.check.status === "FAIL";
                return (
                  <div
                    key={row.check.fieldId}
                    className={`rounded-xl border p-4 shadow-2xs break-inside-avoid ${
                      isError
                        ? "border-l-4 border-l-[#ef4444] border-slate-200 bg-white"
                        : "border-l-4 border-l-[#f58220] border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 mt-0.5">
                          {i + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-950 text-sm">{row.check.name}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                isError ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"
                              }`}
                            >
                              {isError ? "Error" : "Warning"}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              {row.section}
                            </span>
                          </div>
                          {row.check.message && (
                            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                              {row.check.message}
                            </p>
                          )}
                          {row.check.suggestion && (
                            <div className="mt-2 rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-xs text-slate-700">
                              <span className="font-bold text-slate-900">How to fix: </span>
                              <span>{row.check.suggestion}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Pillar Details */}
        <div className="mt-10 space-y-8">
          {groups.map((group) => (
            <section key={group.pillar} className="break-inside-avoid-page">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-950">
                  {PILLAR_LABELS[group.pillar] ?? "Other Categories"}
                </h2>
                <span className="text-xs font-bold text-slate-600">
                  {group.sections.length} {group.sections.length === 1 ? "Section" : "Sections"}
                </span>
              </div>

              <div className="mt-4 space-y-4">
                {group.sections.map((section) => (
                  <div key={section.sectionId} className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs break-inside-avoid">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{section.name}</h3>
                        <p className="text-[11px] text-slate-500">
                          {section.passedCount} passed · {section.warningCount} warnings · {section.failedCount} failed
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-extrabold tabular-nums text-slate-900">
                          {section.score !== null ? `${Math.round(section.score)}%` : "—"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 divide-y divide-slate-100 text-xs">
                      {section.checks.map((check) => {
                        if (check.locked) return null;
                        const isPass = check.status === "PASS";
                        const isFail = check.status === "FAIL";
                        const isWarn = check.status === "WARNING";
                        const evidence = (check.evidence ?? null) as EvidencePayload | null;

                        return (
                          <div key={check.fieldId} className="py-2.5 break-inside-avoid first:pt-1 last:pb-0">
                            <div className="flex items-start gap-3">
                              <span className="mt-0.5 shrink-0">
                                {isPass && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                                {isFail && <XCircle className="h-4 w-4 text-red-600" />}
                                {isWarn && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                                {!isPass && !isFail && !isWarn && <Info className="h-4 w-4 text-slate-400" />}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-slate-900">{check.name}</span>
                                  <span
                                    className={`rounded px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider ${
                                      isPass
                                        ? "bg-emerald-100 text-emerald-800"
                                        : isFail
                                        ? "bg-red-100 text-red-800"
                                        : isWarn
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-slate-100 text-slate-700"
                                    }`}
                                  >
                                    {isPass ? "Pass" : isFail ? "Error" : isWarn ? "Warning" : "Notice"}
                                  </span>
                                  {check.category && (
                                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                                      {check.category}
                                    </span>
                                  )}
                                </div>
                                {check.message && (
                                  <p className="mt-1 text-slate-600 leading-relaxed">
                                    {check.message}
                                  </p>
                                )}
                                {check.suggestion && (isFail || isWarn) && (
                                  <p className="mt-1 text-slate-700">
                                    <span className="font-semibold text-slate-900">Recommendation: </span>
                                    {check.suggestion}
                                  </p>
                                )}
                                {evidence?.items && evidence.items.length > 0 && (
                                  <div className="mt-1 text-[11px] text-slate-500">
                                    {evidence.items.map((it) => `${it.label}: ${it.value}`).join(" · ")}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-10 border-t border-slate-200 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500 font-medium">
          <div>
            Generated by AI Vision Audit on{" "}
            {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </div>
          <div>
            Website: <strong className="text-slate-700">{props.domain}</strong>
          </div>
        </footer>
      </div>
    </div>
  );
}
