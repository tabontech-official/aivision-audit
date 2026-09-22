import "server-only";
import { db } from "@/lib/db/client";
import { requireDynamicStripe } from "./stripe-admin";

export type StripeSyncResult = {
  ok: boolean;
  message: string;
  stripeProductId?: string;
  stripePriceMonthlyId?: string;
  stripePriceYearlyId?: string;
  error?: string;
};

/**
 * Synchronizes a Plan to Stripe.
 * Creates/updates Stripe Product and creates immutable Stripe Prices for Monthly and Yearly intervals.
 */
export async function syncPlanToStripe(planId: string, actorId?: string): Promise<StripeSyncResult> {
  try {
    const stripe = await requireDynamicStripe();
    const plan = await db.plan.findUnique({
      where: { id: planId },
      include: { prices: true },
    });

    if (!plan) {
      return { ok: false, message: "Plan not found", error: "Plan not found" };
    }

    let productId = plan.stripeProductId;

    // 1. Create or Update Stripe Product
    if (!productId) {
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description || undefined,
        active: plan.isActive,
        metadata: {
          internal_plan_id: plan.id,
          plan_slug: plan.key,
          app: "the_rank_writers",
        },
      });
      productId = product.id;
    } else {
      await stripe.products.update(productId, {
        name: plan.name,
        description: plan.description || undefined,
        active: plan.isActive,
        metadata: {
          internal_plan_id: plan.id,
          plan_slug: plan.key,
          app: "the_rank_writers",
        },
      });
    }

    let monthlyPriceId = plan.stripePriceMonthlyId;
    let yearlyPriceId = plan.stripePriceYearlyId;

    // 2. Synchronize Monthly Price (if > 0 or if not created yet)
    if (plan.priceMonthlyCents > 0) {
      let needsNewPrice = !monthlyPriceId;
      if (monthlyPriceId) {
        try {
          const currentPrice = await stripe.prices.retrieve(monthlyPriceId);
          if (
            currentPrice.unit_amount !== plan.priceMonthlyCents ||
            currentPrice.currency.toLowerCase() !== plan.currency.toLowerCase() ||
            !currentPrice.active
          ) {
            needsNewPrice = true;
          }
        } catch {
          needsNewPrice = true;
        }
      }

      if (needsNewPrice) {
        const newPrice = await stripe.prices.create({
          product: productId,
          unit_amount: plan.priceMonthlyCents,
          currency: plan.currency.toLowerCase(),
          recurring: {
            interval: "month",
            interval_count: 1,
          },
          metadata: {
            internal_plan_id: plan.id,
            plan_slug: plan.key,
            interval: "monthly",
          },
        });
        monthlyPriceId = newPrice.id;

        // Upsert in PlanPrice
        await db.planPrice.upsert({
          where: {
            id: plan.prices.find((p) => p.interval === "month")?.id || "00000000-0000-0000-0000-000000000000",
          },
          update: {
            amountCents: plan.priceMonthlyCents,
            currency: plan.currency.toLowerCase(),
            stripePriceId: monthlyPriceId,
            isActive: true,
          },
          create: {
            planId: plan.id,
            interval: "month",
            amountCents: plan.priceMonthlyCents,
            currency: plan.currency.toLowerCase(),
            stripePriceId: monthlyPriceId,
            isActive: true,
          },
        });
      }
    }

    // 3. Synchronize Yearly Price (if > 0 or if not created yet)
    if (plan.priceYearlyCents > 0) {
      let needsNewPrice = !yearlyPriceId;
      if (yearlyPriceId) {
        try {
          const currentPrice = await stripe.prices.retrieve(yearlyPriceId);
          if (
            currentPrice.unit_amount !== plan.priceYearlyCents ||
            currentPrice.currency.toLowerCase() !== plan.currency.toLowerCase() ||
            !currentPrice.active
          ) {
            needsNewPrice = true;
          }
        } catch {
          needsNewPrice = true;
        }
      }

      if (needsNewPrice) {
        const newPrice = await stripe.prices.create({
          product: productId,
          unit_amount: plan.priceYearlyCents,
          currency: plan.currency.toLowerCase(),
          recurring: {
            interval: "year",
            interval_count: 1,
          },
          metadata: {
            internal_plan_id: plan.id,
            plan_slug: plan.key,
            interval: "yearly",
          },
        });
        yearlyPriceId = newPrice.id;

        // Upsert in PlanPrice
        await db.planPrice.upsert({
          where: {
            id: plan.prices.find((p) => p.interval === "year")?.id || "00000000-0000-0000-0000-000000000000",
          },
          update: {
            amountCents: plan.priceYearlyCents,
            currency: plan.currency.toLowerCase(),
            stripePriceId: yearlyPriceId,
            isActive: true,
          },
          create: {
            planId: plan.id,
            interval: "year",
            amountCents: plan.priceYearlyCents,
            currency: plan.currency.toLowerCase(),
            stripePriceId: yearlyPriceId,
            isActive: true,
          },
        });
      }
    }

    // 4. Update Plan with new Stripe IDs
    await db.plan.update({
      where: { id: plan.id },
      data: {
        stripeProductId: productId,
        stripePriceMonthlyId: monthlyPriceId,
        stripePriceYearlyId: yearlyPriceId,
      },
    });

    // 5. Create Audit Log
    if (actorId) {
      await db.billingAuditLog.create({
        data: {
          actorId,
          action: "plan.synced_to_stripe",
          entityType: "plan",
          entityId: plan.id,
          metadata: {
            planKey: plan.key,
            stripeProductId: productId,
            stripePriceMonthlyId: monthlyPriceId,
            stripePriceYearlyId: yearlyPriceId,
          },
        },
      });
    }

    return {
      ok: true,
      message: `Successfully synchronized ${plan.name} to Stripe!`,
      stripeProductId: productId,
      stripePriceMonthlyId: monthlyPriceId ?? undefined,
      stripePriceYearlyId: yearlyPriceId ?? undefined,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Failed to sync plan to Stripe";
    return {
      ok: false,
      message: errorMsg,
      error: errorMsg,
    };
  }
}
