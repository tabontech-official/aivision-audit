import "server-only";
import { extractValue, type ExtractionContext } from "./extract-value";
import { evaluateCriteria } from "./evaluate";
import { interpolate } from "./interpolate";
import type { AuditCriteria, AuditSuggestion, CheckStatus } from "@prisma/client";

/**
 * Run one check: extract → evaluate → render messages.
 * Shared by the admin "Test against URL" feature and the Phase 6 report
 * evaluation engine.
 */

export type CheckRunResult = {
  status: CheckStatus;
  actualValue: string | null;
  expectedSummary: string;
  renderedMessage: string | null;
  renderedSuggestion: string | null;
};

export function runCheck(
  criteria: AuditCriteria,
  suggestions: Pick<AuditSuggestion, "forStatus" | "message" | "suggestion">[],
  ctx: ExtractionContext,
  meta: { domain: string; pageTitle: string | null; sectionName: string },
): CheckRunResult {
  const value = extractValue(criteria, ctx);
  const outcome = evaluateCriteria(criteria, value);

  const numeric =
    value.kind === "number" ? value.value : null;

  const interp = {
    domain: meta.domain,
    actualValue: outcome.actualValue,
    expectedValue: criteria.expectedValue,
    count: numeric,
    minimum: criteria.minValue,
    maximum: criteria.maxValue,
    pageTitle: meta.pageTitle,
    sectionName: meta.sectionName,
  };

  const template = suggestions.find((s) => s.forStatus === outcome.status);

  return {
    status: outcome.status,
    actualValue: outcome.actualValue,
    expectedSummary: outcome.expectedSummary,
    renderedMessage: template ? interpolate(template.message, interp) : null,
    renderedSuggestion: template?.suggestion
      ? interpolate(template.suggestion, interp)
      : null,
  };
}
