import { ExtractedSchemaItem, SchemaIssueItem, SchemaValidationResult } from "./types";
import { SCHEMA_DEFINITIONS, SchemaFieldRule } from "./rules";

export function validateExtractedSchemas(items: ExtractedSchemaItem[]): SchemaValidationResult {
  const allIssues: SchemaIssueItem[] = [];
  const detectedTypesSet = new Set<string>();

  for (const item of items) {
    // If already marked invalid from syntax error in extractor, collect issue and skip further checks
    if (!item.isValid && item.issues.length > 0) {
      allIssues.push(...item.issues);
      continue;
    }

    const itemIssues: SchemaIssueItem[] = [];
    const data = item.rawJson;
    const typeStr = item.schemaType;
    if (typeStr && typeStr !== "Unknown") {
      detectedTypesSet.add(typeStr);
    }

    // ---------------------------------------------------------
    // 1. General Schema.org Syntax Checks
    // ---------------------------------------------------------
    const contextVal = String(data["@context"] || "");
    if (!contextVal) {
      itemIssues.push({
        schemaType: typeStr,
        issueType: "MISSING_CONTEXT",
        severity: "Warning",
        message: 'Missing "@context" declaration in JSON-LD object.',
        recommendation: 'Add `"@context": "https://schema.org"` to the top level of your JSON-LD object.',
      });
    } else if (contextVal.startsWith("http://")) {
      itemIssues.push({
        schemaType: typeStr,
        issueType: "PROTOCOL_HTTP",
        severity: "Warning",
        message: 'Insecure "@context" protocol: uses "http://schema.org" instead of "https://".',
        recommendation: 'Update `"@context"` to `"https://schema.org"`.',
      });
    }

    if (!data["@type"] || data["@type"] === "Unknown") {
      itemIssues.push({
        schemaType: "Unknown",
        issueType: "MISSING_TYPE",
        severity: "Error",
        message: 'Missing or empty "@type" property in structured data.',
        recommendation: 'Specify a valid Schema.org type (e.g. `"@type": "Organization"` or `"@type": "Product"`).',
      });
    }

    // ---------------------------------------------------------
    // 2. Type-Specific Google Rich Results Rules
    // ---------------------------------------------------------
    const ruleDef = findRuleDefinition(typeStr);
    if (ruleDef) {
      // Check Required Fields
      for (const req of ruleDef.requiredFields) {
        const val = data[req.field];
        if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
          itemIssues.push({
            schemaType: typeStr,
            field: req.field,
            issueType: "MISSING_REQUIRED_FIELD",
            severity: "Error",
            message: `Missing required property "${req.field}" (${req.label}) for ${typeStr} schema.`,
            recommendation: `Add the "${req.field}" property: ${req.description}.`,
          });
        } else {
          // Validate format
          validateFieldFormat(typeStr, req, val, itemIssues);
        }
      }

      // Check Recommended Fields
      for (const rec of ruleDef.recommendedFields) {
        const val = data[rec.field];
        if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
          itemIssues.push({
            schemaType: typeStr,
            field: rec.field,
            issueType: "MISSING_RECOMMENDED_FIELD",
            severity: "Opportunity",
            message: `Missing recommended property "${rec.field}" (${rec.label}) for enhanced search appearance.`,
            recommendation: `Consider adding "${rec.field}": ${rec.description}.`,
          });
        } else {
          // Validate format
          validateFieldFormat(typeStr, rec, val, itemIssues);
        }
      }

      // Special nested structural validations
      validateSpecialStructures(typeStr, data, itemIssues);
    }

    // Update item status
    item.issues = itemIssues;
    item.hasErrors = itemIssues.some((i) => i.severity === "Error");
    item.hasWarnings = itemIssues.some((i) => i.severity === "Warning");
    item.isValid = !item.hasErrors;

    allIssues.push(...itemIssues);
  }

  // Deduplicate issues
  const uniqueIssues = deduplicateIssues(allIssues);

  // Calculate totals
  const totalSchemas = items.length;
  const validCount = items.filter((i) => i.isValid).length;
  const errorCount = uniqueIssues.filter((i) => i.severity === "Error").length;
  const warningCount = uniqueIssues.filter((i) => i.severity === "Warning").length;
  const opportunityCount = uniqueIssues.filter((i) => i.severity === "Opportunity").length;

  // Calculate overall score (0-100)
  const overallScore = computeOverallSchemaScore(totalSchemas, validCount, errorCount, warningCount);

  // Build summary signals
  const detectedTypes = Array.from(detectedTypesSet);
  const summary = {
    hasOrganization: detectedTypes.some((t) => t.includes("Organization") || t.includes("Corporation")),
    hasBreadcrumb: detectedTypes.some((t) => t.includes("Breadcrumb")),
    hasArticle: detectedTypes.some((t) => t.includes("Article") || t.includes("BlogPosting")),
    hasProduct: detectedTypes.some((t) => t.includes("Product")),
    hasFAQ: detectedTypes.some((t) => t.includes("FAQPage")),
    hasLocalBusiness: detectedTypes.some((t) => t.includes("LocalBusiness") || t.includes("Store")),
    hasWebsiteSearch: detectedTypes.some((t) => t.includes("WebSite")),
    hasReviewRating: detectedTypes.some((t) => t.includes("Rating") || t.includes("Review")),
    richResultsEligible: detectedTypes.filter((t) => {
      const def = findRuleDefinition(t);
      return def?.richResultEligible;
    }),
  };

  return {
    overallScore,
    totalSchemas,
    validCount,
    errorCount,
    warningCount,
    opportunityCount,
    detectedTypes,
    items,
    issues: uniqueIssues,
    summary,
  };
}

function findRuleDefinition(typeStr: string) {
  if (!typeStr) return null;
  if (SCHEMA_DEFINITIONS[typeStr]) return SCHEMA_DEFINITIONS[typeStr];

  // Match partial or composite types (e.g. "Restaurant" inherits LocalBusiness rules)
  const lower = typeStr.toLowerCase();
  if (lower.includes("article") || lower.includes("news")) return SCHEMA_DEFINITIONS.Article;
  if (lower.includes("product")) return SCHEMA_DEFINITIONS.Product;
  if (lower.includes("faq")) return SCHEMA_DEFINITIONS.FAQPage;
  if (lower.includes("breadcrumb")) return SCHEMA_DEFINITIONS.BreadcrumbList;
  if (lower.includes("business") || lower.includes("store") || lower.includes("restaurant")) return SCHEMA_DEFINITIONS.LocalBusiness;
  if (lower.includes("organization") || lower.includes("company")) return SCHEMA_DEFINITIONS.Organization;
  if (lower.includes("software") || lower.includes("application")) return SCHEMA_DEFINITIONS.SoftwareApplication;
  if (lower.includes("event")) return SCHEMA_DEFINITIONS.Event;
  if (lower.includes("howto") || lower.includes("how-to")) return SCHEMA_DEFINITIONS.HowTo;
  if (lower.includes("job")) return SCHEMA_DEFINITIONS.JobPosting;
  if (lower.includes("person")) return SCHEMA_DEFINITIONS.Person;
  if (lower.includes("website")) return SCHEMA_DEFINITIONS.WebSite;

  return null;
}

function validateFieldFormat(
  schemaType: string,
  rule: SchemaFieldRule,
  val: unknown,
  issues: SchemaIssueItem[]
) {
  if (rule.type === "url" && typeof val === "string") {
    if (!val.startsWith("http://") && !val.startsWith("https://") && !val.startsWith("/")) {
      issues.push({
        schemaType,
        field: rule.field,
        issueType: "INVALID_URL",
        severity: "Warning",
        message: `Property "${rule.field}" contains an invalid URL format ("${val.slice(0, 50)}").`,
        recommendation: "Provide a fully-qualified URL starting with https://",
      });
    }
  }

  if (rule.type === "date" && typeof val === "string") {
    const parsedDate = Date.parse(val);
    if (isNaN(parsedDate)) {
      issues.push({
        schemaType,
        field: rule.field,
        issueType: "INVALID_DATE",
        severity: "Error",
        message: `Property "${rule.field}" contains an invalid date format ("${val}").`,
        recommendation: "Use standard ISO 8601 date format (e.g. YYYY-MM-DD or YYYY-MM-DDTHH:mm:ssZ).",
      });
    }
  }
}

function validateSpecialStructures(
  schemaType: string,
  data: Record<string, unknown>,
  issues: SchemaIssueItem[]
) {
  // 1. FAQPage validation: check mainEntity has questions and acceptedAnswer
  if (schemaType === "FAQPage" && Array.isArray(data.mainEntity)) {
    let invalidQuestions = 0;
    data.mainEntity.forEach((q) => {
      if (!q || typeof q !== "object" || !q.name || !q.acceptedAnswer || !q.acceptedAnswer.text) {
        invalidQuestions++;
      }
    });
    if (invalidQuestions > 0) {
      issues.push({
        schemaType: "FAQPage",
        field: "mainEntity",
        issueType: "INVALID_FORMAT",
        severity: "Error",
        message: `${invalidQuestions} FAQ question(s) are missing question text or acceptedAnswer content.`,
        recommendation: "Ensure each FAQ item is a Question object containing name and acceptedAnswer.text.",
      });
    }
  }

  // 2. BreadcrumbList validation: check itemListElement structure
  if (schemaType === "BreadcrumbList" && Array.isArray(data.itemListElement)) {
    let invalidItems = 0;
    data.itemListElement.forEach((item, index) => {
      if (!item || typeof item !== "object" || (!item.name && !item.item?.name)) {
        invalidItems++;
      }
    });
    if (invalidItems > 0) {
      issues.push({
        schemaType: "BreadcrumbList",
        field: "itemListElement",
        issueType: "INVALID_FORMAT",
        severity: "Warning",
        message: "Breadcrumb list contains entries without defined names or item targets.",
        recommendation: "Each itemListElement item should have a position, name, and item URL.",
      });
    }
  }
}

function computeOverallSchemaScore(
  total: number,
  valid: number,
  errors: number,
  warnings: number
): number {
  if (total === 0) return 0;

  // Base score based on valid schemas ratio (max 70 pts)
  let score = Math.round((valid / total) * 70);

  // Bonus for having multiple rich schemas (up to +30 pts)
  if (total >= 1) score += 15;
  if (total >= 3) score += 15;

  // Deduct for errors and warnings
  score -= errors * 12;
  score -= warnings * 4;

  return Math.max(0, Math.min(100, score));
}

function deduplicateIssues(issues: SchemaIssueItem[]): SchemaIssueItem[] {
  const seen = new Set<string>();
  return issues.filter((i) => {
    const key = `${i.schemaType}:${i.field || ""}:${i.issueType}:${i.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
