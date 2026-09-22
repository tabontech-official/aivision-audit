import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/rbac";
import { db } from "@/lib/db/client";
import { getStripeSettings } from "@/services/billing/stripe-admin";
import { getUserAuditAllowance } from "@/services/billing/entitlements";
import { getPublicPlans } from "@/services/billing/plans";
import { BillingClient } from "./billing-client";

export const metadata: Metadata = { title: "Billing & Plans" };
export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await requireUser();

  const [stripeSettings, allowance, publicPlans, subscription, invoices] = await Promise.all([
    getStripeSettings(),
    getUserAuditAllowance(user.id),
    getPublicPlans(),
    db.subscription.findFirst({
      where: { userId: user.id },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
    db.invoice.findMany({
      where: { userId: user.id },
      orderBy: { issuedAt: "desc" },
      take: 12,
    }),
  ]);

  const activePlanName = subscription?.plan?.name || allowance.planName;
  const isPaidUser = user.plan === "PREMIUM" || (subscription?.status === "ACTIVE" || subscription?.status === "TRIALING");

  const data = {
    planKey: allowance.planKey,
    planName: activePlanName,
    isPaidUser,
    stripeConfigured: stripeSettings.secretKeySet,
    allowance: {
      limit: allowance.limit,
      used: allowance.used,
      bonusCredits: allowance.bonusCredits,
      remaining: allowance.remaining,
      isUnlimited: allowance.isUnlimited,
      periodResetsAt: allowance.periodResetsAt?.toISOString() ?? null,
    },
    subscription: subscription
      ? {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          planName: subscription.plan?.name ?? activePlanName,
        }
      : null,
    availablePlans: publicPlans.map((p) => ({
      id: p.id,
      key: p.key,
      name: p.name,
      description: p.description,
      priceMonthly: p.priceMonthlyCents / 100,
      priceYearly: p.priceYearlyCents / 100,
      trialDays: p.trialDays,
      isPopular: p.isPopular,
      badgeText: p.badgeText,
      customCtaText: p.customCtaText,
      auditLimitPerMonth: p.auditLimitPerMonth,
      auditLimitType: p.auditLimitType,
      features: p.publicFeatures.map((pf) => ({
        label: pf.label,
        isIncluded: pf.isIncluded,
      })),
    })),
    invoices: invoices.map((i) => ({
      id: i.id,
      number: i.invoiceNumber,
      amountCents: i.amountCents,
      currency: i.currency,
      issuedAt: i.issuedAt?.toISOString() ?? null,
      hostedInvoiceUrl: i.hostedInvoiceUrl,
      pdfUrl: i.pdfUrl,
    })),
  };

  return <BillingClient data={data} />;
}
