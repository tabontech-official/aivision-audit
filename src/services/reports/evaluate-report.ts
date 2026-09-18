import "server-only";
import { db } from "@/lib/db/client";
import { dbLong } from "@/lib/db/long-client";
import { runCheck } from "@/services/criteria/run-check";
import { logExecution } from "@/services/system-log/log";
import { findingIdentityHash } from "@/services/findings/reconcile";
import {
  evaluateRules,
  type ExtractionContext,
  type PsiSnapshot,
} from "@/services/criteria/extract-value";
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

/**
 * What fraction of the intended scoring model the overall score was actually
 * computed over. A section whose checks all came back NOT_APPLICABLE (no PSI
 * data) or ERROR silently drops out of both numerator and denominator — the
 * score is then computed on a smaller model and is NOT comparable to a full
 * run. This records that honestly instead of letting the number lie.
 */
export type ScoreBasis = {
  totalSectionWeight: number;
  includedSectionWeight: number;
  /** includedSectionWeight / totalSectionWeight, 1 when nothing dropped out. */
  coverage: number;
  excludedSections: Array<{
    slug: string;
    name: string;
    weight: number;
    reason: "NO_PSI_DATA" | "ALL_ERRORED" | "ALL_SUPPRESSED" | "NOT_APPLICABLE_PLATFORM";
  }>;
};

/**
 * `appliesWhen` gate evaluation. Absent/empty → applies. Falsy result → the
 * check(s) resolve NOT_APPLICABLE. Errors FAIL OPEN (the check runs) — a
 * misconfigured gate must not silently delete checks from the report.
 */
export function evaluateAppliesWhen(
  appliesWhen: string | null,
  extracted: ExtractedData,
): { applies: boolean; errored: boolean } {
  if (!appliesWhen || appliesWhen.trim().length === 0) {
    return { applies: true, errored: false };
  }
  try {
    const result = evaluateRules(JSON.parse(appliesWhen), extracted);
    return { applies: Boolean(result), errored: false };
  } catch {
    return { applies: true, errored: true };
  }
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
  scoreBasis: ScoreBasis;
};

export async function evaluateReport(reportId: string): Promise<EvaluationSummary> {
  const report = await db.report.findUnique({
    where: { id: reportId },
    include: {
      website: { select: { id: true, domain: true, url: true, userId: true } },
      rawData: true,
      pageSpeedResults: true,
    },
  });
  if (!report) throw new Error(`Report ${reportId} not found`);
  if (!report.rawData) throw new Error(`Report ${reportId} has no raw inspection data`);

  // Fix Loop suppression (§2.5): checks whose finding the user marked
  // WONT_FIX / FALSE_POSITIVE are excluded from BOTH sides of the score —
  // identical to NOT_APPLICABLE — while `AuditResult.status` still records
  // the TRUE verdict. Precedence: an appliesWhen-gated check is
  // NOT_APPLICABLE first; suppression only applies to checks that ran.
  // Anonymous websites have no findings, so the set is simply empty there.
  const suppressedHashes = new Set(
    (
      await db.finding.findMany({
        where: { websiteId: report.website.id, state: { in: ["WONT_FIX", "FALSE_POSITIVE"] } },
        select: { identityHash: true },
      })
    ).map((f) => f.identityHash),
  );

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
  const psi = {
    mobile: toPsiSnapshot(report.pageSpeedResults.find((p) => p.strategy === "MOBILE")),
    desktop: toPsiSnapshot(report.pageSpeedResults.find((p) => p.strategy === "DESKTOP")),
  };
  const ctx: ExtractionContext = {
    extracted,
    // Stored page HTML (rendered when the crawl used a browser) — lets
    // selector-based checks run on re-evaluation without re-crawling.
    html: report.rawData.html ?? "",
    psi,
  };

  /**
   * Multi-page sampling: each check declares the page type it inspects.
   * HOME is the audited URL and always exists; other types exist only when
   * discovery sampled them. A check whose page type is missing resolves
   * NOT_APPLICABLE — excluded from scoring, never a false failure.
   *
   * PSI measured the primary URL, so it is deliberately NOT copied onto
   * sampled-page contexts: a speed metric from the homepage must never be
   * presented as a product page's.
   */
  const sampledPages = await db.sampledPage.findMany({ where: { reportId } });
  const ctxByPageType = new Map<string, ExtractionContext>([["HOME", ctx]]);
  for (const sample of sampledPages) {
    ctxByPageType.set(sample.pageType, {
      extracted: sample.extracted as unknown as ExtractedData,
      html: sample.html ?? "",
      psi: { mobile: null, desktop: null },
    });
  }

  const meta = {
    domain: report.website.domain,
    pageTitle: extracted.page?.title ?? null,
  };

  /* ---- run all checks, grouped by section ---- */

  type CheckOutcome = {
    fieldId: string;
    sectionId: string;
    /** true when this check was skipped by an appliesWhen platform gate */
    platformGated: boolean;
    /** true when the user suppressed this check's finding (WONT_FIX/FALSE_POSITIVE) */
    suppressed: boolean;
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
    slug: string;
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
    const sectionGate = evaluateAppliesWhen(section.appliesWhen, extracted);
    if (sectionGate.errored) {
      await logExecution({
        level: "WARN",
        category: "CRITERIA_EVAL",
        message: `Section "${section.name}" has an invalid appliesWhen expression — failing open (section runs)`,
        reportId,
        meta: { sectionId: section.id, appliesWhen: section.appliesWhen },
      });
    }

    const outcome: SectionOutcome = {
      sectionId: section.id,
      name: section.name,
      slug: section.slug,
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

      // Page-type resolution first: a check inspecting a page type we could
      // not sample has nothing to read, and says so.
      const pageCtx = ctxByPageType.get(field.pageType);
      const pageMissing = pageCtx === undefined;
      const activeCtx = pageCtx ?? ctx;
      const activeExtracted = activeCtx.extracted;

      // Platform gate: section-level falsy gates every check; otherwise the
      // check's own gate decides. NOT_APPLICABLE is already excluded from
      // scoring on both sides, so this composes with the existing model.
      let platformGated = pageMissing;
      if (pageMissing) {
        // nothing more to evaluate — the gate below is skipped
      } else if (!sectionGate.applies) {
        platformGated = true;
      } else if (field.appliesWhen) {
        // Against the check's OWN page: a product gate must read the product
        // page's snapshot, not the homepage's. (Section gates stay on HOME —
        // `site.isShopify` and friends are site-level facts.)
        const fieldGate = evaluateAppliesWhen(field.appliesWhen, activeExtracted);
        if (fieldGate.errored) {
          await logExecution({
            level: "WARN",
            category: "CRITERIA_EVAL",
            message: `Check "${field.name}" has an invalid appliesWhen expression — failing open (check runs)`,
            reportId,
            meta: { fieldId: field.id, appliesWhen: field.appliesWhen },
          });
        }
        platformGated = !fieldGate.applies;
      }

      const result = platformGated
        ? {
            status: "NOT_APPLICABLE" as CheckStatus,
            actualValue: null,
            expectedSummary: pageMissing
              ? `No ${field.pageType.toLowerCase()} page was sampled for this audit`
              : "Not applicable to this platform",
            renderedMessage: null,
            renderedSuggestion: null,
          }
        : runCheck(field.criteria, field.suggestions, activeCtx, {
            ...meta,
            sectionName: section.name,
          });

      // Suppression: the observation stands (status is the true verdict);
      // only its effect on the score — and the issue counts — is removed.
      // Page-aware identity, matching reconcile.ts: a suppressed product-page
      // finding must not silence the same check on the homepage.
      const suppressed =
        !platformGated &&
        suppressedHashes.size > 0 &&
        suppressedHashes.has(
          findingIdentityHash(field.fieldKey, report.website.url, field.pageType),
        );

      const scorable = isScorable(result.status) && !suppressed;
      const maxScore = scorable ? field.score * field.weight : 0;
      const earned = scorable
        ? field.score * field.weight * (STATUS_FACTOR[result.status] ?? 0)
        : 0;

      if (scorable) {
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
      }

      /**
       * Quick win: an issue that is easy to fix relative to its impact —
       * a failed/warning check whose severity is LOW or MEDIUM (typically
       * one-line changes: meta tags, alt text, headers).
       */
      const isQuickWin =
        !suppressed &&
        (result.status === "FAIL" || result.status === "WARNING") &&
        (field.severity === "LOW" || field.severity === "MEDIUM");

      outcome.score += earned;
      outcome.maxScore += maxScore;

      outcome.checks.push({
        fieldId: field.id,
        sectionId: section.id,
        platformGated,
        suppressed,
        status: result.status,
        severity: field.severity,
        actualValue: result.actualValue,
        expectedSummary: result.expectedSummary,
        evidence: platformGated
          ? null
          : buildEvidence(field.criteria, activeExtracted, activeCtx.psi),
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

  /* ---- score basis: which sections actually entered the score ---- */

  const excludedSections: ScoreBasis["excludedSections"] = [];
  let totalSectionWeight = 0;
  for (const s of sectionOutcomes) {
    // The intended model: contributing sections that have at least one
    // configured check. A section with no checks was never part of the model.
    if (!s.contributesToScore || s.checks.length === 0) continue;
    totalSectionWeight += s.weight;
    if (s.maxScore > 0) continue;

    // Every check dropped out of scoring — say why. Platform gating first
    // (appliesWhen skipped every check), then missing PSI data, then
    // misconfiguration. ALL_SUPPRESSED is reserved for finding suppression
    // (Phase 2).
    const allPlatformGated = s.checks.length > 0 && s.checks.every((c) => c.platformGated);
    const allSuppressed =
      s.checks.length > 0 && s.checks.every((c) => c.platformGated || c.suppressed);
    const anyNotApplicable = s.checks.some((c) => c.status === "NOT_APPLICABLE" && !c.platformGated);
    excludedSections.push({
      slug: s.slug,
      name: s.name,
      weight: s.weight,
      reason: allPlatformGated
        ? "NOT_APPLICABLE_PLATFORM"
        : allSuppressed
          ? "ALL_SUPPRESSED"
          : anyNotApplicable
            ? "NO_PSI_DATA"
            : "ALL_ERRORED",
    });
  }

  const scoreBasis: ScoreBasis = {
    totalSectionWeight: Math.round(totalSectionWeight * 100) / 100,
    includedSectionWeight: Math.round(weightTotal * 100) / 100,
    coverage:
      totalSectionWeight > 0
        ? Math.round((weightTotal / totalSectionWeight) * 1000) / 1000
        : 1,
    excludedSections,
  };

  /* ---- persist (idempotent rewrite) ---- */

  // On the UNPOOLED client: this transaction can run for tens of seconds on a
  // large template, and Neon's pooled endpoint recycles connections underneath
  // interactive transactions ("Transaction not found" at 96%). A direct
  // connection owns its transaction for its whole lifetime.
  await dbLong.$transaction(
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
            suppressed: c.suppressed,
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
    scoreBasis,
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
