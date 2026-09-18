import { auth } from "@/lib/auth/auth";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/sections";
import { AuditUrlForm } from "@/components/marketing/audit-url-form";
import { ShieldCheck, CheckCircle2 } from "lucide-react";

export default async function SecurityTrustPage() {
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
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>SECURITY &amp; TRUST AUDIT</span>
              </div>
              <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
                Security &amp; Trust
              </h1>
              <p className="mt-4 text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
                Validate SSL status, HTTP security headers, HSTS policy, broken link detection, and domain safety signals.
              </p>

              <div className="mt-10 w-full max-w-xl">
                <AuditUrlForm size="lg" placeholder="Enter URL to test security & trust" buttonText="Run Security Audit" />
              </div>
            </div>
          </div>
        </section>

        {/* Breakdown */}
        <section className="py-16 sm:py-24 border-b border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="font-display text-3xl font-bold text-slate-900">
                Security Factors Verified
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                Protect your user data and maintain strong trust signals required by modern browsers and search engines.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-2xl border border-slate-200 p-6 bg-white shadow-2xs">
                <div className="h-10 w-10 rounded-xl bg-orange-50 text-[#FF4D00] flex items-center justify-center font-bold text-lg mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">SSL &amp; HTTPS Encryption</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Inspects SSL certificate validity, expiration dates, mixed content warnings, and HTTPS redirect enforcement.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-6 bg-white shadow-2xs">
                <div className="h-10 w-10 rounded-xl bg-orange-50 text-[#FF4D00] flex items-center justify-center font-bold text-lg mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">HTTP Security Headers</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Checks for HSTS, Content Security Policy (CSP), X-Frame-Options, and X-Content-Type-Options.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-6 bg-white shadow-2xs">
                <div className="h-10 w-10 rounded-xl bg-orange-50 text-[#FF4D00] flex items-center justify-center font-bold text-lg mb-4">
                  3
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Broken Links &amp; Trust</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Identifies broken external and internal links (404 errors), contact information, and domain reputation.
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
