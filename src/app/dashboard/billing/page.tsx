import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/rbac";
import { db } from "@/lib/db/client";
import { isStripeConfigured } from "@/lib/stripe/client";
import { BillingClient, type BillingData } from "./billing-client";

export const metadata: Metadata = { title: "Billing" };
export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await requireUser();

  const [premiumPlan, subscription, invoices] = await Promise.all([
    db.plan.findUnique({
      where: { key: "PREMIUM" },
      include: { features: { orderBy: { displayOrder: "asc" } } },
    }),
    db.subscription.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    db.invoice.findMany({
      where: { userId: user.id },
      orderBy: { issuedAt: "desc" },
      take: 12,
    }),
  ]);

  const data: BillingData = {
    plan: user.plan,
    stripeConfigured: isStripeConfigured(),
    premium: {
      priceMonthly: premiumPlan ? premiumPlan.priceMonthlyCents / 100 : 29,
      priceYearly: premiumPlan ? premiumPlan.priceYearlyCents / 100 : 290,
      features: (premiumPlan?.features ?? []).map((f) => f.label),
    },
    subscription: subscription
      ? {
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        }
      : null,
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
