import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { STANDARD_FEATURE_KEYS } from "../src/services/billing/constants";

const db = new PrismaClient();

async function main() {
  console.log("Seeding dynamic billing plans and initial configurations...");

  // 1. FREE PLAN
  const freePlan = await db.plan.upsert({
    where: { key: "FREE" },
    update: {
      name: "Free Tier",
      description: "Essential website health check and SEO analysis for single sites.",
      priceMonthlyCents: 0,
      priceYearlyCents: 0,
      auditLimitPerMonth: 3,
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
      name: "Free Tier",
      description: "Essential website health check and SEO analysis for single sites.",
      priceMonthlyCents: 0,
      priceYearlyCents: 0,
      auditLimitPerMonth: 3,
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
      { planId: freePlan.id, label: "3 Full Website Audits / month", isIncluded: true, displayOrder: 1 },
      { planId: freePlan.id, label: "Core Technical SEO & Foundations", isIncluded: true, displayOrder: 2 },
      { planId: freePlan.id, label: "Google Page Speed & Vitals overview", isIncluded: true, displayOrder: 3 },
      { planId: freePlan.id, label: "On-Page Content & Heading Checks", isIncluded: true, displayOrder: 4 },
      { planId: freePlan.id, label: "Public shareable audit link", isIncluded: true, displayOrder: 5 },
      { planId: freePlan.id, label: "Advanced Backlink Intelligence", isIncluded: false, displayOrder: 6 },
      { planId: freePlan.id, label: "Exportable White-label PDF Reports", isIncluded: false, displayOrder: 7 },
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
      priceMonthlyCents: 1900,
      priceYearlyCents: 18000,
      auditLimitPerMonth: 25,
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
      priceMonthlyCents: 1900,
      priceYearlyCents: 18000,
      auditLimitPerMonth: 25,
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
      { planId: starterPlan.id, interval: "month", amountCents: 1900, currency: "usd", isActive: true },
      { planId: starterPlan.id, interval: "year", amountCents: 18000, currency: "usd", isActive: true },
    ],
  });

  // Starter Public Features
  await db.planPublicFeature.deleteMany({ where: { planId: starterPlan.id } });
  await db.planPublicFeature.createMany({
    data: [
      { planId: starterPlan.id, label: "25 In-Depth Audits / month", isIncluded: true, displayOrder: 1 },
      { planId: starterPlan.id, label: "Full Technical SEO & Code Inspection", isIncluded: true, displayOrder: 2 },
      { planId: starterPlan.id, label: "Complete Page Speed & Diagnostic Metrics", isIncluded: true, displayOrder: 3 },
      { planId: starterPlan.id, label: "Schema Markup & JSON-LD Suite", isIncluded: true, displayOrder: 4 },
      { planId: starterPlan.id, label: "AI Search & Answer Engine Optimization", isIncluded: true, displayOrder: 5 },
      { planId: starterPlan.id, label: "Branded PDF Export", isIncluded: true, displayOrder: 6 },
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

  // 3. PREMIUM PLAN (Most Popular)
  const premiumPlan = await db.plan.upsert({
    where: { key: "PREMIUM" },
    update: {
      name: "Professional",
      description: "Full suite access with high-capacity audits, continuous monitoring, and PDF export.",
      priceMonthlyCents: 4900,
      priceYearlyCents: 47000,
      auditLimitPerMonth: 100,
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
      key: "PREMIUM",
      name: "Professional",
      description: "Full suite access with high-capacity audits, continuous monitoring, and PDF export.",
      priceMonthlyCents: 4900,
      priceYearlyCents: 47000,
      auditLimitPerMonth: 100,
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

  // Premium Prices
  await db.planPrice.deleteMany({ where: { planId: premiumPlan.id } });
  await db.planPrice.createMany({
    data: [
      { planId: premiumPlan.id, interval: "month", amountCents: 4900, currency: "usd", isActive: true },
      { planId: premiumPlan.id, interval: "year", amountCents: 47000, currency: "usd", isActive: true },
    ],
  });

  // Premium Public Features
  await db.planPublicFeature.deleteMany({ where: { planId: premiumPlan.id } });
  await db.planPublicFeature.createMany({
    data: [
      { planId: premiumPlan.id, label: "100 High-Speed Audits / month", isIncluded: true, displayOrder: 1 },
      { planId: premiumPlan.id, label: "Unlimited Historical Report Comparison", isIncluded: true, displayOrder: 2 },
      { planId: premiumPlan.id, label: "Full Core Web Vitals & Real-device Metrics", isIncluded: true, displayOrder: 3 },
      { planId: premiumPlan.id, label: "AI Search & Answer Engine Optimization", isIncluded: true, displayOrder: 4 },
      { planId: premiumPlan.id, label: "Automated Weekly Scheduled Scans", isIncluded: true, displayOrder: 5 },
      { planId: premiumPlan.id, label: "Downloadable Client-Ready PDF Reports", isIncluded: true, displayOrder: 6 },
      { planId: premiumPlan.id, label: "Priority Fast Processing Queue", isIncluded: true, displayOrder: 7 },
    ],
  });

  // Premium Entitlements (All true)
  for (const sf of STANDARD_FEATURE_KEYS) {
    await db.planEntitlement.upsert({
      where: { planId_featureKey: { planId: premiumPlan.id, featureKey: sf.key } },
      update: { enabled: true },
      create: { planId: premiumPlan.id, featureKey: sf.key, enabled: true },
    });
  }

  // 4. AGENCY PLAN
  const agencyPlan = await db.plan.upsert({
    where: { key: "AGENCY" },
    update: {
      name: "Agency & Enterprise",
      description: "Designed for marketing agencies managing dozens of client domains.",
      priceMonthlyCents: 14900,
      priceYearlyCents: 140000,
      auditLimitPerMonth: 500,
      auditLimitType: "MONTHLY",
      auditResetPeriod: "MONTHLY",
      concurrentAuditsLimit: 5,
      isActive: true,
      isPublic: true,
      isPopular: false,
      displayOrder: 4,
      badgeText: "High Volume",
      customCtaText: "Get Agency Tier",
    },
    create: {
      key: "AGENCY",
      name: "Agency & Enterprise",
      description: "Designed for marketing agencies managing dozens of client domains.",
      priceMonthlyCents: 14900,
      priceYearlyCents: 140000,
      auditLimitPerMonth: 500,
      auditLimitType: "MONTHLY",
      auditResetPeriod: "MONTHLY",
      concurrentAuditsLimit: 5,
      isActive: true,
      isPublic: true,
      isPopular: false,
      displayOrder: 4,
      badgeText: "High Volume",
      customCtaText: "Get Agency Tier",
    },
  });

  // Agency Prices
  await db.planPrice.deleteMany({ where: { planId: agencyPlan.id } });
  await db.planPrice.createMany({
    data: [
      { planId: agencyPlan.id, interval: "month", amountCents: 14900, currency: "usd", isActive: true },
      { planId: agencyPlan.id, interval: "year", amountCents: 140000, currency: "usd", isActive: true },
    ],
  });

  // Agency Public Features
  await db.planPublicFeature.deleteMany({ where: { planId: agencyPlan.id } });
  await db.planPublicFeature.createMany({
    data: [
      { planId: agencyPlan.id, label: "500 Audits / month with bulk import", isIncluded: true, displayOrder: 1 },
      { planId: agencyPlan.id, label: "5 Simultaneous Concurrent Audits", isIncluded: true, displayOrder: 2 },
      { planId: agencyPlan.id, label: "Custom White Label Branding & Logos", isIncluded: true, displayOrder: 3 },
      { planId: agencyPlan.id, label: "Uncapped Historical Audit Archive", isIncluded: true, displayOrder: 4 },
      { planId: agencyPlan.id, label: "Multi-seat Agency Collaboration", isIncluded: true, displayOrder: 5 },
      { planId: agencyPlan.id, label: "Dedicated Priority Processing Engine", isIncluded: true, displayOrder: 6 },
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

  // System settings default currency & billing enabled
  await db.systemSetting.upsert({
    where: { key: "billing_currency" },
    update: { value: "usd" },
    create: { key: "billing_currency", value: "usd", description: "Default Billing Currency" },
  });

  await db.systemSetting.upsert({
    where: { key: "billing_enabled" },
    update: { value: true },
    create: { key: "billing_enabled", value: true, description: "Master billing switch" },
  });

  console.log("✓ Dynamic billing plans and entitlements seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
