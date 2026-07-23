import "server-only";
import { db } from "@/lib/db/client";
import { runCheck } from "@/services/criteria/run-check";
import type { ExtractionContext, PsiSnapshot } from "@/services/criteria/extract-value";
import type { ExtractedData } from "@/services/inspection/types";
import { buildEvidence } from "./evidence";
import { getSetting } from "@/services/settings/get";
import type { CheckStatus, PageSpeedResult, Prisma } from "@prisma/client";

/**
 * The report evaluation engine (Phase 6).
 *
 * Runs every enabled check of the report's PINNED template version against
 * the stored inspection snapshot, then computes weighted section scores, the
 * overall score, the configurable grade, quick wins, and an immutable
 * snapshot payload.
 *
 * Deterministic and idempotent: results are derived purely from stored data
 * (website_raw_data + page_speed_results) and the frozen template version, so
 * re-running produces identical output. Existing results are replaced.
 */

const STATUS_FACTOR: Partial<Record<CheckStatus, number>> = {
  PASS: 1,
  WARNING: 0.5,
  FAIL: 0,
};

/** Statuses that count toward the score denominator. */
function isScorable(status: CheckStatus): boolean {
  return status === "PASS" || status === "WARNING" || status === "FAIL";
}

function toPsiSnapshot(row: PageSpeedResult | undefined): PsiSnapshot | null {
  if (!row) return null;
  return {
    performanceScore: row.performanceScore,
    accessibilityScore: row.accessibilityScore,
    bestPracticesScore: row.bestPracticesScore,
    seoScore: row.seoScore,
    fcpMs: row.fcpMs,
    lcpMs: row.lcpMs,
    tbtMs: row.tbtMs,
    cls: row.cls,
    speedIndexMs: row.speedIndexMs,
    ttiMs: row.ttiMs,
    inpMs: row.inpMs,
    serverResponseMs: row.serverResponseMs,
  };
}

type ScoreRange = { min: number; max: number; grade: string; color: string };

async function gradeFor(score: number): Promise<string | null> {
  const ranges = (await getSetting("score_ranges")) as unknown as ScoreRange[];
  if (!Array.isArray(ranges)) return null;
  const rounded = Math.round(score);
  const hit = ranges.find((r) => rounded >= r.min && rounded <= r.max);
  return hit?.grade ?? null;
}

export type EvaluationSummary = {
  overallScore: number | null;
  grade: string | null;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  criticalIssueCount: number;
  sectionCount: number;
  checkCount: number;
};

export async function evaluateReport(reportId: string): Promise<EvaluationSummary> {
  const report = await db.report.findUnique({
    where: { id: reportId },
    include: {
      website: { select: { domain: true } },
      rawData: true,
      pageSpeedResults: true,
    },
  });
  if (!report) throw new Error(`Report ${reportId} not found`);
  if (!report.rawData) throw new Error(`Report ${reportId} has no raw inspection data`);

  // Template version pinned at intake — never the latest
  const version = await db.templateVersion.findUnique({
    where: { id: report.templateVersionId },
    include: {
      sections: {
        where: { deletedAt: null, isEnabled: true },
        orderBy: { displayOrder: "asc" },
        include: {
          fields: {
            where: { deletedAt: null, isEnabled: true },
            orderBy: { displayOrder: "asc" },
            include: { criteria: true, suggestions: true },
          },
        },
      },
    },
  });
  if (!version) throw new Error(`Template version ${report.templateVersionId} not found`);

  const extracted = report.rawData.extracted as unknown as ExtractedData;
  const ctx: ExtractionContext = {
    extracted,
    // Stored page HTML (rendered when the crawl used a browser) — lets
    // selector-based checks run on re-evaluation without re-crawling.
    html: report.rawData.html ?? "",
    psi: {
      mobile: toPsiSnapshot(report.pageSpeedResults.find((p) => p.strategy === "MOBILE")),
      desktop: toPsiSnapshot(report.pageSpeedResults.find((p) => p.strategy === "DESKTOP")),
    },
  };

  const meta = {
    domain: report.website.domain,
    pageTitle: extracted.page?.title ?? null,
  };

  /* ---- run all checks, grouped by section ---- */

  type CheckOutcome = {
    fieldId: string;
    sectionId: string;
    status: CheckStatus;
    severity: string;
    actualValue: string | null;
    expectedSummary: string;
    evidence: Record<string, unknown> | null;
    renderedMessage: string | null;
    renderedSuggestion: string | null;
    score: number;
    maxScore: number;
    isQuickWin: boolean;
  };

  type SectionOutcome = {
    sectionId: string;
    name: string;
    weight: number;
    contributesToScore: boolean;
    score: number;
    maxScore: number;
    status: CheckStatus;
    passed: number;
    failed: number;
    warning: number;
    checks: CheckOutcome[];
  };

  const sectionOutcomes: SectionOutcome[] = [];
  let passedCount = 0;
  let failedCount = 0;
  let warningCount = 0;
  let criticalIssueCount = 0;

  for (const section of version.sections) {
    const outcome: SectionOutcome = {
      sectionId: section.id,
      name: section.name,
      weight: section.weight,
      contributesToScore: section.contributesToScore,
      score: 0,
      maxScore: 0,
      status: "INFO",
      passed: 0,
      failed: 0,
      warning: 0,
      checks: [],
    };

    for (const field of section.fields) {
      if (!field.criteria) continue; // unconfigured check — skip silently

      const result = runCheck(field.criteria, field.suggestions, ctx, {
        ...meta,
        sectionName: section.name,
      });

      const scorable = isScorable(result.status);
      const maxScore = scorable ? field.score * field.weight : 0;
      const earned = scorable
        ? field.score * field.weight * (STATUS_FACTOR[result.status] ?? 0)
        : 0;

      if (result.status === "PASS") {
        passedCount++;
        outcome.passed++;
      } else if (result.status === "FAIL") {
        failedCount++;
        outcome.failed++;
        if (field.severity === "CRITICAL") criticalIssueCount++;
      } else if (result.status === "WARNING") {
        warningCount++;
        outcome.warning++;
      }

      /**
       * Quick win: an issue that is easy to fix relative to its impact —
       * a failed/warning check whose severity is LOW or MEDIUM (typically
       * one-line changes: meta tags, alt text, headers).
       */
      const isQuickWin =
        (result.status === "FAIL" || result.status === "WARNING") &&
        (field.severity === "LOW" || field.severity === "MEDIUM");

      outcome.score += earned;
      outcome.maxScore += maxScore;

      outcome.checks.push({
        fieldId: field.id,
        sectionId: section.id,
        status: result.status,
        severity: field.severity,
        actualValue: result.actualValue,
        expectedSummary: result.expectedSummary,
        evidence: buildEvidence(field.criteria, extracted),
        renderedMessage: result.renderedMessage,
        renderedSuggestion: result.renderedSuggestion,
        score: earned,
        maxScore,
        isQuickWin,
      });
    }

    // Section rollup status: worst outcome wins
    outcome.status =
      outcome.failed > 0 ? "FAIL" : outcome.warning > 0 ? "WARNING" : outcome.passed > 0 ? "PASS" : "INFO";

    sectionOutcomes.push(outcome);
  }

  /* ---- overall score: weighted average of section percentages ---- */

  let weightedSum = 0;
  let weightTotal = 0;
  for (const s of sectionOutcomes) {
    if (!s.contributesToScore || s.maxScore <= 0) continue;
    const pct = (s.score / s.maxScore) * 100;
    weightedSum += pct * s.weight;
    weightTotal += s.weight;
  }
  const overallScore = weightTotal > 0 ? Math.round((weightedSum / weightTotal) * 10) / 10 : null;
  const grade = overallScore !== null ? await gradeFor(overallScore) : null;

  /* ---- persist (idempotent rewrite) ---- */

  await db.$transaction(
    async (tx) => {
      await tx.auditResult.deleteMany({ where: { reportId } });
      await tx.reportSectionResult.deleteMany({ where: { reportId } });

      for (const s of sectionOutcomes) {
        const sectionPct = s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 1000) / 10 : null;
        const sectionRow = await tx.reportSectionResult.create({
          data: {
            reportId,
            sectionId: s.sectionId,
            score: sectionPct,
            maxScore: 100,
            status: s.status,
            summary: summarizeSection(s),
            passedCount: s.passed,
            failedCount: s.failed,
            warningCount: s.warning,
          },
        });

        // createMany for throughput; evidence serialized per row
        await tx.auditResult.createMany({
          data: s.checks.map((c) => ({
            reportId,
            sectionResultId: sectionRow.id,
            fieldId: c.fieldId,
            status: c.status,
            severity: c.severity as never,
            actualValue: c.actualValue,
            expectedSummary: c.expectedSummary,
            evidence: (c.evidence ?? undefined) as Prisma.InputJsonValue | undefined,
            renderedMessage: c.renderedMessage,
            renderedSuggestion: c.renderedSuggestion,
            score: c.score,
            maxScore: c.maxScore,
            isQuickWin: c.isQuickWin,
          })),
        });
      }
    },
    { timeout: 30_000 },
  );

  return {
    overallScore,
    grade,
    passedCount,
    failedCount,
    warningCount,
    criticalIssueCount,
    sectionCount: sectionOutcomes.length,
    checkCount: sectionOutcomes.reduce((n, s) => n + s.checks.length, 0),
  };
}

function summarizeSection(s: {
  name: string;
  passed: number;
  failed: number;
  warning: number;
}): string {
  const total = s.passed + s.failed + s.warning;
  if (total === 0) return "No applicable checks for this audit.";
  const parts: string[] = [];
  if (s.passed > 0) parts.push(`${s.passed} passed`);
  if (s.warning > 0) parts.push(`${s.warning} warning${s.warning > 1 ? "s" : ""}`);
  if (s.failed > 0) parts.push(`${s.failed} failed`);
  return parts.join(", ") + ".";
}
