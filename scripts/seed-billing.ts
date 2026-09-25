import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { STANDARD_FEATURE_KEYS } from "../src/services/billing/constants";

const db = new PrismaClient();

async function main() {
  console.log("Seeding recurring SaaS billing plans and default configurations...");

  // 1. FREE PLAN
  const freePlan = await db.plan.upsert({
    where: { key: "FREE" },
    update: {
      name: "Free",
      description: "Essential website health check and SEO analysis for single sites.",
      priceMonthlyCents: 0,
      priceYearlyCents: 0,
      auditLimitPerMonth: 3,
      pageAuditLimit: 10,
      initialSampleSize: 10,
      websiteLimit: 1,
      schemaMonthlyLimit: 3,
      schemaBuilderEnabled: true,
      auditHistoryRetentionDays: 7,
      scheduledAuditsEnabled: false,
      scheduledAuditFrequency: "DISABLED",
      reAuditEnabled: true,
      auditComparisonEnabled: false,
      auditLimitType: "MONTHLY",
      auditResetPeriod: "MONTHLY",
      concurrentAuditsLimit: 1,
      isActive: true,
      isPublic: true,
      isPopular: false,
      displayOrder: 1,
      customCtaText: "Get Started Free",
    },
    create: {
      key: "FREE",
      name: "Free",
      description: "Essential website health check and SEO analysis for single sites.",
      priceMonthlyCents: 0,
      priceYearlyCents: 0,
      auditLimitPerMonth: 3,
      pageAuditLimit: 10,
      initialSampleSize: 10,
      websiteLimit: 1,
      schemaMonthlyLimit: 3,
      schemaBuilderEnabled: true,
      auditHistoryRetentionDays: 7,
      scheduledAuditsEnabled: false,
      scheduledAuditFrequency: "DISABLED",
      reAuditEnabled: true,
      auditComparisonEnabled: false,
      auditLimitType: "MONTHLY",
      auditResetPeriod: "MONTHLY",
      concurrentAuditsLimit: 1,
      isActive: true,
      isPublic: true,
      isPopular: false,
      displayOrder: 1,
      customCtaText: "Get Started Free",
    },
  });

  // Free Public Features
  await db.planPublicFeature.deleteMany({ where: { planId: freePlan.id } });
  await db.planPublicFeature.createMany({
    data: [
      { planId: freePlan.id, label: "1 Website / Project", isIncluded: true, displayOrder: 1 },
      { planId: freePlan.id, label: "10 Audit Page Credits / month", isIncluded: true, displayOrder: 2 },
      { planId: freePlan.id, label: "Limited Schema Builder (3 generations/mo)", isIncluded: true, displayOrder: 3 },
      { planId: freePlan.id, label: "Manual Website Audits", isIncluded: true, displayOrder: 4 },
      { planId: freePlan.id, label: "Full Technical SEO & Code Inspection", isIncluded: true, displayOrder: 5 },
      { planId: freePlan.id, label: "Scheduled Audits & Monitoring", isIncluded: false, displayOrder: 6 },
      { planId: freePlan.id, label: "Audit Comparison & History Tracking", isIncluded: false, displayOrder: 7 },
    ],
  });

  // Free Entitlements
  for (const sf of STANDARD_FEATURE_KEYS) {
    const enabled = sf.key !== "backlinks" && sf.key !== "keywords" && sf.key !== "pdf_export" && sf.key !== "custom_branding";
    await db.planEntitlement.upsert({
      where: { planId_featureKey: { planId: freePlan.id, featureKey: sf.key } },
      update: { enabled },
      create: { planId: freePlan.id, featureKey: sf.key, enabled },
    });
  }

  // 2. STARTER PLAN
  const starterPlan = await db.plan.upsert({
    where: { key: "STARTER" },
    update: {
      name: "Starter",
      description: "Ideal for growing websites, solo developers, and content creators.",
      priceMonthlyCents: 2900,
      priceYearlyCents: 29000,
      auditLimitPerMonth: 10,
      pageAuditLimit: 100,
      initialSampleSize: 30,
      websiteLimit: 1,
      schemaMonthlyLimit: 25,
      schemaBuilderEnabled: true,
      auditHistoryRetentionDays: 30,
      scheduledAuditsEnabled: true,
      scheduledAuditFrequency: "MONTHLY",
      reAuditEnabled: true,
      auditComparisonEnabled: true,
      auditLimitType: "MONTHLY",
      auditResetPeriod: "MONTHLY",
      concurrentAuditsLimit: 2,
      isActive: true,
      isPublic: true,
      isPopular: false,
      displayOrder: 2,
      badgeText: "Great For Creators",
      customCtaText: "Start with Starter",
    },
    create: {
      key: "STARTER",
      name: "Starter",
      description: "Ideal for growing websites, solo developers, and content creators.",
      priceMonthlyCents: 2900,
      priceYearlyCents: 29000,
      auditLimitPerMonth: 10,
      pageAuditLimit: 100,
      initialSampleSize: 30,
      websiteLimit: 1,
      schemaMonthlyLimit: 25,
      schemaBuilderEnabled: true,
      auditHistoryRetentionDays: 30,
      scheduledAuditsEnabled: true,
      scheduledAuditFrequency: "MONTHLY",
      reAuditEnabled: true,
      auditComparisonEnabled: true,
      auditLimitType: "MONTHLY",
      auditResetPeriod: "MONTHLY",
      concurrentAuditsLimit: 2,
      isActive: true,
      isPublic: true,
      isPopular: false,
      displayOrder: 2,
      badgeText: "Great For Creators",
      customCtaText: "Start with Starter",
    },
  });

  // Starter Prices
  await db.planPrice.deleteMany({ where: { planId: starterPlan.id } });
  await db.planPrice.createMany({
    data: [
      { planId: starterPlan.id, interval: "month", amountCents: 2900, currency: "usd", isActive: true },
      { planId: starterPlan.id, interval: "year", amountCents: 29000, currency: "usd", isActive: true },
    ],
  });

  // Starter Public Features
  await db.planPublicFeature.deleteMany({ where: { planId: starterPlan.id } });
  await db.planPublicFeature.createMany({
    data: [
      { planId: starterPlan.id, label: "1 Website / Project", isIncluded: true, displayOrder: 1 },
      { planId: starterPlan.id, label: "100 Audit Page Credits / month", isIncluded: true, displayOrder: 2 },
      { planId: starterPlan.id, label: "Schema Builder Included (25 generations/mo)", isIncluded: true, displayOrder: 3 },
      { planId: starterPlan.id, label: "Monthly Scheduled Audits & Monitoring", isIncluded: true, displayOrder: 4 },
      { planId: starterPlan.id, label: "Audit History (30 Days)", isIncluded: true, displayOrder: 5 },
      { planId: starterPlan.id, label: "Audit Comparison & Change Tracking", isIncluded: true, displayOrder: 6 },
      { planId: starterPlan.id, label: "Exportable Client PDF Reports", isIncluded: true, displayOrder: 7 },
    ],
  });

  // Starter Entitlements
  for (const sf of STANDARD_FEATURE_KEYS) {
    const enabled = sf.key !== "custom_branding";
    await db.planEntitlement.upsert({
      where: { planId_featureKey: { planId: starterPlan.id, featureKey: sf.key } },
      update: { enabled },
      create: { planId: starterPlan.id, featureKey: sf.key, enabled },
    });
  }

  // 3. PRO PLAN (Most Popular)
  const proPlan = await db.plan.upsert({
    where: { key: "PRO" },
    update: {
      name: "Pro",
      description: "Full suite access with high-capacity audits, continuous monitoring, and verification.",
      priceMonthlyCents: 7900,
      priceYearlyCents: 79000,
      auditLimitPerMonth: 50,
      pageAuditLimit: 1000,
      initialSampleSize: 50,
      websiteLimit: 5,
      schemaMonthlyLimit: 100,
      schemaBuilderEnabled: true,
      auditHistoryRetentionDays: 90,
      scheduledAuditsEnabled: true,
      scheduledAuditFrequency: "WEEKLY",
      reAuditEnabled: true,
      auditComparisonEnabled: true,
      auditLimitType: "MONTHLY",
      auditResetPeriod: "MONTHLY",
      concurrentAuditsLimit: 3,
      isActive: true,
      isPublic: true,
      isPopular: true,
      displayOrder: 3,
      badgeText: "Most Popular",
      customCtaText: "Upgrade to Pro",
    },
    create: {
      key: "PRO",
      name: "Pro",
      description: "Full suite access with high-capacity audits, continuous monitoring, and verification.",
      priceMonthlyCents: 7900,
      priceYearlyCents: 79000,
      auditLimitPerMonth: 50,
      pageAuditLimit: 1000,
      initialSampleSize: 50,
      websiteLimit: 5,
      schemaMonthlyLimit: 100,
      schemaBuilderEnabled: true,
      auditHistoryRetentionDays: 90,
      scheduledAuditsEnabled: true,
      scheduledAuditFrequency: "WEEKLY",
      reAuditEnabled: true,
      auditComparisonEnabled: true,
      auditLimitType: "MONTHLY",
      auditResetPeriod: "MONTHLY",
      concurrentAuditsLimit: 3,
      isActive: true,
      isPublic: true,
      isPopular: true,
      displayOrder: 3,
      badgeText: "Most Popular",
      customCtaText: "Upgrade to Pro",
    },
  });

  // Keep PREMIUM key in sync as alias if needed
  await db.plan.upsert({
    where: { key: "PREMIUM" },
    update: {
      name: "Pro",
      priceMonthlyCents: 7900,
      priceYearlyCents: 79000,
      pageAuditLimit: 1000,
      initialSampleSize: 50,
      websiteLimit: 5,
      schemaMonthlyLimit: 100,
      schemaBuilderEnabled: true,
      auditHistoryRetentionDays: 90,
      scheduledAuditsEnabled: true,
      scheduledAuditFrequency: "WEEKLY",
      reAuditEnabled: true,
      auditComparisonEnabled: true,
      isActive: true,
      isPublic: false,
    },
    create: {
      key: "PREMIUM",
      name: "Pro",
      description: "Full suite access with high-capacity audits, continuous monitoring, and verification.",
      priceMonthlyCents: 7900,
      priceYearlyCents: 79000,
      auditLimitPerMonth: 50,
      pageAuditLimit: 1000,
      initialSampleSize: 50,
      websiteLimit: 5,
      schemaMonthlyLimit: 100,
      schemaBuilderEnabled: true,
      auditHistoryRetentionDays: 90,
      scheduledAuditsEnabled: true,
      scheduledAuditFrequency: "WEEKLY",
      reAuditEnabled: true,
      auditComparisonEnabled: true,
      isActive: true,
      isPublic: false,
      displayOrder: 99,
    },
  });

  // Pro Prices
  await db.planPrice.deleteMany({ where: { planId: proPlan.id } });
  await db.planPrice.createMany({
    data: [
      { planId: proPlan.id, interval: "month", amountCents: 7900, currency: "usd", isActive: true },
      { planId: proPlan.id, interval: "year", amountCents: 79000, currency: "usd", isActive: true },
    ],
  });

  // Pro Public Features
  await db.planPublicFeature.deleteMany({ where: { planId: proPlan.id } });
  await db.planPublicFeature.createMany({
    data: [
      { planId: proPlan.id, label: "5 Websites / Projects", isIncluded: true, displayOrder: 1 },
      { planId: proPlan.id, label: "1,000 Audit Page Credits / month", isIncluded: true, displayOrder: 2 },
      { planId: proPlan.id, label: "Schema Builder Included (100 generations/mo)", isIncluded: true, displayOrder: 3 },
      { planId: proPlan.id, label: "Scheduled Audits (Weekly & Monthly)", isIncluded: true, displayOrder: 4 },
      { planId: proPlan.id, label: "Deeper Audit History (90 Days)", isIncluded: true, displayOrder: 5 },
      { planId: proPlan.id, label: "Issue Comparison & Fix Verification", isIncluded: true, displayOrder: 6 },
      { planId: proPlan.id, label: "Re-Audit & Historical Trends", isIncluded: true, displayOrder: 7 },
      { planId: proPlan.id, label: "Branded PDF Export", isIncluded: true, displayOrder: 8 },
    ],
  });

  // Pro Entitlements (All true)
  for (const sf of STANDARD_FEATURE_KEYS) {
    await db.planEntitlement.upsert({
      where: { planId_featureKey: { planId: proPlan.id, featureKey: sf.key } },
      update: { enabled: true },
      create: { planId: proPlan.id, featureKey: sf.key, enabled: true },
    });
  }

  // 4. AGENCY PLAN
  const agencyPlan = await db.plan.upsert({
    where: { key: "AGENCY" },
    update: {
      name: "Agency",
      description: "Designed for marketing agencies and teams managing multiple client websites.",
      priceMonthlyCents: 19900,
      priceYearlyCents: 199000,
      auditLimitPerMonth: 200,
      pageAuditLimit: 3000,
      initialSampleSize: 100,
      websiteLimit: 20,
      schemaMonthlyLimit: -1,
      schemaBuilderEnabled: true,
      auditHistoryRetentionDays: 365,
      scheduledAuditsEnabled: true,
      scheduledAuditFrequency: "WEEKLY",
      reAuditEnabled: true,
      auditComparisonEnabled: true,
      auditLimitType: "MONTHLY",
      auditResetPeriod: "MONTHLY",
      concurrentAuditsLimit: 5,
      isActive: true,
      isPublic: true,
      isPopular: false,
      displayOrder: 4,
      badgeText: "High Capacity",
      customCtaText: "Get Agency Plan",
    },
    create: {
      key: "AGENCY",
      name: "Agency",
      description: "Designed for marketing agencies and teams managing multiple client websites.",
      priceMonthlyCents: 19900,
      priceYearlyCents: 199000,
      auditLimitPerMonth: 200,
      pageAuditLimit: 3000,
      initialSampleSize: 100,
      websiteLimit: 20,
      schemaMonthlyLimit: -1,
      schemaBuilderEnabled: true,
      auditHistoryRetentionDays: 365,
      scheduledAuditsEnabled: true,
      scheduledAuditFrequency: "WEEKLY",
      reAuditEnabled: true,
      auditComparisonEnabled: true,
      auditLimitType: "MONTHLY",
      auditResetPeriod: "MONTHLY",
      concurrentAuditsLimit: 5,
      isActive: true,
      isPublic: true,
      isPopular: false,
      displayOrder: 4,
      badgeText: "High Capacity",
      customCtaText: "Get Agency Plan",
    },
  });

  // Agency Prices
  await db.planPrice.deleteMany({ where: { planId: agencyPlan.id } });
  await db.planPrice.createMany({
    data: [
      { planId: agencyPlan.id, interval: "month", amountCents: 19900, currency: "usd", isActive: true },
      { planId: agencyPlan.id, interval: "year", amountCents: 199000, currency: "usd", isActive: true },
    ],
  });

  // Agency Public Features
  await db.planPublicFeature.deleteMany({ where: { planId: agencyPlan.id } });
  await db.planPublicFeature.createMany({
    data: [
      { planId: agencyPlan.id, label: "20 Websites / Client Projects", isIncluded: true, displayOrder: 1 },
      { planId: agencyPlan.id, label: "3,000 Audit Page Credits / month", isIncluded: true, displayOrder: 2 },
      { planId: agencyPlan.id, label: "Unlimited Schema Builder Generations", isIncluded: true, displayOrder: 3 },
      { planId: agencyPlan.id, label: "Scheduled Audits (Weekly & Monthly)", isIncluded: true, displayOrder: 4 },
      { planId: agencyPlan.id, label: "Full Audit History (365 Days Retention)", isIncluded: true, displayOrder: 5 },
      { planId: agencyPlan.id, label: "Audit Comparison & Multi-Run Diffs", isIncluded: true, displayOrder: 6 },
      { planId: agencyPlan.id, label: "Re-Audit & Verification Engine", isIncluded: true, displayOrder: 7 },
      { planId: agencyPlan.id, label: "Custom White Label / Agency PDF Reports", isIncluded: true, displayOrder: 8 },
    ],
  });

  // Agency Entitlements (All true)
  for (const sf of STANDARD_FEATURE_KEYS) {
    await db.planEntitlement.upsert({
      where: { planId_featureKey: { planId: agencyPlan.id, featureKey: sf.key } },
      update: { enabled: true },
      create: { planId: agencyPlan.id, featureKey: sf.key, enabled: true },
    });
  }

  console.log("✅ Seed completed successfully! 4 default plans configured in database (FREE, STARTER, PRO, AGENCY).");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
