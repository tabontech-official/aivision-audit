import { auth } from "@/lib/auth/auth";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/sections";
import { AuditUrlForm } from "@/components/marketing/audit-url-form";
import { Gauge, Zap, CheckCircle2 } from "lucide-react";

export default async function SpeedCoreVitalsPage() {
  const session = await auth();

  return (
    <>
      <MarketingHeader isLoggedIn={!!session?.user} />
      <main className="bg-white">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-[#FCFCFB] py-16 sm:py-24 border-b border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center flex flex-col items-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-[#FF4D00]">
                <Gauge className="h-3.5 w-3.5" />
                <span>PERFORMANCE &amp; PAGESPEED TOOL</span>
              </div>
              <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
                Speed &amp; Core Vitals
              </h1>
              <p className="mt-4 text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
                Measure Google PageSpeed insights, Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), and First Contentful Paint (FCP).
              </p>

              <div className="mt-10 w-full max-w-xl">
                <AuditUrlForm size="lg" placeholder="Enter URL to test speed & vitals" buttonText="Test Speed Now" />
              </div>
            </div>
          </div>
        </section>

        {/* Breakdown */}
        <section className="py-16 sm:py-24 border-b border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-display text-3xl font-bold text-slate-900">
                Core Web Vitals Analyzed
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                Discover the exact metrics Google uses to evaluate your site speed and user experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-2xl border border-slate-200 p-6 bg-white shadow-2xs">
                <div className="h-10 w-10 rounded-xl bg-orange-50 text-[#FF4D00] flex items-center justify-center font-bold text-lg mb-4">
                  LCP
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Largest Contentful Paint</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Measures loading performance. Checks main hero image, background assets, and render times.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-6 bg-white shadow-2xs">
                <div className="h-10 w-10 rounded-xl bg-orange-50 text-[#FF4D00] flex items-center justify-center font-bold text-lg mb-4">
                  CLS
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Cumulative Layout Shift</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Measures visual stability. Identifies layout jumps caused by images or web fonts without dimensions.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-6 bg-white shadow-2xs">
                <div className="h-10 w-10 rounded-xl bg-orange-50 text-[#FF4D00] flex items-center justify-center font-bold text-lg mb-4">
                  FCP
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">First Contentful Paint</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Tracks the time until the browser renders the first piece of text, image, or canvas element.
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
