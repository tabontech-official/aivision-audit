import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/sections";
import { AuditUrlForm } from "@/components/marketing/audit-url-form";
import { AuthModalProvider, AuthActionButton } from "@/components/marketing/auth-modal-context";
import {
  FileText,
  Search,
  CheckCircle2,
  Zap,
  TrendingUp,
  Layers,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  RefreshCw,
  Globe2,
  Database,
  ExternalLink,
} from "lucide-react";

export const metadata: Metadata = {
  title: "AI Website Audits for Content-Led Companies · AI Vision Audit",
  description:
    "Scale programmatic and editorial site audits. Track citations across Perplexity, ChatGPT, and Google AI Overviews. Automate Article schema and maintain search dominance.",
};

export default async function ContentLedCompaniesPage() {
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
                <FileText className="h-3.5 w-3.5" />
                <span>FOR EDITORIAL &amp; PROGRAMMATIC MEDIA</span>
              </div>

              <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.12]">
                Large-Site Audits &amp; AI Citation Intelligence
              </h1>

              <p className="mt-5 text-base sm:text-lg text-slate-700 leading-relaxed max-w-2xl font-normal">
                Crawl tens of thousands of articles in minutes. Uncover content decay, fix missing JSON-LD schema, and ensure your media brand is actively cited by ChatGPT, Perplexity, and Claude.
              </p>

              {/* Instant Audit Form */}
              <div className="mt-10 w-full max-w-xl">
                <AuditUrlForm
                  size="lg"
                  placeholder="Enter publication or blog URL (e.g. https://domain.com/blog)"
                  buttonText="Audit Content Site"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Instant deep crawl · Checks canonicals, schema markup, and AI search visibility
                </p>
              </div>

              {/* Stats Bar */}
              <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 w-full border-t border-slate-300/60 pt-8 text-left">
                <div className="rounded-xl bg-white/70 backdrop-blur-sm p-4 border border-slate-200/60 shadow-2xs">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">50K+</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Pages Audited in Minutes</div>
                </div>
                <div className="rounded-xl bg-white/70 backdrop-blur-sm p-4 border border-slate-200/60 shadow-2xs">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">99.4%</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Schema Validation Accuracy</div>
                </div>
                <div className="rounded-xl bg-white/70 backdrop-blur-sm p-4 border border-slate-200/60 shadow-2xs">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">4.8x</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">LLM Citation Rate Lift</div>
                </div>
                <div className="rounded-xl bg-white/70 backdrop-blur-sm p-4 border border-slate-200/60 shadow-2xs">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">0s</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Manual Tagging Effort</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Core Challenge Section */}
        <section className="py-16 sm:py-24 border-b border-slate-100 bg-[#fbfcfb]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-900" />
                <span>THE CONTENT DILEMMA</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Search Engines are Evolving into Answer Engines
              </h2>
              <p className="mt-3 text-slate-600 text-base leading-relaxed">
                Publishing thousands of articles isn’t enough anymore. If LLMs cannot extract structured entities and authoritative authors from your content, your publication gets ignored in AI summaries.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs hover:border-slate-300 transition">
                <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm mb-5">
                  <Database className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Programmatic Crawl Inefficiencies</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Orphan URLs, infinite facet loops, and non-canonical duplicates waste your crawl budget, preventing high-value journalism from ranking.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs hover:border-slate-300 transition">
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm mb-5">
                  <Search className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Zero AI Citation Attribution</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Perplexity, ChatGPT Search, and Gemini synthesize your answers without linking back because author credentials and schema entities are missing.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs hover:border-slate-300 transition">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm mb-5">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Silent Content Decay</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Historic evergreen articles lose rankings unnoticed. Without continuous automated delta audits, content refresh priorities remain a guessing game.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Deep Dive 1: AI Citation & Entity Architecture */}
        <section className="py-16 sm:py-24 border-b border-slate-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-md bg-[#dff2ed] px-3 py-1 text-xs font-bold text-slate-900">
                  <Globe2 className="h-3.5 w-3.5" />
                  <span>AI SEARCH DISCOVERY</span>
                </div>
                <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                  Win Citing Spots in ChatGPT &amp; Perplexity
                </h2>
                <p className="mt-4 text-base text-slate-600 leading-relaxed">
                  AI Vision Audit runs simulated prompts across top AI platforms to evaluate whether your publication is referenced as the primary authority on key topics.
                </p>

                <ul className="mt-6 space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>LLM Grounding Diagnostics:</strong> Evaluate how well generative engines parse your key facts and pullquotes.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Author Entity Verification:</strong> Generate Person and Organization schema linking Wikidata and social profiles.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Direct Answer Extraction:</strong> Ensure listicles, definitions, and stats use bot-friendly semantic markup.</span>
                  </li>
                </ul>

                <div className="mt-8">
                  <AuthActionButton
                    targetUrl="/dashboard/schema"
                    className="inline-flex items-center gap-2 rounded-full bg-[#181818] px-6 py-3 text-sm font-bold text-white transition hover:bg-black"
                  >
                    Generate Article Schema
                    <ArrowRight className="h-4 w-4" />
                  </AuthActionButton>
                </div>
              </div>

              {/* Visual Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-900 p-6 sm:p-8 text-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-mono text-slate-300">AI Citation Tracker · Live Stream</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800/60">
                    CITED 94%
                  </span>
                </div>

                <div className="mt-6 space-y-4 font-mono text-xs">
                  <div className="rounded-lg bg-slate-800/80 p-4 border border-slate-700/60">
                    <div className="text-slate-400">Prompt: &ldquo;What are the best sustainable packaging solutions in 2026?&rdquo;</div>
                    <div className="mt-3 flex items-center gap-2 text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Cited via Perplexity &amp; ChatGPT Search</span>
                    </div>
                    <div className="mt-1 text-slate-300 text-[11px]">
                      Source: <span className="text-white underline">yourdomain.com/eco-packaging-guide</span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-800/80 p-4 border border-slate-700/60">
                    <div className="text-slate-400">Schema Inspection: Article / TechArticle</div>
                    <div className="mt-2 text-emerald-400">✓ author.name = &quot;Dr. Sarah Jenkins&quot;</div>
                    <div className="text-emerald-400">✓ publisher.logo = validated</div>
                    <div className="text-emerald-400">✓ speakable.cssSelector = verified</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Deep Dive 2: Massive-Scale Programmatic Audits */}
        <section className="py-16 sm:py-24 border-b border-slate-100 bg-[#fbfcfb]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Visual Card */}
              <div className="order-2 lg:order-1 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                  <span className="text-sm font-bold text-slate-900">Programmatic Crawl Delta (Last 30 Days)</span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Health Score 98/100
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-700">Canonical Tag Conformity</span>
                    <span className="font-bold text-emerald-600">99.8% Perfect</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-700">Indexable Editorial URLs</span>
                    <span className="font-bold text-slate-900">48,210 URLs</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-700">Orphan Articles Detected</span>
                    <span className="font-bold text-amber-600">0 (Fixed Automatically)</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-700">Core Web Vitals Pass Rate</span>
                    <span className="font-bold text-emerald-600">96.4% Good</span>
                  </div>
                </div>
              </div>

              {/* Text */}
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 rounded-md bg-[#dff2ed] px-3 py-1 text-xs font-bold text-slate-900">
                  <Database className="h-3.5 w-3.5" />
                  <span>HIGH-CAPACITY CRAWLING</span>
                </div>
                <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                  Built for Large Publications &amp; News Portals
                </h2>
                <p className="mt-4 text-base text-slate-600 leading-relaxed">
                  Traditional crawlers choke on 10,000+ page archives. AI Vision Audit uses lightning-fast headless workers to parse sitemaps, RSS feeds, and dynamic JS hydration without taxing your origin servers.
                </p>

                <ul className="mt-6 space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Instant Sitemap &amp; RSS Sync:</strong> Audit newly published articles seconds after going live.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Automated Internal Link Mesh:</strong> Identify related context nodes to distribute PageRank efficiently.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Multi-Language &amp; Hreflang Audits:</strong> Validate global localized editions with zero cross-domain mismatch.</span>
                  </li>
                </ul>

                <div className="mt-8">
                  <AuthActionButton
                    targetUrl="/dashboard"
                    className="inline-flex items-center gap-2 rounded-full bg-[#181818] px-6 py-3 text-sm font-bold text-white transition hover:bg-black"
                  >
                    Start Large-Site Crawl
                    <ArrowRight className="h-4 w-4" />
                  </AuthActionButton>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow Comparison */}
        <section className="py-16 sm:py-24 border-b border-slate-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Why Media Leaders Switch to AI Vision Audit
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                How our AI-powered engine compares to legacy manual audit software.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Legacy Tools */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
                <h3 className="text-lg font-bold text-slate-500">Legacy Crawl Tools</h3>
                <ul className="mt-6 space-y-4 text-sm text-slate-600">
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 font-bold">✕</span>
                    <span>No visibility into Perplexity or ChatGPT citation share</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 font-bold">✕</span>
                    <span>Manual schema markup coding required per article template</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 font-bold">✕</span>
                    <span>Crawls crash on 50,000+ URL catalogs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-red-500 font-bold">✕</span>
                    <span>Generic issue lists with zero automated code remedies</span>
                  </li>
                </ul>
              </div>

              {/* AI Vision Audit */}
              <div className="rounded-2xl border-2 border-slate-900 bg-white p-6 sm:p-8 shadow-lg relative">
                <div className="absolute -top-3.5 right-6 bg-[#dff2ed] border border-emerald-300 text-emerald-900 text-[11px] font-bold px-3 py-0.5 rounded-full">
                  AI-FIRST ARCHITECTURE
                </div>
                <h3 className="text-lg font-bold text-slate-900">AI Vision Audit</h3>
                <ul className="mt-6 space-y-4 text-sm text-slate-800">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Live LLM Citation Tracking:</strong> See real prompts and mentions in real-time.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>1-Click Article JSON-LD:</strong> Copy-paste schemas for authors, dates, and publishers.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Unlimited Elastic Crawls:</strong> Scaled effortlessly with cloud concurrency.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Automated Code Fixes:</strong> Direct meta, canonical, and schema code patches.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-[#dff2ed] py-16 sm:py-20 border-t border-slate-200/80">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Ready to Audit Your Content at Scale?
            </h2>
            <p className="mt-4 max-w-xl text-base text-slate-700">
              Run a free technical audit on any editorial URL or connect your sitemap for complete portfolio monitoring.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <AuthActionButton
                targetUrl="/dashboard"
                className="rounded-full bg-[#181818] px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-black transition"
              >
                Start Free Content Audit
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
