import { z } from "zod";

/**
 * Zod schemas for the admin report builder.
 * These are the single source of truth for what an admin may configure —
 * including the RULES_EVALUATOR whitelist (no arbitrary code, ever).
 */

export const planAccessSchema = z.enum(["FREE", "PREMIUM", "HIDDEN", "BOTH"]);
export const severitySchema = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"]);

export const inspectionTypeSchema = z.enum([
  "ELEMENT_EXISTS", "ELEMENT_NOT_EXISTS", "ATTRIBUTE_EXISTS", "ATTRIBUTE_EQUALS",
  "ATTRIBUTE_CONTAINS", "TEXT_EXISTS", "TEXT_CONTAINS", "ELEMENT_COUNT", "TEXT_LENGTH",
  "HTTP_STATUS", "REDIRECT_CHECK", "SSL_CHECK", "RESPONSE_HEADER", "BROKEN_LINKS",
  "IMAGE_ALT_TEXT", "HTML_VALIDATION", "META_TAG", "HEADING_HIERARCHY", "CANONICAL_TAG",
  "ROBOTS_META", "SITEMAP_CHECK", "ROBOTS_TXT_CHECK", "STRUCTURED_DATA", "SCHEMA_TYPE",
  "MOBILE_VIEWPORT", "FORM_FIELD", "CTA_CHECK", "PSI_METRIC", "LIGHTHOUSE_SCORE",
  "API_CHECK", "RULES_EVALUATOR", "REGEX_EVALUATOR", "BOOLEAN_CHECK",
  "NUMERIC_COMPARISON", "STRING_COMPARISON",
]);

export const operatorSchema = z.enum([
  "EXISTS", "NOT_EXISTS", "EQUALS", "NOT_EQUALS", "CONTAINS", "NOT_CONTAINS",
  "STARTS_WITH", "ENDS_WITH", "GREATER_THAN", "LESS_THAN", "GREATER_THAN_OR_EQUAL",
  "LESS_THAN_OR_EQUAL", "BETWEEN", "MATCHES_REGEX", "IS_TRUE", "IS_FALSE",
]);

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #4F46E5")
  .optional()
  .or(z.literal("").transform(() => undefined));

const slug = z
  .string()
  .trim()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only");

/** Lucide icon names we whitelist for sections (rendered dynamically). */
export const SECTION_ICONS = [
  "gauge", "search", "settings-2", "accessibility", "smartphone", "shield",
  "trending-up", "layout", "file-text", "share-2", "code-2", "image",
  "link", "form-input", "badge-check", "shopping-cart", "sparkles", "map-pin",
  "zap", "globe",
] as const;

export const sectionInputSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  slug,
  shortDescription: z.string().trim().max(200).optional().or(z.literal("").transform(() => undefined)),
  detailedDescription: z.string().trim().max(2000).optional().or(z.literal("").transform(() => undefined)),
  icon: z.enum(SECTION_ICONS).optional(),
  weight: z.coerce.number().min(0).max(10).default(1),
  contributesToScore: z.coerce.boolean().default(true),
  planAccess: planAccessSchema.default("BOTH"),
  isEnabled: z.coerce.boolean().default(true),
  defaultExpanded: z.coerce.boolean().default(true),
  visibleInReport: z.coerce.boolean().default(true),
  accentColor: hexColor,
  adminNotes: z.string().trim().max(1000).optional().or(z.literal("").transform(() => undefined)),
});

/**
 * RULES_EVALUATOR rule validation: recursively verify only whitelisted ops
 * appear. Rejects anything else before it reaches the database.
 */
const ALLOWED_RULE_OPS = new Set([
  "var", "==", "===", "!=", ">", "<", ">=", "<=", "!", "and", "or", "in",
  "length", "cat", "substr",
]);

function validateRuleNode(node: unknown, depth: number): boolean {
  if (depth > 15) return false;
  if (node === null) return true;
  if (["string", "number", "boolean"].includes(typeof node)) return true;
  if (Array.isArray(node)) return node.every((n) => validateRuleNode(n, depth + 1));
  if (typeof node === "object") {
    const entries = Object.entries(node as Record<string, unknown>);
    if (entries.length !== 1) return false;
    const [op, args] = entries[0]!;
    if (!ALLOWED_RULE_OPS.has(op)) return false;
    const argList = Array.isArray(args) ? args : [args];
    return argList.every((a) => validateRuleNode(a, depth + 1));
  }
  return false;
}

export const rulesSchema = z
  .unknown()
  .refine((v) => validateRuleNode(v, 0), {
    message: "Rules contain an unsupported operation",
  });

export const criteriaInputSchema = z
  .object({
    inspectionType: inspectionTypeSchema,
    dataSource: z.enum(["HTML", "RENDERED_DOM", "HEADERS", "PSI", "ROBOTS", "SITEMAP", "NETWORK"]).default("HTML"),
    selector: z.string().trim().max(300).optional().or(z.literal("").transform(() => undefined)),
    attributeName: z.string().trim().max(100).optional().or(z.literal("").transform(() => undefined)),
    operator: operatorSchema,
    expectedValue: z.string().trim().max(500).optional().or(z.literal("").transform(() => undefined)),
    minValue: z.coerce.number().optional().or(z.literal("").transform(() => undefined)),
    maxValue: z.coerce.number().optional().or(z.literal("").transform(() => undefined)),
    regexPattern: z.string().trim().max(300).optional().or(z.literal("").transform(() => undefined)),
    caseSensitive: z.coerce.boolean().default(false),
    warnOperator: operatorSchema.optional().or(z.literal("").transform(() => undefined)),
    warnExpectedValue: z.string().trim().max(500).optional().or(z.literal("").transform(() => undefined)),
    warnMinValue: z.coerce.number().optional().or(z.literal("").transform(() => undefined)),
    warnMaxValue: z.coerce.number().optional().or(z.literal("").transform(() => undefined)),
    /** JSON string from the form; parsed + whitelisted */
    configJson: z.string().trim().max(5000).optional().or(z.literal("").transform(() => undefined)),
  })
  .transform((data, ctx) => {
    let config: Record<string, unknown> = {};
    if (data.configJson) {
      try {
        const parsed: unknown = JSON.parse(data.configJson);
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
          ctx.addIssue({ code: "custom", message: "Config must be a JSON object", path: ["configJson"] });
          return z.NEVER;
        }
        config = parsed as Record<string, unknown>;
      } catch {
        ctx.addIssue({ code: "custom", message: "Config is not valid JSON", path: ["configJson"] });
        return z.NEVER;
      }
    }
    if (data.inspectionType === "RULES_EVALUATOR") {
      const check = rulesSchema.safeParse(config.rules);
      if (!check.success) {
        ctx.addIssue({
          code: "custom",
          message: 'Rules must use only the supported operations (var, ==, >, and, or, …) — configure { "rules": … }',
          path: ["configJson"],
        });
        return z.NEVER;
      }
    }
    const { configJson: _configJson, ...rest } = data;
    return { ...rest, config };
  });

const messagePair = z.object({
  message: z.string().trim().max(500).optional().or(z.literal("").transform(() => undefined)),
  suggestion: z.string().trim().max(1500).optional().or(z.literal("").transform(() => undefined)),
});

export const fieldInputSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  fieldKey: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9_.]+$/, "Lowercase letters, numbers, dots and underscores only"),
  description: z.string().trim().max(500).optional().or(z.literal("").transform(() => undefined)),
  planAccess: planAccessSchema.default("BOTH"),
  severity: severitySchema.default("MEDIUM"),
  category: z.string().trim().max(60).optional().or(z.literal("").transform(() => undefined)),
  score: z.coerce.number().min(0).max(100).default(1),
  weight: z.coerce.number().min(0).max(10).default(1),
  passLabel: z.string().trim().max(30).default("Yes"),
  failLabel: z.string().trim().max(30).default("No"),
  warningLabel: z.string().trim().max(30).default("Partial"),
  helpArticleUrl: z
    .string()
    .trim()
    .url("Enter a full URL")
    .max(500)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  isEnabled: z.coerce.boolean().default(true),
  adminNotes: z.string().trim().max(1000).optional().or(z.literal("").transform(() => undefined)),
  criteria: criteriaInputSchema,
  messages: z.object({
    PASS: messagePair,
    FAIL: messagePair,
    WARNING: messagePair,
  }),
});

export const testCriterionSchema = z.object({
  url: z.string().trim().min(3).max(2048),
  criteria: criteriaInputSchema,
});

export type SectionInput = z.infer<typeof sectionInputSchema>;
export type FieldInput = z.infer<typeof fieldInputSchema>;
