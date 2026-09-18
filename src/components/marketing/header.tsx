"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Menu,
  X,
  Zap,
  ShieldCheck,
  Search,
  Gauge,
  Smartphone,
  Globe,
  BarChart2,
  FileText,
  Layers,
  ArrowRight,
} from "lucide-react";
import { AuthGateModal } from "@/components/marketing/auth-gate-modal";

export function MarketingHeader({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (name: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setActiveDropdown(name);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  const scrollToHero = () => {
    const input = document.querySelector("input[type='text'], input[placeholder*='http']");
    if (input) {
      input.scrollIntoView({ behavior: "smooth", block: "center" });
      (input as HTMLElement).focus();
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-[74px] sm:h-[78px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo & Title */}
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          {/* Exact Brand Logo SVG */}
          <div className="flex h-8 w-8 items-center justify-center">
            <svg
              viewBox="0 0 36 36"
              className="h-8 w-8 text-[#FF4D00]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 22L11 11L18 25L25 10L32 18"
                stroke="#FF4D00"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="4" cy="22" r="3" fill="#FFFFFF" stroke="#FF4D00" strokeWidth="2.4" />
              <circle cx="11" cy="11" r="3" fill="#FFFFFF" stroke="#FF4D00" strokeWidth="2.4" />
              <circle cx="18" cy="25" r="3" fill="#FFFFFF" stroke="#FF4D00" strokeWidth="2.4" />
              <circle cx="25" cy="10" r="3" fill="#FFFFFF" stroke="#FF4D00" strokeWidth="2.4" />
              <circle cx="32" cy="18" r="3" fill="#FFFFFF" stroke="#FF4D00" strokeWidth="2.4" />
            </svg>
          </div>
          <span className="text-[19px] sm:text-[20px] font-semibold tracking-tight text-slate-900">
            SEO Site Checkup
          </span>
        </Link>

        {/* Center / Navigation Links */}
        <nav className="hidden items-center gap-6 lg:gap-8 md:flex">
          {/* Features Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("features")}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[15px] font-medium transition-colors rounded-lg ${
                activeDropdown === "features"
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-slate-700 hover:text-slate-900"
              }`}
            >
              <span>Features</span>
              <ChevronDown
                className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                  activeDropdown === "features" ? "rotate-180 text-slate-900" : ""
                }`}
              />
            </button>

            {activeDropdown === "features" && (
              <div className="absolute top-full left-0 pt-2 z-50">
                <div className="w-[620px] rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xl">
                  <div className="grid grid-cols-2 gap-x-7 gap-y-6">
                    <Link
                      href="/tools/seo-health-check"
                      onClick={() => setActiveDropdown(null)}
                      className="group flex items-start gap-3 rounded-lg p-1 transition"
                    >
                      <div className="mt-0.5 shrink-0 text-[#FF4D00]">
                        <Search className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div>
                        <div className="text-[15px] font-bold text-slate-900 group-hover:text-[#FF4D00] transition-colors">
                          SEO Health Check
                        </div>
                        <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                          Meta tags, headings, canonicals, robots.txt, and sitemap health.
                        </p>
                      </div>
                    </Link>

                    <Link
                      href="/tools/speed-core-vitals"
                      onClick={() => setActiveDropdown(null)}
                      className="group flex items-start gap-3 rounded-lg p-1 transition"
                    >
                      <div className="mt-0.5 shrink-0 text-[#FF4D00]">
                        <Gauge className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div>
                        <div className="text-[15px] font-bold text-slate-900 group-hover:text-[#FF4D00] transition-colors">
                          Speed &amp; Core Vitals
                        </div>
                        <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                          Google PageSpeed metrics, LCP, CLS, FCP, and performance scoring.
                        </p>
                      </div>
                    </Link>

                    <Link
                      href="/tools/mobile-ux-review"
                      onClick={() => setActiveDropdown(null)}
                      className="group flex items-start gap-3 rounded-lg p-1 transition"
                    >
                      <div className="mt-0.5 shrink-0 text-[#FF4D00]">
                        <Smartphone className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div>
                        <div className="text-[15px] font-bold text-slate-900 group-hover:text-[#FF4D00] transition-colors">
                          Mobile &amp; UX Review
                        </div>
                        <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                          Mobile responsiveness, tap targets, contrast, and layout audits.
                        </p>
                      </div>
                    </Link>

                    <Link
                      href="/tools/security-trust"
                      onClick={() => setActiveDropdown(null)}
                      className="group flex items-start gap-3 rounded-lg p-1 transition"
                    >
                      <div className="mt-0.5 shrink-0 text-[#FF4D00]">
                        <ShieldCheck className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div>
                        <div className="text-[15px] font-bold text-slate-900 group-hover:text-[#FF4D00] transition-colors">
                          Security &amp; Trust
                        </div>
                        <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                          SSL status, broken link checks, headers, and trust signal validation.
                        </p>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Use Cases Dropdown — EXACT LAYOUT & COPY FROM REFERENCE */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("useCases")}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[15px] font-medium transition-colors rounded-lg ${
                activeDropdown === "useCases"
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-slate-700 hover:text-slate-900"
              }`}
            >
              <span>Use Cases</span>
              <ChevronDown
                className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                  activeDropdown === "useCases" ? "rotate-180 text-slate-900" : ""
                }`}
              />
            </button>

            {activeDropdown === "useCases" && (
              <div className="absolute top-full left-0 pt-2 z-50">
                <div className="w-[640px] max-w-[90vw] rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Item 1: Content-Led Companies */}
                    <a
                      href="#product"
                      className="group flex items-start gap-3.5 rounded-lg transition"
                    >
                      <div className="mt-0.5 shrink-0 text-[#FF4D00]">
                        {/* Document with bar chart inside */}
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="8" y1="18" x2="8" y2="14" />
                          <line x1="12" y1="18" x2="12" y2="11" />
                          <line x1="16" y1="18" x2="16" y2="16" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-[15px] font-bold text-slate-900 group-hover:text-[#FF4D00] transition-colors">
                          Content-Led Companies
                        </div>
                        <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                          Large-site audits. AI citation tracking. Content performance intel.
                        </p>
                      </div>
                    </a>

                    {/* Item 2: E-commerce Brands */}
                    <a
                      href="#product"
                      className="group flex items-start gap-3.5 rounded-lg transition"
                    >
                      <div className="mt-0.5 shrink-0 text-[#FF4D00]">
                        {/* Shopping bag */}
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-[15px] font-bold text-slate-900 group-hover:text-[#FF4D00] transition-colors">
                          E-commerce Brands
                        </div>
                        <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                          Monitor product pages, schemas, feeds. Rank in Google and ChatGPT.
                        </p>
                      </div>
                    </a>

                    {/* Item 3: Growth Agencies */}
                    <a
                      href="#product"
                      className="group flex items-start gap-3.5 rounded-lg transition"
                    >
                      <div className="mt-0.5 shrink-0 text-[#FF4D00]">
                        {/* Trending growth icon */}
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="20" x2="18" y2="10" />
                          <line x1="12" y1="20" x2="12" y2="4" />
                          <line x1="6" y1="20" x2="6" y2="14" />
                          <polyline points="2 6 9 6 9 13" />
                          <line x1="9" y1="6" x2="2" y2="13" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-[15px] font-bold text-slate-900 group-hover:text-[#FF4D00] transition-colors">
                          Growth Agencies
                        </div>
                        <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                          Multi-client command center. White-label reports. AI + traditional SEO.
                        </p>
                      </div>
                    </a>

                    {/* Item 4: SaaS Marketers */}
                    <a
                      href="#product"
                      className="group flex items-start gap-3.5 rounded-lg transition"
                    >
                      <div className="mt-0.5 shrink-0 text-[#FF4D00]">
                        {/* 3D isometric cube */}
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                          <line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-[15px] font-bold text-slate-900 group-hover:text-[#FF4D00] transition-colors">
                          SaaS Marketers
                        </div>
                        <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                          Monitor product pages, track AI citations, prove marketing ROI fast.
                        </p>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Free Tools */}
          <a
            href="#tools"
            onClick={(e) => {
              e.preventDefault();
              scrollToHero();
            }}
            className="px-3 py-1.5 text-[15px] font-medium text-slate-700 transition hover:text-slate-900"
          >
            Free Tools
          </a>

          {/* Pricing */}
          <a
            href="#pricing"
            className="px-3 py-1.5 text-[15px] font-medium text-slate-700 transition hover:text-slate-900"
          >
            Pricing
          </a>

          {/* Articles */}
          <a
            href="#faq"
            className="px-3 py-1.5 text-[15px] font-medium text-slate-700 transition hover:text-slate-900"
          >
            Articles
          </a>
        </nav>

        {/* Right Action Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          {isLoggedIn ? (
            <>
              <button
                type="button"
                onClick={scrollToHero}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-xs transition hover:border-slate-300 hover:bg-slate-50"
              >
                Run Audit
              </button>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-lg bg-[#FF4D00] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#E64500]"
              >
                Dashboard
              </Link>
            </>
          ) : (
            <>
              {/* Log In Button: Outlined style */}
              <button
                type="button"
                onClick={() => setGateOpen(true)}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-xs transition hover:border-slate-300 hover:bg-slate-50"
              >
                Log In
              </button>

              {/* Try for Free Button: Orange Solid Button */}
              <button
                type="button"
                onClick={scrollToHero}
                className="inline-flex items-center justify-center rounded-lg bg-[#FF4D00] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#E64500]"
              >
                Try for Free
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-100 md:hidden"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-6 shadow-xl md:hidden">
          <nav className="flex flex-col gap-4">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between text-base font-medium text-slate-800"
            >
              <span>Features</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </a>
            <a
              href="#product"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between text-base font-medium text-slate-800"
            >
              <span>Use Cases</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </a>
            <a
              href="#tools"
              onClick={() => {
                setMobileMenuOpen(false);
                scrollToHero();
              }}
              className="text-base font-medium text-slate-800"
            >
              Free Tools
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-slate-800"
            >
              Pricing
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-slate-800"
            >
              Articles
            </a>
          </nav>

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="flex w-full items-center justify-center rounded-lg bg-[#FF4D00] py-2.5 text-center text-sm font-semibold text-white shadow-sm"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setGateOpen(true);
                  }}
                  className="flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white py-2.5 text-center text-sm font-semibold text-slate-800 shadow-xs"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    scrollToHero();
                  }}
                  className="flex w-full items-center justify-center rounded-lg bg-[#FF4D00] py-2.5 text-center text-sm font-semibold text-white shadow-sm"
                >
                  Try for Free
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Auth Gate Modal */}
      <AuthGateModal
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        onAuthenticated={(redirectTo) => {
          setGateOpen(false);
          router.push(redirectTo);
          router.refresh();
        }}
      />
    </header>
  );
}