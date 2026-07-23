/**
 * AuditFlow — plans, subscriptions, payments, invoices
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
import { subscriptionStatusEnum, paymentStatusEnum, userPlanEnum } from "./enums";
import { users } from "./auth";

export const plans = pgTable(
  "plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: userPlanEnum("key").notNull(), // FREE | PREMIUM
    name: text("name").notNull(),
    description: text("description"),
    priceMonthlyCents: integer("price_monthly_cents").notNull().default(0),
    priceYearlyCents: integer("price_yearly_cents").notNull().default(0),
    currency: text("currency").notNull().default("usd"),
    stripeProductId: text("stripe_product_id"),
    stripePriceMonthlyId: text("stripe_price_monthly_id"),
    stripePriceYearlyId: text("stripe_price_yearly_id"),
    auditLimitPerMonth: integer("audit_limit_per_month").notNull().default(3),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("plans_key_unique").on(t.key)],
);

export const planFeatures = pgTable(
  "plan_features",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    featureKey: text("feature_key").notNull(), // pdf_download | history | rerun | full_evidence …
    label: text("label").notNull(), // marketing copy on pricing page
    isIncluded: boolean("is_included").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("plan_features_plan_key_unique").on(t.planId, t.featureKey)],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "restrict" }),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    status: subscriptionStatusEnum("status").notNull().default("ACTIVE"),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("subscriptions_stripe_sub_unique").on(t.stripeSubscriptionId),
    index("subscriptions_user_idx").on(t.userId),
    index("subscriptions_status_idx").on(t.status),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id, {
      onDelete: "set null",
    }),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    stripeChargeId: text("stripe_charge_id"),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("usd"),
    status: paymentStatusEnum("status").notNull(),
    failureReason: text("failure_reason"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("payments_stripe_pi_unique").on(t.stripePaymentIntentId),
    index("payments_user_idx").on(t.userId),
  ],
);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    paymentId: uuid("payment_id").references(() => payments.id, { onDelete: "set null" }),
    stripeInvoiceId: text("stripe_invoice_id"),
    invoiceNumber: text("invoice_number"),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("usd"),
    pdfUrl: text("pdf_url"), // Stripe-hosted invoice PDF
    hostedInvoiceUrl: text("hosted_invoice_url"),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("invoices_stripe_unique").on(t.stripeInvoiceId),
    index("invoices_user_idx").on(t.userId),
  ],
);

/** Stripe webhook idempotency ledger */
export const stripeWebhookEvents = pgTable(
  "stripe_webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stripeEventId: text("stripe_event_id").notNull(),
    type: text("type").notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("stripe_webhook_events_event_unique").on(t.stripeEventId)],
);
