/**
 * AuditFlow — dynamic report builder tables
 * Template → Version (immutable once published) → Sections → Fields → Criteria → Suggestions
 */
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import {
  planAccessEnum,
  templateStatusEnum,
  inspectionTypeEnum,
  operatorEnum,
  severityEnum,
  checkStatusEnum,
} from "./enums";
import { users } from "./auth";

export const reportTemplates = pgTable("report_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  isDefault: boolean("is_default").notNull().default(false),
  createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

/**
 * Versioning: admin edits the latest DRAFT version; Publish freezes it and
 * clones a new DRAFT. Reports pin the version they ran against.
 */
export const templateVersions = pgTable(
  "template_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => reportTemplates.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    status: templateStatusEnum("status").notNull().default("DRAFT"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    publishedById: uuid("published_by_id").references(() => users.id, { onDelete: "set null" }),
    changelog: text("changelog"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("template_versions_template_version_unique").on(t.templateId, t.versionNumber),
    index("template_versions_status_idx").on(t.status),
  ],
);

export const reportSections = pgTable(
  "report_sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    templateVersionId: uuid("template_version_id")
      .notNull()
      .references(() => templateVersions.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    shortDescription: text("short_description"),
    detailedDescription: text("detailed_description"),
    icon: text("icon"), // lucide icon name, validated against whitelist
    displayOrder: integer("display_order").notNull().default(0),
    isEnabled: boolean("is_enabled").notNull().default(true),
    defaultExpanded: boolean("default_expanded").notNull().default(true),
    weight: real("weight").notNull().default(1), // contribution to overall score
    contributesToScore: boolean("contributes_to_score").notNull().default(true),
    planAccess: planAccessEnum("plan_access").notNull().default("BOTH"),
    visibleInReport: boolean("visible_in_report").notNull().default(true),
    accentColor: text("accent_color"), // hex, validated
    isSystem: boolean("is_system").notNull().default(false), // e.g. Page Speed — cannot be deleted
    adminNotes: text("admin_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("report_sections_version_slug_unique").on(t.templateVersionId, t.slug),
    index("report_sections_version_order_idx").on(t.templateVersionId, t.displayOrder),
  ],
);

export const auditFields = pgTable(
  "audit_fields",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sectionId: uuid("section_id")
      .notNull()
      .references(() => reportSections.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    fieldKey: text("field_key").notNull(), // stable machine key, e.g. "seo.title_tag"
    description: text("description"),
    displayOrder: integer("display_order").notNull().default(0),
    isEnabled: boolean("is_enabled").notNull().default(true),
    planAccess: planAccessEnum("plan_access").notNull().default("BOTH"),
    severity: severityEnum("severity").notNull().default("MEDIUM"),
    category: text("category"),
    score: real("score").notNull().default(1), // max points for this check
    weight: real("weight").notNull().default(1),
    passLabel: text("pass_label").notNull().default("Yes"),
    failLabel: text("fail_label").notNull().default("No"),
    warningLabel: text("warning_label").notNull().default("Partial"),
    helpArticleUrl: text("help_article_url"),
    adminNotes: text("admin_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("audit_fields_section_key_unique").on(t.sectionId, t.fieldKey),
    index("audit_fields_section_order_idx").on(t.sectionId, t.displayOrder),
  ],
);

/**
 * One criteria row per field. `config` is a Zod-validated, inspection-type-specific
 * JSON payload (selector, attribute name, header name, PSI metric key, JsonLogic
 * rules for RULES_EVALUATOR, etc.). No executable code is ever stored.
 */
export const auditCriteria = pgTable(
  "audit_criteria",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fieldId: uuid("field_id")
      .notNull()
      .references(() => auditFields.id, { onDelete: "cascade" }),
    inspectionType: inspectionTypeEnum("inspection_type").notNull(),
    dataSource: text("data_source").notNull().default("HTML"), // HTML | RENDERED_DOM | HEADERS | PSI | ROBOTS | SITEMAP | NETWORK
    selector: text("selector"), // CSS selector or extraction rule
    attributeName: text("attribute_name"),
    operator: operatorEnum("operator").notNull(),
    expectedValue: text("expected_value"),
    minValue: real("min_value"),
    maxValue: real("max_value"),
    regexPattern: text("regex_pattern"), // validated + length/complexity capped (ReDoS guard)
    caseSensitive: boolean("case_sensitive").notNull().default(false),
    /** Optional secondary band: if pass fails but this passes → WARNING instead of FAIL */
    warnOperator: operatorEnum("warn_operator"),
    warnExpectedValue: text("warn_expected_value"),
    warnMinValue: real("warn_min_value"),
    warnMaxValue: real("warn_max_value"),
    config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("audit_criteria_field_unique").on(t.fieldId)],
);

/**
 * Messages + suggestions per outcome status. One row per (field, status).
 * Templates support {{domain}} {{actualValue}} {{expectedValue}} {{count}}
 * {{minimum}} {{maximum}} {{pageTitle}} {{sectionName}} — interpolated server-side, escaped.
 */
export const auditSuggestions = pgTable(
  "audit_suggestions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fieldId: uuid("field_id")
      .notNull()
      .references(() => auditFields.id, { onDelete: "cascade" }),
    forStatus: checkStatusEnum("for_status").notNull(),
    message: text("message").notNull(), // e.g. "Your page is missing a title tag."
    suggestion: text("suggestion"), // actionable recommendation
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("audit_suggestions_field_status_unique").on(t.fieldId, t.forStatus)],
);
