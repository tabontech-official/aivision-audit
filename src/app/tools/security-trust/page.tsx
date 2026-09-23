import { auth } from "@/lib/auth/auth";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/sections";
import { AuditUrlForm } from "@/components/marketing/audit-url-form";
import { ShieldCheck, Lock, ShieldAlert, Key, Globe, FileCheck } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Free Security, SSL & Trust Signal Audit · AI Vision Audit",
  description: "Check SSL certificates, HSTS policy, security headers, mixed content, and safe browsing reputations.",
};

export default async function SecurityTrustPage() {
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
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>SECURITY, SSL &amp; TRUST AUDIT</span>
              </div>
              <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
                Security &amp; Trust Review
              </h1>
              <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed max-w-2xl font-normal">
                Check SSL certificates, HTTP security headers, HSTS configuration, mixed content risks, and safe browsing reputations in seconds.
              </p>

              <div className="mt-10 w-full max-w-xl font-lazzer">
                <AuditUrlForm size="lg" placeholder="Enter URL to check security and trust" buttonText="Run Security Audit" />
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
                <span>ENTERPRISE-GRADE SECURITY AUDITING</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">
                Security &amp; Compliance Signals Checked
              </h2>
              <p className="mt-3 text-slate-600 text-base">
                Protect user trust, safeguard customer data, and meet modern browser compliance standards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">SSL / TLS Certificate Health</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Checks certificate validity, expiration dates, trusted certificate authorities, and modern cipher suite compatibility.
                </p>
              </div>

              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <Key className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">HSTS &amp; HTTPS Enforcement</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Ensures HTTP-to-HTTPS 301 redirection, Strict-Transport-Security (HSTS) headers, and preload eligibility.
                </p>
              </div>

              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <ShieldAlert className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Security Response Headers</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Inspects Content-Security-Policy (CSP), X-Frame-Options (clickjacking defense), X-Content-Type-Options, and Referrer-Policy.
                </p>
              </div>

              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <Globe className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Mixed Content Detection</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Flags insecure HTTP image, script, iframe, or stylesheet resources being loaded inside encrypted HTTPS pages.
                </p>
              </div>

              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <FileCheck className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Safe Browsing &amp; Reputation</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Validates domain reputation against malware blacklists, phishing databases, and Google Safe Browsing advisories.
                </p>
              </div>

              <div className="rounded-sm border border-slate-200/90 p-6 sm:p-7 bg-white shadow-2xs">
                <div className="h-9 w-9 rounded-sm bg-[#dff2ed] text-slate-900 flex items-center justify-center font-bold text-sm mb-4">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Cookie Security Flags</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Verifies that session and authentication cookies include Secure, HttpOnly, and SameSite=Lax/Strict directives.
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
                <h3 className="text-2xl sm:text-3xl font-bold font-display">Ready for a full security scan?</h3>
                <p className="mt-2 text-sm text-slate-300 max-w-lg">
                  Run a complete audit across SEO health, Core Web Vitals, Schema markup, and security posture with AI Vision Audit.
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
