import "server-only";
import type { AuditCriteria } from "@prisma/client";
import type { ExtractedData } from "@/services/inspection/types";
import type { PsiSnapshot } from "@/services/criteria/extract-value";
import { resolvePath } from "@/services/criteria/extract-value";

/**
 * Per-check evidence: the concrete thing that caused the verdict.
 *
 * This is the direct counter to the most common complaint about audit tools —
 * a flag you cannot verify is a flag you stop trusting. Every check should be
 * able to answer "how do you know?".
 *
 * Two layers:
 *  1. Hand-written cases for inspection types with genuinely interesting
 *     detail (which images lack alt text, which links are broken).
 *  2. A GENERIC layer for the path-based types (BOOLEAN_CHECK,
 *     NUMERIC_COMPARISON, STRING_COMPARISON, REGEX_EVALUATOR, RULES_EVALUATOR)
 *     that reports the path read, the value found, and the sibling values from
 *     the same data group so the number has context. Without this the entire
 *     Shopify library — 31 of 34 checks are path-based — shipped with no
 *     evidence at all.
 */

export type EvidenceItem = { label: string; value: string };
export type Evidence = {
  /** Human-readable rows rendered in the report. */
  items: EvidenceItem[];
  /** Optional longer lists (samples, outlines) rendered as bullets. */
  samples?: string[];
  /** What was inspected, for the "how do you know?" line. */
  source?: string;
};

const MAX_SAMPLES = 8;
const MAX_SIBLINGS = 6;

function fmt(value: unknown): string {
  if (value === null || value === undefined) return "not set";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "number") return String(Math.round(value * 100) / 100);
  if (Array.isArray(value)) return value.length === 0 ? "none" : value.slice(0, 5).map(String).join(", ");
  if (typeof value === "object") return "—";
  const s = String(value);
  return s.length > 120 ? `${s.slice(0, 120)}…` : s;
}

/** Turn `shopifyCdnCount` / `hasProductSchema` into "Shopify cdn count". */
function humanize(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[._]/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

/**
 * Value at `path`, plus the primitive siblings in its parent group — the
 * context that makes a bare number meaningful ("16 of 16 CDN images carry a
 * width parameter" rather than just "16").
 */
function pathEvidence(extracted: ExtractedData, path: string): Evidence | null {
  const value = resolvePath(extracted, path);
  if (value === undefined) return null;

  const items: EvidenceItem[] = [{ label: humanize(path.split(".").pop() ?? path), value: fmt(value) }];
  const samples: string[] = [];

  if (Array.isArray(value)) {
    for (const entry of value.slice(0, MAX_SAMPLES)) samples.push(String(entry));
  }

  const parentPath = path.split(".").slice(0, -1).join(".");
  const leaf = path.split(".").pop();
  if (parentPath) {
    const parent = resolvePath(extracted, parentPath);
    if (parent && typeof parent === "object" && !Array.isArray(parent)) {
      let added = 0;
      for (const [key, sibling] of Object.entries(parent as Record<string, unknown>)) {
        if (key === leaf || added >= MAX_SIBLINGS) continue;
        if (sibling === null || typeof sibling === "object") continue;
        items.push({ label: humanize(key), value: fmt(sibling) });
        added++;
      }
    }
  }

  return { items, samples: samples.length ? samples : undefined, source: path };
}

export function buildEvidence(
  criteria: Pick<AuditCriteria, "inspectionType" | "selector" | "attributeName" | "config">,
  extracted: ExtractedData,
  psi?: { mobile: PsiSnapshot | null; desktop: PsiSnapshot | null },
): Evidence | null {
  const config = (criteria.config ?? {}) as Record<string, unknown>;
  const configPath = typeof config.path === "string" ? config.path : null;

  switch (criteria.inspectionType) {
    case "IMAGE_ALT_TEXT":
      return {
        items: [
          { label: "Images missing alt text", value: fmt(extracted.images.missingAltCount) },
          { label: "Total images", value: fmt(extracted.images.count) },
          { label: "Decorative (empty alt)", value: fmt(extracted.images.emptyAltCount) },
        ],
        samples: extracted.images.issues.slice(0, MAX_SAMPLES).map((i) => i.src),
        source: "images",
      };

    case "BROKEN_LINKS":
      return {
        items: [
          { label: "Broken links found", value: fmt(extracted.brokenLinks.brokenCount) },
          { label: "Links checked", value: fmt(extracted.brokenLinks.checkedCount) },
        ],
        samples: extracted.brokenLinks.broken.map((b) => `${b.url} → ${b.status ?? "no response"}`),
        source: "brokenLinks",
      };

    case "HEADING_HIERARCHY":
      return {
        items: [
          { label: "H1", value: fmt(extracted.headings.h1Count) },
          { label: "H2", value: fmt(extracted.headings.h2Count) },
          { label: "H3", value: fmt(extracted.headings.h3Count) },
          { label: "Hierarchy valid", value: fmt(extracted.headings.hierarchyValid) },
        ],
        samples: extracted.headings.all.slice(0, 12).map((h) => `${h.tag.toUpperCase()}: ${h.text.slice(0, 70)}`),
        source: "headings",
      };

    case "META_TAG":
    case "TEXT_LENGTH":
      return {
        items: [
          { label: "Title", value: fmt(extracted.page.title) },
          { label: "Title length", value: `${extracted.page.titleLength} characters` },
          { label: "Meta description", value: fmt(extracted.page.metaDescription) },
          { label: "Description length", value: `${extracted.page.metaDescriptionLength} characters` },
        ],
        source: "page",
      };

    case "CANONICAL_TAG":
      return { items: [{ label: "Canonical URL", value: fmt(extracted.page.canonicalUrl) }], source: "page.canonicalUrl" };

    case "MOBILE_VIEWPORT":
      return { items: [{ label: "Viewport", value: fmt(extracted.page.viewport) }], source: "page.viewport" };

    case "SSL_CHECK":
    case "HTTP_STATUS":
    case "REDIRECT_CHECK":
      return {
        items: [
          { label: "HTTP status", value: fmt(extracted.network.httpStatus) },
          { label: "Served over HTTPS", value: fmt(extracted.network.usedHttps) },
          { label: "Redirects followed", value: fmt(extracted.network.redirectCount) },
          { label: "Final URL", value: fmt(extracted.network.finalUrl) },
        ],
        samples: extracted.network.redirectChain.slice(0, MAX_SAMPLES),
        source: "network",
      };

    case "RESPONSE_HEADER": {
      const header =
        (criteria.attributeName ?? (typeof config.header === "string" ? config.header : "")).toLowerCase();
      if (!header) return null;
      return {
        items: [
          { label: `Header: ${header}`, value: fmt(extracted.network.responseHeaders[header] ?? null) },
        ],
        source: `network.responseHeaders.${header}`,
      };
    }

    case "ROBOTS_TXT_CHECK":
      return {
        items: [
          { label: "robots.txt found", value: fmt(extracted.robots.exists) },
          { label: "References a sitemap", value: fmt(extracted.robots.referencesSitemap) },
          { label: "Disallows everything", value: fmt(extracted.robots.disallowsAll) },
        ],
        source: "robots",
      };

    case "SITEMAP_CHECK":
      return {
        items: [
          { label: "Sitemap found", value: fmt(extracted.sitemap.exists) },
          { label: "Sitemap URL", value: fmt(extracted.sitemap.url) },
          { label: "URLs listed", value: fmt(extracted.sitemap.urlCount) },
        ],
        samples: extracted.sitemap.childSitemaps?.slice(0, MAX_SAMPLES),
        source: "sitemap",
      };

    case "STRUCTURED_DATA":
    case "SCHEMA_TYPE":
      return {
        items: [
          { label: "JSON-LD blocks", value: fmt(extracted.structuredData.jsonLdBlocks) },
          { label: "Schema types found", value: fmt(extracted.structuredData.schemaTypes) },
        ],
        samples: extracted.structuredData.schemaTypes.slice(0, MAX_SAMPLES),
        source: "structuredData",
      };

    case "FORM_FIELD":
      return {
        items: [{ label: "Forms on the page", value: fmt(extracted.conversion.formCount) }],
        samples: extracted.conversion.forms
          .slice(0, 5)
          .map((f) => `${f.method.toUpperCase()} ${f.action ?? "(no action)"} — ${f.fieldCount} fields`),
        source: "conversion.forms",
      };

    case "CTA_CHECK":
      return {
        items: [
          { label: "Calls to action found", value: fmt(extracted.conversion.ctaCount) },
          { label: "Buttons", value: fmt(extracted.conversion.buttonCount) },
        ],
        samples: extracted.conversion.ctaExamples.slice(0, MAX_SAMPLES),
        source: "conversion",
      };

    case "PSI_METRIC":
    case "LIGHTHOUSE_SCORE": {
      const strategy = (typeof config.strategy === "string" ? config.strategy : "mobile").toLowerCase();
      const snapshot = strategy === "desktop" ? psi?.desktop : psi?.mobile;
      if (!snapshot) {
        return {
          items: [{ label: "PageSpeed data", value: "not available for this audit" }],
          source: `PageSpeed Insights (${strategy})`,
        };
      }
      return {
        items: [
          { label: "Performance", value: fmt(snapshot.performanceScore) },
          { label: "LCP", value: snapshot.lcpMs !== null ? `${Math.round(snapshot.lcpMs)} ms` : "not set" },
          { label: "CLS", value: fmt(snapshot.cls) },
          { label: "TBT", value: snapshot.tbtMs !== null ? `${Math.round(snapshot.tbtMs)} ms` : "not set" },
          { label: "Server response", value: snapshot.serverResponseMs !== null ? `${Math.round(snapshot.serverResponseMs)} ms` : "not set" },
        ],
        source: `PageSpeed Insights (${strategy})`,
      };
    }

    /* ---- path-based checks: the generic layer ---- */
    case "BOOLEAN_CHECK":
    case "NUMERIC_COMPARISON":
    case "STRING_COMPARISON":
    case "REGEX_EVALUATOR":
      return configPath ? pathEvidence(extracted, configPath) : null;

    case "RULES_EVALUATOR": {
      // Surface every path the rule reads, so a multi-value verdict is
      // explainable rather than a black box.
      const paths = new Set<string>();
      const walk = (node: unknown): void => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (node && typeof node === "object") {
          for (const [op, args] of Object.entries(node as Record<string, unknown>)) {
            if (op === "var" && typeof args === "string") paths.add(args);
            else walk(args);
          }
        }
      };
      walk(config.rules);
      if (paths.size === 0) return null;
      const items: EvidenceItem[] = [];
      for (const path of [...paths].slice(0, MAX_SIBLINGS + 2)) {
        const value = resolvePath(extracted, path);
        if (value === undefined) continue;
        items.push({ label: humanize(path.split(".").pop() ?? path), value: fmt(value) });
      }
      return items.length ? { items, source: [...paths].join(", ") } : null;
    }

    /* ---- selector-driven DOM checks ---- */
    case "ELEMENT_EXISTS":
    case "ELEMENT_NOT_EXISTS":
    case "ELEMENT_COUNT":
    case "ATTRIBUTE_EXISTS":
    case "ATTRIBUTE_EQUALS":
    case "ATTRIBUTE_CONTAINS":
    case "TEXT_EXISTS":
    case "TEXT_CONTAINS": {
      // The counted value is already shown as "Detected"; what the reader is
      // missing is WHAT WAS LOOKED FOR. Naming the selector is the whole
      // answer to "how do you know?" for a DOM check.
      if (!criteria.selector) return null;
      const items: EvidenceItem[] = [{ label: "Looked for", value: criteria.selector }];
      if (criteria.attributeName) {
        items.push({ label: "Attribute", value: criteria.attributeName });
      }
      return { items, source: "page HTML" };
    }

    default:
      return null;
  }
}
