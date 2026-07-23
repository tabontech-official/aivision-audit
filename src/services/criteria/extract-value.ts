import "server-only";
import * as cheerio from "cheerio";
import type { ExtractedData } from "@/services/inspection/types";
import type { AuditCriteria } from "@prisma/client";
import type { PsiMetrics } from "@/services/pagespeed/client";

/**
 * Stage 1 of the criteria engine: turn a criterion's inspection config into
 * an "actual value" from the stored inspection snapshot.
 *
 * Inputs are the persisted artifacts (ExtractedData, raw HTML, PSI rows), so
 * criteria can be re-evaluated without re-crawling.
 */

export type PsiPair = { mobile: PsiMetrics | null; desktop: PsiMetrics | null };

export type ExtractionContext = {
  extracted: ExtractedData;
  /** raw (or rendered) HTML for selector-based inspections */
  html: string;
  psi: {
    mobile: PsiSnapshot | null;
    desktop: PsiSnapshot | null;
  };
};

/** The subset of PSI data the engine reads (matches page_speed_results row). */
export type PsiSnapshot = {
  performanceScore: number | null;
  accessibilityScore: number | null;
  bestPracticesScore: number | null;
  seoScore: number | null;
  fcpMs: number | null;
  lcpMs: number | null;
  tbtMs: number | null;
  cls: number | null;
  speedIndexMs: number | null;
  ttiMs: number | null;
  inpMs: number | null;
  serverResponseMs: number | null;
};

export type ExtractedValue =
  | { kind: "string"; value: string | null }
  | { kind: "number"; value: number | null }
  | { kind: "boolean"; value: boolean }
  | { kind: "unavailable"; reason: string };

type CriteriaConfig = Record<string, unknown>;

function cfgString(config: CriteriaConfig, key: string): string | null {
  const v = config[key];
  return typeof v === "string" && v.length > 0 ? v : null;
}

/** Resolve dotted paths ("contact.hasEmail") against ExtractedData. */
export function resolvePath(data: ExtractedData, path: string): unknown {
  const parts = path.split(".");
  let node: unknown = data;
  for (const part of parts) {
    if (node === null || node === undefined || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

/* ------------------------------------------------------------------ */
/* Sandboxed JsonLogic-style rules evaluator (RULES_EVALUATOR)         */
/* Whitelisted ops only; reads only from ExtractedData paths.          */
/* ------------------------------------------------------------------ */

type Rule = unknown;

export function evaluateRules(rule: Rule, data: ExtractedData, depth = 0): unknown {
  if (depth > 20) return null; // recursion guard
  if (rule === null || typeof rule !== "object") return rule;
  if (Array.isArray(rule)) return rule.map((r) => evaluateRules(r, data, depth + 1));

  const entries = Object.entries(rule as Record<string, unknown>);
  if (entries.length !== 1) return null;
  const [op, rawArgs] = entries[0]!;
  const args = Array.isArray(rawArgs) ? rawArgs : [rawArgs];
  const ev = (i: number): unknown => evaluateRules(args[i], data, depth + 1);
  const num = (v: unknown): number => (typeof v === "number" ? v : Number(v));

  switch (op) {
    case "var": {
      const path = typeof args[0] === "string" ? args[0] : "";
      const v = resolvePath(data, path);
      return v === undefined ? null : v;
    }
    case "==": return ev(0) == ev(1);  
    case "===": return ev(0) === ev(1);
    case "!=": return ev(0) != ev(1);  
    case ">": return num(ev(0)) > num(ev(1));
    case "<": return num(ev(0)) < num(ev(1));
    case ">=": return num(ev(0)) >= num(ev(1));
    case "<=": return num(ev(0)) <= num(ev(1));
    case "!": return !truthy(ev(0));
    case "and": return args.every((_, i) => truthy(ev(i)));
    case "or": return args.some((_, i) => truthy(ev(i)));
    case "in": {
      const needle = ev(0);
      const haystack = ev(1);
      if (typeof haystack === "string") return haystack.includes(String(needle));
      if (Array.isArray(haystack)) return haystack.includes(needle);
      return false;
    }
    case "length": {
      const v = ev(0);
      if (typeof v === "string" || Array.isArray(v)) return v.length;
      return 0;
    }
    case "cat": return args.map((_, i) => String(ev(i) ?? "")).join("");
    case "substr": {
      const s = String(ev(0) ?? "");
      return s.substring(num(ev(1)) || 0, args.length > 2 ? num(ev(2)) : undefined);
    }
    default:
      return null; // unknown op — refuse silently
  }
}

function truthy(v: unknown): boolean {
  if (Array.isArray(v)) return v.length > 0;
  return !!v;
}

/* ------------------------------------------------------------------ */
/* Main extraction dispatch                                            */
/* ------------------------------------------------------------------ */

function psiMetric(ctx: ExtractionContext, config: CriteriaConfig): ExtractedValue {
  const strategy = (cfgString(config, "strategy") ?? "mobile").toLowerCase();
  const snap = strategy === "desktop" ? ctx.psi.desktop : ctx.psi.mobile;
  if (!snap) return { kind: "unavailable", reason: "PageSpeed data unavailable" };
  const metric = cfgString(config, "metric") ?? "lcp_ms";
  const map: Record<string, number | null> = {
    fcp_ms: snap.fcpMs,
    lcp_ms: snap.lcpMs,
    tbt_ms: snap.tbtMs,
    cls: snap.cls,
    speed_index_ms: snap.speedIndexMs,
    tti_ms: snap.ttiMs,
    inp_ms: snap.inpMs,
    server_response_ms: snap.serverResponseMs,
  };
  if (!(metric in map)) return { kind: "unavailable", reason: `Unknown metric ${metric}` };
  return { kind: "number", value: map[metric] ?? null };
}

function lighthouseScore(ctx: ExtractionContext, config: CriteriaConfig): ExtractedValue {
  const strategy = (cfgString(config, "strategy") ?? "mobile").toLowerCase();
  const snap = strategy === "desktop" ? ctx.psi.desktop : ctx.psi.mobile;
  if (!snap) return { kind: "unavailable", reason: "PageSpeed data unavailable" };
  const category = cfgString(config, "category") ?? "performance";
  const map: Record<string, number | null> = {
    performance: snap.performanceScore,
    accessibility: snap.accessibilityScore,
    "best-practices": snap.bestPracticesScore,
    seo: snap.seoScore,
  };
  if (!(category in map)) return { kind: "unavailable", reason: `Unknown category ${category}` };
  return { kind: "number", value: map[category] ?? null };
}

export function extractValue(
  criteria: Pick<
    AuditCriteria,
    "inspectionType" | "selector" | "attributeName" | "config" | "regexPattern"
  >,
  ctx: ExtractionContext,
): ExtractedValue {
  const config = (criteria.config ?? {}) as CriteriaConfig;
  const ex = ctx.extracted;
  const selector = criteria.selector;

  const $ = () => cheerio.load(ctx.html);

  switch (criteria.inspectionType) {
    /* ---- element / attribute / text over the DOM ---- */
    case "ELEMENT_EXISTS":
    case "ELEMENT_NOT_EXISTS": {
      if (!selector) return { kind: "unavailable", reason: "No selector configured" };
      try {
        const count = $()(selector).length;
        const exists = count > 0;
        return {
          kind: "boolean",
          value: criteria.inspectionType === "ELEMENT_EXISTS" ? exists : !exists,
        };
      } catch {
        return { kind: "unavailable", reason: "Invalid selector" };
      }
    }
    case "ELEMENT_COUNT": {
      if (!selector) return { kind: "unavailable", reason: "No selector configured" };
      try {
        return { kind: "number", value: $()(selector).length };
      } catch {
        return { kind: "unavailable", reason: "Invalid selector" };
      }
    }
    case "ATTRIBUTE_EXISTS":
    case "ATTRIBUTE_EQUALS":
    case "ATTRIBUTE_CONTAINS": {
      if (!selector || !criteria.attributeName) {
        return { kind: "unavailable", reason: "Selector and attribute required" };
      }
      try {
        const attr = $()(selector).first().attr(criteria.attributeName);
        return { kind: "string", value: attr ?? null };
      } catch {
        return { kind: "unavailable", reason: "Invalid selector" };
      }
    }
    case "TEXT_EXISTS":
    case "TEXT_CONTAINS": {
      try {
        const text = selector
          ? $()(selector).first().text().trim()
          : $()("body").text().trim();
        return { kind: "string", value: text || null };
      } catch {
        return { kind: "unavailable", reason: "Invalid selector" };
      }
    }
    case "TEXT_LENGTH": {
      try {
        const text = selector
          ? $()(selector).first().text().trim()
          : (ex.page.title ?? "");
        return { kind: "number", value: text.length };
      } catch {
        return { kind: "unavailable", reason: "Invalid selector" };
      }
    }

    /* ---- well-known extracted fields ---- */
    case "META_TAG": {
      const tag = cfgString(config, "tag");
      const name = cfgString(config, "name");
      if (tag === "title") return { kind: "string", value: ex.page.title };
      if (name === "description") return { kind: "string", value: ex.page.metaDescription };
      if (name === "robots") return { kind: "string", value: ex.page.metaRobots };
      if (name === "viewport") return { kind: "string", value: ex.page.viewport };
      // Generic meta lookup by name
      if (name) {
        try {
          const content = $()(`head meta[name="${name.replace(/"/g, "")}" i]`)
            .first()
            .attr("content");
          return { kind: "string", value: content ?? null };
        } catch {
          return { kind: "unavailable", reason: "Meta lookup failed" };
        }
      }
      return { kind: "unavailable", reason: "Configure tag or name" };
    }
    case "CANONICAL_TAG": return { kind: "string", value: ex.page.canonicalUrl };
    case "ROBOTS_META": return { kind: "string", value: ex.page.metaRobots };
    case "MOBILE_VIEWPORT": return { kind: "string", value: ex.page.viewport };
    case "HEADING_HIERARCHY": return { kind: "boolean", value: ex.headings.hierarchyValid };
    case "IMAGE_ALT_TEXT": return { kind: "number", value: ex.images.missingAltCount };
    case "BROKEN_LINKS": return { kind: "number", value: ex.brokenLinks.brokenCount };
    case "FORM_FIELD": return { kind: "number", value: ex.conversion.formCount };
    case "CTA_CHECK": return { kind: "number", value: ex.conversion.ctaCount };
    case "STRUCTURED_DATA": return { kind: "boolean", value: ex.structuredData.hasStructuredData };
    case "SCHEMA_TYPE": {
      const wanted = cfgString(config, "schemaType");
      if (wanted) {
        return {
          kind: "boolean",
          value: ex.structuredData.schemaTypes.some(
            (t) => t.toLowerCase() === wanted.toLowerCase(),
          ),
        };
      }
      return { kind: "string", value: ex.structuredData.schemaTypes.join(", ") || null };
    }

    /* ---- network-level ---- */
    case "HTTP_STATUS": return { kind: "number", value: ex.network.httpStatus };
    case "REDIRECT_CHECK": return { kind: "number", value: ex.network.redirectCount };
    case "SSL_CHECK": return { kind: "boolean", value: ex.network.usedHttps };
    case "RESPONSE_HEADER": {
      const header = (criteria.attributeName ?? cfgString(config, "header") ?? "").toLowerCase();
      if (!header) return { kind: "unavailable", reason: "Configure the header name" };
      return { kind: "string", value: ex.network.responseHeaders[header] ?? null };
    }
    case "ROBOTS_TXT_CHECK": return { kind: "boolean", value: ex.robots.exists };
    case "SITEMAP_CHECK": return { kind: "boolean", value: ex.sitemap.exists };

    /* ---- generic evaluators ---- */
    case "RULES_EVALUATOR": {
      const rules = config.rules;
      if (rules === undefined) return { kind: "unavailable", reason: "No rules configured" };
      const result = evaluateRules(rules, ex);
      if (typeof result === "boolean") return { kind: "boolean", value: result };
      if (typeof result === "number") return { kind: "number", value: result };
      if (typeof result === "string") return { kind: "string", value: result };
      return { kind: "boolean", value: truthy(result) };
    }
    case "REGEX_EVALUATOR": {
      const source = cfgString(config, "path");
      const target = source
        ? String(resolvePath(ex, source) ?? "")
        : ctx.html.slice(0, 200_000);
      return { kind: "string", value: target || null };
    }
    case "BOOLEAN_CHECK": {
      const path = cfgString(config, "path");
      if (!path) return { kind: "unavailable", reason: "Configure a data path" };
      return { kind: "boolean", value: truthy(resolvePath(ex, path)) };
    }
    case "NUMERIC_COMPARISON": {
      const path = cfgString(config, "path");
      if (!path) return { kind: "unavailable", reason: "Configure a data path" };
      const v = resolvePath(ex, path);
      return { kind: "number", value: typeof v === "number" ? v : v == null ? null : Number(v) };
    }
    case "STRING_COMPARISON": {
      const path = cfgString(config, "path");
      if (!path) return { kind: "unavailable", reason: "Configure a data path" };
      const v = resolvePath(ex, path);
      return { kind: "string", value: v == null ? null : String(v) };
    }

    /* ---- PSI ---- */
    case "PSI_METRIC": return psiMetric(ctx, config);
    case "LIGHTHOUSE_SCORE": return lighthouseScore(ctx, config);

    /* ---- not yet implemented as live probes; evaluate from snapshot ---- */
    case "HTML_VALIDATION":
      return { kind: "unavailable", reason: "HTML validation is not enabled" };
    case "API_CHECK":
      return { kind: "unavailable", reason: "External API checks are not enabled" };

    default:
      return { kind: "unavailable", reason: `Unsupported inspection type` };
  }
}
