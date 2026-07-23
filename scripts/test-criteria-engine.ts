/**
 * Verify the criteria engine end-to-end against a live fetch of example.com:
 * extraction, operators, warn bands, rules evaluator, interpolation.
 */
import "dotenv/config";
import { fetchPage } from "../src/services/inspection/fetcher";
import { extractFromHtml } from "../src/services/inspection/extract-html";
import { extractValue, type ExtractionContext } from "../src/services/criteria/extract-value";
import { evaluateCriteria } from "../src/services/criteria/evaluate";
import { interpolate } from "../src/services/criteria/interpolate";
import type { AuditCriteria } from "@prisma/client";

function makeCriteria(partial: Partial<AuditCriteria>): AuditCriteria {
  return {
    id: "t", fieldId: "t", inspectionType: "META_TAG", dataSource: "HTML",
    selector: null, attributeName: null, operator: "EXISTS",
    expectedValue: null, minValue: null, maxValue: null, regexPattern: null,
    caseSensitive: false, warnOperator: null, warnExpectedValue: null,
    warnMinValue: null, warnMaxValue: null, config: {},
    createdAt: new Date(), updatedAt: new Date(),
    ...partial,
  } as AuditCriteria;
}

async function main() {
  const fetched = await fetchPage("https://example.com/");
  if (!fetched.ok) throw new Error("fetch failed: " + fetched.error);
  const extracted = extractFromHtml(fetched.page);
  const ctx: ExtractionContext = {
    extracted,
    html: fetched.page.html,
    psi: { mobile: null, desktop: null },
  };

  const cases: Array<{ name: string; criteria: AuditCriteria; expect: string }> = [
    { name: "title exists", criteria: makeCriteria({ inspectionType: "META_TAG", operator: "EXISTS", config: { tag: "title" } }), expect: "PASS" },
    { name: "meta description missing", criteria: makeCriteria({ inspectionType: "META_TAG", operator: "EXISTS", config: { tag: "meta", name: "description" } }), expect: "FAIL" },
    { name: "title length 30-60 warn 10-70", criteria: makeCriteria({ inspectionType: "TEXT_LENGTH", selector: "title", operator: "BETWEEN", minValue: 30, maxValue: 60, warnOperator: "BETWEEN", warnMinValue: 10, warnMaxValue: 70 }), expect: "WARNING" }, // "Example Domain" = 14 chars
    { name: "exactly one h1", criteria: makeCriteria({ inspectionType: "ELEMENT_COUNT", selector: "h1", operator: "EQUALS", expectedValue: "1" }), expect: "PASS" },
    { name: "https on", criteria: makeCriteria({ inspectionType: "SSL_CHECK", operator: "IS_TRUE" }), expect: "PASS" },
    { name: "hsts header missing", criteria: makeCriteria({ inspectionType: "RESPONSE_HEADER", attributeName: "strict-transport-security", operator: "EXISTS" }), expect: "FAIL" },
    { name: "viewport present", criteria: makeCriteria({ inspectionType: "MOBILE_VIEWPORT", operator: "EXISTS" }), expect: "PASS" },
    { name: "PSI check w/o data -> N/A", criteria: makeCriteria({ inspectionType: "LIGHTHOUSE_SCORE", operator: "GREATER_THAN_OR_EQUAL", minValue: 90, config: { strategy: "mobile", category: "performance" } }), expect: "NOT_APPLICABLE" },
    { name: "rules: no email AND no phone", criteria: makeCriteria({ inspectionType: "RULES_EVALUATOR", operator: "IS_FALSE", config: { rules: { or: [{ var: "contact.hasEmail" }, { var: "contact.hasPhone" }] } } }), expect: "PASS" },
    { name: "regex on title", criteria: makeCriteria({ inspectionType: "STRING_COMPARISON", operator: "MATCHES_REGEX", regexPattern: "^Example", config: { path: "page.title" } }), expect: "PASS" },
    { name: "http status 200", criteria: makeCriteria({ inspectionType: "HTTP_STATUS", operator: "EQUALS", expectedValue: "200" }), expect: "PASS" },
    { name: "title contains 'domain' (case-insensitive)", criteria: makeCriteria({ inspectionType: "META_TAG", operator: "CONTAINS", expectedValue: "DOMAIN", config: { tag: "title" } }), expect: "PASS" },
  ];

  let failures = 0;
  for (const c of cases) {
    const value = extractValue(c.criteria, ctx);
    const outcome = evaluateCriteria(c.criteria, value);
    const pass = outcome.status === c.expect;
    if (!pass) failures++;
    console.log(`${pass ? "PASS" : "FAIL"}  ${c.name}: got ${outcome.status} (actual=${outcome.actualValue}) expected ${c.expect}`);
  }

  // Interpolation
  const msg = interpolate(
    "Your page {{pageTitle}} on {{domain}} has {{count}} items (max {{maximum}}). <b>{{actualValue}}</b>",
    { pageTitle: "Example <Domain>", domain: "example.com", count: 3, maximum: 5, actualValue: "x&y" },
  );
  const interpOk = msg.includes("Example &lt;Domain&gt;") && msg.includes("x&amp;y") && msg.includes("3") && msg.includes("5");
  if (!interpOk) failures++;
  console.log(`${interpOk ? "PASS" : "FAIL"}  interpolation escapes HTML: ${msg}`);

  // Unknown placeholder stays literal
  const unk = interpolate("Bad {{nope}} here", {});
  const unkOk = unk === "Bad {{nope}} here";
  if (!unkOk) failures++;
  console.log(`${unkOk ? "PASS" : "FAIL"}  unknown placeholder literal: ${unk}`);

  if (failures > 0) { console.error(`\n${failures} failed`); process.exit(1); }
  console.log("\nAll criteria engine cases passed.");
}
main();
