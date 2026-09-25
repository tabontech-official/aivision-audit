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
  RotateCw,
  Activity,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing & Plans · AI Vision Audit",
  description:
    "Audits show you what’s broken. Monitoring helps you keep it fixed. Choose how much of your website you want to monitor and how often you want it checked.",
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const session = await auth();
  const dbPlans = await getPublicPlans();

  // Dynamic Plans from Master Admin DB with recurring positioning
  let formattedPlans: PublicPricingPlan[] = dbPlans.map((p) => {
    const keyUpper = p.key.toUpperCase();
    let positioning = "Find what’s broken";
    if (keyUpper.includes("FREE")) positioning = "Find what’s broken";
    else if (keyUpper.includes("STARTER")) positioning = "Keep one site healthy";
    else if (keyUpper.includes("PRO") || keyUpper.includes("PREMIUM")) positioning = "Protect a growing website";
    else if (keyUpper.includes("AGENCY") || keyUpper.includes("SCALE")) positioning = "Monitor multiple client websites";

    const monitoredCapacity =
      p.pageAuditLimit >= 3000
        ? "Up to 3,000 monitored pages"
        : p.pageAuditLimit >= 1000
        ? "Up to 1,000 monitored pages"
        : p.pageAuditLimit >= 100
        ? "Up to 100 monitored pages"
        : "Up to 10 monitored pages";

    const featuresList: Array<{ label: string; isIncluded: boolean }> = [];

    // 1. Number of monitored websites
    featuresList.push({
      label:
        p.websiteLimit === -1
          ? "Unlimited monitored websites"
          : `${p.websiteLimit} monitored ${p.websiteLimit === 1 ? "website" : "websites"}`,
      isIncluded: true,
    });

    // 2. Monitored page capacity
    featuresList.push({
      label: monitoredCapacity,
      isIncluded: true,
    });

    // 3. Check frequency
    featuresList.push({
      label: keyUpper.includes("AGENCY")
        ? "Daily & weekly automated checks"
        : keyUpper.includes("PRO") || keyUpper.includes("PREMIUM")
        ? "Weekly automated health monitoring"
        : keyUpper.includes("STARTER")
        ? "Monthly scheduled health check"
        : "On-demand free audit",
      isIncluded: true,
    });

    // 4. Fix verification
    featuresList.push({
      label: keyUpper.includes("FREE") ? "1 fix verification included" : "Instant live fix verification",
      isIncluded: true,
    });

    // 5. Audit history & comparison
    featuresList.push({
      label: "Audit history & before/after compare diffs",
      isIncluded: !keyUpper.includes("FREE"),
    });

    // 6. Schema builder allowance
    featuresList.push({
      label:
        p.schemaMonthlyLimit === -1
          ? "Unlimited schema builder generations"
          : `${p.schemaMonthlyLimit || 3} schema generations / mo`,
      isIncluded: true,
    });

    // 7. Scheduled audits & alerts
    featuresList.push({
      label: "Automated recurring monitoring & issue alerts",
      isIncluded: !keyUpper.includes("FREE"),
    });

    return {
      id: p.id,
      key: p.key,
      name: p.name,
      description: p.description,
      positioning,
      monitoredCapacity,
      websiteLimit: p.websiteLimit,
      pageAuditLimit: p.pageAuditLimit,
      priceMonthly: p.priceMonthlyCents / 100,
      priceYearly: p.priceYearlyCents / 100,
      currency: p.currency,
      trialDays: p.trialDays,
      isPopular: p.isPopular,
      badgeText: p.badgeText,
      customCtaText: p.customCtaText || (keyUpper.includes("FREE") ? "Audit My Site Free" : `Choose ${p.name}`),
      customCtaUrl: p.customCtaUrl,
      auditLimitPerMonth: p.auditLimitPerMonth,
      auditLimitType: p.auditLimitType,
      features: featuresList,
    };
  });

  // Fallback defaults if master admin has not populated plans in DB yet
  if (formattedPlans.length === 0) {
    formattedPlans = [
      {
        id: "free",
        key: "free",
        name: "Free",
        description: "Find what’s broken on your website with an instant technical inspection.",
        positioning: "Find what’s broken",
        monitoredCapacity: "Up to 10 monitored pages",
        websiteLimit: 1,
        pageAuditLimit: 10,
        priceMonthly: 0,
        priceYearly: 0,
        currency: "usd",
        trialDays: 0,
        isPopular: false,
        badgeText: null,
        customCtaText: "Audit My Site Free",
        customCtaUrl: null,
        auditLimitPerMonth: 10,
        auditLimitType: "MONTHLY",
        features: [
          { label: "1 monitored website", isIncluded: true },
          { label: "Up to 10 monitored pages", isIncluded: true },
          { label: "On-demand free audit", isIncluded: true },
          { label: "1 fix verification included", isIncluded: true },
          { label: "3 schema generations / mo", isIncluded: true },
          { label: "Audit history & comparisons", isIncluded: false },
        ],
      },
      {
        id: "starter",
        key: "starter",
        name: "Starter",
        description: "Keep one site healthy and verify technical fixes over time.",
        positioning: "Keep one site healthy",
        monitoredCapacity: "Up to 100 monitored pages",
        websiteLimit: 1,
        pageAuditLimit: 100,
        priceMonthly: 19,
        priceYearly: 15,
        currency: "usd",
        trialDays: 0,
        isPopular: false,
        badgeText: null,
        customCtaText: "Choose Starter",
        customCtaUrl: null,
        auditLimitPerMonth: 100,
        auditLimitType: "MONTHLY",
        features: [
          { label: "1 monitored website", isIncluded: true },
          { label: "Up to 100 monitored pages", isIncluded: true },
          { label: "Monthly scheduled health check", isIncluded: true },
          { label: "Instant live fix verification", isIncluded: true },
          { label: "Full audit history & change diffs", isIncluded: true },
          { label: "25 schema generations / mo", isIncluded: true },
        ],
      },
      {
        id: "pro",
        key: "pro",
        name: "Pro",
        description: "Protect a growing website with weekly automated checks and deep crawl depth.",
        positioning: "Protect a growing website",
        monitoredCapacity: "Up to 1,000 monitored pages",
        websiteLimit: 5,
        pageAuditLimit: 1000,
        priceMonthly: 49,
        priceYearly: 39,
        currency: "usd",
        trialDays: 7,
        isPopular: true,
        badgeText: "Most Popular",
        customCtaText: "Choose Pro",
        customCtaUrl: null,
        auditLimitPerMonth: 1000,
        auditLimitType: "MONTHLY",
        features: [
          { label: "5 monitored websites", isIncluded: true },
          { label: "Up to 1,000 monitored pages", isIncluded: true },
          { label: "Weekly automated health monitoring", isIncluded: true },
          { label: "Instant live fix verification", isIncluded: true },
          { label: "Historical compare diff engine", isIncluded: true },
          { label: "100 schema generations / mo", isIncluded: true },
          { label: "Automated recurring re-audit alerts", isIncluded: true },
        ],
      },
      {
        id: "agency",
        key: "agency",
        name: "Agency",
        description: "Monitor multiple client websites with high-capacity crawls and white-label reporting.",
        positioning: "Monitor multiple client websites",
        monitoredCapacity: "Up to 3,000 monitored pages",
        websiteLimit: 20,
        pageAuditLimit: 3000,
        priceMonthly: 129,
        priceYearly: 99,
        currency: "usd",
        trialDays: 14,
        isPopular: false,
        badgeText: "Agency Choice",
        customCtaText: "Choose Agency",
        customCtaUrl: null,
        auditLimitPerMonth: 3000,
        auditLimitType: "MONTHLY",
        features: [
          { label: "20 monitored websites", isIncluded: true },
          { label: "Up to 3,000 monitored pages", isIncluded: true },
          { label: "Daily & weekly automated checks", isIncluded: true },
          { label: "Instant live fix verification", isIncluded: true },
          { label: "Multi-client portfolio workspace", isIncluded: true },
          { label: "Unlimited schema builder generations", isIncluded: true },
          { label: "Full white-label PDF audit reports", isIncluded: true },
        ],
      },
    ];
  }

  // Dynamic Comparison Table based on active master-admin plans
  const comparisonCategories = [
    {
      category: "Site Coverage & Monitoring",
      features: [
        {
          name: "Monitored Page Capacity",
          getValue: (p: PublicPricingPlan) =>
            p.monitoredCapacity ||
            ((p.pageAuditLimit ?? 0) >= 3000
              ? "Up to 3,000 pages"
              : (p.pageAuditLimit ?? 0) >= 1000
              ? "Up to 1,000 pages"
              : (p.pageAuditLimit ?? 0) >= 100
              ? "Up to 100 pages"
              : "Up to 10 pages"),
        },
        {
          name: "Monitored Websites",
          getValue: (p: PublicPricingPlan) =>
            p.websiteLimit === -1 ? "Unlimited" : `${p.websiteLimit ?? 1} Sites`,
        },
        {
          name: "Automated Check Frequency",
          getValue: (p: PublicPricingPlan) => {
            const k = (p.key || "").toUpperCase();
            if (k.includes("AGENCY")) return "Daily & Weekly";
            if (k.includes("PRO") || k.includes("PREMIUM")) return "Weekly";
            if (k.includes("STARTER")) return "Monthly";
            return "On-demand";
          },
        },
        {
          name: "Fix Verification Engine",
          getValue: (p: PublicPricingPlan) =>
            (p.key || "").toUpperCase().includes("FREE") ? "1 Verification" : "Unlimited",
        },
      ],
    },
    {
      category: "Audit Intelligence & History",
      features: [
        {
          name: "70+ Factor Technical SEO Diagnostics",
          getValue: (_p: PublicPricingPlan) => true,
        },
        {
          name: "Core Web Vitals & Real Speed Scoring",
          getValue: (_p: PublicPricingPlan) => true,
        },
        {
          name: "Audit History & Before/After Change Tracking",
          getValue: (p: PublicPricingPlan) => !(p.key || "").toUpperCase().includes("FREE"),
        },
        {
          name: "Automated Code Remediation Snippets",
          getValue: (_p: PublicPricingPlan) => true,
        },
      ],
    },
    {
      category: "Schema Builder & Structured Data",
      features: [
        {
          name: "JSON-LD Schema Builder Allowance",
          getValue: (p: PublicPricingPlan) => {
            const k = (p.key || "").toUpperCase();
            if (k.includes("AGENCY")) return "Unlimited";
            if (k.includes("PRO") || k.includes("PREMIUM")) return "100 / mo";
            if (k.includes("STARTER")) return "25 / mo";
            return "3 / mo";
          },
        },
        {
          name: "Google Rich Results SERP Previewer",
          getValue: (_p: PublicPricingPlan) => true,
        },
        {
          name: "Real-Time Syntax & Error Validator",
          getValue: (_p: PublicPricingPlan) => true,
        },
      ],
    },
    {
      category: "Reporting & Collaboration",
      features: [
        {
          name: "Exportable Client-Ready PDF Deliverables",
          getValue: (p: PublicPricingPlan) => p.priceMonthly >= 15,
        },
        {
          name: "Custom White-Label Branding",
          getValue: (p: PublicPricingPlan) => p.priceMonthly >= 50,
        },
        {
          name: "Multi-Client Portfolio Workspace",
          getValue: (p: PublicPricingPlan) => p.priceMonthly >= 50,
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
      q: "How does ongoing website health monitoring work?",
      a: "Once you set up a website, AI Vision Audit routinely crawls your pages according to your plan frequency (weekly or daily) to catch broken links, slow pages, missing schema, and SEO regressions as your site changes.",
    },
    {
      q: "What is Fix Verification?",
      a: "After you deploy a code or template fix on your website, Fix Verification immediately rechecks the affected live URLs in real-time to confirm whether the issue is resolved.",
    },
    {
      q: "How does billing and plan upgrading work?",
      a: "You can upgrade, downgrade, or cancel your plan at any time directly in your dashboard billing settings. When upgrading, proration is calculated automatically so you only pay the difference.",
    },
    {
      q: "What happens if my site has more pages than my plan capacity?",
      a: "You can easily upgrade to a higher tier anytime to expand your monitored page capacity from 100 to 1,000 or 3,000 pages.",
    },
    {
      q: "Can I customize the white-label PDF reports with my agency logo?",
      a: "Yes! On Agency plans, you can upload your agency logo, primary color scheme, and executive sign-off notes so the PDF deliverables appear 100% bespoke to your clients.",
    },
    {
      q: "Is there a free trial?",
      a: "Yes! Plans with free trials allow you to test all features with zero risk. You won’t be charged until the trial period ends, and you can cancel anytime with one click.",
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
                <span>CONTINUOUS WEBSITE HEALTH PLANS</span>
              </div>

              <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-950 leading-[1.12]">
                Audits show you what’s broken.
                <br />
                Monitoring helps you keep it fixed.
              </h1>

              <p className="mt-5 text-base sm:text-lg text-slate-700 leading-relaxed max-w-2xl font-normal">
                Choose how much of your website you want to monitor and how often you want it checked.
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
                <span>CAPABILITY BREAKDOWN</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Compare Plan Capabilities &amp; Monitoring
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                Everything you need to know about site coverage, verification limits, and scheduled monitoring.
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
                  <span>HIGH-CAPACITY &amp; ENTERPRISE</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Need Custom Monitoring or High-Volume Crawls?
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
                Everything you need to know about website health monitoring, verification, and plans.
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
                Audit My Site Free
              </AuthActionButton>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </AuthModalProvider>
  );
}
