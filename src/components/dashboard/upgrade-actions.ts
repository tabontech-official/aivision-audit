"use server";

import { db } from "@/lib/db/client";
import { auth } from "@/lib/auth/auth";
import { getUserUsageSummary } from "@/services/billing/entitlements";
import { createDynamicCheckoutSession } from "@/services/billing/billing";

export type UpgradePlanOption = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  pageAuditLimit: number;
  websiteLimit: number;
  schemaMonthlyLimit: number;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  isPopular: boolean;
  badgeText: string | null;
  features: string[];
};

export async function getUpgradeOptionsAction(): Promise<{
  ok: boolean;
  currentPlanKey: string;
  currentPlanName: string;
  pageCreditsLimit: number;
  nextPlan: UpgradePlanOption | null;
  allPlans: UpgradePlanOption[];
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        ok: false,
        currentPlanKey: "FREE",
        currentPlanName: "Free Plan",
        pageCreditsLimit: 10,
        nextPlan: null,
        allPlans: [],
        error: "Not authenticated",
      };
    }

    const usage = await getUserUsageSummary(session.user.id);
    const dbPlans = await db.plan.findMany({
      where: { isActive: true, isPublic: true },
      orderBy: { displayOrder: "asc" },
      include: {
        prices: { where: { isActive: true } },
        publicFeatures: { orderBy: { displayOrder: "asc" } },
      },
    });

    const mappedPlans: UpgradePlanOption[] = dbPlans.map((p) => {
      const monthlyPrice = p.prices.find((pr) => pr.interval === "month" || pr.interval === "monthly");
      const yearlyPrice = p.prices.find((pr) => pr.interval === "year" || pr.interval === "yearly");

      return {
        id: p.id,
        key: p.key,
        name: p.name,
        description: p.description,
        pageAuditLimit: p.pageAuditLimit,
        websiteLimit: p.websiteLimit,
        schemaMonthlyLimit: p.schemaMonthlyLimit,
        priceMonthly: monthlyPrice?.amountCents ? monthlyPrice.amountCents / 100 : 0,
        priceYearly: yearlyPrice?.amountCents ? yearlyPrice.amountCents / 100 : 0,
        currency: monthlyPrice?.currency || "USD",
        isPopular: p.isPopular,
        badgeText: p.badgeText,
        features: p.publicFeatures.map((f) => f.label),
      };
    });

    // Determine the next plan tier
    const currentKeyUpper = usage.plan.planKey.toUpperCase();
    const paidPlans = mappedPlans.filter((p) => p.priceMonthly > 0);
    let nextPlan: UpgradePlanOption | null = null;

    if (currentKeyUpper === "FREE") {
      nextPlan = paidPlans[0] || null; // Starter (100 credits)
    } else {
      const currentIdx = mappedPlans.findIndex((p) => p.key.toUpperCase() === currentKeyUpper);
      if (currentIdx >= 0 && currentIdx < mappedPlans.length - 1) {
        nextPlan = mappedPlans[currentIdx + 1] ?? null;
      } else {
        nextPlan = paidPlans[paidPlans.length - 1] || null;
      }
    }

    return {
      ok: true,
      currentPlanKey: usage.plan.planKey,
      currentPlanName: usage.plan.planName,
      pageCreditsLimit: usage.pages.limit,
      nextPlan,
      allPlans: mappedPlans,
    };
  } catch (err: unknown) {
    return {
      ok: false,
      currentPlanKey: "FREE",
      currentPlanName: "Free Plan",
      pageCreditsLimit: 10,
      nextPlan: null,
      allPlans: [],
      error: err instanceof Error ? err.message : "Failed to load upgrade plans",
    };
  }
}

export async function upgradePlanCheckoutAction(
  planId: string,
  interval: "month" | "year" = "month",
): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Not authenticated." };
    }
    return createDynamicCheckoutSession(session.user.id, planId, interval);
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to start checkout." };
  }
}
