import { auth } from "@/lib/auth/auth";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/sections";
import { AuditUrlForm } from "@/components/marketing/audit-url-form";
import { Smartphone, Layout, Eye, MousePointerClick, Zap, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Free Mobile Usability & UX Review · AI Vision Audit",
  description: "Audit mobile responsiveness, viewport configurations, touch target sizes, legibility, and layout stability.",
};

export default async function MobileUxReviewPage() {
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
                <Smartphone className="h-3.5 w-3.5" />
                <span>MOBILE USABILITY &amp; UX AUDIT</span>
              </div>
              <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
                Mobile &amp; UX Review
              </h1>
              <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed max-w-2xl font-normal">
                Audit mobile responsiveness, touch target sizes, viewport configurations, font legibility, and layout stability to ensure seamless smartphone user experiences.
              </p>

              <div className="mt-10 w-full max-w-xl font-lazzer">
                <AuditUrlForm size="lg" placeholder="Enter URL to check mobile usability" buttonText="Run Mobile UX Audit" />
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
                <span>MOBILE-FIRST EXPERIENCE SIGNALS</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">
                Mobile Experience Factors Checked
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                Ensure over 60% of your mobile traffic enjoys an optimized, conversion-ready browsing experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <Layout className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Viewport &amp; Responsiveness</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Verifies meta viewport tags, horizontal scroll prevention, and fluid responsive grid scaling across small and large phone screens.
                </p>
              </div>

              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <MousePointerClick className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Touch Targets &amp; Spacing</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Checks that interactive buttons, navigation links, and form fields meet minimum 48x48px hit areas with adequate spacing.
                </p>
              </div>

              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <Eye className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Legibility &amp; Font Contrast</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Measures base font sizes (min 16px to prevent iOS auto-zoom) and color contrast ratios against WCAG 2.1 AA accessibility guidelines.
                </p>
              </div>

              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <Zap className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Mobile Layout Shifts</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Detects disruptive content shifts caused by late-loading ads, dynamic banners, or missing image aspect-ratio placeholders.
                </p>
              </div>

              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <Smartphone className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Device Emulation &amp; Gestures</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Simulates iOS Safari and Android Chrome rendering engines to uncover device-specific layout quirks and input lag.
                </p>
              </div>

              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Form &amp; Input Usability</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Validates virtual keyboard type associations (email, tel, numeric), auto-complete tags, and streamlined single-column forms.
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
                <h3 className="text-2xl sm:text-3xl font-bold font-display">Ready for a mobile-first audit?</h3>
                <p className="mt-2 text-sm text-slate-300 max-w-lg">
                  Run a complete website audit with Mobile UX checks, Core Web Vitals, and prioritized conversion roadmap suggestions.
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
