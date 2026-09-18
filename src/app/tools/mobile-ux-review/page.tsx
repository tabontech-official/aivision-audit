import { auth } from "@/lib/auth/auth";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/sections";
import { AuditUrlForm } from "@/components/marketing/audit-url-form";
import { Smartphone, CheckCircle2 } from "lucide-react";

export default async function MobileUxReviewPage() {
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
                <Smartphone className="h-3.5 w-3.5" />
                <span>MOBILE USABILITY &amp; UX AUDIT</span>
              </div>
              <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
                Mobile &amp; UX Review
              </h1>
              <p className="mt-4 text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
                Audit mobile responsiveness, touch target sizes, viewport configurations, font legibility, and layout stability.
              </p>

              <div className="mt-10 w-full max-w-xl">
                <AuditUrlForm size="lg" placeholder="Enter URL to check mobile usability" buttonText="Run Mobile UX Audit" />
              </div>
            </div>
          </div>
        </section>

        {/* Breakdown */}
        <section className="py-16 sm:py-24 border-b border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-display text-3xl font-bold text-slate-900">
                Mobile Experience Signals Checked
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                Ensure over 60% of your mobile traffic enjoys an optimized, conversion-ready browsing experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-2xl border border-slate-200 p-6 bg-white shadow-2xs">
                <div className="h-10 w-10 rounded-xl bg-orange-50 text-[#FF4D00] flex items-center justify-center font-bold text-lg mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Viewport &amp; Responsiveness</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Verifies meta viewport tags, horizontal scroll prevention, and fluid responsive design across device sizes.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-6 bg-white shadow-2xs">
                <div className="h-10 w-10 rounded-xl bg-orange-50 text-[#FF4D00] flex items-center justify-center font-bold text-lg mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Touch Targets &amp; Spacing</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Checks that buttons, links, and form fields are sized and spaced appropriately for mobile fingers.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-6 bg-white shadow-2xs">
                <div className="h-10 w-10 rounded-xl bg-orange-50 text-[#FF4D00] flex items-center justify-center font-bold text-lg mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Legibility &amp; Contrast</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Measures font sizes and color contrast ratios against WCAG accessibility recommendations.
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
