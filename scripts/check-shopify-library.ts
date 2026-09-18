/**
 * Offline guard for docs/shopify-check-library.json.
 *
 * This deliberately uses the production import parser so enum drift, invalid
 * JsonLogic, malformed configJson, and duplicate field keys fail before an
 * admin can paste the library into the builder.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseTemplatePayload } from "../src/services/builder/import-export";

const file = resolve(process.cwd(), "docs/shopify-check-library.json");
const parsed = parseTemplatePayload(readFileSync(file, "utf8"));

if (!parsed.ok) {
  console.error(`Shopify check library is invalid: ${parsed.error}`);
  process.exit(1);
}

const keys = new Set<string>();
let checkCount = 0;

const supportedPaths = new Set([
  "site.isShopify",
  "site.appCount",
  "site.blockingAppScripts",
  "resources.hasShopifyCdnHint",
  "images.count",
  "images.shopifyCdnCount",
  "images.withWidthParamCount",
  "images.withDimensionsCount",
  "images.avgSrcsetEntries",
  "images.eagerAboveFoldCount",
  "images.lazyLoadedCount",
  "shopify.policies.refund.exists",
  "shopify.policies.privacy.exists",
  "shopify.policies.terms.exists",
  "shopify.policies.shipping.exists",
  "shopify.policies.presentCount",
  "shopify.policies.thinCount",
  "shopify.policies.duplicateTitleH1Count",
  "shopify.product.isProductPage",
  "shopify.product.hasProductSchema",
  "shopify.product.schemaHasOffers",
  "shopify.product.schemaHasPrice",
  "shopify.product.schemaHasAvailability",
  "shopify.product.schemaHasCurrency",
  "shopify.product.hasAggregateRating",
  "shopify.product.imageCount",
  "shopify.product.hasSizeGuide",
  "shopify.product.hasShippingInfo",
  "shopify.product.hasReturnsInfo",
  "shopify.urls.hasCollectionScopedProductLinks",
  "shopify.urls.variantParamLinkCount",
  "shopify.urls.filterParamLinkCount",
  "shopify.urls.paginationLinkCount",
  "shopify.sitemapChildren",
  "llms.exists",
  "llms.sizeBytes",
  "llms.content",
]);

function collectPaths(value: unknown, paths: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) collectPaths(item, paths);
    return;
  }
  if (!value || typeof value !== "object") return;

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if ((key === "path" || key === "var") && typeof child === "string") paths.add(child);
    collectPaths(child, paths);
  }
}

for (const { section, fields } of parsed.sections) {
  if (section.slug.startsWith("shopify-") && !section.appliesWhen?.includes("site.isShopify")) {
    console.error(`Shopify section "${section.slug}" is missing its site.isShopify gate.`);
    process.exit(1);
  }

  if (section.appliesWhen) {
    const sectionPaths = new Set<string>();
    collectPaths(JSON.parse(section.appliesWhen), sectionPaths);
    for (const path of sectionPaths) {
      if (!supportedPaths.has(path)) {
        console.error(`Section "${section.slug}" references unsupported snapshot path "${path}".`);
        process.exit(1);
      }
    }
  }

  for (const field of fields) {
    checkCount++;
    if (keys.has(field.fieldKey)) {
      console.error(`Field key "${field.fieldKey}" is duplicated across the library.`);
      process.exit(1);
    }
    keys.add(field.fieldKey);

    const referencedPaths = new Set<string>();
    collectPaths(field.criteria.config, referencedPaths);
    if (field.appliesWhen) collectPaths(JSON.parse(field.appliesWhen), referencedPaths);
    for (const path of referencedPaths) {
      if (!supportedPaths.has(path)) {
        console.error(`Check "${field.fieldKey}" references unsupported snapshot path "${path}".`);
        process.exit(1);
      }
    }

    /**
     * Product checks must carry a product gate so they can never fire on a
     * homepage. TWO gates are legitimate, and the distinction matters:
     *
     *   shopify.product.isProductPage    — the page IS a product page. Use for
     *                                      checks that are answerable without
     *                                      schema (image count, shipping copy)
     *                                      AND for "does this page have schema
     *                                      at all", which must be able to FAIL.
     *   shopify.product.hasProductSchema — the schema exists. Use only for
     *                                      checks that inspect INSIDE it.
     *
     * Requiring hasProductSchema everywhere (the original rule) made the most
     * valuable finding — a product page with no schema — unreportable: every
     * check silently resolved NOT_APPLICABLE.
     */
    if (
      section.slug === "shopify-product-readiness" &&
      !field.appliesWhen?.includes("shopify.product.hasProductSchema") &&
      !field.appliesWhen?.includes("shopify.product.isProductPage")
    ) {
      console.error(`Product check "${field.fieldKey}" is missing its product-page gate.`);
      process.exit(1);
    }
  }
}

console.log(
  `Shopify check library valid: ${parsed.sections.length} sections, ${checkCount} checks, ${keys.size} unique field keys.`,
);
