import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/sections";
import { AuditUrlForm } from "@/components/marketing/audit-url-form";
import { AuthModalProvider, AuthActionButton } from "@/components/marketing/auth-modal-context";
import {
  Search,
  CheckCircle2,
  Zap,
  Layers,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Target,
  Compass,
  Laptop,
} from "lucide-react";

export const metadata: Metadata = {
  title: "AI Website Audits for SaaS Marketers · AI Vision Audit",
  description:
    "Dominate software category searches and AI recommendations. Track brand citations in ChatGPT & Perplexity, audit comparison hubs, and turn organic search into pipeline.",
};

export default async function SaasMarketersPage() {
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
                <Laptop className="h-3.5 w-3.5" />
                <span>FOR B2B &amp; PRODUCT-LED SAAS</span>
              </div>

              <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.12]">
                Monitor Product Pages, Track AI Citations &amp; Prove ROI
              </h1>

              <p className="mt-5 text-base sm:text-lg text-slate-700 leading-relaxed max-w-2xl font-normal">
                Ensure your software is recommended when buyers ask ChatGPT &amp; Perplexity for the best tools in your space. Automate SoftwareApplication schema and eliminate technical crawl blockers.
              </p>

              {/* Instant Audit Form */}
              <div className="mt-10 w-full max-w-xl">
                <AuditUrlForm
                  size="lg"
                  placeholder="Enter SaaS product or feature URL (e.g. https://yoursaas.com)"
                  buttonText="Audit SaaS Website"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Instant technical audit · Checks SoftwareApplication schema, bots access, and performance
                </p>
              </div>

              {/* Stats Bar */}
              <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 w-full border-t border-slate-300/60 pt-8 text-left">
                <div className="rounded-xl bg-white/70 backdrop-blur-sm p-4 border border-slate-200/60 shadow-2xs">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">3.2x</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Category Query Visibility</div>
                </div>
                <div className="rounded-xl bg-white/70 backdrop-blur-sm p-4 border border-slate-200/60 shadow-2xs">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">100%</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">SoftwareApplication JSON-LD</div>
                </div>
                <div className="rounded-xl bg-white/70 backdrop-blur-sm p-4 border border-slate-200/60 shadow-2xs">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">+42%</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Comparison Page Conversions</div>
                </div>
                <div className="rounded-xl bg-white/70 backdrop-blur-sm p-4 border border-slate-200/60 shadow-2xs">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">&lt; 60s</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Setup &amp; Audit Time</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SaaS Challenges */}
        <section className="py-16 sm:py-24 border-b border-slate-100 bg-[#fbfcfb]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-900" />
                <span>THE SAAS BUYING JOURNEY HAS CHANGED</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Software Buyers Ask LLMs Before Ever Clicking a Google Ad
              </h2>
              <p className="mt-3 text-slate-600 text-base leading-relaxed">
                When prospective buyers ask &ldquo;What&apos;s the best alternative to [Competitor]?&rdquo;, your SaaS must have pristine entity schemas, comparison data, and crawlable feature pages.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs hover:border-slate-300 transition">
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm mb-5">
                  <Target className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Omitted in LLM Recommendations</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Generative engines lack clear entity connections between your product name, category taxonomy, and pricing model.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs hover:border-slate-300 transition">
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm mb-5">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Unindexed Feature &amp; Integration Hubs</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Hundreds of integration and template pages rendered with client-side JavaScript that search engine bots fail to crawl properly.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs hover:border-slate-300 transition">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm mb-5">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Engineering Resource Bottlenecks</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Marketing can’t wait 6 weeks for engineering to push schema and canonical updates. You need instant copy-paste code patches.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Deep Dive 1: SoftwareApplication Schema */}
        <section className="py-16 sm:py-24 border-b border-slate-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-md bg-[#dff2ed] px-3 py-1 text-xs font-bold text-slate-900">
                  <Layers className="h-3.5 w-3.5" />
                  <span>STRUCTURED ENTITY GRAPH</span>
                </div>
                <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                  Structured SoftwareApplication Schema
                </h2>
                <p className="mt-4 text-base text-slate-600 leading-relaxed">
                  Define your software category, operating systems, pricing plans, and aggregate customer ratings in machine-readable JSON-LD.
                </p>

                <ul className="mt-6 space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Software &amp; Pricing Models:</strong> Accurately convey Free Trial, Freemium, and Enterprise tier pricing.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>G2 &amp; Capterra Rating Linking:</strong> Connect third-party verified ratings directly to your search snippet.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Competitor Alternative Hubs:</strong> Structure FAQ &amp; ItemList schemas on comparison battlecards.</span>
                  </li>
                </ul>

                <div className="mt-8">
                  <AuthActionButton
                    targetUrl="/dashboard/schema"
                    className="inline-flex items-center gap-2 rounded-full bg-[#181818] px-6 py-3 text-sm font-bold text-white transition hover:bg-black"
                  >
                    Generate Software Schema
                    <ArrowRight className="h-4 w-4" />
                  </AuthActionButton>
                </div>
              </div>

              {/* Visual Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-900 p-6 sm:p-8 text-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-mono text-slate-300">SoftwareApplication Schema Validator</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800/60">
                    VALIDATED
                  </span>
                </div>

                <div className="mt-6 space-y-4 font-mono text-xs">
                  <div className="rounded-lg bg-slate-800/80 p-4 border border-slate-700/60">
                    <div className="text-emerald-400 font-bold">&quot;@type&quot;: &quot;SoftwareApplication&quot;</div>
                    <div className="mt-2 text-slate-300">&quot;name&quot;: &quot;CloudScale Analytics&quot;,</div>
                    <div className="text-slate-300">&quot;applicationCategory&quot;: &quot;BusinessApplication&quot;,</div>
                    <div className="text-slate-300">&quot;operatingSystem&quot;: &quot;Web-based, macOS, Windows&quot;,</div>
                    <div className="text-emerald-300 mt-1">&quot;offers&quot;: &#123;</div>
                    <div className="ml-4 text-emerald-300">&quot;@type&quot;: &quot;Offer&quot;, &quot;price&quot;: &quot;49.00&quot;, &quot;priceCurrency&quot;: &quot;USD&quot;</div>
                    <div className="text-emerald-300">&#125;,</div>
                    <div className="text-slate-300 mt-1">&quot;aggregateRating&quot;: &#123;</div>
                    <div className="ml-4 text-amber-400">&quot;ratingValue&quot;: &quot;4.8&quot;, &quot;ratingCount&quot;: &quot;512&quot;</div>
                    <div className="text-slate-300">&#125;</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Deep Dive 2: LLM Citation Tracking */}
        <section className="py-16 sm:py-24 border-b border-slate-100 bg-[#fbfcfb]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Visual Card */}
              <div className="order-2 lg:order-1 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <span className="text-sm font-bold text-slate-900">SaaS Category Answer Tracking</span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    #1 Cited Brand
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                    <div className="text-slate-500 font-mono text-[11px]">Query: &ldquo;Best automated billing tool for B2B SaaS&rdquo;</div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-bold text-slate-900">ChatGPT Search</span>
                      <span className="text-emerald-600 font-bold">Cited #1</span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                    <div className="text-slate-500 font-mono text-[11px]">Query: &ldquo;Stripe Billing alternatives with custom tax rules&rdquo;</div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-bold text-slate-900">Perplexity AI</span>
                      <span className="text-emerald-600 font-bold">Featured Source</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text */}
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 rounded-md bg-[#dff2ed] px-3 py-1 text-xs font-bold text-slate-900">
                  <Target className="h-3.5 w-3.5" />
                  <span>PROVE MARKETING ROI FAST</span>
                </div>
                <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                  Track High-Intent AI Citations &amp; Conversions
                </h2>
                <p className="mt-4 text-base text-slate-600 leading-relaxed">
                  Monitor when your SaaS brand is referenced by LLMs during high-intent evaluation phases. Prove tangible marketing attribution from next-gen AI search engines.
                </p>

                <ul className="mt-6 space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Category Prompts Monitoring:</strong> Track weekly answer share across ChatGPT, Perplexity, and Claude.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Technical Health Defense:</strong> Keep your docs and landing pages fast, accessible, and error-free.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Integrate with Your CMS:</strong> Easy deployment into Webflow, Next.js, Framer, and WordPress.</span>
                  </li>
                </ul>

                <div className="mt-8">
                  <AuthActionButton
                    targetUrl="/dashboard"
                    className="inline-flex items-center gap-2 rounded-full bg-[#181818] px-6 py-3 text-sm font-bold text-white transition hover:bg-black"
                  >
                    Run SaaS Audit
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
              Supercharge Your SaaS Organic Growth
            </h2>
            <p className="mt-4 max-w-xl text-base text-slate-700">
              Audit your SaaS landing pages and feature hubs in seconds. Start winning search and AI answer engine spots today.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <AuthActionButton
                targetUrl="/dashboard"
                className="rounded-full bg-[#181818] px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-black transition"
              >
                Start Free SaaS Audit
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
