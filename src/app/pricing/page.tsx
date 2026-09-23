import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { getPublicPlans } from "@/services/billing/plans";
import { PricingTable, PublicPricingPlan } from "@/components/pricing/pricing-table";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/sections";
import { AuthModalProvider, AuthActionButton } from "@/components/marketing/auth-modal-context";
import {
  CheckCircle2,
  ShieldCheck,
  Zap,
  HelpCircle,
  Building2,
  ArrowRight,
  Check,
  X,
  CreditCard,
  RefreshCw,
  Award,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing & Plans · AI Vision Audit",
  description:
    "Transparent, flexible pricing for AI website audits, Core Web Vitals, JSON-LD schema generation, and agency white-label reports.",
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const session = await auth();
  const dbPlans = await getPublicPlans();

  // Dynamic Plans from Master Admin DB
  let formattedPlans: PublicPricingPlan[] = dbPlans.map((p) => ({
    id: p.id,
    key: p.key,
    name: p.name,
    description: p.description,
    priceMonthly: p.priceMonthlyCents / 100,
    priceYearly: p.priceYearlyCents / 100,
    currency: p.currency,
    trialDays: p.trialDays,
    isPopular: p.isPopular,
    badgeText: p.badgeText,
    customCtaText: p.customCtaText,
    customCtaUrl: p.customCtaUrl,
    auditLimitPerMonth: p.auditLimitPerMonth,
    auditLimitType: p.auditLimitType,
    features: p.publicFeatures.map((pf) => ({
      label: pf.label,
      isIncluded: pf.isIncluded,
    })),
  }));

  // Fallback defaults if master admin has not populated plans in DB yet
  if (formattedPlans.length === 0) {
    formattedPlans = [
      {
        id: "starter",
        key: "starter",
        name: "Starter Free",
        description: "Perfect for testing individual websites, single landing pages, and quick schema checks.",
        priceMonthly: 0,
        priceYearly: 0,
        currency: "usd",
        trialDays: 0,
        isPopular: false,
        badgeText: null,
        customCtaText: "Start Free",
        customCtaUrl: null,
        auditLimitPerMonth: 5,
        auditLimitType: "MONTHLY",
        features: [
          { label: "5 Technical Audits / Month", isIncluded: true },
          { label: "Basic SEO & Meta Tag Inspector", isIncluded: true },
          { label: "Core Web Vitals & Speed Score", isIncluded: true },
          { label: "Standard JSON-LD Schema Generator", isIncluded: true },
          { label: "AI Citation Tracker", isIncluded: false },
          { label: "White-Label PDF Reports", isIncluded: false },
        ],
      },
      {
        id: "growth-pro",
        key: "growth-pro",
        name: "Growth Pro",
        description: "For scaling brands, e-commerce stores, and high-growth SaaS teams.",
        priceMonthly: 29,
        priceYearly: 24,
        currency: "usd",
        trialDays: 7,
        isPopular: true,
        badgeText: "Most Popular",
        customCtaText: "Start 7-Day Free Trial",
        customCtaUrl: null,
        auditLimitPerMonth: 100,
        auditLimitType: "MONTHLY",
        features: [
          { label: "100 Deep Audits / Month", isIncluded: true },
          { label: "Full Technical Crawler & Canonical Mesh", isIncluded: true },
          { label: "Perplexity & ChatGPT Citation Tracking", isIncluded: true },
          { label: "Advanced Product & Article Schema", isIncluded: true },
          { label: "Automated Fix Code Generator", isIncluded: true },
          { label: "Standard PDF Export Reports", isIncluded: true },
        ],
      },
      {
        id: "agency-scale",
        key: "agency-scale",
        name: "Agency & Scale",
        description: "For agencies and enterprises managing multi-client domains and high-volume crawls.",
        priceMonthly: 89,
        priceYearly: 72,
        currency: "usd",
        trialDays: 14,
        isPopular: false,
        badgeText: "Agency Choice",
        customCtaText: "Get Agency Scale",
        customCtaUrl: null,
        auditLimitPerMonth: 500,
        auditLimitType: "MONTHLY",
        features: [
          { label: "500 Audits / Month (or Unlimited option)", isIncluded: true },
          { label: "Full White-Label Branded PDF Reports", isIncluded: true },
          { label: "Multi-Client Portfolio Command Center", isIncluded: true },
          { label: "Automated Weekly Re-Crawl Alerts", isIncluded: true },
          { label: "Historical Compare Diff Engine", isIncluded: true },
          { label: "Priority Concurrency & VIP Support", isIncluded: true },
        ],
      },
    ];
  }

  // Dynamic Comparison Table based on active master-admin plans
  const comparisonCategories = [
    {
      category: "Audit Limits & Performance",
      features: [
        {
          name: "Monthly Audit Allowance",
          getValue: (p: PublicPricingPlan) =>
            p.auditLimitType === "UNLIMITED" ? "Unlimited" : `${p.auditLimitPerMonth} Audits/mo`,
        },
        {
          name: "Headless Browser JavaScript Rendering",
          getValue: (_p: PublicPricingPlan) => true,
        },
        {
          name: "Core Web Vitals & Speed Scoring",
          getValue: (_p: PublicPricingPlan) => true,
        },
        {
          name: "Sitemap & RSS Feed Auto-Sync",
          getValue: (p: PublicPricingPlan) => p.priceMonthly > 0 || p.auditLimitPerMonth >= 50,
        },
      ],
    },
    {
      category: "Structured Data & AI Search",
      features: [
        {
          name: "JSON-LD Schema Generation & Validation",
          getValue: (_p: PublicPricingPlan) => true,
        },
        {
          name: "Google Rich Results SERP Preview",
          getValue: (_p: PublicPricingPlan) => true,
        },
        {
          name: "AI Answer Engine Citation Tracking",
          getValue: (p: PublicPricingPlan) =>
            p.features.some(
              (f) =>
                f.isIncluded &&
                (f.label.toLowerCase().includes("ai") ||
                  f.label.toLowerCase().includes("citation") ||
                  f.label.toLowerCase().includes("search"))
            ) || p.priceMonthly > 0,
        },
        {
          name: "Automated Code Remediation Snippets",
          getValue: (p: PublicPricingPlan) =>
            p.features.some(
              (f) =>
                f.isIncluded &&
                (f.label.toLowerCase().includes("code") ||
                  f.label.toLowerCase().includes("fix") ||
                  f.label.toLowerCase().includes("inspection"))
            ) || p.priceMonthly > 0,
        },
      ],
    },
    {
      category: "Agency & Collaboration",
      features: [
        {
          name: "Exportable PDF Audit Deliverables",
          getValue: (p: PublicPricingPlan) =>
            p.features.some(
              (f) =>
                f.isIncluded &&
                (f.label.toLowerCase().includes("pdf") ||
                  f.label.toLowerCase().includes("report"))
            ) || p.priceMonthly >= 15,
        },
        {
          name: "Custom White-Label Branding",
          getValue: (p: PublicPricingPlan) =>
            p.features.some(
              (f) =>
                f.isIncluded &&
                (f.label.toLowerCase().includes("white-label") ||
                  f.label.toLowerCase().includes("brand"))
            ) || p.priceMonthly >= 50,
        },
        {
          name: "Multi-Client Portfolio Workspace",
          getValue: (p: PublicPricingPlan) =>
            p.features.some(
              (f) =>
                f.isIncluded &&
                (f.label.toLowerCase().includes("client") ||
                  f.label.toLowerCase().includes("portfolio") ||
                  f.label.toLowerCase().includes("workspace"))
            ) || p.priceMonthly >= 50,
        },
        {
          name: "Priority Concurrency & Support",
          getValue: (p: PublicPricingPlan) => p.priceMonthly >= 50,
        },
      ],
    },
  ];

  const faqs = [
    {
      q: "How does billing and plan upgrading work?",
      a: "You can upgrade, downgrade, or cancel your plan at any time directly in your dashboard billing settings. When upgrading, proration is calculated automatically so you only pay the delta.",
    },
    {
      q: "What happens if I hit my monthly audit limit?",
      a: "If you need additional audits before your cycle resets, you can easily top up credits or upgrade to a higher tier. Failed audits due to server timeouts never consume your quota.",
    },
    {
      q: "Can I customize the white-label PDF reports with my agency logo?",
      a: "Yes! On Agency plans, you can upload your agency logo, primary color scheme, and executive sign-off notes so the PDF deliverables appear 100% bespoke to your clients.",
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept all major credit and debit cards (Visa, Mastercard, American Express) processed securely via Stripe. Invoicing is also available for annual enterprise contracts.",
    },
    {
      q: "Is there a free trial?",
      a: "Yes! Plans with free trials allow you to test all features with zero risk. You won’t be charged until the trial period ends, and you can cancel anytime.",
    },
  ];

  return (
    <AuthModalProvider isLoggedIn={!!session?.user}>
      <MarketingHeader isLoggedIn={!!session?.user} />
      <main className="min-h-screen bg-white font-lazzer text-slate-900 selection:bg-[#dff2ed]">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-[#dff2ed] pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-slate-200/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center flex flex-col items-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>DYNAMIC, TRANSPARENT PLANS</span>
              </div>

              <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.12]">
                Simple Pricing for Powerful Audits
              </h1>

              <p className="mt-5 text-base sm:text-lg text-slate-700 leading-relaxed max-w-2xl font-normal">
                Choose the plan that fits your growth. Managed dynamically to ensure you always get the latest features, highest crawl speeds, and best value.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Cards Section */}
        <section className="py-16 sm:py-24 border-b border-slate-100 bg-[#fafcfb]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <PricingTable plans={formattedPlans} isLoggedIn={Boolean(session?.user)} />
          </div>
        </section>

        {/* Feature Comparison Matrix */}
        <section className="py-16 sm:py-24 border-b border-slate-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-900" />
                <span>FEATURE BREAKDOWN</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Compare All Plan Capabilities
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                Everything you need to know about our audit limits, AI intelligence, and white-label tiers.
              </p>
            </div>

            <div className="max-w-5xl mx-auto overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-xs font-bold uppercase tracking-wider text-slate-900">
                    <th className="py-4 px-4 w-1/3">Features</th>
                    {formattedPlans.map((plan) => (
                      <th
                        key={plan.id}
                        className={`py-4 px-4 text-center ${
                          plan.isPopular ? "bg-[#dff2ed]/30 rounded-t-lg text-slate-900 font-extrabold" : ""
                        }`}
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {comparisonCategories.map((group, gIdx) => (
                    <tr key={gIdx} className="contents">
                      <tr className="bg-slate-50/80">
                        <td
                          colSpan={formattedPlans.length + 1}
                          className="py-3 px-4 font-bold text-xs uppercase tracking-wider text-slate-700 font-lazzer"
                        >
                          {group.category}
                        </td>
                      </tr>
                      {group.features.map((feat, fIdx) => (
                        <tr key={fIdx} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-4 text-slate-800 font-medium text-xs sm:text-sm">
                            {feat.name}
                          </td>
                          {formattedPlans.map((plan) => {
                            const val = feat.getValue(plan);
                            return (
                              <td
                                key={plan.id}
                                className={`py-3.5 px-4 text-center text-xs ${
                                  plan.isPopular ? "bg-[#dff2ed]/20" : ""
                                }`}
                              >
                                {typeof val === "boolean" ? (
                                  val ? (
                                    <Check className="h-4 w-4 mx-auto text-emerald-600 font-bold" />
                                  ) : (
                                    <X className="h-4 w-4 mx-auto text-slate-300" />
                                  )
                                ) : (
                                  <span className="font-bold text-slate-900">{val}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Enterprise Card */}
        <section className="py-16 border-b border-slate-100 bg-[#fbfcfb]">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-slate-200 bg-slate-900 p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-3 max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-emerald-400 border border-slate-700">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>HIGH-VOLUME &amp; ENTERPRISE</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Need Custom Audits or API Integrations?
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  We offer custom volume pricing, dedicated crawler concurrency, webhook streaming, custom SSO, and SLA guarantees for enterprise platforms.
                </p>
              </div>

              <div className="shrink-0">
                <AuthActionButton
                  targetUrl="/dashboard"
                  className="inline-flex items-center justify-center rounded-full bg-[#dff2ed] px-8 py-3.5 text-sm font-bold text-slate-900 hover:bg-white transition"
                >
                  Contact Enterprise Team
                </AuthActionButton>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 sm:py-24 border-b border-slate-100 bg-white">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                Everything you need to know about billing, audits, and plans.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-[#fbfcfb] p-6 text-left transition hover:border-slate-300"
                >
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
                    <HelpCircle className="h-4 w-4 text-emerald-700 shrink-0" />
                    <span>{faq.q}</span>
                  </h4>
                  <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed pl-6.5">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Guarantee Banner */}
        <section className="bg-[#dff2ed] py-16 sm:py-20 border-t border-slate-200/80">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-emerald-300 text-slate-900 mb-4">
              <ShieldCheck className="h-6 w-6 text-emerald-800" />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              100% Satisfaction &amp; Reliability Guarantee
            </h2>
            <p className="mt-4 max-w-xl text-base text-slate-700">
              All website audits run through real headless browser rendering with automatic retries. Start risk-free today and scale as your traffic grows.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <AuthActionButton
                targetUrl="/dashboard"
                className="rounded-full bg-[#181818] px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-black transition"
              >
                Get Started Now
              </AuthActionButton>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </AuthModalProvider>
  );
}
