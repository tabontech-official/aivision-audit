/**
 * AuditFlow — Postgres enums (Drizzle ORM)
 * Phase 1 schema preview. In Phase 2 this file moves to src/lib/db/schema/enums.ts unchanged.
 */
import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["MASTER_ADMIN", "ADMIN", "USER"]);

export const userPlanEnum = pgEnum("user_plan", ["FREE", "PREMIUM"]);

export const planAccessEnum = pgEnum("plan_access", ["FREE", "PREMIUM", "HIDDEN", "BOTH"]);

export const reportStatusEnum = pgEnum("report_status", [
  "QUEUED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "PARTIAL",
]);

export const auditStageEnum = pgEnum("audit_stage", [
  "CONNECTING",
  "FETCHING_HTML",
  "RENDERING",
  "CHECKING_SEO",
  "CHECKING_SPEED",
  "INSPECTING_METADATA",
  "REVIEWING_ACCESSIBILITY",
  "ANALYZING_MOBILE",
  "CHECKING_CONVERSION",
  "PREPARING_RECOMMENDATIONS",
  "GENERATING_REPORT",
]);

export const checkStatusEnum = pgEnum("check_status", [
  "PASS",
  "FAIL",
  "WARNING",
  "INFO",
  "NOT_APPLICABLE",
  "ERROR",
]);

export const severityEnum = pgEnum("severity", [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
  "INFORMATIONAL",
]);

export const inspectionTypeEnum = pgEnum("inspection_type", [
  "ELEMENT_EXISTS",
  "ELEMENT_NOT_EXISTS",
  "ATTRIBUTE_EXISTS",
  "ATTRIBUTE_EQUALS",
  "ATTRIBUTE_CONTAINS",
  "TEXT_EXISTS",
  "TEXT_CONTAINS",
  "ELEMENT_COUNT",
  "TEXT_LENGTH",
  "HTTP_STATUS",
  "REDIRECT_CHECK",
  "SSL_CHECK",
  "RESPONSE_HEADER",
  "BROKEN_LINKS",
  "IMAGE_ALT_TEXT",
  "HTML_VALIDATION",
  "META_TAG",
  "HEADING_HIERARCHY",
  "CANONICAL_TAG",
  "ROBOTS_META",
  "SITEMAP_CHECK",
  "ROBOTS_TXT_CHECK",
  "STRUCTURED_DATA",
  "SCHEMA_TYPE",
  "MOBILE_VIEWPORT",
  "FORM_FIELD",
  "CTA_CHECK",
  "PSI_METRIC",
  "LIGHTHOUSE_SCORE",
  "API_CHECK",
  "RULES_EVALUATOR", // sandboxed JsonLogic — replaces "custom JavaScript" safely
  "REGEX_EVALUATOR",
  "BOOLEAN_CHECK",
  "NUMERIC_COMPARISON",
  "STRING_COMPARISON",
]);

export const operatorEnum = pgEnum("criteria_operator", [
  "EXISTS",
  "NOT_EXISTS",
  "EQUALS",
  "NOT_EQUALS",
  "CONTAINS",
  "NOT_CONTAINS",
  "STARTS_WITH",
  "ENDS_WITH",
  "GREATER_THAN",
  "LESS_THAN",
  "GREATER_THAN_OR_EQUAL",
  "LESS_THAN_OR_EQUAL",
  "BETWEEN",
  "MATCHES_REGEX",
  "IS_TRUE",
  "IS_FALSE",
]);

export const templateStatusEnum = pgEnum("template_status", ["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "ACTIVE",
  "TRIALING",
  "PAST_DUE",
  "CANCELED",
  "INCOMPLETE",
  "INCOMPLETE_EXPIRED",
  "UNPAID",
  "PAUSED",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "SUCCEEDED",
  "PENDING",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
]);

export const psiStrategyEnum = pgEnum("psi_strategy", ["MOBILE", "DESKTOP"]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "REPORT_READY",
  "REPORT_FAILED",
  "PLAN_UPGRADED",
  "PLAN_DOWNGRADED",
  "PAYMENT_FAILED",
  "SYSTEM",
]);
