import { auth } from "@/lib/auth/auth";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/sections";
import { AuditUrlForm } from "@/components/marketing/audit-url-form";
import { Search, CheckCircle2, ShieldCheck, FileText, Globe, Link2, Sparkles } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Free SEO Health Check & Technical Audit · AI Vision Audit",
  description: "Analyze your website’s meta tags, headings, canonicals, robots.txt, sitemaps, and indexing health in seconds.",
};

export default async function SeoHealthCheckPage() {
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
                <Search className="h-3.5 w-3.5" />
                <span>FREE ON-PAGE &amp; TECHNICAL SEO AUDIT</span>
              </div>
              <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
                SEO Health Check
              </h1>
              <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed max-w-2xl font-normal">
                Analyze your website’s meta tags, headings, canonicals, robots.txt, sitemaps, and indexing health in seconds. Get instant prioritized fixes.
              </p>

              <div className="mt-10 w-full max-w-xl font-lazzer">
                <AuditUrlForm size="lg" placeholder="Enter URL to check SEO health" buttonText="Run SEO Check" />
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
                <span>COMPREHENSIVE CRAWL FACTORS</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">
                What the SEO Health Check Inspects
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                Get an instant breakdown of every critical factor search engines use to understand, crawl, and rank your site.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Title Tags &amp; Meta Descriptions</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Checks length, keyword targeting, duplicate descriptions, open graph tags, and SERP snippet readability.
                </p>
              </div>

              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <Search className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Heading Hierarchy (H1-H6)</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Ensures logical document outline, exactly one primary H1 tag per page, and clean semantic sectioning.
                </p>
              </div>

              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <Globe className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Indexability &amp; Canonicals</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Validates self-referencing canonical URLs, robots.txt disallow rules, noindex meta tags, and XML sitemaps.
                </p>
              </div>

              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <Link2 className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Internal &amp; External Links</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Scans for broken links (404s), redirect chains (301/302), missing anchor text, and unhelpful nofollow tags.
                </p>
              </div>

              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Image Optimization &amp; Alt Tags</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Detects unoptimized image assets, missing alt descriptions, oversized payloads, and WebP/AVIF formatting.
                </p>
              </div>

              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Security &amp; Protocol Health</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Validates SSL certificate validity, HTTPS migration enforcement, mixed content avoidance, and HSTS headers.
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
                <h3 className="text-2xl sm:text-3xl font-bold font-display">Ready for a complete audit?</h3>
                <p className="mt-2 text-sm text-slate-300 max-w-lg">
                  Run a full website audit including Core Web Vitals, Schema markup verification, and prioritized roadmap recommendations.
                </p>
              </div>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100 font-lazzer shrink-0"
              >
                Start Free Audit
              </Link>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
