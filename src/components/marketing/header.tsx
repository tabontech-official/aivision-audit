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
  ArrowUpRight,
} from "lucide-react";
import dynamic from "next/dynamic";
import { BrandIcon } from "@/components/ui/brand-icon";

const AuthGateModal = dynamic(
  () => import("@/components/marketing/auth-gate-modal").then((m) => m.AuthGateModal),
  { ssr: false },
);

export function MarketingHeader({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
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
    const handleScroll = () => {
      // Transition to solid white when scrolled past the initial hero view
      if (window.scrollY > 280) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  const scrollToHero = () => {
    const input = document.querySelector("input[type='text'], input[placeholder*='website']");
    if (input) {
      input.scrollIntoView({ behavior: "smooth", block: "center" });
      (input as HTMLElement).focus();
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-colors duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs"
          : "bg-[#dff2ed] border-b border-transparent shadow-none"
      }`}
    >
      <div className="w-full flex h-[70px] sm:h-[74px] items-center justify-between px-4 sm:px-8 lg:px-12">
        {/* Left: Brand Logo & Title */}
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <BrandIcon className="h-8 w-8 text-[rgb(24,30,21)] shrink-0" />
          <span className="text-[18px] sm:text-[19px] font-bold tracking-tight text-[rgb(24,30,21)] font-lazzer">
            The Rank Writers
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
              className={`flex items-center gap-1.5 px-3 py-1.5 font-lazzer text-[16px] font-[600] leading-[19.2px] transition-colors rounded-lg ${
                activeDropdown === "features"
                  ? "text-black font-bold"
                  : "text-[rgb(24,30,21)] hover:text-black"
              }`}
            >
              <span>Features</span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-[rgb(24,30,21)] transition-transform duration-200 stroke-[2.5] ${
                  activeDropdown === "features" ? "rotate-180 text-black" : ""
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

          {/* Use Cases Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("useCases")}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 font-lazzer text-[16px] font-[600] leading-[19.2px] transition-colors rounded-lg ${
                activeDropdown === "useCases"
                  ? "text-black font-bold"
                  : "text-[rgb(24,30,21)] hover:text-black"
              }`}
            >
              <span>Use Cases</span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-[rgb(24,30,21)] transition-transform duration-200 stroke-[2.5] ${
                  activeDropdown === "useCases" ? "rotate-180 text-black" : ""
                }`}
              />
            </button>

            {activeDropdown === "useCases" && (
              <div className="absolute top-full left-0 pt-2 z-50">
                <div className="w-[640px] max-w-[90vw] rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                    <a
                      href="#product"
                      className="group flex items-start gap-3.5 rounded-lg transition"
                    >
                      <div className="mt-0.5 shrink-0 text-[#FF4D00]">
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

                    <a
                      href="#product"
                      className="group flex items-start gap-3.5 rounded-lg transition"
                    >
                      <div className="mt-0.5 shrink-0 text-[#FF4D00]">
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

                    <a
                      href="#product"
                      className="group flex items-start gap-3.5 rounded-lg transition"
                    >
                      <div className="mt-0.5 shrink-0 text-[#FF4D00]">
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

                    <a
                      href="#product"
                      className="group flex items-start gap-3.5 rounded-lg transition"
                    >
                      <div className="mt-0.5 shrink-0 text-[#FF4D00]">
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
            className="px-3 py-1.5 font-lazzer text-[16px] font-[600] leading-[19.2px] text-[rgb(24,30,21)] transition hover:text-black"
          >
            Free Tools
          </a>

          {/* Pricing */}
          <a
            href="#pricing"
            className="px-3 py-1.5 font-lazzer text-[16px] font-[600] leading-[19.2px] text-[rgb(24,30,21)] transition hover:text-black"
          >
            Pricing
          </a>

          {/* Articles */}
          <a
            href="#faq"
            className="px-3 py-1.5 font-lazzer text-[16px] font-[600] leading-[19.2px] text-[rgb(24,30,21)] transition hover:text-black"
          >
            Articles
          </a>
        </nav>

        {/* Right Action Buttons */}
        <div className="hidden items-center gap-3 md:flex font-lazzer">
          {isLoggedIn ? (
            <>
              <button
                type="button"
                onClick={scrollToHero}
                className="inline-flex items-center justify-center rounded-full border border-slate-700/60 bg-transparent px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-900/5 cursor-pointer"
              >
                Run Audit
              </button>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full bg-[#181818] px-5 py-2 text-sm font-semibold text-white transition hover:bg-black cursor-pointer shadow-xs"
              >
                Dashboard
              </Link>
            </>
          ) : (
            <>
              {/* Log In Button: Pill style */}
              <button
                type="button"
                onClick={() => setGateOpen(true)}
                className="inline-flex items-center justify-center rounded-full border border-slate-700/60 bg-transparent px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-900/5 cursor-pointer"
              >
                Log In
              </button>

              {/* Try for Free Button: Solid Dark Pill */}
              <button
                type="button"
                onClick={() => setGateOpen(true)}
                className="inline-flex items-center justify-center rounded-full bg-[#181818] px-5 py-2 text-sm font-semibold text-white transition hover:bg-black cursor-pointer shadow-xs"
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
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-700 transition hover:bg-slate-100 md:hidden"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200/80 bg-white px-4 py-6 shadow-xl md:hidden font-lazzer">
          <nav className="flex flex-col gap-4">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between text-[16px] font-[600] leading-[19.2px] text-[rgb(24,30,21)]"
            >
              <span>Features</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </a>
            <a
              href="#product"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between text-[16px] font-[600] leading-[19.2px] text-[rgb(24,30,21)]"
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
              className="text-[16px] font-[600] leading-[19.2px] text-[rgb(24,30,21)]"
            >
              Free Tools
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="text-[16px] font-[600] leading-[19.2px] text-[rgb(24,30,21)]"
            >
              Pricing
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="text-[16px] font-[600] leading-[19.2px] text-[rgb(24,30,21)]"
            >
              Articles
            </a>
          </nav>

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="flex w-full items-center justify-center rounded-full bg-[#181818] py-2.5 text-center text-sm font-semibold text-white shadow-xs"
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
                  className="flex w-full items-center justify-center rounded-full border border-slate-700/60 bg-transparent py-2.5 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setGateOpen(true);
                  }}
                  className="flex w-full items-center justify-center rounded-full bg-[#181818] py-2.5 text-center text-sm font-semibold text-white shadow-xs hover:bg-black"
                >
                  Try for Free
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Auth Gate Modal */}
      {gateOpen && (
        <AuthGateModal
          open={gateOpen}
          onClose={() => setGateOpen(false)}
          onAuthenticated={(redirectTo) => {
            setGateOpen(false);
            router.push(redirectTo);
            router.refresh();
          }}
        />
      )}
    </header>
  );
}