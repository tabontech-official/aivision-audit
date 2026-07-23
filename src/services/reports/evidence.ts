import "server-only";
import type { AuditCriteria } from "@prisma/client";
import type { ExtractedData } from "@/services/inspection/types";

/**
 * Build the per-check evidence payload: concrete supporting detail shown in
 * the report ("which images are missing alt text", "which links are broken").
 * Kept small — each list is already capped in the extractors.
 */
export function buildEvidence(
  criteria: Pick<AuditCriteria, "inspectionType" | "selector" | "attributeName">,
  extracted: ExtractedData,
): Record<string, unknown> | null {
  switch (criteria.inspectionType) {
    case "IMAGE_ALT_TEXT":
      return extracted.images.missingAltCount > 0
        ? {
            missingAltCount: extracted.images.missingAltCount,
            totalImages: extracted.images.count,
            samples: extracted.images.issues.slice(0, 8).map((i) => i.src),
          }
        : { totalImages: extracted.images.count };

    case "BROKEN_LINKS":
      return {
        checkedCount: extracted.brokenLinks.checkedCount,
        brokenCount: extracted.brokenLinks.brokenCount,
        broken: extracted.brokenLinks.broken,
      };

    case "HEADING_HIERARCHY":
      return {
        h1Count: extracted.headings.h1Count,
        h2Count: extracted.headings.h2Count,
        h3Count: extracted.headings.h3Count,
        outline: extracted.headings.all.slice(0, 15).map((h) => `${h.tag}: ${h.text.slice(0, 60)}`),
      };

    case "META_TAG":
    case "TEXT_LENGTH":
      return {
        title: extracted.page.title,
        titleLength: extracted.page.titleLength,
        metaDescription: extracted.page.metaDescription,
        metaDescriptionLength: extracted.page.metaDescriptionLength,
      };

    case "CANONICAL_TAG":
      return { canonicalUrl: extracted.page.canonicalUrl };

    case "MOBILE_VIEWPORT":
      return { viewport: extracted.page.viewport };

    case "SSL_CHECK":
    case "HTTP_STATUS":
    case "REDIRECT_CHECK":
      return {
        httpStatus: extracted.network.httpStatus,
        finalUrl: extracted.network.finalUrl,
        usedHttps: extracted.network.usedHttps,
        redirectChain: extracted.network.redirectChain,
      };

    case "RESPONSE_HEADER": {
      const header = (criteria.attributeName ?? "").toLowerCase();
      return header
        ? { header, value: extracted.network.responseHeaders[header] ?? null }
        : null;
    }

    case "ROBOTS_TXT_CHECK":
      return {
        exists: extracted.robots.exists,
        referencesSitemap: extracted.robots.referencesSitemap,
        disallowsAll: extracted.robots.disallowsAll,
      };

    case "SITEMAP_CHECK":
      return {
        exists: extracted.sitemap.exists,
        url: extracted.sitemap.url,
        urlCount: extracted.sitemap.urlCount,
      };

    case "STRUCTURED_DATA":
    case "SCHEMA_TYPE":
      return {
        jsonLdBlocks: extracted.structuredData.jsonLdBlocks,
        schemaTypes: extracted.structuredData.schemaTypes,
      };

    case "FORM_FIELD":
      return {
        formCount: extracted.conversion.formCount,
        forms: extracted.conversion.forms.slice(0, 5),
      };

    case "CTA_CHECK":
      return {
        ctaCount: extracted.conversion.ctaCount,
        examples: extracted.conversion.ctaExamples,
      };

    case "RULES_EVALUATOR":
      // Contact-style rules benefit from showing what was found
      return {
        hasEmail: extracted.contact.hasEmail,
        hasPhone: extracted.contact.hasPhone,
      };

    default:
      return null;
  }
}
