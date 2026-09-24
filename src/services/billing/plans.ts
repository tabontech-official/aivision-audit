import "server-only";
import { db } from "@/lib/db/client";
import { STANDARD_FEATURE_KEYS } from "./entitlements";
import { syncPlanToStripe } from "./stripe-sync";

export type PlanWithDetails = Awaited<ReturnType<typeof getPlanById>>;

export async function getAdminPlans() {
  const plans = await db.plan.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      prices: true,
      entitlements: true,
      publicFeatures: { orderBy: { displayOrder: "asc" } },
      _count: {
        select: {
          subscriptions: {
            where: { status: { in: ["ACTIVE", "TRIALING"] } },
          },
        },
      },
    },
  });

  return plans;
}

export async function getPublicPlans() {
  const plans = await db.plan.findMany({
    where: { isActive: true, isPublic: true },
    orderBy: { displayOrder: "asc" },
    include: {
      prices: { where: { isActive: true } },
      publicFeatures: { orderBy: { displayOrder: "asc" } },
      entitlements: true,
    },
  });

  return plans;
}

export async function getPlanById(id: string) {
  const plan = await db.plan.findUnique({
    where: { id },
    include: {
      prices: true,
      entitlements: true,
      publicFeatures: { orderBy: { displayOrder: "asc" } },
      subscriptions: {
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, email: true, name: true, createdAt: true } },
        },
      },
      _count: {
        select: {
          subscriptions: { where: { status: { in: ["ACTIVE", "TRIALING"] } } },
        },
      },
    },
  });

  return plan;
}

export type PlanInput = {
  key: string;
  name: string;
  description?: string | null;
  priceMonthlyCents: number;
  priceYearlyCents: number;
  currency?: string;
  auditLimitPerMonth: number;
  pageAuditLimit?: number;
  initialSampleSize?: number;
  auditLimitType?: string;
  auditResetPeriod?: string;
  concurrentAuditsLimit?: number;
  autoRefundOnFailure?: boolean;
  trialDays?: number;
  setupFeeCents?: number;
  isActive?: boolean;
  isPublic?: boolean;
  isPopular?: boolean;
  badgeText?: string | null;
  customCtaText?: string | null;
  customCtaUrl?: string | null;
  displayOrder?: number;
  adminNotes?: string | null;
  entitlements?: Array<{
    featureKey: string;
    enabled: boolean;
    limit?: number | null;
  }>;
  publicFeatures?: Array<{
    label: string;
    isIncluded: boolean;
    displayOrder: number;
  }>;
  autoSyncStripe?: boolean;
};

export async function createPlan(input: PlanInput, actorId: string) {
  try {
    const slug = input.key
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, "-");

    const existing = await db.plan.findUnique({ where: { key: slug } });
    if (existing) {
      return { ok: false, error: `Plan slug '${slug}' already exists. Please choose a unique slug.` };
    }

    const maxOrder = await db.plan.aggregate({ _max: { displayOrder: true } });
    const nextOrder = input.displayOrder ?? (maxOrder._max.displayOrder ?? 0) + 1;

    const plan = await db.plan.create({
      data: {
        key: slug,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        priceMonthlyCents: input.priceMonthlyCents ?? 0,
        priceYearlyCents: input.priceYearlyCents ?? 0,
        currency: (input.currency || "usd").toLowerCase(),
        auditLimitPerMonth: input.auditLimitPerMonth ?? 10,
        pageAuditLimit: input.pageAuditLimit ?? 100,
        initialSampleSize: input.initialSampleSize ?? 30,
        auditLimitType: input.auditLimitType || "MONTHLY",
        auditResetPeriod: input.auditResetPeriod || "MONTHLY",
        concurrentAuditsLimit: input.concurrentAuditsLimit ?? 1,
        autoRefundOnFailure: input.autoRefundOnFailure ?? true,
        trialDays: input.trialDays ?? 0,
        setupFeeCents: input.setupFeeCents ?? 0,
        isActive: input.isActive ?? true,
        isPublic: input.isPublic ?? true,
        isPopular: input.isPopular ?? false,
        badgeText: input.badgeText?.trim() || null,
        customCtaText: input.customCtaText?.trim() || null,
        customCtaUrl: input.customCtaUrl?.trim() || null,
        displayOrder: nextOrder,
        adminNotes: input.adminNotes?.trim() || null,
      },
    });

    // Create default prices
    if (input.priceMonthlyCents > 0) {
      await db.planPrice.create({
        data: {
          planId: plan.id,
          interval: "month",
          amountCents: input.priceMonthlyCents,
          currency: plan.currency,
          isActive: true,
        },
      });
    }

    if (input.priceYearlyCents > 0) {
      await db.planPrice.create({
        data: {
          planId: plan.id,
          interval: "year",
          amountCents: input.priceYearlyCents,
          currency: plan.currency,
          isActive: true,
        },
      });
    }

    // Create entitlements
    const entitlementsToInsert =
      input.entitlements && input.entitlements.length > 0
        ? input.entitlements
        : STANDARD_FEATURE_KEYS.map((f) => ({
            featureKey: f.key,
            enabled: f.defaultEnabled,
            limit: null,
          }));

    for (const ent of entitlementsToInsert) {
      await db.planEntitlement.create({
        data: {
          planId: plan.id,
          featureKey: ent.featureKey,
          enabled: ent.enabled,
          limit: ent.limit ?? null,
        },
      });
    }

    // Create public features
    if (input.publicFeatures && input.publicFeatures.length > 0) {
      for (const [idx, pf] of input.publicFeatures.entries()) {
        await db.planPublicFeature.create({
          data: {
            planId: plan.id,
            label: pf.label.trim(),
            isIncluded: pf.isIncluded ?? true,
            displayOrder: pf.displayOrder ?? idx,
          },
        });
      }
    }

    // Auto-sync to Stripe if requested and non-free
    if (input.autoSyncStripe && (plan.priceMonthlyCents > 0 || plan.priceYearlyCents > 0)) {
      await syncPlanToStripe(plan.id, actorId);
    }

    await db.billingAuditLog.create({
      data: {
        actorId,
        action: "plan.created",
        entityType: "plan",
        entityId: plan.id,
        metadata: { planKey: plan.key, name: plan.name },
      },
    });

    return { ok: true, planId: plan.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to create plan",
    };
  }
}

export async function updatePlan(id: string, input: Partial<PlanInput>, actorId: string) {
  try {
    const existing = await db.plan.findUnique({ where: { id } });
    if (!existing) return { ok: false, error: "Plan not found" };

    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.description !== undefined) updateData.description = input.description?.trim() || null;
    if (input.priceMonthlyCents !== undefined) updateData.priceMonthlyCents = input.priceMonthlyCents;
    if (input.priceYearlyCents !== undefined) updateData.priceYearlyCents = input.priceYearlyCents;
    if (input.currency !== undefined) updateData.currency = input.currency.toLowerCase();
    if (input.auditLimitPerMonth !== undefined) updateData.auditLimitPerMonth = input.auditLimitPerMonth;
    if (input.pageAuditLimit !== undefined) updateData.pageAuditLimit = input.pageAuditLimit;
    if (input.initialSampleSize !== undefined) updateData.initialSampleSize = input.initialSampleSize;
    if (input.auditLimitType !== undefined) updateData.auditLimitType = input.auditLimitType;
    if (input.auditResetPeriod !== undefined) updateData.auditResetPeriod = input.auditResetPeriod;
    if (input.concurrentAuditsLimit !== undefined) updateData.concurrentAuditsLimit = input.concurrentAuditsLimit;
    if (input.autoRefundOnFailure !== undefined) updateData.autoRefundOnFailure = input.autoRefundOnFailure;
    if (input.trialDays !== undefined) updateData.trialDays = input.trialDays;
    if (input.setupFeeCents !== undefined) updateData.setupFeeCents = input.setupFeeCents;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.isPublic !== undefined) updateData.isPublic = input.isPublic;
    if (input.isPopular !== undefined) updateData.isPopular = input.isPopular;
    if (input.badgeText !== undefined) updateData.badgeText = input.badgeText?.trim() || null;
    if (input.customCtaText !== undefined) updateData.customCtaText = input.customCtaText?.trim() || null;
    if (input.customCtaUrl !== undefined) updateData.customCtaUrl = input.customCtaUrl?.trim() || null;
    if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;
    if (input.adminNotes !== undefined) updateData.adminNotes = input.adminNotes?.trim() || null;

    await db.plan.update({
      where: { id },
      data: updateData,
    });

    // Update entitlements if provided
    if (input.entitlements) {
      for (const ent of input.entitlements) {
        await db.planEntitlement.upsert({
          where: { planId_featureKey: { planId: id, featureKey: ent.featureKey } },
          update: { enabled: ent.enabled, limit: ent.limit ?? null },
          create: {
            planId: id,
            featureKey: ent.featureKey,
            enabled: ent.enabled,
            limit: ent.limit ?? null,
          },
        });
      }
    }

    // Update public features if provided
    if (input.publicFeatures) {
      await db.planPublicFeature.deleteMany({ where: { planId: id } });
      for (const [idx, pf] of input.publicFeatures.entries()) {
        await db.planPublicFeature.create({
          data: {
            planId: id,
            label: pf.label.trim(),
            isIncluded: pf.isIncluded ?? true,
            displayOrder: pf.displayOrder ?? idx,
          },
        });
      }
    }

    // Check if Stripe sync is needed
    if (input.autoSyncStripe) {
      await syncPlanToStripe(id, actorId);
    }

    await db.billingAuditLog.create({
      data: {
        actorId,
        action: "plan.updated",
        entityType: "plan",
        entityId: id,
        metadata: { changes: Object.keys(updateData) },
      },
    });

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update plan",
    };
  }
}

export async function duplicatePlan(id: string, actorId: string) {
  try {
    const original = await db.plan.findUnique({
      where: { id },
      include: {
        entitlements: true,
        publicFeatures: true,
      },
    });

    if (!original) return { ok: false, error: "Original plan not found" };

    const newSlug = `${original.key}-copy-${Date.now().toString().slice(-4)}`;
    const newName = `${original.name} (Copy)`;

    const newPlan = await db.plan.create({
      data: {
        key: newSlug,
        name: newName,
        description: original.description,
        priceMonthlyCents: original.priceMonthlyCents,
        priceYearlyCents: original.priceYearlyCents,
        currency: original.currency,
        auditLimitPerMonth: original.auditLimitPerMonth,
        pageAuditLimit: original.pageAuditLimit,
        initialSampleSize: original.initialSampleSize,
        auditLimitType: original.auditLimitType,
        auditResetPeriod: original.auditResetPeriod,
        concurrentAuditsLimit: original.concurrentAuditsLimit,
        autoRefundOnFailure: original.autoRefundOnFailure,
        trialDays: original.trialDays,
        setupFeeCents: original.setupFeeCents,
        isActive: false, // Inactive by default for copied plans
        isPublic: false,
        isPopular: false,
        badgeText: original.badgeText,
        customCtaText: original.customCtaText,
        displayOrder: original.displayOrder + 1,
        adminNotes: `Cloned from ${original.name}`,
      },
    });

    for (const ent of original.entitlements) {
      await db.planEntitlement.create({
        data: {
          planId: newPlan.id,
          featureKey: ent.featureKey,
          enabled: ent.enabled,
          limit: ent.limit,
        },
      });
    }

    for (const pf of original.publicFeatures) {
      await db.planPublicFeature.create({
        data: {
          planId: newPlan.id,
          label: pf.label,
          isIncluded: pf.isIncluded,
          displayOrder: pf.displayOrder,
        },
      });
    }

    await db.billingAuditLog.create({
      data: {
        actorId,
        action: "plan.duplicated",
        entityType: "plan",
        entityId: newPlan.id,
        metadata: { originalPlanId: id, newPlanId: newPlan.id },
      },
    });

    return { ok: true, planId: newPlan.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to duplicate plan",
    };
  }
}

export async function deletePlan(id: string, actorId: string) {
  try {
    const plan = await db.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    if (!plan) return { ok: false, error: "Plan not found" };

    if (plan._count.subscriptions > 0) {
      // Archive instead of hard delete to protect foreign keys and historical records
      await db.plan.update({
        where: { id },
        data: { isActive: false, isPublic: false },
      });

      await db.billingAuditLog.create({
        data: {
          actorId,
          action: "plan.archived",
          entityType: "plan",
          entityId: id,
          metadata: { subscriberCount: plan._count.subscriptions },
        },
      });

      return {
        ok: true,
        archived: true,
        message: "Plan has active or historical subscriptions. It has been deactivated and hidden from public pricing.",
      };
    }

    await db.plan.delete({ where: { id } });

    await db.billingAuditLog.create({
      data: {
        actorId,
        action: "plan.deleted",
        entityType: "plan",
        entityId: id,
        metadata: { planKey: plan.key },
      },
    });

    return { ok: true, deleted: true, message: "Plan deleted successfully." };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to delete plan",
    };
  }
}

export async function reorderPlans(orders: Array<{ id: string; displayOrder: number }>, actorId: string) {
  try {
    await db.$transaction(
      orders.map((o) =>
        db.plan.update({
          where: { id: o.id },
          data: { displayOrder: o.displayOrder },
        }),
      ),
    );

    await db.billingAuditLog.create({
      data: {
        actorId,
        action: "plans.reordered",
        entityType: "plans",
        metadata: { count: orders.length },
      },
    });

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to reorder plans",
    };
  }
}
