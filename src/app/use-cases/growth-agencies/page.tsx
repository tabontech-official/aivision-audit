import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/sections";
import { AuditUrlForm } from "@/components/marketing/audit-url-form";
import { AuthModalProvider, AuthActionButton } from "@/components/marketing/auth-modal-context";
import {
  Briefcase,
  Search,
  CheckCircle2,
  Zap,
  TrendingUp,
  Layers,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  FileSpreadsheet,
  Users,
  Award,
  Download,
} from "lucide-react";

export const metadata: Metadata = {
  title: "AI Website Audits for Growth Agencies · AI Vision Audit",
  description:
    "Deliver executive-ready white-label SEO & AI audit reports in seconds. Manage multi-client portfolios, close higher retainers, and automate technical remediation.",
};

export default async function GrowthAgenciesPage() {
  const session = await auth();

  return (
    <AuthModalProvider isLoggedIn={!!session?.user}>
      <MarketingHeader isLoggedIn={!!session?.user} />
      <main className="min-h-screen bg-white font-lazzer text-slate-900 selection:bg-[#dff2ed]">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-[#dff2ed] pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-slate-200/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center flex flex-col items-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800">
                <Briefcase className="h-3.5 w-3.5" />
                <span>FOR SEO, GROWTH &amp; DIGITAL AGENCIES</span>
              </div>

              <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.12]">
                Multi-Client Command Center &amp; White-Label Audits
              </h1>

              <p className="mt-5 text-base sm:text-lg text-slate-700 leading-relaxed max-w-2xl font-normal">
                Win new client pitches in 60 seconds with branded AI audit reports. Manage 50+ client domains from a unified dashboard with automated recurring health monitoring.
              </p>

              {/* Instant Audit Form */}
              <div className="mt-10 w-full max-w-xl">
                <AuditUrlForm
                  size="lg"
                  placeholder="Enter prospect or client URL (e.g. https://client.com)"
                  buttonText="Generate Client Audit"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Instant analysis · Exportable white-label PDF with your agency branding
                </p>
              </div>

              {/* Stats Bar */}
              <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 w-full border-t border-slate-300/60 pt-8 text-left">
                <div className="rounded-xl bg-white/70 backdrop-blur-sm p-4 border border-slate-200/60 shadow-2xs">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">10x</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Faster Pitch Deliverables</div>
                </div>
                <div className="rounded-xl bg-white/70 backdrop-blur-sm p-4 border border-slate-200/60 shadow-2xs">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">100%</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">White-Label Customization</div>
                </div>
                <div className="rounded-xl bg-white/70 backdrop-blur-sm p-4 border border-slate-200/60 shadow-2xs">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">50+</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Domains Per Agency Account</div>
                </div>
                <div className="rounded-xl bg-white/70 backdrop-blur-sm p-4 border border-slate-200/60 shadow-2xs">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">3.4x</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Pitch-to-Retainer Close Rate</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Agency Value Props */}
        <section className="py-16 sm:py-24 border-b border-slate-100 bg-[#fbfcfb]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-900" />
                <span>AGENCY OPERATING EFFICIENCY</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Stop Spending 8 Hours Manually Assembling Audits
              </h2>
              <p className="mt-3 text-slate-600 text-base leading-relaxed">
                Empower your strategists and business development team with automated, beautiful deliverables that showcase deep technical expertise without the manual labor.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs hover:border-slate-300 transition">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm mb-5">
                  <Award className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">White-Label PDF Reports</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Export stunning client-ready audit PDFs featuring your agency logo, brand colors, custom recommendations, and executive summaries.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs hover:border-slate-300 transition">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm mb-5">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Multi-Client Portfolio Hub</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Organize clients into dedicated workspaces with role-based access. Track historical health scores and spot ranking regressions early.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs hover:border-slate-300 transition">
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm mb-5">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Win with AI SEO Insights</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Differentiate your agency by showing prospects exactly where they fail in ChatGPT &amp; Perplexity citations, opening massive new retainer upsells.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Deep Dive 1: White Label Deliverables */}
        <section className="py-16 sm:py-24 border-b border-slate-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-md bg-[#dff2ed] px-3 py-1 text-xs font-bold text-slate-900">
                  <Download className="h-3.5 w-3.5" />
                  <span>CLIENT-READY ARTIFACTS</span>
                </div>
                <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                  Deliver Impressive White-Label Audit PDFs
                </h2>
                <p className="mt-4 text-base text-slate-600 leading-relaxed">
                  Every audit report can be instantly exported as a clean, polished PDF branded with your agency credentials. Perfect for kickoff calls and monthly retainer reviews.
                </p>

                <ul className="mt-6 space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Custom Agency Branding:</strong> Add your agency logo, primary color scheme, and agency contact details.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Executive Summaries:</strong> C-suite ready summary metrics alongside granular technical code fixes for dev teams.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Historical Compare Diff:</strong> Show clients exact month-over-month SEO improvements and ROI.</span>
                  </li>
                </ul>

                <div className="mt-8">
                  <AuthActionButton
                    targetUrl="/dashboard/reports"
                    className="inline-flex items-center gap-2 rounded-full bg-[#181818] px-6 py-3 text-sm font-bold text-white transition hover:bg-black"
                  >
                    View Sample Agency Report
                    <ArrowRight className="h-4 w-4" />
                  </AuthActionButton>
                </div>
              </div>

              {/* Visual Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-900 p-6 sm:p-8 text-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-mono text-slate-300">White-Label PDF Engine · v2.4</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800/60">
                    AGENCY READY
                  </span>
                </div>

                <div className="mt-6 rounded-lg bg-slate-800/90 p-5 border border-slate-700 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                    <div className="font-bold text-white text-sm">Nexus Growth Digital</div>
                    <div className="text-emerald-400 font-mono text-[11px]">Prepared for: Acme Corp</div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded bg-slate-900 p-2.5 border border-slate-800">
                      <div className="text-emerald-400 font-bold text-base">94/100</div>
                      <div className="text-[10px] text-slate-400">SEO Health</div>
                    </div>
                    <div className="rounded bg-slate-900 p-2.5 border border-slate-800">
                      <div className="text-emerald-400 font-bold text-base">PASSED</div>
                      <div className="text-[10px] text-slate-400">Core Vitals</div>
                    </div>
                    <div className="rounded bg-slate-900 p-2.5 border border-slate-800">
                      <div className="text-emerald-400 font-bold text-base">12 Issues</div>
                      <div className="text-[10px] text-slate-400">Remediated</div>
                    </div>
                  </div>

                  <div className="mt-4 text-[11px] text-slate-300 font-mono">
                    ✓ Executive Summary · Technical Crawl Breakdown · Schema Fixes Attached
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Deep Dive 2: Multi-Client Hub */}
        <section className="py-16 sm:py-24 border-b border-slate-100 bg-[#fbfcfb]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Visual Card */}
              <div className="order-2 lg:order-1 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <span className="text-sm font-bold text-slate-900">Agency Client Workspace (14 Active)</span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    All Crawls Synced
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div>
                      <div className="font-bold text-slate-900">apex-fintech.io</div>
                      <div className="text-[11px] text-slate-500">Weekly Crawl · 12,400 URLs</div>
                    </div>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Score: 98</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div>
                      <div className="font-bold text-slate-900">lumina-skincare.com</div>
                      <div className="text-[11px] text-slate-500">Daily Crawl · 8,150 URLs</div>
                    </div>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Score: 94</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div>
                      <div className="font-bold text-slate-900">cloudvault-saas.com</div>
                      <div className="text-[11px] text-slate-500">Weekly Crawl · 4,200 URLs</div>
                    </div>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Score: 96</span>
                  </div>
                </div>
              </div>

              {/* Text */}
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 rounded-md bg-[#dff2ed] px-3 py-1 text-xs font-bold text-slate-900">
                  <Users className="h-3.5 w-3.5" />
                  <span>SCALE AGENCY RETENTION</span>
                </div>
                <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                  Unified Portfolio Management for Teams
                </h2>
                <p className="mt-4 text-base text-slate-600 leading-relaxed">
                  No more juggling individual logins. Monitor all client properties in one central command center with recurring automated audits and email regression alerts.
                </p>

                <ul className="mt-6 space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Automated Regressions Alerts:</strong> Be notified immediately if a client developer breaks canonicals or robots.txt.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>1-Click Schema Code Generation:</strong> Hand clean, validated JSON-LD scripts directly to client engineers.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Dedicated Team Roles:</strong> Invite SEO strategists, account managers, and clients with custom view/edit permissions.</span>
                  </li>
                </ul>

                <div className="mt-8">
                  <AuthActionButton
                    targetUrl="/dashboard/websites"
                    className="inline-flex items-center gap-2 rounded-full bg-[#181818] px-6 py-3 text-sm font-bold text-white transition hover:bg-black"
                  >
                    Open Agency Workspace
                    <ArrowRight className="h-4 w-4" />
                  </AuthActionButton>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-[#dff2ed] py-16 sm:py-20 border-t border-slate-200/80">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Upgrade Your Agency&apos;s SEO Tech Stack
            </h2>
            <p className="mt-4 max-w-xl text-base text-slate-700">
              Create your agency account to access white-label exports, multi-client monitoring, and next-gen AI search diagnostics.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <AuthActionButton
                targetUrl="/dashboard"
                className="rounded-full bg-[#181818] px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-black transition"
              >
                Create Agency Account
              </AuthActionButton>
              <Link
                href="/pricing"
                className="rounded-full border border-slate-700/60 bg-transparent px-8 py-3.5 text-sm font-bold text-slate-900 hover:bg-white/60 transition"
              >
                View Agency Plans
              </Link>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </AuthModalProvider>
  );
}
