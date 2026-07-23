/**
 * AuditFlow — settings, branding, email templates, logs, usage, notifications
 */
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { notificationTypeEnum } from "./enums";
import { users } from "./auth";

/**
 * Key-value settings. Typed access layer in services/settings validates each key
 * with Zod. `isSecret` values are AES-256-GCM encrypted with SETTINGS_ENCRYPTION_KEY
 * and masked in all API responses.
 *
 * Seeded keys include:
 *  product_name, support_email, free_audit_limit, premium_audit_limit,
 *  anonymous_report_expiration_days, score_ranges (JSON grade bands),
 *  pagespeed_api_key (secret), maintenance_mode, terms_url, privacy_url,
 *  cookie_policy_url, anonymous_audits_per_hour_ip
 */
export const systemSettings = pgTable(
  "system_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull(),
    value: jsonb("value").$type<unknown>(),
    isSecret: boolean("is_secret").notNull().default(false),
    description: text("description"),
    updatedById: uuid("updated_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("system_settings_key_unique").on(t.key)],
);

export const brandingSettings = pgTable("branding_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  productName: text("product_name").notNull().default("AuditFlow"),
  logoUrl: text("logo_url"),
  logoDarkUrl: text("logo_dark_url"),
  faviconUrl: text("favicon_url"),
  primaryColor: text("primary_color").notNull().default("#4F46E5"), // indigo-600
  accentColor: text("accent_color").notNull().default("#7C3AED"), // premium purple
  updatedById: uuid("updated_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Editable transactional email templates. Variables use the same {{placeholder}}
 * whitelist convention as suggestions ({{name}}, {{verifyUrl}}, {{resetUrl}}, …).
 */
export const emailTemplates = pgTable(
  "email_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull(), // verify_email | reset_password | report_ready | welcome | payment_failed
    name: text("name").notNull(),
    subject: text("subject").notNull(),
    htmlBody: text("html_body").notNull(),
    textBody: text("text_body"),
    availableVariables: jsonb("available_variables").$type<string[]>().notNull().default([]),
    isEnabled: boolean("is_enabled").notNull().default(true),
    updatedById: uuid("updated_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("email_templates_key_unique").on(t.key)],
);

/** Every admin mutation: who, what, before/after */
export const adminActivityLogs = pgTable(
  "admin_activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(), // e.g. "section.update", "user.plan_change"
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    before: jsonb("before").$type<Record<string, unknown>>(),
    after: jsonb("after").$type<Record<string, unknown>>(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("admin_logs_actor_idx").on(t.actorId),
    index("admin_logs_entity_idx").on(t.entityType, t.entityId),
    index("admin_logs_created_idx").on(t.createdAt),
  ],
);

/** External API consumption tracking (PSI, Browserless, Resend, Stripe) */
export const apiUsage = pgTable(
  "api_usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(), // pagespeed | browserless | resend | stripe
    endpoint: text("endpoint"),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    reportId: uuid("report_id"),
    statusCode: integer("status_code"),
    durationMs: integer("duration_ms"),
    success: boolean("success").notNull().default(true),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("api_usage_provider_created_idx").on(t.provider, t.createdAt),
    index("api_usage_user_idx").on(t.userId),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    linkUrl: text("link_url"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_read_idx").on(t.userId, t.readAt)],
);
