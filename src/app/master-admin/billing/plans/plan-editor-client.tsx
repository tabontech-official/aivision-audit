"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Zap,
  CreditCard,
  Gauge,
  Layers,
  ListChecks,
  Users,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import {
  createPlanAction,
  updatePlanAction,
  syncPlanToStripeAction,
} from "./actions";
import { STANDARD_FEATURE_KEYS } from "@/services/billing/constants";

export function PlanEditorClient({
  initialPlan,
  isNew = false,
}: {
  initialPlan?: any;
  isNew?: boolean;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "general" | "pricing" | "limits" | "entitlements" | "public_features" | "stripe" | "subscribers"
  >("general");

  // Form states
  const [name, setName] = useState(initialPlan?.name || "");
  const [key, setKey] = useState(initialPlan?.key || "");
  const [description, setDescription] = useState(initialPlan?.description || "");
  const [isActive, setIsActive] = useState(initialPlan?.isActive ?? true);
  const [isPublic, setIsPublic] = useState(initialPlan?.isPublic ?? true);
  const [isPopular, setIsPopular] = useState(initialPlan?.isPopular ?? false);
  const [badgeText, setBadgeText] = useState(initialPlan?.badgeText || "");
  const [customCtaText, setCustomCtaText] = useState(initialPlan?.customCtaText || "");
  const [customCtaUrl, setCustomCtaUrl] = useState(initialPlan?.customCtaUrl || "");
  const [displayOrder, setDisplayOrder] = useState<number>(initialPlan?.displayOrder ?? 0);
  const [adminNotes, setAdminNotes] = useState(initialPlan?.adminNotes || "");

  // Pricing
  const [priceMonthlyDollars, setPriceMonthlyDollars] = useState<number>(
    initialPlan?.priceMonthlyCents ? initialPlan.priceMonthlyCents / 100 : 0,
  );
  const [priceYearlyDollars, setPriceYearlyDollars] = useState<number>(
    initialPlan?.priceYearlyCents ? initialPlan.priceYearlyCents / 100 : 0,
  );
  const [currency, setCurrency] = useState(initialPlan?.currency || "usd");
  const [trialDays, setTrialDays] = useState<number>(initialPlan?.trialDays ?? 0);
  const [setupFeeDollars, setSetupFeeDollars] = useState<number>(
    initialPlan?.setupFeeCents ? initialPlan.setupFeeCents / 100 : 0,
  );

  // Limits & Audit Coverage
  const [auditLimitPerMonth, setAuditLimitPerMonth] = useState<number>(
    initialPlan?.auditLimitPerMonth ?? 10,
  );
  const [pageAuditLimit, setPageAuditLimit] = useState<number>(
    initialPlan?.pageAuditLimit ?? 100,
  );
  const [initialSampleSize, setInitialSampleSize] = useState<number>(
    initialPlan?.initialSampleSize ?? 30,
  );
  const [auditLimitType, setAuditLimitType] = useState(initialPlan?.auditLimitType || "MONTHLY");
  const [auditResetPeriod, setAuditResetPeriod] = useState(initialPlan?.auditResetPeriod || "MONTHLY");
  const [concurrentAuditsLimit, setConcurrentAuditsLimit] = useState<number>(
    initialPlan?.concurrentAuditsLimit ?? 1,
  );
  const [autoRefundOnFailure, setAutoRefundOnFailure] = useState(
    initialPlan?.autoRefundOnFailure ?? true,
  );

  // Entitlements
  const [entitlements, setEntitlements] = useState<
    Array<{ featureKey: string; enabled: boolean; limit: number | null }>
  >(() => {
    return STANDARD_FEATURE_KEYS.map((sf) => {
      const existing = initialPlan?.entitlements?.find((e: any) => e.featureKey === sf.key);
      return {
        featureKey: sf.key,
        enabled: existing ? existing.enabled : sf.defaultEnabled,
        limit: existing ? existing.limit : null,
      };
    });
  });

  // Public Features Checklist
  const [publicFeatures, setPublicFeatures] = useState<
    Array<{ label: string; isIncluded: boolean; displayOrder: number }>
  >(
    initialPlan?.publicFeatures?.length
      ? initialPlan.publicFeatures
      : [
          { label: "Comprehensive Technical SEO & Foundations", isIncluded: true, displayOrder: 0 },
          { label: "Page Speed & Core Web Vitals Analysis", isIncluded: true, displayOrder: 1 },
          { label: "AI Search & Answer Engine Optimization", isIncluded: true, displayOrder: 2 },
          { label: "Schema Markup & Structured Data Suite", isIncluded: true, displayOrder: 3 },
          { label: "Exportable Branded PDF Reports", isIncluded: true, displayOrder: 4 },
        ],
  );

  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleEntitlementToggle = (featureKey: string, enabled: boolean) => {
    setEntitlements((prev) =>
      prev.map((e) => (e.featureKey === featureKey ? { ...e, enabled } : e)),
    );
  };

  const handleEntitlementLimit = (featureKey: string, limit: number | null) => {
    setEntitlements((prev) =>
      prev.map((e) => (e.featureKey === featureKey ? { ...e, limit } : e)),
    );
  };

  const handleAddPublicFeature = () => {
    setPublicFeatures((prev) => [
      ...prev,
      { label: "", isIncluded: true, displayOrder: prev.length },
    ]);
  };

  const handleRemovePublicFeature = (index: number) => {
    setPublicFeatures((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = async (autoSync = false) => {
    if (!name.trim()) {
      setStatusNotice({ type: "error", text: "Plan name is required." });
      return;
    }
    if (!key.trim()) {
      setStatusNotice({ type: "error", text: "Plan key/slug is required." });
      return;
    }

    setSaving(true);
    setStatusNotice(null);

    const planPayload = {
      name,
      key,
      description,
      priceMonthlyCents: Math.round(priceMonthlyDollars * 100),
      priceYearlyCents: Math.round(priceYearlyDollars * 100),
      currency,
      trialDays,
      setupFeeCents: Math.round(setupFeeDollars * 100),
      auditLimitPerMonth,
      pageAuditLimit,
      initialSampleSize,
      auditLimitType,
      auditResetPeriod,
      concurrentAuditsLimit,
      autoRefundOnFailure,
      isActive,
      isPublic,
      isPopular,
      badgeText: badgeText.trim() || null,
      customCtaText: customCtaText.trim() || null,
      customCtaUrl: customCtaUrl.trim() || null,
      displayOrder,
      adminNotes,
      entitlements,
      publicFeatures: publicFeatures.filter((pf) => pf.label.trim().length > 0),
      autoSyncStripe: autoSync,
    };

    if (isNew) {
      const res = await createPlanAction(planPayload);
      setSaving(false);
      if (res.ok && res.planId) {
        router.push(`/master-admin/billing/plans/${res.planId}?created=true`);
      } else {
        setStatusNotice({ type: "error", text: res.error || "Failed to create plan." });
      }
    } else {
      const res = await updatePlanAction(initialPlan.id, planPayload);
      setSaving(false);
      if (res.ok) {
        setStatusNotice({ type: "success", text: "Plan updated successfully!" });
      } else {
        setStatusNotice({ type: "error", text: res.error || "Failed to update plan." });
      }
    }
  };

  const handleStripeSyncNow = async () => {
    if (isNew || !initialPlan?.id) return;
    setSyncing(true);
    setStatusNotice(null);
    const res = await syncPlanToStripeAction(initialPlan.id);
    setSyncing(false);
    if (res.ok) {
      setStatusNotice({ type: "success", text: res.message || "Stripe sync completed!" });
      router.refresh();
    } else {
      setStatusNotice({ type: "error", text: res.error || "Stripe sync failed." });
    }
  };

  const tabs = [
    { id: "general", label: "1. General Info", icon: Layers },
    { id: "pricing", label: "2. Pricing & Cycles", icon: CreditCard },
    { id: "limits", label: "3. Usage & Audit Limits", icon: Gauge },
    { id: "entitlements", label: "4. Feature Entitlements", icon: ShieldCheck },
    { id: "public_features", label: "5. Pricing Card Bullets", icon: ListChecks },
    { id: "stripe", label: "6. Stripe Sync", icon: Zap },
    ...(!isNew ? [{ id: "subscribers", label: `7. Subscribers (${initialPlan?._count?.subscriptions ?? 0})`, icon: Users }] : []),
  ] as const;

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/master-admin/billing/plans"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {isNew ? "Create Subscription Plan" : `Edit Plan: ${name}`}
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              {key ? `Slug: ${key}` : "Define plan parameters & features"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isNew && (
            <button
              type="button"
              onClick={handleStripeSyncNow}
              disabled={syncing}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
              Sync to Stripe
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-[#dff2ed] shadow hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : isNew ? "Create Plan" : "Save Changes"}
          </button>
        </div>
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

      {/* Tabs Header */}
      <div className="flex overflow-x-auto rounded-xl bg-slate-100 p-1 border border-slate-200 scrollbar-none">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-xs font-bold transition-all ${
                active
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: General Info */}
      {activeTab === "general" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">Plan Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Agency Pro"
                className="mt-1.5 w-full text-sm font-semibold rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Unique Slug / Key *</label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="e.g. agency-pro"
                disabled={!isNew && (key === "FREE" || key === "PREMIUM")}
                className="mt-1.5 w-full font-mono text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none disabled:bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short plan summary displayed on marketing pages..."
              className="mt-1.5 w-full text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-700">Popular / Featured Badge</label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="e.g. Most Popular, Best Value"
                className="mt-1.5 w-full text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Custom CTA Button Text</label>
              <input
                type="text"
                value={customCtaText}
                onChange={(e) => setCustomCtaText(e.target.value)}
                placeholder="e.g. Start Free Trial, Upgrade Now"
                className="mt-1.5 w-full text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Display Order</label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                className="mt-1.5 w-full text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <div>
                <div className="text-xs font-bold text-slate-900">Active Status</div>
                <div className="text-[11px] text-slate-500">Enable plan for subscribers</div>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <div>
                <div className="text-xs font-bold text-slate-900">Public Pricing Card</div>
                <div className="text-[11px] text-slate-500">Show on /pricing page</div>
              </div>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3.5">
              <div>
                <div className="text-xs font-bold text-slate-900">Highlighted Card</div>
                <div className="text-[11px] text-slate-500">Add highlight frame on pricing</div>
              </div>
              <input
                type="checkbox"
                checked={isPopular}
                onChange={(e) => setIsPopular(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">Internal Admin Notes</label>
            <textarea
              rows={2}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Internal operator notes or target customer segment..."
              className="mt-1.5 w-full text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* TAB 2: Pricing & Cycles */}
      {activeTab === "pricing" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
              <label className="block text-xs font-bold text-slate-900">Monthly Price ($ USD)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={priceMonthlyDollars}
                  onChange={(e) => setPriceMonthlyDollars(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm font-black pl-8 pr-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Amount charged every month. Enter 0 for free tiers.
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
              <label className="block text-xs font-bold text-slate-900">Annual Price ($ USD)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={priceYearlyDollars}
                  onChange={(e) => setPriceYearlyDollars(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm font-black pl-8 pr-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Total amount billed once per year.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-3 border-t border-slate-100 pt-5">
            <div>
              <label className="block text-xs font-bold text-slate-700">Free Trial Period (Days)</label>
              <input
                type="number"
                value={trialDays}
                onChange={(e) => setTrialDays(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="mt-1.5 w-full text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">One-Time Setup Fee ($)</label>
              <input
                type="number"
                step="0.01"
                value={setupFeeDollars}
                onChange={(e) => setSetupFeeDollars(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="mt-1.5 w-full text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1.5 w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none"
              >
                <option value="usd">USD ($)</option>
                <option value="eur">EUR (€)</option>
                <option value="gbp">GBP (£)</option>
                <option value="cad">CAD (C$)</option>
                <option value="aud">AUD (A$)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Usage & Limits */}
      {activeTab === "limits" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          {/* Crawl Credit & Page Audit Coverage Settings */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                Audit Coverage &amp; Initial Sample Limits
              </h4>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-900">
                  Total Page Coverage Limit (Audit Scope)
                </label>
                <input
                  type="number"
                  min={1}
                  value={pageAuditLimit}
                  onChange={(e) => setPageAuditLimit(parseInt(e.target.value) || 0)}
                  className="mt-1.5 w-full text-sm font-bold rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-600">
                  Maximum pages covered under this plan (e.g. 10 for Free, 100 for Starter, 1,000 for Pro, 3,000 for Agency).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900">
                  Initial Sample Size (First Audit Run)
                </label>
                <input
                  type="number"
                  min={1}
                  value={initialSampleSize}
                  onChange={(e) => setInitialSampleSize(parseInt(e.target.value) || 0)}
                  className="mt-1.5 w-full text-sm font-bold rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-600">
                  Pages analyzed on first audit without exhausting plan limit (e.g. 10 for Free, 30 for Starter, 50 for Pro, 100 for Agency).
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">Audits Limit (Campaigns / Month)</label>
              <input
                type="number"
                value={auditLimitPerMonth}
                onChange={(e) => setAuditLimitPerMonth(parseInt(e.target.value) || 0)}
                className="mt-1.5 w-full text-sm font-bold rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Number of completed audits allowed per period (1 completed audit = 1 credit).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Limit Type</label>
              <select
                value={auditLimitType}
                onChange={(e) => setAuditLimitType(e.target.value)}
                className="mt-1.5 w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none"
              >
                <option value="MONTHLY">Monthly Allowance</option>
                <option value="BILLING_CYCLE">Per Billing Cycle</option>
                <option value="LIFETIME">Lifetime Total</option>
                <option value="UNLIMITED">Unlimited Audits</option>
              </select>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 border-t border-slate-100 pt-5">
            <div>
              <label className="block text-xs font-bold text-slate-700">Reset Frequency</label>
              <select
                value={auditResetPeriod}
                onChange={(e) => setAuditResetPeriod(e.target.value)}
                className="mt-1.5 w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none"
              >
                <option value="MONTHLY">Every 1st of the Month</option>
                <option value="BILLING_CYCLE">On Subscription Renewal Date</option>
                <option value="NEVER">Never (Non-expiring / Lifetime)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Concurrent Audits Allowed</label>
              <input
                type="number"
                value={concurrentAuditsLimit}
                onChange={(e) => setConcurrentAuditsLimit(parseInt(e.target.value) || 1)}
                className="mt-1.5 w-full text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div>
              <div className="text-xs font-bold text-slate-900">Auto-Refund Failed Audits</div>
              <div className="text-xs text-slate-500">
                System or network crawl failures never consume user credit.
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoRefundOnFailure}
              onChange={(e) => setAutoRefundOnFailure(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
          </div>
        </div>
      )}

      {/* TAB 4: Feature Entitlements Matrix */}
      {activeTab === "entitlements" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Feature Access & Entitlements Matrix</h2>
            <p className="text-xs text-slate-500">
              Control module access for subscribers of this plan.
            </p>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {STANDARD_FEATURE_KEYS.map((f) => {
              const currentEnt = entitlements.find((e) => e.featureKey === f.key);
              const isEnabled = currentEnt?.enabled ?? f.defaultEnabled;

              return (
                <div key={f.key} className="flex items-center justify-between p-4 bg-white hover:bg-slate-50/50">
                  <div>
                    <div className="text-xs font-bold text-slate-900">{f.label}</div>
                    <div className="text-[11px] font-mono text-slate-500">{f.key}</div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) => handleEntitlementToggle(f.key, e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="peer h-5 w-9 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-slate-900 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: Public Marketing Bullets */}
      {activeTab === "public_features" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Pricing Card Marketing Checklist</h2>
              <p className="text-xs text-slate-500">
                Custom marketing bullet points displayed on the customer pricing page card.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddPublicFeature}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Item
            </button>
          </div>

          <div className="space-y-2.5">
            {publicFeatures.map((pf, idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                <input
                  type="text"
                  value={pf.label}
                  onChange={(e) => {
                    setPublicFeatures((prev) =>
                      prev.map((item, i) => (i === idx ? { ...item, label: e.target.value } : item)),
                    );
                  }}
                  placeholder="e.g. Full Core Web Vitals breakdown"
                  className="flex-1 text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-inner focus:outline-none"
                />

                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pf.isIncluded}
                    onChange={(e) => {
                      setPublicFeatures((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, isIncluded: e.target.checked } : item)),
                      );
                    }}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span>Included</span>
                </label>

                <button
                  type="button"
                  onClick={() => handleRemovePublicFeature(idx)}
                  className="p-1.5 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: Stripe Sync */}
      {activeTab === "stripe" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Stripe Synchronization</h2>
            <p className="text-xs text-slate-500">
              Linked Stripe Product & Price IDs for payment checkout.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Stripe Product ID
              </div>
              <div className="font-mono text-xs font-bold text-slate-900 break-all">
                {initialPlan?.stripeProductId || "Not created yet"}
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Monthly Price ID
              </div>
              <div className="font-mono text-xs font-bold text-slate-900 break-all">
                {initialPlan?.stripePriceMonthlyId || "Not created yet"}
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Yearly Price ID
              </div>
              <div className="font-mono text-xs font-bold text-slate-900 break-all">
                {initialPlan?.stripePriceYearlyId || "Not created yet"}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleStripeSyncNow}
              disabled={syncing || isNew}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-[#dff2ed] shadow hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Synchronizing to Stripe..." : "Sync Plan & Prices to Stripe Now"}
            </button>
            {isNew && (
              <p className="mt-2 text-xs text-slate-500">
                Save this plan first before synchronizing with Stripe.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: Subscribers */}
      {activeTab === "subscribers" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Subscribers on this Plan</h2>
              <p className="text-xs text-slate-500">
                Recent users subscribed to {name}.
              </p>
            </div>
            <Link
              href={`/master-admin/billing/subscriptions?planId=${initialPlan.id}`}
              className="text-xs font-bold text-slate-900 hover:underline flex items-center gap-1"
            >
              <span>View All Subscriptions</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {initialPlan?.subscriptions?.length ? (
              initialPlan.subscriptions.map((sub: any) => (
                <div key={sub.id} className="flex items-center justify-between p-3.5 bg-white">
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {sub.user?.name || "Unnamed User"}
                    </div>
                    <div className="text-[11px] text-slate-500">{sub.user?.email}</div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      {sub.status}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Since {new Date(sub.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-500">
                No active subscribers on this plan yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
