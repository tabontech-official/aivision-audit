/**
 * AuditFlow — websites, reports, results, raw data, PageSpeed
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
  reportStatusEnum,
  auditStageEnum,
  checkStatusEnum,
  severityEnum,
  userPlanEnum,
  psiStrategyEnum,
} from "./enums";
import { users, anonymousSessions } from "./auth";
import { templateVersions, reportSections, auditFields } from "./builder";

export const websites = pgTable(
  "websites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    url: text("url").notNull(), // normalized origin + path
    domain: text("domain").notNull(),
    faviconUrl: text("favicon_url"),
    /** owner is nullable: anonymous audits create ownerless websites, claimed on signup */
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    firstAuditedAt: timestamp("first_audited_at", { withTimezone: true }),
    lastAuditedAt: timestamp("last_audited_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("websites_user_idx").on(t.userId),
    index("websites_domain_idx").on(t.domain),
    uniqueIndex("websites_user_url_unique").on(t.userId, t.url),
  ],
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** unguessable public identifier used in URLs (nanoid 21) */
    publicId: text("public_id").notNull(),
    websiteId: uuid("website_id")
      .notNull()
      .references(() => websites.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    anonymousSessionId: uuid("anonymous_session_id").references(() => anonymousSessions.id, {
      onDelete: "set null",
    }),
    templateVersionId: uuid("template_version_id")
      .notNull()
      .references(() => templateVersions.id, { onDelete: "restrict" }),
    status: reportStatusEnum("status").notNull().default("QUEUED"),
    currentStage: auditStageEnum("current_stage"),
    progressPercent: integer("progress_percent").notNull().default(0),
    /** plan snapshot at generation time — controls what was evaluated/stored */
    planAtGeneration: userPlanEnum("plan_at_generation").notNull().default("FREE"),
    overallScore: real("overall_score"),
    grade: text("grade"), // "Excellent" | "Good" | "Needs Improvement" | "Poor" (from settings)
    mobileScore: real("mobile_score"),
    desktopScore: real("desktop_score"),
    passedCount: integer("passed_count").notNull().default(0),
    failedCount: integer("failed_count").notNull().default(0),
    warningCount: integer("warning_count").notNull().default(0),
    criticalIssueCount: integer("critical_issue_count").notNull().default(0),
    screenshotUrl: text("screenshot_url"),
    errorMessage: text("error_message"), // safe, user-facing failure summary
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    /** anonymous reports expire; claimed reports have this cleared */
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("reports_public_id_unique").on(t.publicId),
    index("reports_user_created_idx").on(t.userId, t.createdAt),
    index("reports_website_idx").on(t.websiteId),
    index("reports_anon_session_idx").on(t.anonymousSessionId),
    index("reports_status_idx").on(t.status),
    index("reports_expires_idx").on(t.expiresAt),
  ],
);

export const reportSectionResults = pgTable(
  "report_section_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    sectionId: uuid("section_id")
      .notNull()
      .references(() => reportSections.id, { onDelete: "restrict" }),
    score: real("score"),
    maxScore: real("max_score"),
    status: checkStatusEnum("status").notNull().default("INFO"), // rollup
    summary: text("summary"),
    passedCount: integer("passed_count").notNull().default(0),
    failedCount: integer("failed_count").notNull().default(0),
    warningCount: integer("warning_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("section_results_report_section_unique").on(t.reportId, t.sectionId),
    index("section_results_report_idx").on(t.reportId),
  ],
);

export const auditResults = pgTable(
  "audit_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    sectionResultId: uuid("section_result_id")
      .notNull()
      .references(() => reportSectionResults.id, { onDelete: "cascade" }),
    fieldId: uuid("field_id")
      .notNull()
      .references(() => auditFields.id, { onDelete: "restrict" }),
    status: checkStatusEnum("status").notNull(),
    severity: severityEnum("severity").notNull(),
    actualValue: text("actual_value"), // detected value, stringified
    expectedSummary: text("expected_summary"), // human-readable expected condition
    evidence: jsonb("evidence").$type<Record<string, unknown>>(), // snippets, counts, urls
    renderedMessage: text("rendered_message"), // interpolated message
    renderedSuggestion: text("rendered_suggestion"), // interpolated suggestion
    score: real("score").notNull().default(0),
    maxScore: real("max_score").notNull().default(0),
    isQuickWin: boolean("is_quick_win").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("audit_results_report_field_unique").on(t.reportId, t.fieldId),
    index("audit_results_report_idx").on(t.reportId),
    index("audit_results_section_result_idx").on(t.sectionResultId),
  ],
);

/** Full extracted crawl snapshot — lets checks be re-evaluated without re-crawling */
export const websiteRawData = pgTable(
  "website_raw_data",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    httpStatus: integer("http_status"),
    finalUrl: text("final_url"),
    redirectChain: jsonb("redirect_chain").$type<string[]>(),
    responseHeaders: jsonb("response_headers").$type<Record<string, string>>(),
    /** parsed & structured extraction (titles, metas, headings, links, images,
     *  OG/Twitter, JSON-LD, forms, CTAs, trust signals, counts, ratios …) */
    extracted: jsonb("extracted").$type<Record<string, unknown>>().notNull().default({}),
    robotsTxt: text("robots_txt"),
    sitemapInfo: jsonb("sitemap_info").$type<Record<string, unknown>>(),
    brokenLinks: jsonb("broken_links").$type<Array<{ url: string; status: number | null }>>(),
    htmlSizeBytes: integer("html_size_bytes"),
    fetchDurationMs: integer("fetch_duration_ms"),
    renderedWithBrowser: boolean("rendered_with_browser").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("website_raw_data_report_unique").on(t.reportId)],
);

export const pageSpeedResults = pgTable(
  "page_speed_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    strategy: psiStrategyEnum("strategy").notNull(),
    performanceScore: real("performance_score"),
    accessibilityScore: real("accessibility_score"),
    bestPracticesScore: real("best_practices_score"),
    seoScore: real("seo_score"),
    fcpMs: real("fcp_ms"),
    lcpMs: real("lcp_ms"),
    tbtMs: real("tbt_ms"),
    cls: real("cls"),
    speedIndexMs: real("speed_index_ms"),
    ttiMs: real("tti_ms"),
    inpMs: real("inp_ms"),
    serverResponseMs: real("server_response_ms"),
    opportunities: jsonb("opportunities").$type<Array<Record<string, unknown>>>(),
    diagnostics: jsonb("diagnostics").$type<Array<Record<string, unknown>>>(),
    passedAudits: jsonb("passed_audits").$type<Array<Record<string, unknown>>>(),
    rawResponse: jsonb("raw_response").$type<Record<string, unknown>>(), // debug only, never sent to client
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("psi_report_strategy_unique").on(t.reportId, t.strategy),
    index("psi_report_idx").on(t.reportId),
  ],
);

/** Immutable JSON snapshot of the final rendered report payload (premium history/PDF) */
export const reportSnapshots = pgTable(
  "report_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => reports.id, { onDelete: "cascade" }),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("report_snapshots_report_unique").on(t.reportId)],
);
