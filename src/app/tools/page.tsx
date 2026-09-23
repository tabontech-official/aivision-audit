import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/sections";
import { AuditUrlForm } from "@/components/marketing/audit-url-form";
import { AuthModalProvider, AuthActionButton } from "@/components/marketing/auth-modal-context";
import {
  Wrench,
  Search,
  Layers,
  Gauge,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Zap,
  Globe2,
  FileCode,
  Lock,
  BarChart2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Free SEO & AI Website Audit Tools · AI Vision Audit",
  description:
    "Explore our collection of free web tools: SEO health check, schema markup validator, PageSpeed Core Web Vitals, mobile UX tester, and security SSL inspection.",
};

export default async function FreeToolsHubPage() {
  const session = await auth();

  const tools = [
    {
      title: "SEO Health Check & Crawler",
      description:
        "Instant technical crawl of title tags, meta descriptions, H1-H6 hierarchy, canonicals, robots.txt, sitemaps, and HTTP status codes.",
      badge: "Most Popular",
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
      icon: Search,
      href: "/tools/seo-health-check",
      features: [
        "Indexability & Canonical validation",
        "Meta tags & OpenGraph inspect",
        "Heading hierarchy & keyword density",
        "Orphan page & broken link detection",
      ],
    },
    {
      title: "Schema Markup & JSON-LD",
      description:
        "Generate, validate, and preview structured data for Articles, Products, Organizations, FAQs, Local Businesses, and Breadcrumbs.",
      badge: "Core Feature",
      badgeColor: "bg-[#dff2ed] text-[#143a31] border-emerald-300",
      icon: Layers,
      href: "/tools/schema-markup",
      features: [
        "1-Click JSON-LD code generation",
        "Google Rich Results compliance",
        "Entity & Wikidata linking",
        "Real-time syntax & error detection",
      ],
    },
    {
      title: "Speed & Core Web Vitals",
      description:
        "Measure real-world performance metrics: LCP, INP, CLS, TTFB, and get prioritized speed recommendations to improve search rankings.",
      badge: "Speed Benchmark",
      badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
      icon: Gauge,
      href: "/tools/speed-core-vitals",
      features: [
        "Interaction to Next Paint (INP)",
        "Largest Contentful Paint (LCP)",
        "Cumulative Layout Shift (CLS)",
        "Render-blocking JS & CSS analysis",
      ],
    },
    {
      title: "Mobile UX & Viewport",
      description:
        "Ensure your website delivers a seamless mobile experience with responsive layout diagnostics, tap target spacing, and font readability.",
      badge: "Mobile First",
      badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
      icon: Smartphone,
      href: "/tools/mobile-ux-review",
      features: [
        "Mobile viewport tag verification",
        "Touch target size & padding audit",
        "Horizontal scroll & overflow detection",
        "Font legibility across device sizes",
      ],
    },
    {
      title: "Security & SSL Trust",
      description:
        "Inspect SSL certificates, HSTS enforcement, security headers (CSP, X-Frame-Options), and safe browsing status to protect visitors.",
      badge: "Security & Trust",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
      icon: ShieldCheck,
      href: "/tools/security-trust",
      features: [
        "SSL/TLS certificate expiry check",
        "HTTP to HTTPS redirect verification",
        "HSTS & Security headers inspection",
        "Mixed content & insecure script alerts",
      ],
    },
    {
      title: "AI Answer Engine Scanner",
      description:
        "Evaluate how generative AI engines (ChatGPT, Perplexity, Claude, Gemini) read and cite your domain for key search queries.",
      badge: "AI Powered",
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
      icon: Globe2,
      href: "/dashboard/schema",
      features: [
        "LLM crawler access (GPTBot, ClaudeBot)",
        "Structured entity graph analysis",
        "Author credential extraction",
        "Direct answer snippet readiness",
      ],
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
                <Wrench className="h-3.5 w-3.5" />
                <span>FREE SEO &amp; AI AUDIT SUITE</span>
              </div>

              <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.12]">
                Free Diagnostic Tools for Modern Websites
              </h1>

              <p className="mt-5 text-base sm:text-lg text-slate-700 leading-relaxed max-w-2xl font-normal">
                Instant, production-grade tools to audit technical SEO, validate JSON-LD schemas, test Core Web Vitals, and verify AI search readiness — 100% free with no credit card required.
              </p>

              {/* Instant Global URL Check */}
              <div className="mt-10 w-full max-w-xl">
                <AuditUrlForm
                  size="lg"
                  placeholder="Enter any website URL to run all checks (e.g. https://yourdomain.com)"
                  buttonText="Run Free Full Audit"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Runs comprehensive crawl across SEO, schema, speed, mobile, and security
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tools Grid */}
        <section className="py-16 sm:py-24 border-b border-slate-100 bg-[#fbfcfb]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-900" />
                <span>INDIVIDUAL DIAGNOSTIC TOOLS</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Pick a Dedicated Tool to Audit Your Site
              </h2>
              <p className="mt-3 text-slate-600 text-base leading-relaxed">
                Each tool delivers deep, actionable insights and copy-paste remediation code.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {tools.map((tool, idx) => {
                const Icon = tool.icon;
                return (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-7 shadow-xs hover:border-slate-300 hover:shadow-md transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <div className="h-11 w-11 rounded-xl bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold group-hover:bg-slate-900 group-hover:text-[#dff2ed] transition-colors">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${tool.badgeColor}`}
                        >
                          {tool.badge}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-[17px] font-bold text-slate-900 group-hover:text-black transition-colors whitespace-nowrap overflow-hidden text-ellipsis font-lazzer">
                        {tool.title}
                      </h3>

                      <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
                        {tool.description}
                      </p>

                      <div className="mt-6 border-t border-slate-100 pt-5 space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Key Checks Included
                        </div>
                        <ul className="space-y-2">
                          {tool.features.map((feat, fIdx) => (
                            <li
                              key={fIdx}
                              className="flex items-start gap-2 text-xs font-medium text-slate-700"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-8 pt-5 border-t border-slate-100">
                      <Link
                        href={tool.href}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-[#dff2ed] transition hover:bg-black"
                      >
                        <span>Launch Tool</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 sm:py-24 border-b border-slate-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Why Developers &amp; Marketers Trust AI Vision Audit
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                Modern website testing built for search engines and AI answer algorithms.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
                <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 text-slate-900 flex items-center justify-center font-bold mb-4">
                  <Zap className="h-5 w-5 text-emerald-700" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Real Headless Browser Rendering</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Unlike simple HTTP fetchers, we render complete JavaScript SPAs (Next.js, Nuxt, React) to analyze exact client DOM output.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
                <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 text-slate-900 flex items-center justify-center font-bold mb-4">
                  <FileCode className="h-5 w-5 text-emerald-700" />
                </div>
                <h3 className="text-base font-bold text-slate-900">1-Click Code Remediation</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Get exact code blocks, structured JSON-LD scripts, and meta tags ready to copy directly into your codebase.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
                <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 text-slate-900 flex items-center justify-center font-bold mb-4">
                  <Globe2 className="h-5 w-5 text-emerald-700" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Generative AI Citation Readiness</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Evaluate whether your content architecture is optimized to be cited by Perplexity, ChatGPT Search, and Google AI Overviews.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-[#dff2ed] py-16 sm:py-20 border-t border-slate-200/80">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Want Continuous Automated Audits?
            </h2>
            <p className="mt-4 max-w-xl text-base text-slate-700">
              Set up scheduled weekly crawls, track ranking regressions, and generate white-label client PDF reports with an AI Vision Audit account.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <AuthActionButton
                targetUrl="/dashboard"
                className="rounded-full bg-[#181818] px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-black transition"
              >
                Create Free Account
              </AuthActionButton>
              <Link
                href="/pricing"
                className="rounded-full border border-slate-700/60 bg-transparent px-8 py-3.5 text-sm font-bold text-slate-900 hover:bg-white/60 transition"
              >
                View Plans &amp; Pricing
              </Link>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </AuthModalProvider>
  );
}
