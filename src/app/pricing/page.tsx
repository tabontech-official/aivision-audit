import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { getPublicPlans } from "@/services/billing/plans";
import { PricingTable } from "@/components/pricing/pricing-table";
import { Sparkles, CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing & Plans · AI Vision Audit",
  description: "Simple, transparent pricing for AI website audits, Core Web Vitals, and technical SEO suites.",
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const session = await auth();
  const plans = await getPublicPlans();

  const formattedPlans = plans.map((p) => ({
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

  return (
    <div className="min-h-screen bg-[#fafcfb] font-lazzer text-slate-900 selection:bg-[#dff2ed]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-[#dff2ed]">
              AVA
            </div>
            <span className="text-base font-bold tracking-tight text-slate-900">
              AI Vision Audit
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {session?.user ? (
              <Link
                href="/dashboard"
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-[#dff2ed] shadow-sm hover:bg-slate-800 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-[#dff2ed] shadow-sm hover:bg-slate-800 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <div className="mx-auto max-w-4xl px-6 pt-16 pb-8 text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#dff2ed] px-3.5 py-1 text-xs font-bold text-[#143a31]">
          <Sparkles className="h-3.5 w-3.5 text-[#2f7a68]" />
          <span>Transparent, Flexible Pricing</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
          Supercharge Your Website Audits & Rankings
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
          Choose a plan tailored to your audit needs. Scale effortlessly from solo blogs to high-volume agency client portfolios.
        </p>
      </div>

      {/* Pricing Table Component */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <PricingTable plans={formattedPlans} isLoggedIn={Boolean(session?.user)} />
      </main>

      {/* Trust & Guarantee Banner */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs space-y-4">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dff2ed] text-slate-900">
              <ShieldCheck className="h-6 w-6 text-[#143a31]" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900">100% Satisfaction & Reliability Guarantee</h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            All audits are processed through real browser rendering engines with automated retry policies. Failed audits due to network glitches or server timeouts never consume your credits.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} AI Vision Audit. All rights reserved.</p>
      </footer>
    </div>
  );
}
