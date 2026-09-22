"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Copy,
  Trash2,
  Edit,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Users,
  CreditCard,
  Sparkles,
  Zap,
} from "lucide-react";
import { duplicatePlanAction, deletePlanAction, syncPlanToStripeAction } from "./actions";

export function PlansListClient({ initialPlans }: { initialPlans: any[] }) {
  const router = useRouter();
  const [plans, setPlans] = useState(initialPlans);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleDuplicate = async (id: string) => {
    setActionInProgress(`duplicate-${id}`);
    setStatusNotice(null);
    const res = await duplicatePlanAction(id);
    setActionInProgress(null);
    if (res.ok) {
      setStatusNotice({ type: "success", text: "Plan duplicated successfully as draft/inactive." });
      router.refresh();
    } else {
      setStatusNotice({ type: "error", text: res.error || "Failed to duplicate plan." });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete or archive '${name}'?`)) return;
    setActionInProgress(`delete-${id}`);
    setStatusNotice(null);
    const res = await deletePlanAction(id);
    setActionInProgress(null);
    if (res.ok) {
      setStatusNotice({ type: "success", text: res.message || "Plan deleted/archived." });
      router.refresh();
    } else {
      setStatusNotice({ type: "error", text: res.error || "Failed to delete plan." });
    }
  };

  const handleSyncStripe = async (id: string) => {
    setActionInProgress(`sync-${id}`);
    setStatusNotice(null);
    const res = await syncPlanToStripeAction(id);
    setActionInProgress(null);
    if (res.ok) {
      setStatusNotice({ type: "success", text: res.message || "Successfully synced to Stripe!" });
      router.refresh();
    } else {
      setStatusNotice({ type: "error", text: res.error || "Failed to sync to Stripe." });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Subscription Plans</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage customer subscription tiers, multi-interval pricing, usage limits, and Stripe synchronization.
          </p>
        </div>
        <Link
          href="/master-admin/billing/plans/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-[#dff2ed] shadow hover:bg-slate-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create New Plan
        </Link>
      </div>

      {statusNotice && (
        <div
          className={`flex items-center gap-3 rounded-xl p-4 border text-sm font-medium ${
            statusNotice.type === "success"
              ? "bg-[#dff2ed]/60 border-[#2f7a68]/20 text-[#1b4e42]"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {statusNotice.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2f7a68]" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          )}
          <span>{statusNotice.text}</span>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const isSynced = Boolean(plan.stripeProductId);
          const monthlyDollars = (plan.priceMonthlyCents / 100).toFixed(0);
          const yearlyDollars = (plan.priceYearlyCents / 100).toFixed(0);
          const subscriberCount = plan._count?.subscriptions ?? 0;

          return (
            <div
              key={plan.id}
              className={`flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-md ${
                plan.isPopular ? "border-slate-900 ring-1 ring-slate-900" : "border-slate-200"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                        plan.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      {plan.isActive ? "Active" : "Inactive"}
                    </span>
                    {plan.isPublic ? (
                      <span className="text-[11px] font-medium text-slate-500">Public</span>
                    ) : (
                      <span className="text-[11px] font-medium text-amber-600">Hidden</span>
                    )}
                  </div>

                  {plan.badgeText && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#dff2ed] px-2.5 py-0.5 text-[11px] font-bold text-slate-900">
                      <Sparkles className="h-3 w-3 text-[#1b4e42]" />
                      {plan.badgeText}
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  <div className="text-xs font-mono text-slate-600 font-semibold">{plan.key}</div>
                  <p className="mt-2 text-xs text-slate-600 line-clamp-2 min-h-[32px]">
                    {plan.description || "No description provided."}
                  </p>
                </div>

                {/* Price Display */}
                <div className="mt-4 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">${monthlyDollars}</span>
                    <span className="text-xs font-semibold text-slate-500">/mo</span>
                    {plan.priceYearlyCents > 0 && (
                      <span className="ml-auto text-xs font-bold text-slate-600">
                        ${yearlyDollars}/yr
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-200/60 pt-2 font-medium">
                    <span>
                      {plan.auditLimitType === "UNLIMITED"
                        ? "Unlimited Audits"
                        : `${plan.auditLimitPerMonth} audits / ${plan.auditResetPeriod.toLowerCase()}`}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-slate-700">
                      <Users className="h-3 w-3" />
                      {subscriberCount} {subscriberCount === 1 ? "subscriber" : "subscribers"}
                    </span>
                  </div>
                </div>

                {/* Stripe Status */}
                <div className="mt-3 flex items-center justify-between text-[11px] px-1">
                  <span className="text-slate-500 font-medium">Stripe Product:</span>
                  {isSynced ? (
                    <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      {plan.stripeProductId}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                      <AlertCircle className="h-3 w-3" />
                      Not Synced
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4">
                <Link
                  href={`/master-admin/billing/plans/${plan.id}`}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit Plan
                </Link>

                <button
                  type="button"
                  onClick={() => handleSyncStripe(plan.id)}
                  disabled={actionInProgress === `sync-${plan.id}`}
                  title="Sync to Stripe"
                  className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${actionInProgress === `sync-${plan.id}` ? "animate-spin" : ""}`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => handleDuplicate(plan.id)}
                  disabled={actionInProgress === `duplicate-${plan.id}`}
                  title="Duplicate Plan"
                  className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(plan.id, plan.name)}
                  disabled={actionInProgress === `delete-${plan.id}`}
                  title="Delete/Archive Plan"
                  className="flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50/50 p-2 text-rose-600 shadow-sm hover:bg-rose-100 disabled:opacity-50 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
