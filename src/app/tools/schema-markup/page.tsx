import { auth } from "@/lib/auth/auth";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/sections";
import { Layers, Code2 } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Schema Markup Generator & Structured Data Validator · The Rank Writers",
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
                Schema Markup Generator &amp; Validator
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
        <section className="py-16 sm:py-24 border-b border-slate-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-display text-3xl font-bold text-slate-900">
                Complete Structured Data Capabilities
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                Everything you need to audit, create, and optimize Schema.org structured data.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-2xl border border-slate-200 p-6 bg-[#fbfcfb] shadow-2xs">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">10+ Schema Types</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Generate Organization, LocalBusiness, FAQPage, Article, Product, BreadcrumbList, WebSite, and more.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-6 bg-[#fbfcfb] shadow-2xs">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Syntax &amp; Error Validation</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Inspect raw JSON-LD code or live URLs to detect missing required properties, syntax errors, and warnings.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-6 bg-[#fbfcfb] shadow-2xs">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Google Rich Snippets Preview</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  See real-time visual previews of how your schema markup will render in Google SERPs and AI search cards.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
