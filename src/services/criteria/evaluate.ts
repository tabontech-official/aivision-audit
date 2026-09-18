import "server-only";
import type { AuditCriteria, CheckStatus, CriteriaOperator } from "@prisma/client";
import type { ExtractedValue } from "./extract-value";

/**
 * Stage 2 of the criteria engine: apply the configured operator to the
 * extracted value and produce a check status.
 *
 * Decision flow:
 *   extraction unavailable        → ERROR (or NOT_APPLICABLE for PSI absence)
 *   pass condition matches        → PASS
 *   warn condition configured
 *     and matches                 → WARNING
 *   otherwise                     → FAIL
 *
 * Pure and deterministic — no I/O. Regex evaluation is guarded against
 * pathological patterns (length cap + timeout-free RE2-style rejection of
 * nested quantifiers).
 */

export type EvaluationOutcome = {
  status: CheckStatus;
  /** stringified actual value for display/evidence */
  actualValue: string | null;
  /** human-readable expected condition, e.g. "between 30 and 60" */
  expectedSummary: string;
};

const MAX_REGEX_LENGTH = 300;
/** Reject classic catastrophic-backtracking shapes: (a+)+, (a*)* etc. */
const DANGEROUS_REGEX = /(\([^)]*[+*][^)]*\)|\[[^\]]*\])[+*]\s*[+*]|\((?:[^()]*\|)+[^()]*\)[+*]\{/;

function safeRegexTest(pattern: string, value: string, caseSensitive: boolean): boolean | null {
  if (pattern.length > MAX_REGEX_LENGTH) return null;
  if (DANGEROUS_REGEX.test(pattern)) return null;
  try {
    const re = new RegExp(pattern, caseSensitive ? "" : "i");
    // Cap the subject to bound worst-case time
    return re.test(value.slice(0, 50_000));
  } catch {
    return null;
  }
}

type Band = {
  operator: CriteriaOperator;
  expectedValue: string | null;
  minValue: number | null;
  maxValue: number | null;
};

function toNumber(v: ExtractedValue): number | null {
  if (v.kind === "number") return v.value;
  if (v.kind === "string" && v.value !== null) {
    const n = Number(v.value);
    return Number.isFinite(n) ? n : null;
  }
  if (v.kind === "boolean") return v.value ? 1 : 0;
  return null;
}

function toStringValue(v: ExtractedValue): string | null {
  if (v.kind === "string") return v.value;
  if (v.kind === "number") return v.value === null ? null : String(v.value);
  if (v.kind === "boolean") return v.value ? "true" : "false";
  return null;
}

function existsValue(v: ExtractedValue): boolean {
  if (v.kind === "boolean") return v.value;
  if (v.kind === "string") return v.value !== null && v.value.trim() !== "";
  if (v.kind === "number") return v.value !== null;
  return false;
}

/** Apply one operator band to the value. Returns null when not decidable. */
function applyBand(
  band: Band,
  value: ExtractedValue,
  caseSensitive: boolean,
  regexPattern: string | null,
): boolean | null {
  const str = toStringValue(value);
  const num = toNumber(value);
  const expected = band.expectedValue;

  const cmpStr = (a: string, b: string): [string, string] =>
    caseSensitive ? [a, b] : [a.toLowerCase(), b.toLowerCase()];

  switch (band.operator) {
    case "EXISTS": return existsValue(value);
    case "NOT_EXISTS": return !existsValue(value);
    case "IS_TRUE": return value.kind === "boolean" ? value.value : existsValue(value);
    case "IS_FALSE": return value.kind === "boolean" ? !value.value : !existsValue(value);

    case "EQUALS": {
      if (expected === null) return null;
      // Numeric comparison when both sides are numeric
      const expNum = Number(expected);
      if (num !== null && Number.isFinite(expNum)) return num === expNum;
      if (str === null) return false;
      const [a, b] = cmpStr(str, expected);
      return a === b;
    }
    case "NOT_EQUALS": {
      const eq = applyBand({ ...band, operator: "EQUALS" }, value, caseSensitive, regexPattern);
      return eq === null ? null : !eq;
    }
    case "CONTAINS": {
      if (expected === null || str === null) return expected === null ? null : false;
      const [a, b] = cmpStr(str, expected);
      return a.includes(b);
    }
    case "NOT_CONTAINS": {
      const c = applyBand({ ...band, operator: "CONTAINS" }, value, caseSensitive, regexPattern);
      return c === null ? null : !c;
    }
    case "STARTS_WITH": {
      if (expected === null || str === null) return expected === null ? null : false;
      const [a, b] = cmpStr(str, expected);
      return a.startsWith(b);
    }
    case "ENDS_WITH": {
      if (expected === null || str === null) return expected === null ? null : false;
      const [a, b] = cmpStr(str, expected);
      return a.endsWith(b);
    }

    case "GREATER_THAN":
      return num === null ? false : num > (band.minValue ?? Number(expected));
    case "LESS_THAN":
      return num === null ? false : num < (band.maxValue ?? Number(expected));
    case "GREATER_THAN_OR_EQUAL":
      return num === null ? false : num >= (band.minValue ?? Number(expected));
    case "LESS_THAN_OR_EQUAL":
      return num === null ? false : num <= (band.maxValue ?? Number(expected));
    case "BETWEEN": {
      if (num === null) return false;
      const min = band.minValue ?? Number.NEGATIVE_INFINITY;
      const max = band.maxValue ?? Number.POSITIVE_INFINITY;
      return num >= min && num <= max;
    }

    case "MATCHES_REGEX": {
      const pattern = regexPattern ?? expected;
      if (!pattern || str === null) return pattern ? false : null;
      return safeRegexTest(pattern, str, caseSensitive);
    }

    default:
      return null;
  }
}

function describeBand(band: Band, regexPattern: string | null): string {
  const exp = band.expectedValue ?? "";
  switch (band.operator) {
    case "EXISTS": return "should be present";
    case "NOT_EXISTS": return "should not be present";
    case "IS_TRUE": return "should be true";
    case "IS_FALSE": return "should be false";
    case "EQUALS": return `should equal ${exp}`;
    case "NOT_EQUALS": return `should not equal ${exp}`;
    case "CONTAINS": return `should contain "${exp}"`;
    case "NOT_CONTAINS": return `should not contain "${exp}"`;
    case "STARTS_WITH": return `should start with "${exp}"`;
    case "ENDS_WITH": return `should end with "${exp}"`;
    case "GREATER_THAN": return `should be greater than ${band.minValue ?? exp}`;
    case "LESS_THAN": return `should be less than ${band.maxValue ?? exp}`;
    case "GREATER_THAN_OR_EQUAL": return `should be at least ${band.minValue ?? exp}`;
    case "LESS_THAN_OR_EQUAL": return `should be at most ${band.maxValue ?? exp}`;
    case "BETWEEN": return `should be between ${band.minValue ?? "…"} and ${band.maxValue ?? "…"}`;
    case "MATCHES_REGEX": return `should match pattern ${regexPattern ?? exp}`;
    default: return "condition";
  }
}

export function evaluateCriteria(
  criteria: Pick<
    AuditCriteria,
    | "operator"
    | "expectedValue"
    | "minValue"
    | "maxValue"
    | "regexPattern"
    | "caseSensitive"
    | "warnOperator"
    | "warnExpectedValue"
    | "warnMinValue"
    | "warnMaxValue"
  >,
  value: ExtractedValue,
): EvaluationOutcome {
  const passBand: Band = {
    operator: criteria.operator,
    expectedValue: criteria.expectedValue,
    minValue: criteria.minValue,
    maxValue: criteria.maxValue,
  };
  const expectedSummary = describeBand(passBand, criteria.regexPattern);

  if (value.kind === "unavailable") {
    // NOT_APPLICABLE (excluded from scoring, not a misconfiguration) when the
    // data genuinely wasn't there for this audit: PSI returned nothing, or the
    // snapshot path is absent — e.g. product-page signals on a homepage. An
    // absent path must never read as `false` and produce a false failure.
    const isDataGap =
      value.reason.includes("PageSpeed") || value.reason.includes("not present");
    return {
      status: isDataGap ? "NOT_APPLICABLE" : "ERROR",
      actualValue: null,
      expectedSummary,
    };
  }

  const actualValue = toStringValue(value);

  const passResult = applyBand(
    passBand,
    value,
    criteria.caseSensitive,
    criteria.regexPattern,
  );
  if (passResult === null) {
    return { status: "ERROR", actualValue, expectedSummary };
  }
  if (passResult) {
    return { status: "PASS", actualValue, expectedSummary };
  }

  if (criteria.warnOperator) {
    const warnBand: Band = {
      operator: criteria.warnOperator,
      expectedValue: criteria.warnExpectedValue,
      minValue: criteria.warnMinValue,
      maxValue: criteria.warnMaxValue,
    };
    const warnResult = applyBand(
      warnBand,
      value,
      criteria.caseSensitive,
      criteria.regexPattern,
    );
    if (warnResult === true) {
      return { status: "WARNING", actualValue, expectedSummary };
    }
  }

  return { status: "FAIL", actualValue, expectedSummary };
}
