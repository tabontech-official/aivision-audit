"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, Award, ExternalLink, Loader2, Gift, Zap, Shield, CreditCard } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils/cn";
import { startDynamicCheckoutAction, openPortalAction } from "./actions";

export type CustomerBillingData = {
  planKey: string;
  planName: string;
  isPaidUser: boolean;
  stripeConfigured: boolean;
  usage?: {
    pages: { limit: number; used: number; remaining: number; isLimitReached: boolean; isUnlimited: boolean };
    websites: { limit: number; used: number; remaining: number; isLimitReached: boolean; isUnlimited: boolean };
    schemas: { limit: number; used: number; remaining: number; isLimitReached: boolean; isUnlimited: boolean; enabled: boolean };
    audits: { limit: number; used: number; remaining: number; isUnlimited: boolean };
    periodStart: string;
    periodEnd: string | null;
    plan: {
      key: string;
      name: string;
      pageAuditLimit: number;
      initialSampleSize: number;
      websiteLimit: number;
      schemaMonthlyLimit: number;
      schemaBuilderEnabled: boolean;
      auditHistoryRetentionDays: number;
      scheduledAuditFrequency: string;
      scheduledAuditsEnabled: boolean;
      reAuditEnabled: boolean;
      auditComparisonEnabled: boolean;
    };
  };
  allowance?: {
    limit: number;
    used: number;
    bonusCredits: number;
    remaining: number;
    isUnlimited: boolean;
    periodResetsAt: string | null;
  };
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    planName: string;
  } | null;
  availablePlans: Array<{
    id: string;
    key: string;
    name: string;
    description: string | null;
    priceMonthly: number;
    priceYearly: number;
    trialDays: number;
    isPopular: boolean;
    badgeText: string | null;
    customCtaText: string | null;
    auditLimitPerMonth: number;
    auditLimitType: string;
    features: Array<{ label: string; isIncluded: boolean }>;
  }>;
  invoices: Array<{
    id: string;
    number: string | null;
    amountCents: number;
    currency: string;
    issuedAt: string | null;
    hostedInvoiceUrl: string | null;
    pdfUrl: string | null;
  }>;
};

export function BillingClient({ data }: { data: CustomerBillingData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [interval, setIntervalState] = useState<"monthly" | "yearly">("monthly");
  const [refreshing, setRefreshing] = useState(false);
  const [checkoutTargetPlanId, setCheckoutTargetPlanId] = useState<string | null>(null);

  const checkout = searchParams.get("checkout");

  useEffect(() => {
    if (checkout !== "success" || data.isPaidUser) return;
    let attempts = 0;
    setRefreshing(true);
    const tick = async () => {
      attempts++;
      await update();
      router.refresh();
      if (attempts >= 5) setRefreshing(false);
    };
    const id = setInterval(tick, 2500);
    void tick();
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkout, data.isPaidUser]);

  const handleSelectPlan = (planId: string) => {
    setError(null);
    setCheckoutTargetPlanId(planId);
    startTransition(async () => {
      const r = await startDynamicCheckoutAction(planId, interval);
      if (r.ok) {
        window.location.href = r.url;
      } else {
        setError(r.error);
        setCheckoutTargetPlanId(null);
      }
    });
  };

  const manage = () => {
    setError(null);
    startTransition(async () => {
      const r = await openPortalAction();
      if (r.ok) window.location.href = r.url;
      else setError(r.error);
    });
  };

  const pagesUsed = data.usage?.pages.used ?? data.allowance?.used ?? 0;
  const pagesLimit = data.usage?.pages.limit ?? data.allowance?.limit ?? 10;
  const isPagesUnlimited = data.usage?.pages.isUnlimited ?? data.allowance?.isUnlimited ?? false;
  const pagesPercent = isPagesUnlimited ? 0 : Math.min(100, Math.round((pagesUsed / (pagesLimit || 1)) * 100));

  const schemasUsed = data.usage?.schemas.used ?? 0;
  const schemasLimit = data.usage?.schemas.limit ?? 25;
  const isSchemasUnlimited = data.usage?.schemas.isUnlimited ?? false;
  const schemasPercent = isSchemasUnlimited ? 0 : Math.min(100, Math.round((schemasUsed / (schemasLimit || 1)) * 100));

  const websitesUsed = data.usage?.websites.used ?? 1;
  const websitesLimit = data.usage?.websites.limit ?? 1;
  const isWebsitesUnlimited = data.usage?.websites.isUnlimited ?? false;
  const websitesPercent = isWebsitesUnlimited ? 0 : Math.min(100, Math.round((websitesUsed / (websitesLimit || 1)) * 100));

  const resetDate = data.usage?.periodEnd ?? data.allowance?.periodResetsAt;

  return (
    <div className="space-y-8 font-lazzer text-slate-800">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Billing & Plans</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Manage your monthly subscription, page crawl allowances, schema quotas, and website limits.
        </p>
      </div>

      {checkout === "success" && !data.isPaidUser && refreshing && (
        <Alert variant="info">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Payment received — activating your subscription plan…
          </span>
        </Alert>
      )}
      {checkout === "success" && data.isPaidUser && (
        <Alert variant="success">Welcome! Your subscription is now active.</Alert>
      )}
      {checkout === "canceled" && (
        <Alert variant="warning">Checkout canceled. You have not been charged.</Alert>
      )}
      {error && <Alert variant="error">{error}</Alert>}

      {/* Active Tier Summary Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-500">Current Plan &amp; Billing Cycle</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xl font-bold text-slate-900">{data.planName}</span>
            <span
              className={cn(
                "rounded-md px-2.5 py-0.5 text-xs font-bold border",
                data.isPaidUser
                  ? "bg-[#dff2ed] text-slate-900 border-[#2f7a68]/30"
                  : "bg-slate-100 text-slate-700 border-slate-200",
              )}
            >
              {data.isPaidUser ? "Active Subscription" : "Free Plan"}
            </span>
          </div>
          {resetDate && (
            <div className="mt-1 text-xs text-slate-500">
              Monthly allowances reset on <strong>{formatDate(resetDate)}</strong>
            </div>
          )}
          {data.subscription?.cancelAtPeriodEnd && (
            <div className="mt-1 text-xs font-semibold text-amber-700">
              Cancels on {formatDate(data.subscription.currentPeriodEnd)}
            </div>
          )}
        </div>

        <div>
          {data.isPaidUser ? (
            <button
              type="button"
              onClick={manage}
              disabled={pending || !data.stripeConfigured}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Manage in Stripe Portal</span>
            </button>
          ) : (
            <span className="text-xs text-slate-500">
              Upgrade to higher crawl capacity &amp; multi-website limits.
            </span>
          )}
        </div>
      </div>

      {/* 3 Core SaaS Usage Meters */}
      <div className="grid gap-5 sm:grid-cols-3">
        {/* Meter 1: Monthly Crawl / Page Audit Allowance */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Page Crawl Allowance</span>
              <span className="text-[11px] font-mono text-slate-400">Monthly</span>
            </div>

            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">{pagesUsed}</span>
              <span className="text-xs font-semibold text-slate-500">
                / {isPagesUnlimited ? "Unlimited" : `${pagesLimit} pages`}
              </span>
            </div>

            {!isPagesUnlimited && (
              <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    pagesPercent > 90 ? "bg-rose-500" : pagesPercent > 70 ? "bg-amber-500" : "bg-slate-900",
                  )}
                  style={{ width: `${pagesPercent}%` }}
                />
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
            <span>Remaining: <strong>{isPagesUnlimited ? "Unlimited" : Math.max(0, pagesLimit - pagesUsed)}</strong></span>
            {data.usage?.plan.initialSampleSize && (
              <span className="text-[10px] text-slate-400">Sample: {data.usage.plan.initialSampleSize} pgs</span>
            )}
          </div>
        </div>

        {/* Meter 2: Schema Builder Monthly Generations */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Schema Builder</span>
              <span className="text-[11px] font-mono text-slate-400">Monthly</span>
            </div>

            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">{schemasUsed}</span>
              <span className="text-xs font-semibold text-slate-500">
                / {isSchemasUnlimited ? "Unlimited" : `${schemasLimit} schemas`}
              </span>
            </div>

            {!isSchemasUnlimited && (
              <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    schemasPercent > 90 ? "bg-rose-500" : schemasPercent > 70 ? "bg-amber-500" : "bg-slate-900",
                  )}
                  style={{ width: `${schemasPercent}%` }}
                />
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
            <span>Remaining: <strong>{isSchemasUnlimited ? "Unlimited" : Math.max(0, schemasLimit - schemasUsed)}</strong></span>
            <a href="/dashboard/schema" className="text-[11px] font-bold text-slate-900 hover:underline">
              Open Suite &rarr;
            </a>
          </div>
        </div>

        {/* Meter 3: Active Websites / Projects Limit */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Website Projects</span>
              <span className="text-[11px] font-mono text-slate-400">Active</span>
            </div>

            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">{websitesUsed}</span>
              <span className="text-xs font-semibold text-slate-500">
                / {isWebsitesUnlimited ? "Unlimited" : `${websitesLimit} domains`}
              </span>
            </div>

            {!isWebsitesUnlimited && (
              <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    websitesPercent > 90 ? "bg-rose-500" : websitesPercent > 70 ? "bg-amber-500" : "bg-slate-900",
                  )}
                  style={{ width: `${websitesPercent}%` }}
                />
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
            <span>Retention: <strong>{data.usage?.plan.auditHistoryRetentionDays ?? 30} days</strong></span>
            <span className="text-[10px] text-slate-400">
              {data.usage?.plan.scheduledAuditsEnabled ? `${data.usage.plan.scheduledAuditFrequency} audits` : "Manual only"}
            </span>
          </div>
        </div>
      </div>

      {/* Available Plans & Upgrades */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Available Plans & Upgrades</h2>
            <p className="text-xs text-slate-500">
              Choose the right tier for your websites and audit volume.
            </p>
          </div>

          {/* Monthly / Annual switch */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-bold">
            <button
              onClick={() => setIntervalState("monthly")}
              className={cn(
                "rounded-lg px-3.5 py-1.5 transition-all cursor-pointer",
                interval === "monthly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800",
              )}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setIntervalState("yearly")}
              className={cn(
                "rounded-lg px-3.5 py-1.5 transition-all cursor-pointer flex items-center gap-1",
                interval === "yearly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800",
              )}
            >
              <span>Annual Billing</span>
              <span className="rounded bg-[#dff2ed] px-1.5 py-0.2 text-[10px] font-extrabold text-[#1b4e42]">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.availablePlans.map((plan) => {
            const price = interval === "yearly" ? plan.priceYearly : plan.priceMonthly;
            const per = interval === "yearly" ? "year" : "month";
            const isCurrentPlan = data.planKey.toLowerCase() === plan.key.toLowerCase();
            const isTargetLoading = pending && checkoutTargetPlanId === plan.id;

            return (
              <div
                key={plan.id}
                className={cn(
                  "flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-xs transition-all",
                  plan.isPopular ? "border-slate-900 ring-1 ring-slate-900" : "border-slate-200/80",
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                    {plan.badgeText && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#dff2ed] px-2.5 py-0.5 text-[10px] font-bold text-slate-900">
                        <Award className="h-3 w-3 text-[#1b4e42]" />
                        {plan.badgeText}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500 min-h-[32px]">{plan.description}</p>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">${price}</span>
                    <span className="text-xs font-semibold text-slate-500">/ {per}</span>
                  </div>

                  <div className="mt-3 rounded-lg bg-slate-50 p-2 text-xs font-semibold text-slate-700">
                    {plan.auditLimitType === "UNLIMITED"
                      ? "Unlimited Audits"
                      : `${plan.auditLimitPerMonth} Audits included`}
                  </div>

                  <ul className="mt-5 space-y-2.5">
                    {plan.features.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <span>{f.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isCurrentPlan || isTargetLoading || !data.stripeConfigured}
                    onClick={() => handleSelectPlan(plan.id)}
                    className={cn(
                      "w-full rounded-xl py-2.5 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5",
                      isCurrentPlan
                        ? "bg-slate-100 text-slate-400 cursor-default"
                        : plan.isPopular
                        ? "bg-slate-900 text-[#dff2ed] hover:bg-slate-800 shadow-sm"
                        : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
                    )}
                  >
                    {isTargetLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : (
                      plan.customCtaText || `Select ${plan.name}`
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoices */}
      {data.invoices.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
          <h2 className="border-b border-slate-100 px-5 py-4 font-bold text-slate-900 text-sm sm:text-base">
            Billing History & Receipts
          </h2>
          <ul className="divide-y divide-slate-100">
            {data.invoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between px-5 py-3.5 text-xs sm:text-sm">
                <div>
                  <div className="font-bold text-slate-900">{inv.number ?? "Invoice"}</div>
                  <div className="text-xs text-slate-500">{formatDate(inv.issuedAt)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums font-semibold text-slate-700">
                    {formatMoney(inv.amountCents, inv.currency)}
                  </span>
                  {(() => {
                    const link = inv.hostedInvoiceUrl ?? inv.pdfUrl;
                    return link ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:underline"
                      >
                        <span>View PDF</span>
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    ) : null;
                  })()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}
