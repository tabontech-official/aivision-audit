import { auth } from "@/lib/auth/auth";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/sections";
import { AuditUrlForm } from "@/components/marketing/audit-url-form";
import { Gauge, Zap, Smartphone, Laptop, Clock, Activity } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Free PageSpeed & Core Web Vitals Test · AI Vision Audit",
  description: "Measure Google PageSpeed metrics, LCP, CLS, FCP, and performance scoring for mobile and desktop.",
};

export default async function SpeedCoreVitalsPage() {
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
                <Gauge className="h-3.5 w-3.5" />
                <span>GOOGLE PAGESPEED &amp; CORE WEB VITALS</span>
              </div>
              <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
                Speed &amp; Core Vitals Test
              </h1>
              <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed max-w-2xl font-normal">
                Direct integration with Google PageSpeed Insights. Measure real-world Mobile and Desktop performance metrics with actionable fixes.
              </p>

              <div className="mt-10 w-full max-w-xl font-lazzer">
                <AuditUrlForm size="lg" placeholder="Enter URL to test speed & vitals" buttonText="Test Speed Now" />
              </div>
            </div>
          </div>
        </section>

        {/* Breakdown */}
        <section className="py-16 sm:py-24 border-b border-slate-100 bg-[#fbfcfb]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-900" />
                <span>OFFICIAL GOOGLE METRICS</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">
                Core Web Vitals We Measure
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                Discover the exact metrics Google uses in its ranking algorithms to judge user experience and page speed.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <Clock className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Largest Contentful Paint (LCP)</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Measures main content render speed. Evaluates hero images, banner headings, and render-blocking CSS/JS files.
                </p>
              </div>

              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <Activity className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Cumulative Layout Shift (CLS)</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Measures visual stability. Pinpoints elements shifting unexpectedly due to unsized images, dynamic banners, or late fonts.
                </p>
              </div>

              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <Zap className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">First Contentful Paint (FCP)</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Tracks the exact milliseconds until the browser paints the first visual element from the server response.
                </p>
              </div>

              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <Activity className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Total Blocking Time (TBT)</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Measures JavaScript execution overhead and main-thread responsiveness before the page becomes fully interactive.
                </p>
              </div>

              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <Smartphone className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Mobile Emulation Scoring</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Tests on emulated Moto G4 on a 4G connection to simulate actual mobile user experiences and Googlebot Mobile crawls.
                </p>
              </div>

              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <Laptop className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Desktop Performance Scoring</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Evaluates high-speed broadband performance, full-res image loading, and desktop viewport optimizations.
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
                <h3 className="text-2xl sm:text-3xl font-bold font-display">Need deeper performance diagnostics?</h3>
                <p className="mt-2 text-sm text-slate-300 max-w-lg">
                  Run a full audit to receive precise code-level recommendations, script breakdown, and image compression roadmaps.
                </p>
              </div>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100 font-lazzer shrink-0"
              >
                Run Free Audit
              </Link>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
