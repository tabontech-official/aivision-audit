"use client";

import { useState, useTransition } from "react";
import { Check, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { startPublicCheckoutAction } from "./actions";

export type PublicPricingPlan = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  trialDays: number;
  isPopular: boolean;
  badgeText: string | null;
  customCtaText: string | null;
  customCtaUrl: string | null;
  auditLimitPerMonth: number;
  auditLimitType: string;
  features: Array<{ label: string; isIncluded: boolean }>;
};

export function PricingTable({
  plans,
  isLoggedIn = false,
}: {
  plans: PublicPricingPlan[];
  isLoggedIn?: boolean;
}) {
  const [interval, setIntervalState] = useState<"monthly" | "yearly">("monthly");
  const [pending, startTransition] = useTransition();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = (plan: PublicPricingPlan) => {
    if (plan.customCtaUrl) {
      window.location.href = plan.customCtaUrl;
      return;
    }

    if (plan.priceMonthly === 0 && plan.priceYearly === 0) {
      window.location.href = isLoggedIn ? "/dashboard" : "/signup";
      return;
    }

    setError(null);
    setLoadingPlanId(plan.id);

    startTransition(async () => {
      const res = await startPublicCheckoutAction(plan.id, interval);
      if (res.ok && res.url) {
        window.location.href = res.url;
      } else {
        setError(res.error || "Could not start checkout. Please try again.");
        setLoadingPlanId(null);
      }
    });
  };

  return (
    <div className="space-y-12">
      {/* Interval Toggle */}
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-100 p-1.5 shadow-inner">
          <button
            type="button"
            onClick={() => setIntervalState("monthly")}
            className={cn(
              "rounded-xl px-5 py-2.5 text-xs font-bold transition-all cursor-pointer",
              interval === "monthly"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setIntervalState("yearly")}
            className={cn(
              "rounded-xl px-5 py-2.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
              interval === "yearly"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900",
            )}
          >
            <span>Annual Billing</span>
            <span className="rounded-full bg-[#dff2ed] px-2 py-0.5 text-[10px] font-black text-[#143a31]">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-auto max-w-md rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-700 text-center">
          {error}
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 items-stretch max-w-7xl mx-auto">
        {plans.map((plan) => {
          const price = interval === "yearly" ? plan.priceYearly : plan.priceMonthly;
          const per = interval === "yearly" ? "year" : "month";
          const isFree = plan.priceMonthly === 0 && plan.priceYearly === 0;
          const isLoading = pending && loadingPlanId === plan.id;

          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col justify-between rounded-3xl border bg-white p-8 transition-all hover:shadow-xl",
                plan.isPopular
                  ? "border-slate-900 ring-2 ring-slate-900 shadow-lg scale-[1.02] z-10"
                  : "border-slate-200/90 shadow-sm",
              )}
            >
              {plan.badgeText && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3.5 py-1 text-xs font-bold text-[#dff2ed] shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 text-[#dff2ed]" />
                    {plan.badgeText}
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                </div>
                <p className="mt-2 text-xs text-slate-500 leading-relaxed min-h-[36px]">
                  {plan.description || "Unlock powerful AI website audits and technical insights."}
                </p>

                <div className="mt-6 flex items-baseline gap-1.5 border-b border-slate-100 pb-6">
                  <span className="text-4xl font-black tracking-tight text-slate-900">
                    ${price}
                  </span>
                  {!isFree && (
                    <span className="text-xs font-bold text-slate-500">/ {per}</span>
                  )}
                  {plan.trialDays > 0 && (
                    <span className="ml-auto text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5">
                      {plan.trialDays}-Day Free Trial
                    </span>
                  )}
                </div>

                <div className="mt-6 rounded-xl bg-[#dff2ed]/30 border border-[#2f7a68]/15 p-3 text-xs font-bold text-[#143a31]">
                  {plan.auditLimitType === "UNLIMITED"
                    ? "✨ Unlimited Website Audits"
                    : `⚡ ${plan.auditLimitPerMonth} Audits Included / Month`}
                </div>

                {/* Features list */}
                <div className="mt-6 space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Included Features
                  </div>
                  <ul className="space-y-2.5">
                    {plan.features.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs font-medium text-slate-700">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{f.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleCheckout(plan)}
                  className={cn(
                    "w-full rounded-xl py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm",
                    plan.isPopular
                      ? "bg-slate-900 text-[#dff2ed] hover:bg-slate-800"
                      : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>{plan.customCtaText || (isFree ? "Get Started Free" : `Choose ${plan.name}`)}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
