import { auth } from "@/lib/auth/auth";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/sections";
import { Layers, Code2, CheckCircle2, Eye, Building2, ShoppingBag, HelpCircle, FileText } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Schema Markup Generator & Structured Data Validator · AI Vision Audit",
  description: "Generate, test, and validate Google-compliant JSON-LD structured data and preview rich snippets.",
};

export default async function SchemaMarkupToolPage() {
  const session = await auth();

  return (
    <>
      <MarketingHeader isLoggedIn={!!session?.user} />
      <main className="bg-white font-lazzer">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-[#dff2ed] py-16 sm:py-24 border-b border-slate-200/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center flex flex-col items-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800">
                <Layers className="h-3.5 w-3.5" />
                <span>FREE STRUCTURED DATA SUITE</span>
              </div>
              <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
                Schema Markup Suite
              </h1>
              <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed max-w-2xl font-normal">
                Generate clean, Google-compliant JSON-LD markup and validate existing structured data to win rich snippets in Google and AI answer engines.
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/dashboard/schema"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#181818] px-7 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-black font-lazzer"
                >
                  <Code2 className="h-4 w-4" />
                  <span>Open Schema Suite</span>
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full border border-slate-700/60 bg-white px-7 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 font-lazzer"
                >
                  Create Free Account
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Checks Breakdown */}
        <section className="py-16 sm:py-24 border-b border-slate-100 bg-[#fbfcfb]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-900" />
                <span>STRUCTURED DATA TOOLS</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">
                Complete Structured Data Capabilities
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                Everything you need to audit, create, and optimize Schema.org structured data.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <Building2 className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Organization &amp; Local Business</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Generate rich entity graphs with logo, address, geo coordinates, opening hours, contact points, and social profiles.
                </p>
              </div>

              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <HelpCircle className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">FAQPage &amp; How-To Markup</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Earn expandable FAQ accordion rich snippets in Google search results with validated question and answer pairs.
                </p>
              </div>

              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <ShoppingBag className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Product &amp; Offer Schemas</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Showcase pricing, availability status, SKU, aggregate review ratings, and brand identity directly in search results.
                </p>
              </div>

              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Article &amp; BlogPosting</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Structure publisher info, author entities, datePublished, headline, and featured image assets for Google Discover and News.
                </p>
              </div>

              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <Eye className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Real-Time Rich Snippet Preview</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Preview how your structured data will visually render on desktop and mobile Google SERP snippets before publishing.
                </p>
              </div>

              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Syntax &amp; Error Validation</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Detect syntax errors, invalid date formats, missing recommended properties, and standard Schema.org compliance violations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="bg-white py-16 sm:py-20 border-b border-slate-100">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-sm bg-[#111827] p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold font-display">Generate and test structured data</h3>
                <p className="mt-2 text-sm text-slate-300 max-w-lg">
                  Access our Schema suite to generate validated JSON-LD or test your existing website URLs instantly.
                </p>
              </div>
              <Link
                href="/dashboard/schema"
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100 font-lazzer shrink-0"
              >
                Launch Schema Suite
              </Link>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
