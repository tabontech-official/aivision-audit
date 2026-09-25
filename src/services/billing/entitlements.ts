import "server-only";
import { db } from "@/lib/db/client";
import { getSetting } from "@/services/settings/get";
import { STANDARD_FEATURE_KEYS, type FeatureKey } from "./constants";

export { STANDARD_FEATURE_KEYS, type FeatureKey };

export type AllowanceSummary = {
  limit: number;
  used: number;
  bonusCredits: number;
  remaining: number;
  isUnlimited: boolean;
  planKey: string;
  planName: string;
  limitType: string;
  periodResetsAt: Date | null;
};

/**
 * Calculates current audit allowance for a user based on their active subscription,
 * custom plan entitlements, usage events in period, and active non-expired bonus credits.
 */
export async function getUserAuditAllowance(userId: string): Promise<AllowanceSummary> {
  // 1. Check for an active or trialing subscription
  const activeSub = await db.subscription.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "TRIALING"] },
    },
    include: {
      plan: {
        include: {
          entitlements: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  let planKey = "FREE";
  let planName = "Free Plan";
  let limit = 3;
  let limitType = "MONTHLY";
  let resetPeriod = "MONTHLY";
  let isUnlimited = false;
  let periodStart: Date;
  let periodEnd: Date | null = null;

  if (activeSub && activeSub.plan) {
    const plan = activeSub.plan;
    planKey = plan.key;
    planName = plan.name;
    limit = plan.auditLimitPerMonth;
    limitType = plan.auditLimitType;
    resetPeriod = plan.auditResetPeriod;

    if (limitType === "UNLIMITED" || limit === -1) {
      isUnlimited = true;
    }

    if (resetPeriod === "BILLING_CYCLE" && activeSub.currentPeriodStart && activeSub.currentPeriodEnd) {
      periodStart = new Date(activeSub.currentPeriodStart);
      periodEnd = new Date(activeSub.currentPeriodEnd);
    } else {
      // Default monthly reset
      const now = new Date();
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    }
  } else {
    // Check fallback user plan from user record
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (user?.plan === "PREMIUM") {
      const premPlan = await db.plan.findUnique({ where: { key: "PREMIUM" } });
      limit = premPlan?.auditLimitPerMonth ?? (await getSetting("premium_audit_limit"));
      planKey = "PREMIUM";
      planName = premPlan?.name ?? "Premium Plan";
    } else {
      const freePlan = await db.plan.findUnique({ where: { key: "FREE" } });
      limit = freePlan?.auditLimitPerMonth ?? (await getSetting("free_audit_limit"));
      planKey = "FREE";
      planName = freePlan?.name ?? "Free Plan";
    }

    const now = new Date();
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  }

  // 2. Count audits run in this period (excluding SYSTEM failures which are free)
  const usedCount = await db.report.count({
    where: {
      userId,
      createdAt: { gte: periodStart },
      deletedAt: null,
      NOT: { status: "FAILED", failureCategory: "SYSTEM" },
    },
  });

  // 3. Count available active non-expired bonus credits
  const now = new Date();
  const bonusCredits = await db.bonusCredit.findMany({
    where: {
      userId,
      remainingUnits: { gt: 0 },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });

  const totalBonusCredits = bonusCredits.reduce((acc, b) => acc + b.remainingUnits, 0);

  const baseRemaining = isUnlimited ? 999999 : Math.max(0, limit - usedCount);
  const remaining = isUnlimited ? 999999 : baseRemaining + totalBonusCredits;

  return {
    limit,
    used: usedCount,
    bonusCredits: totalBonusCredits,
    remaining,
    isUnlimited,
    planKey,
    planName,
    limitType,
    periodResetsAt: periodEnd,
  };
}

export type PlanConfig = {
  planId: string;
  planKey: string;
  planName: string;
  priceMonthlyCents: number;
  priceYearlyCents: number;
  currency: string;
  pageAuditLimit: number;
  initialSampleSize: number;
  websiteLimit: number;
  schemaMonthlyLimit: number;
  schemaBuilderEnabled: boolean;
  auditHistoryRetentionDays: number;
  scheduledAuditsEnabled: boolean;
  scheduledAuditFrequency: string;
  reAuditEnabled: boolean;
  auditComparisonEnabled: boolean;
  auditLimitPerMonth: number;
  auditLimitType: string;
  auditResetPeriod: string;
  periodStart: Date;
  periodEnd: Date | null;
  subscriptionId: string | null;
};

export type FullUserUsageSummary = {
  plan: PlanConfig;
  periodStart: Date;
  periodEnd: Date | null;
  pages: {
    limit: number;
    used: number;
    remaining: number;
    initialSampleSize: number;
    isLimitReached: boolean;
    isUnlimited: boolean;
  };
  schemas: {
    limit: number;
    used: number;
    remaining: number;
    isUnlimited: boolean;
    enabled: boolean;
    isLimitReached: boolean;
  };
  websites: {
    limit: number;
    used: number;
    remaining: number;
    isUnlimited: boolean;
    isLimitReached: boolean;
  };
  audits: {
    limit: number;
    used: number;
    remaining: number;
    isUnlimited: boolean;
  };
  features: {
    scheduledAuditsEnabled: boolean;
    scheduledAuditFrequency: string;
    reAuditEnabled: boolean;
    auditComparisonEnabled: boolean;
    auditHistoryRetentionDays: number;
  };
};

/** Get the resolved active Plan config and billing cycle for a user */
export async function getUserPlanConfig(userId: string): Promise<PlanConfig> {
  const activeSub = await db.subscription.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "TRIALING"] },
    },
    include: {
      plan: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  let periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  let periodEnd: Date | null = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  let subscriptionId: string | null = null;

  if (activeSub && activeSub.plan) {
    subscriptionId = activeSub.id;
    if (activeSub.plan.auditResetPeriod === "BILLING_CYCLE" && activeSub.currentPeriodStart && activeSub.currentPeriodEnd) {
      periodStart = new Date(activeSub.currentPeriodStart);
      periodEnd = new Date(activeSub.currentPeriodEnd);
    }
    const plan = activeSub.plan;
    const isSubFree = (plan.key || "").toUpperCase() === "FREE";
    return {
      planId: plan.id,
      planKey: plan.key,
      planName: plan.name,
      priceMonthlyCents: plan.priceMonthlyCents,
      priceYearlyCents: plan.priceYearlyCents,
      currency: plan.currency,
      pageAuditLimit: isSubFree ? 10 : (plan.pageAuditLimit ?? 100),
      initialSampleSize: isSubFree ? 10 : (plan.initialSampleSize ?? 30),
      websiteLimit: plan.websiteLimit ?? 1,
      schemaMonthlyLimit: plan.schemaMonthlyLimit ?? 25,
      schemaBuilderEnabled: plan.schemaBuilderEnabled ?? true,
      auditHistoryRetentionDays: plan.auditHistoryRetentionDays ?? 30,
      scheduledAuditsEnabled: plan.scheduledAuditsEnabled ?? true,
      scheduledAuditFrequency: plan.scheduledAuditFrequency || "MONTHLY",
      reAuditEnabled: plan.reAuditEnabled ?? true,
      auditComparisonEnabled: plan.auditComparisonEnabled ?? true,
      auditLimitPerMonth: plan.auditLimitPerMonth,
      auditLimitType: plan.auditLimitType,
      auditResetPeriod: plan.auditResetPeriod,
      periodStart,
      periodEnd,
      subscriptionId,
    };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  const planKey = user?.plan === "PREMIUM" ? "PRO" : "FREE";
  let plan = await db.plan.findUnique({ where: { key: planKey } });
  if (!plan && planKey === "PRO") {
    plan = await db.plan.findUnique({ where: { key: "PREMIUM" } });
  }
  if (!plan) {
    plan = await db.plan.findUnique({ where: { key: "FREE" } });
  }

  const isFree = planKey === "FREE" || (plan?.key || "").toUpperCase() === "FREE";

  return {
    planId: plan?.id || "default-free",
    planKey: plan?.key || "FREE",
    planName: plan?.name || "Free",
    priceMonthlyCents: plan?.priceMonthlyCents ?? 0,
    priceYearlyCents: plan?.priceYearlyCents ?? 0,
    currency: plan?.currency || "usd",
    pageAuditLimit: isFree ? 10 : (plan?.pageAuditLimit ?? 1000),
    initialSampleSize: isFree ? 10 : (plan?.initialSampleSize ?? 50),
    websiteLimit: plan?.websiteLimit ?? (isFree ? 1 : 5),
    schemaMonthlyLimit: plan?.schemaMonthlyLimit ?? (isFree ? 3 : 100),
    schemaBuilderEnabled: plan?.schemaBuilderEnabled ?? true,
    auditHistoryRetentionDays: plan?.auditHistoryRetentionDays ?? (isFree ? 7 : 90),
    scheduledAuditsEnabled: plan?.scheduledAuditsEnabled ?? !isFree,
    scheduledAuditFrequency: plan?.scheduledAuditFrequency || (isFree ? "DISABLED" : "WEEKLY"),
    reAuditEnabled: plan?.reAuditEnabled ?? true,
    auditComparisonEnabled: plan?.auditComparisonEnabled ?? !isFree,
    auditLimitPerMonth: plan?.auditLimitPerMonth ?? (isFree ? 3 : 50),
    auditLimitType: plan?.auditLimitType || "MONTHLY",
    auditResetPeriod: plan?.auditResetPeriod || "MONTHLY",
    periodStart,
    periodEnd,
    subscriptionId: null,
  };
}

/** Complete user usage summary across all 3 key monthly resources: Pages, Schemas, Websites */
export async function getUserUsageSummary(userId: string): Promise<FullUserUsageSummary> {
  const plan = await getUserPlanConfig(userId);

  // 1. Pages Usage: Sum of AUDIT_PAGE units in current period
  const pageEvents = await db.usageEvent.aggregate({
    where: {
      userId,
      type: { in: ["AUDIT_PAGE", "AUDIT_RUN"] },
      createdAt: { gte: plan.periodStart },
    },
    _sum: { units: true },
  });

  const pageUsed = pageEvents._sum.units ?? 0;
  const pageLimit = plan.pageAuditLimit;
  const pageRemaining = Math.max(0, pageLimit - pageUsed);

  // 2. Schema Usage: Count of SCHEMA_GENERATION events or GeneratedSchemas in current period
  const schemaUsed = await db.usageEvent.count({
    where: {
      userId,
      type: "SCHEMA_GENERATION",
      createdAt: { gte: plan.periodStart },
    },
  });

  const schemaLimit = plan.schemaMonthlyLimit;
  const isSchemaUnlimited = schemaLimit === -1;
  const schemaRemaining = isSchemaUnlimited ? 999999 : Math.max(0, schemaLimit - schemaUsed);

  // 3. Websites Usage: Active Website count
  const websiteCount = await db.website.count({
    where: {
      userId,
      deletedAt: null,
    },
  });

  const websiteLimit = plan.websiteLimit;
  const isWebsiteUnlimited = websiteLimit === -1;
  const websiteRemaining = isWebsiteUnlimited ? 999999 : Math.max(0, websiteLimit - websiteCount);

  return {
    plan,
    periodStart: plan.periodStart,
    periodEnd: plan.periodEnd,
    pages: {
      limit: pageLimit,
      used: pageUsed,
      remaining: pageRemaining,
      initialSampleSize: plan.initialSampleSize,
      isLimitReached: pageRemaining <= 0,
      isUnlimited: pageLimit === -1,
    },
    schemas: {
      limit: schemaLimit,
      used: schemaUsed,
      remaining: schemaRemaining,
      isUnlimited: isSchemaUnlimited,
      enabled: plan.schemaBuilderEnabled,
      isLimitReached: !isSchemaUnlimited && schemaRemaining <= 0,
    },
    websites: {
      limit: websiteLimit,
      used: websiteCount,
      remaining: websiteRemaining,
      isUnlimited: isWebsiteUnlimited,
      isLimitReached: !isWebsiteUnlimited && websiteRemaining <= 0,
    },
    audits: {
      limit: plan.auditLimitPerMonth,
      used: pageUsed > 0 ? 1 : 0,
      remaining: Math.max(0, plan.auditLimitPerMonth - (pageUsed > 0 ? 1 : 0)),
      isUnlimited: plan.auditLimitType === "UNLIMITED",
    },
    features: {
      scheduledAuditsEnabled: plan.scheduledAuditsEnabled,
      scheduledAuditFrequency: plan.scheduledAuditFrequency,
      reAuditEnabled: plan.reAuditEnabled,
      auditComparisonEnabled: plan.auditComparisonEnabled,
      auditHistoryRetentionDays: plan.auditHistoryRetentionDays,
    },
  };
}

/** Record Audit Page consumption in the Usage Ledger */
export async function recordAuditPageUsage({
  userId,
  subscriptionId,
  websiteId,
  reportId,
  pagesCount,
  description,
}: {
  userId: string;
  subscriptionId?: string | null;
  websiteId?: string | null;
  reportId?: string | null;
  pagesCount: number;
  description?: string;
}) {
  if (pagesCount <= 0) return;
  return db.usageEvent.create({
    data: {
      userId,
      subscriptionId,
      websiteId,
      reportId,
      type: "AUDIT_PAGE",
      units: pagesCount,
      featureKey: "AUDIT_PAGE",
      description: description || `Audited ${pagesCount} website pages`,
      metadata: { pagesCount, timestamp: new Date().toISOString() },
    },
  });
}

/** Record Schema Generation in the Usage Ledger */
export async function recordSchemaUsage({
  userId,
  subscriptionId,
  websiteId,
  schemaType,
  name,
}: {
  userId: string;
  subscriptionId?: string | null;
  websiteId?: string | null;
  schemaType: string;
  name?: string | null;
}) {
  return db.usageEvent.create({
    data: {
      userId,
      subscriptionId,
      websiteId,
      type: "SCHEMA_GENERATION",
      units: 1,
      featureKey: "SCHEMA_GENERATOR",
      description: `Generated ${schemaType} schema${name ? `: ${name}` : ""}`,
      metadata: { schemaType, name, timestamp: new Date().toISOString() },
    },
  });
}

/** Check whether user has access to a specific feature flag */
export async function checkUserFeatureAccess(
  userId: string,
  featureKey: string,
): Promise<{ allowed: boolean; limit?: number | null; reason?: string }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, plan: true },
  });

  if (!user) return { allowed: false, reason: "User not found" };
  if (user.role === "MASTER_ADMIN" || user.role === "ADMIN") {
    return { allowed: true, limit: null };
  }

  const config = await getUserPlanConfig(userId);

  if (featureKey === "scheduled_audits") {
    return { allowed: config.scheduledAuditsEnabled, reason: "Scheduled audits require an upgraded plan." };
  }
  if (featureKey === "audit_comparison") {
    return { allowed: config.auditComparisonEnabled, reason: "Audit comparison requires a Starter plan or higher." };
  }
  if (featureKey === "re_audit") {
    return { allowed: config.reAuditEnabled, reason: "Re-auditing is disabled on this plan." };
  }
  if (featureKey === "schema_builder") {
    return { allowed: config.schemaBuilderEnabled, reason: "Schema Builder is disabled on this plan." };
  }

  // Find active subscription plan
  const sub = await db.subscription.findFirst({
    where: { userId, status: { in: ["ACTIVE", "TRIALING"] } },
    include: {
      plan: {
        include: {
          entitlements: {
            where: { featureKey },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (sub?.plan) {
    const entitlement = sub.plan.entitlements[0];
    if (entitlement) {
      return {
        allowed: entitlement.enabled,
        limit: entitlement.limit,
      };
    }
    return { allowed: true };
  }

  const fallbackPlan = await db.plan.findUnique({
    where: { key: user.plan },
    include: {
      entitlements: {
        where: { featureKey },
      },
    },
  });

  if (fallbackPlan) {
    const ent = fallbackPlan.entitlements[0];
    if (ent) {
      return { allowed: ent.enabled, limit: ent.limit };
    }
  }

  if (featureKey === "backlinks" || featureKey === "keywords" || featureKey === "pdf_export") {
    return {
      allowed: user.plan === "PREMIUM",
      reason: "This feature requires an active premium subscription.",
    };
  }

  return { allowed: true };
}

/** Grant bonus credits to a user */
export async function grantUserBonusCredits(
  userId: string,
  units: number,
  reason: string,
  expiresAt: Date | null,
  grantedById?: string,
): Promise<{ ok: boolean; bonusCreditId?: string; error?: string }> {
  try {
    const bonus = await db.$transaction(async (tx) => {
      const row = await tx.bonusCredit.create({
        data: {
          userId,
          units,
          remainingUnits: units,
          reason,
          grantedById,
          expiresAt,
        },
      });

      await tx.usageEvent.create({
        data: {
          userId,
          type: "BONUS_CREDIT_GRANTED",
          units,
          featureKey: "WEBSITE_AUDIT",
          description: reason || `Granted ${units} bonus audit credits`,
        },
      });

      return row;
    });

    return { ok: true, bonusCreditId: bonus.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to grant bonus credits",
    };
  }
}

/** Reset user's usage for current period */
export async function resetUserUsage(
  userId: string,
  actorId?: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await db.usageEvent.create({
      data: {
        userId,
        type: "MANUAL_RESET",
        units: 0,
        featureKey: "WEBSITE_AUDIT",
        description: `Usage manually reset by admin`,
      },
    });

    if (actorId) {
      await db.billingAuditLog.create({
        data: {
          actorId,
          action: "user.usage_reset",
          entityType: "user",
          entityId: userId,
          metadata: { userId },
        },
      });
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to reset usage",
    };
  }
}
