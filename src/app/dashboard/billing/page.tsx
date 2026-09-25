import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/rbac";
import { db } from "@/lib/db/client";
import { getStripeSettings } from "@/services/billing/stripe-admin";
import { getUserUsageSummary } from "@/services/billing/entitlements";
import { getPublicPlans } from "@/services/billing/plans";
import { BillingClient } from "./billing-client";

export const metadata: Metadata = { title: "Billing & Plans" };
export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await requireUser();

  const [stripeSettings, usageSummary, publicPlans, subscription, invoices] = await Promise.all([
    getStripeSettings(),
    getUserUsageSummary(user.id),
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

  const activePlanName = subscription?.plan?.name || usageSummary.plan.planName;
  const isPaidUser = user.plan === "PREMIUM" || (subscription?.status === "ACTIVE" || subscription?.status === "TRIALING");

  const data = {
    planKey: usageSummary.plan.planKey,
    planName: activePlanName,
    isPaidUser,
    stripeConfigured: stripeSettings.secretKeySet,
    usage: {
      pages: usageSummary.pages,
      websites: usageSummary.websites,
      schemas: usageSummary.schemas,
      audits: usageSummary.audits,
      periodStart: usageSummary.periodStart.toISOString(),
      periodEnd: usageSummary.periodEnd ? usageSummary.periodEnd.toISOString() : null,
      plan: {
        key: usageSummary.plan.planKey,
        name: usageSummary.plan.planName,
        pageAuditLimit: usageSummary.plan.pageAuditLimit,
        initialSampleSize: usageSummary.plan.initialSampleSize,
        websiteLimit: usageSummary.plan.websiteLimit,
        schemaMonthlyLimit: usageSummary.plan.schemaMonthlyLimit,
        schemaBuilderEnabled: usageSummary.plan.schemaBuilderEnabled,
        auditHistoryRetentionDays: usageSummary.plan.auditHistoryRetentionDays,
        scheduledAuditFrequency: usageSummary.plan.scheduledAuditFrequency,
        scheduledAuditsEnabled: usageSummary.plan.scheduledAuditsEnabled,
        reAuditEnabled: usageSummary.plan.reAuditEnabled,
        auditComparisonEnabled: usageSummary.plan.auditComparisonEnabled,
      },
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
