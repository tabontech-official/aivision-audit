import Link from "next/link";
import {
  Gauge,
  Search,
  Accessibility,
  Smartphone,
  ShieldCheck,
  TrendingUp,
  FileSearch,
  ListChecks,
  Rocket,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Check,
  Minus,
  Box,
  BarChart3,
  Users,
  ShoppingBag,
  ChevronRight,
  ChevronDown,
  Zap,
  Link2,
  Award,
  Flag,
  BookOpen,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import { AuditUrlForm } from "./audit-url-form";
import { HeroSearchForm } from "./hero-search-form";
import { BrandIcon } from "@/components/ui/brand-icon";

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#dff2ed] pt-8 pb-10 sm:pt-12 sm:pb-14">
      {/* Background ambient lighting and soft radial wash */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(195,242,231,0.65),transparent_80%)] pointer-events-none" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-8 lg:px-12 text-center">
        {/* Main Headline */}
        <h1 className="font-display font-semibold text-5xl sm:text-6xl md:text-7xl lg:text-[76px] xl:text-[80px] tracking-[-0.035em] text-[#111827] leading-[1.06] max-w-4xl mx-auto">
          Be found everywhere
          <br />
          search happens
        </h1>

        {/* Subtitle */}
        <p className="mt-4 sm:mt-5 text-base sm:text-lg md:text-[19px] text-[#374151] max-w-xl mx-auto font-normal leading-relaxed">
          The leading platform to grow and measure
          <br className="hidden sm:inline" /> brand visibility across every digital channel.
        </p>

        {/* Search Bar Pill Container */}
        <div className="mt-8 sm:mt-10 mx-auto max-w-2xl w-full font-lazzer">
          <HeroSearchForm />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Second Section: AI & Search Opportunities Feature Cards            */
/* ------------------------------------------------------------------ */

/* Second Section: AI & Search Opportunities Feature Cards            */
/* ------------------------------------------------------------------ */

export function CredibilityStrip() {
  return (
    <section className="bg-[#dff2ed] pt-0 pb-10 sm:pb-14 lg:pb-16">
      <div className="w-full px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Card - Feature Card (col-span-8) with rounded-sm and compact padding */}
          <div className="lg:col-span-8 relative overflow-hidden rounded-sm bg-[#b482fc] p-5 sm:p-6 lg:p-7 flex flex-col justify-between shadow-xs">
            {/* Diagonal Striped Accent Pattern Top-Right */}
            <div className="absolute top-0 right-0 w-36 h-36 pointer-events-none opacity-35 overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 160 160" fill="none">
                <defs>
                  <pattern
                    id="stripes-purple"
                    patternUnits="userSpaceOnUse"
                    width="10"
                    height="10"
                    patternTransform="rotate(45)"
                  >
                    <line x1="0" y1="0" x2="0" y2="10" stroke="#ffffff" strokeWidth="2.5" />
                  </pattern>
                </defs>
                <rect width="160" height="160" fill="url(#stripes-purple)" />
              </svg>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center z-10">
              {/* Left Column: Heading (2 lines), Description & CTA */}
              <div className="md:col-span-5 flex flex-col justify-between h-full">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-black/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-900 mb-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>Live Audit Engine</span>
                  </div>

                  <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-[34px] xl:text-[36px] leading-[1.1] tracking-tight text-[#161e2e]">
                    <span className="block">Complete Website</span>
                    <span className="block">SEO & Speed Audit</span>
                  </h2>

                  <p className="mt-4 text-xs sm:text-sm font-medium text-slate-900/90 leading-relaxed max-w-xs">
                    Inspect 70+ technical SEO factors, Google Core Web Vitals, mobile UX, security headers, and on-page crawlability with prioritized fixes.
                  </p>
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center rounded-full bg-[#181818] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-black cursor-pointer shadow-xs font-lazzer"
                  >
                    Run Free Audit
                  </Link>
                </div>
              </div>

              {/* Right Column: Inset White Mock Data Card with rounded-sm */}
              <div className="md:col-span-7">
                <div className="bg-white rounded-sm p-4 sm:p-5 shadow-sm border border-white/80">
                  {/* Top Opportunities Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 font-display">
                        Audit Health Breakdown
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">Real-time technical &amp; performance checks</p>
                    </div>
                    <div className="flex items-center rounded-sm border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                      Score: 94/100
                    </div>
                  </div>

                  {/* 2-Column Metrics */}
                  <div className="mt-3.5 grid grid-cols-2 gap-x-5 gap-y-2 border-b border-slate-100 pb-3.5 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100/60 pb-1.5">
                      <span className="text-slate-600 font-medium">Technical SEO</span>
                      <span className="font-bold text-emerald-600 font-display text-xs sm:text-sm">96% Passed</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100/60 pb-1.5">
                      <span className="text-slate-600 font-medium">Core Web Vitals</span>
                      <span className="font-bold text-emerald-600 font-display text-xs sm:text-sm">Good (1.2s)</span>
                    </div>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-slate-600 font-medium">Mobile Usability</span>
                      <span className="font-bold text-slate-900 font-display text-xs sm:text-sm">100% Ready</span>
                    </div>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-slate-600 font-medium">Security &amp; SSL</span>
                      <span className="font-bold text-emerald-600 font-display text-xs sm:text-sm">A+ Grade</span>
                    </div>
                  </div>

                  {/* Audit Diagnostic Summary */}
                  <div className="mt-3.5 flex items-center justify-between">
                    <div className="flex flex-col">
                      <h4 className="text-xs font-bold text-slate-900 font-display uppercase tracking-wider">
                        Quick Fix Roadmap
                      </h4>
                      <div className="mt-2 flex flex-col gap-1.5 text-[11px] font-medium text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span>Canonical &amp; Robots.txt valid</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-blue-500" />
                          <span>Page speed optimized (LCP 1.2s)</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-sm border border-purple-200">
                        70+ Checks Run
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Card - Schema Markup Suite Card (col-span-4) with rounded-sm and compact padding */}
          <div className="lg:col-span-4 relative overflow-hidden rounded-sm bg-[#F7F9F8] p-5 sm:p-6 lg:p-7 flex flex-col justify-between shadow-xs border border-slate-200/50">
            {/* Diagonal Striped Accent Pattern Top-Right */}
            <div className="absolute top-0 right-0 w-36 h-36 pointer-events-none opacity-30 overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 160 160" fill="none">
                <defs>
                  <pattern
                    id="stripes-gray"
                    patternUnits="userSpaceOnUse"
                    width="10"
                    height="10"
                    patternTransform="rotate(45)"
                  >
                    <line x1="0" y1="0" x2="0" y2="10" stroke="#a855f7" strokeWidth="2.5" />
                  </pattern>
                </defs>
                <rect width="160" height="160" fill="url(#stripes-gray)" />
              </svg>
            </div>

            <div className="z-10 flex flex-col justify-between h-full">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 text-[11px] font-bold uppercase tracking-wider mb-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  <span>Available Now</span>
                </div>

                <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-[34px] xl:text-[36px] leading-[1.1] tracking-tight text-[#161e2e]">
                  Schema Markup
                  <br />
                  &amp; Rich Snippets
                </h2>

                <p className="mt-4 text-xs sm:text-sm font-normal text-slate-700 leading-relaxed">
                  Generate, validate, and preview Google-compliant JSON-LD structured data. Win rich search snippets for Organizations, FAQs, Products, Articles, and Local Businesses.
                </p>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    <span>Instant JSON-LD generator</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    <span>Live syntax &amp; schema validator</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    <span>SERP rich snippet visualizer</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href="/dashboard/schema"
                  className="inline-flex items-center justify-center rounded-full border border-slate-700/60 bg-white px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-900/5 cursor-pointer font-lazzer shadow-2xs"
                >
                  Explore Schema Suite
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Features                                                            */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: Search,
    title: "Deep SEO & Technical Analysis",
    body: "Titles, descriptions, headings, canonicals, robots, sitemaps — every technical factor search engines read.",
  },
  {
    icon: Zap,
    title: "Schema Markup & Rich Snippets",
    body: "Generate, test, and validate JSON-LD structured data for Google Rich Results and AI answer engine comprehension.",
  },
  {
    icon: Gauge,
    title: "Page Speed & Core Web Vitals",
    body: "Real Google PageSpeed data for mobile and desktop — LCP, CLS, TBT, and the prioritized fixes that move them.",
  },
  {
    icon: TrendingUp,
    title: "Conversion & Mobile UX",
    body: "CTAs, responsive layouts, viewport rules, tap targets, and trust signals that convert visitors.",
  },
  {
    icon: ShieldCheck,
    title: "Security & Trust Signals",
    body: "HTTPS, SSL certificates, HSTS, and security headers that protect your domain authority.",
  },
  {
    icon: Accessibility,
    title: "Accessibility & Compliance",
    body: "Alt text, contrast ratios, ARIA labels, and language declarations so every visitor can use your site.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-[#dff2ed] py-14 sm:py-20 font-lazzer">
      <div className="w-full px-4 sm:px-8 lg:px-12">
        {/* Section Header (Centered) */}
        <div className="mx-auto max-w-3xl text-center">
          {/* Eyebrow Tag */}
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 font-lazzer justify-center">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-900" />
            <span>FIND &amp; FIX SEO &amp; SCHEMA ISSUES IN SECONDS</span>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-900" />
          </div>

          {/* Main Headline */}
          <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#111827] tracking-tight font-lazzer">
            The Rank Writers’ Core Capabilities
          </h2>

          {/* Description */}
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Precision SEO intelligence and structured data automation. Run deep technical audits across 70+ factors, generate Google-compliant JSON-LD schema markup, and optimize your Core Web Vitals.
          </p>
        </div>

        {/* Feature Blocks Stack */}
        <div className="mt-14 sm:mt-16 space-y-16 lg:space-y-24">
          {/* Feature 1: Deep Technical SEO Audits */}
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
            {/* Left Content */}
            <div className="flex flex-col items-start text-left lg:col-span-5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 text-[11px] font-bold uppercase tracking-wider mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                <span>Available Now</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight font-lazzer">
                Deep Technical SEO Audits
              </h3>
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600">
                Stop guessing what holds your website back. We crawl and inspect 70+ technical SEO factors, metadata, indexability, canonicals, robots.txt, and link health with instant actionable fixes.
              </p>

              {/* Bullet Checklist */}
              <ul className="mt-6 space-y-3">
                <li className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-slate-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  <span>70+ on-page and technical crawl checks</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-slate-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  <span>Prioritized fix roadmap with code snippets</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-slate-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  <span>Crawlability, sitemaps, and indexing diagnostics</span>
                </li>
              </ul>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full bg-[#181818] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-black cursor-pointer shadow-xs font-lazzer"
                >
                  Run Free Audit
                </Link>
                <Link
                  href="/tools/seo-health-check"
                  className="inline-flex items-center justify-center rounded-full border border-slate-700/60 bg-transparent px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-900/5 cursor-pointer font-lazzer"
                >
                  Learn more
                </Link>
              </div>
            </div>

            {/* Right Image */}
            <div className="lg:col-span-7">
              <div className="relative rounded-sm border border-slate-200/90 bg-white p-1.5 shadow-sm overflow-hidden">
                <img
                  src="https://media.adaptocms.com/60659756-4e49-4975-8fd0-de59ae94dd96/images/859bd674-2772-4e3b-aa58-38735ce25c78.webp"
                  alt="Deep Domain Analysis Dashboard Preview"
                  className="w-full h-auto object-cover rounded-xs block"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* Feature 2: Schema Markup & Structured Data Suite */}
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
            {/* Left Image */}
            <div className="order-2 lg:order-1 lg:col-span-7">
              <div className="relative rounded-sm border border-slate-200/90 bg-white p-1.5 shadow-sm overflow-hidden">
                <img
                  src="https://media.adaptocms.com/60659756-4e49-4975-8fd0-de59ae94dd96/images/72e5d272-688e-4864-862c-c3a325a11c97.webp"
                  alt="Schema Markup Suite Preview"
                  className="w-full h-auto object-cover rounded-xs block"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Right Content */}
            <div className="order-1 lg:order-2 flex flex-col items-start text-left lg:col-span-5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 text-[11px] font-bold uppercase tracking-wider mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                <span>Available Now</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight font-lazzer">
                Schema Markup &amp; Structured Data
              </h3>
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600">
                Help search engines and AI models accurately understand your entities, products, FAQs, and brand. Generate clean JSON-LD markup and validate syntax with zero errors.
              </p>

              {/* Bullet Checklist */}
              <ul className="mt-6 space-y-3">
                <li className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-slate-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  <span>Generate Organization, Product, FAQ, Article &amp; Local schema</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-slate-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  <span>Live Schema syntax validation &amp; issue detection</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-slate-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  <span>Google Rich Snippets visual preview</span>
                </li>
              </ul>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  href="/dashboard/schema"
                  className="inline-flex items-center justify-center rounded-full bg-[#181818] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-black cursor-pointer shadow-xs font-lazzer"
                >
                  Open Schema Suite
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full border border-slate-700/60 bg-transparent px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-900/5 cursor-pointer font-lazzer"
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          </div>

          {/* Feature 3: Page Speed & Core Web Vitals */}
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
            {/* Left Content */}
            <div className="flex flex-col items-start text-left lg:col-span-5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 text-[11px] font-bold uppercase tracking-wider mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                <span>Available Now</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight font-lazzer">
                Page Speed &amp; Core Web Vitals
              </h3>
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600">
                Direct integration with Google PageSpeed Insights. Measure mobile and desktop performance, Largest Contentful Paint (LCP), Cumulative Layout Shift (CLS), and Total Blocking Time (TBT).
              </p>

              {/* Bullet Checklist */}
              <ul className="mt-6 space-y-3">
                <li className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-slate-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  <span>Real Google PageSpeed data for Mobile &amp; Desktop</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-slate-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  <span>LCP, CLS, FCP, and TBT metric breakdowns</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-slate-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  <span>Asset optimization &amp; script reduction advice</span>
                </li>
              </ul>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  href="/tools/speed-core-vitals"
                  className="inline-flex items-center justify-center rounded-full bg-[#181818] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-black cursor-pointer shadow-xs font-lazzer"
                >
                  Test Site Speed
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full border border-slate-700/60 bg-transparent px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-900/5 cursor-pointer font-lazzer"
                >
                  Learn more
                </Link>
              </div>
            </div>

            {/* Right Image */}
            <div className="lg:col-span-7">
              <div className="relative rounded-sm border border-slate-200/90 bg-white p-1.5 shadow-sm overflow-hidden">
                <img
                  src="https://media.adaptocms.com/60659756-4e49-4975-8fd0-de59ae94dd96/images/72e5d272-688e-4864-862c-c3a325a11c97.webp"
                  alt="Page Speed Dashboard Preview"
                  className="w-full h-auto object-cover rounded-xs block"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* Feature 4: AI & Answer Engine Readiness */}
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
            {/* Left Image */}
            <div className="order-2 lg:order-1 lg:col-span-7">
              <div className="relative rounded-sm border border-slate-200/90 bg-white p-1.5 shadow-sm overflow-hidden">
                <img
                  src="https://media.adaptocms.com/60659756-4e49-4975-8fd0-de59ae94dd96/images/859bd674-2772-4e3b-aa58-38735ce25c78.webp"
                  alt="AI Search Readiness Preview"
                  className="w-full h-auto object-cover rounded-xs block"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Right Content */}
            <div className="order-1 lg:order-2 flex flex-col items-start text-left lg:col-span-5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 text-[11px] font-bold uppercase tracking-wider mb-3">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                <span>Available Now</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight font-lazzer">
                AI &amp; Answer Engine Readiness
              </h3>
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600">
                Search is shifting towards AI answers in ChatGPT, Claude, Gemini, and Perplexity. Audit your content clarity, entity citations, and schema depth so AI bots can reference your brand.
              </p>

              {/* Bullet Checklist */}
              <ul className="mt-6 space-y-3">
                <li className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-slate-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  <span>Entity clarity &amp; semantic content evaluation</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-slate-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  <span>Structured data readiness for LLM web crawlers</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-slate-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  <span>Trust signals &amp; brand authority validation</span>
                </li>
              </ul>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full bg-[#181818] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-black cursor-pointer shadow-xs font-lazzer"
                >
                  Audit AI Readiness
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-full border border-slate-700/60 bg-transparent px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-900/5 cursor-pointer font-lazzer"
                >
                  See How it Works
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Other Features Section                                             */
/* ------------------------------------------------------------------ */

const OTHER_FEATURES = [
  {
    icon: Zap,
    title: "Site Speed & Core Vitals",
    badge: "Available Now",
    isLive: true,
    body: "Monitor page load speed, LCP, and Core Web Vitals across mobile and desktop.",
    checklist: [
      "Google PageSpeed metrics",
      "Mobile & Desktop breakdown",
      "Prioritized speed fixes",
    ],
    linkText: "Test Site Speed",
    linkHref: "/tools/speed-core-vitals",
  },
  {
    icon: Link2,
    title: "Schema Markup Suite",
    badge: "Available Now",
    isLive: true,
    body: "Generate, validate, and preview structured data for Google Rich Results.",
    checklist: [
      "10+ Schema JSON-LD generators",
      "Live syntax & error validator",
      "SERP snippet visualizer",
    ],
    linkText: "Explore Schema Suite",
    linkHref: "/dashboard/schema",
  },
  {
    icon: Briefcase,
    title: "White-Label Audit Reports",
    badge: "Available Now",
    isLive: true,
    body: "Generate client-ready PDF and interactive SEO audit reports with your branding.",
    checklist: [
      "Custom branding & logos",
      "Executive summaries & roadmaps",
      "Export PDF and share links",
    ],
    linkText: "View Sample Report",
    linkHref: "/signup",
  },
  {
    icon: Link2,
    title: "Backlinks Explorer",
    badge: "Coming Soon",
    isLive: false,
    body: "Track referring domains, domain authority, anchor texts, and new link growth.",
    checklist: [
      "Monitor backlink profile",
      "Analyze link authority",
      "Spot toxic backlinks",
    ],
    linkText: "Coming Soon",
    linkHref: "#",
  },
  {
    icon: Flag,
    title: "Keyword Position Tracker",
    badge: "Coming Soon",
    isLive: false,
    body: "Monitor keyword rankings daily across search engines, locations, and devices.",
    checklist: [
      "Daily rank tracking",
      "Multi-location SERP monitoring",
      "Competitor rank comparisons",
    ],
    linkText: "Coming Soon",
    linkHref: "#",
  },
  {
    icon: BookOpen,
    title: "Keyword Research & Studio",
    badge: "Coming Soon",
    isLive: false,
    body: "Discover high-intent keyword ideas, search volumes, and difficulty scores.",
    checklist: [
      "Untapped keyword ideas",
      "Search volume & intent data",
      "Content optimization suggestions",
    ],
    linkText: "Coming Soon",
    linkHref: "#",
  },
];

export function OtherFeatures() {
  return (
    <section className="bg-[#dff2ed] py-14 sm:py-20 font-lazzer">
      <div className="w-full px-4 sm:px-8 lg:px-12">
        {/* Title */}
        <div className="flex flex-col items-start text-left mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 font-lazzer mb-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-900" />
            <span>MODULES &amp; ROADMAP</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#111827] tracking-tight font-lazzer">
            Platform Capabilities &amp; Roadmap
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl font-normal">
            Website Audits and Schema Markup are live today. Backlinks, Rank Tracking, and Keyword Research are actively coming soon!
          </p>
        </div>

        {/* 6 Cards Grid (3 cols x 2 rows) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {OTHER_FEATURES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={`flex flex-col justify-between rounded-sm border p-6 sm:p-7 shadow-xs hover:shadow-sm transition-all duration-200 ${
                  item.isLive
                    ? "border-slate-200/90 bg-white"
                    : "border-slate-200/60 bg-white/70"
                }`}
              >
                <div>
                  {/* Icon, Title & Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#dff2ed] text-slate-900 shrink-0">
                        <Icon className="h-4.5 w-4.5 text-slate-900" />
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-[#111827] font-lazzer">
                        {item.title}
                      </h3>
                    </div>

                    <span
                      className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                        item.isLive
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>

                  {/* Body Subtitle */}
                  <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {item.body}
                  </p>

                  {/* Divider Line */}
                  <div className="my-4.5 w-full border-t border-slate-100" />

                  {/* Checklist */}
                  <ul className="space-y-2.5">
                    {item.checklist.map((point) => (
                      <li
                        key={point}
                        className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700"
                      >
                        <CheckCircle2
                          className={`h-4 w-4 shrink-0 ${
                            item.isLive ? "text-emerald-600" : "text-slate-400"
                          }`}
                        />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom Link */}
                <div className="mt-6 pt-2">
                  {item.isLive ? (
                    <Link
                      href={item.linkHref}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-black transition-all font-lazzer"
                    >
                      <span>{item.linkText}</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 font-lazzer">
                      <span>In active development</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* AI Shift / Problem Section (Section 6)                            */
/* ------------------------------------------------------------------ */

export function AiShiftSection() {
  return (
    <section className="bg-[#dff2ed] py-14 sm:py-20 font-lazzer">
      <div className="w-full px-4 sm:px-8 lg:px-12">
        {/* Top Header Area */}
        <div className="flex flex-col items-start text-left max-w-3xl">
          {/* Eyebrow Tag */}
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 font-lazzer">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-900" />
            <span>THE PROBLEM YOU DON&apos;T KNOW YOU HAVE</span>
          </div>

          {/* Headline */}
          <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-[46px] font-bold text-[#111827] leading-[1.12] tracking-tight font-lazzer">
            Search is shifting to AI. And you&apos;re invisible.
          </h2>

          {/* Subtitle */}
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            40% of searches now happen in AI engines. Your competitors appear in ChatGPT, Gemini, Perplexity and other LLM generated answers. You are not.
          </p>
        </div>

        {/* 2-Column Content Grid */}
        <div className="mt-12 sm:mt-14 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14 items-center">
          {/* Left Column: 4 Problem Cards (2x2) + CTA */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-start text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Card 1 */}
              <div className="flex flex-col items-start text-left rounded-sm border border-slate-200/80 bg-[#fbfcfb] p-4 sm:p-5 shadow-2xs">
                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-red-50 text-red-600 shadow-2xs">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <h3 className="mt-3 text-sm sm:text-base font-bold text-slate-900 leading-snug font-lazzer">
                  You&apos;re losing deals to competitors cited by AI
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Prospects ask ChatGPT for recommendations. Your competitors get cited. You don&apos;t. By the time they reach your site, the decision&apos;s already made.
                </p>
              </div>

              {/* Card 2 */}
              <div className="flex flex-col items-start text-left rounded-sm border border-slate-200/80 bg-[#fbfcfb] p-4 sm:p-5 shadow-2xs">
                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-red-50 text-red-600 shadow-2xs">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <h3 className="mt-3 text-sm sm:text-base font-bold text-slate-900 leading-snug font-lazzer">
                  You don&apos;t know what prompts are triggering competitors
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Competitors dominate specific AI prompts in your category. You don&apos;t know which questions trigger citations or how to compete.
                </p>
              </div>

              {/* Card 3 */}
              <div className="flex flex-col items-start text-left rounded-sm border border-slate-200/80 bg-[#fbfcfb] p-4 sm:p-5 shadow-2xs">
                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-red-50 text-red-600 shadow-2xs">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <h3 className="mt-3 text-sm sm:text-base font-bold text-slate-900 leading-snug font-lazzer">
                  Your brand is not mentioned by LLM agents
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  ChatGPT, Claude, Gemini, Perplexity, none cite your brand. Competitors with similar products appear in AI answers.
                </p>
              </div>

              {/* Card 4 */}
              <div className="flex flex-col items-start text-left rounded-sm border border-slate-200/80 bg-[#fbfcfb] p-4 sm:p-5 shadow-2xs">
                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-red-50 text-red-600 shadow-2xs">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <h3 className="mt-3 text-sm sm:text-base font-bold text-slate-900 leading-snug font-lazzer">
                  You don&apos;t know how to optimize for AI visibility
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  LLMs need structured data, clear facts, and trust signals, not keywords. Your Google #1 ranking might score 0/100 for AI-readiness.
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-8 sm:mt-10">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-[#181818] px-7 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-black font-lazzer cursor-pointer"
              >
                Check your AI Visibility
              </Link>
            </div>
          </div>

          {/* Right Column: AI Search Comparison Illustration */}
          <div className="lg:col-span-6 xl:col-span-6 relative flex flex-col items-center">
            {/* AI Search Comparison Graphic */}
            <div className="relative w-full rounded-sm border border-slate-200/90 bg-white p-1.5 shadow-sm overflow-hidden">
              <img
                src="https://media.adaptocms.com/60659756-4e49-4975-8fd0-de59ae94dd96/images/6e33c578-ab31-4a3a-a6ce-6766a3e27b5b.jpg?w=1216&format=webp&quality=100"
                alt="AI Engine Search Shift Comparison Preview"
                className="w-full h-auto object-cover rounded-xs block"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How it works                                                        */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    icon: FileSearch,
    title: "Enter your URL",
    body: "Paste any public website address. We fetch and inspect the live page — no installation or code changes needed.",
  },
  {
    icon: ListChecks,
    title: "We run 60+ checks",
    body: "Speed, SEO, accessibility, security, mobile, and conversion checks run automatically against your real pages.",
  },
  {
    icon: Rocket,
    title: "Get your action plan",
    body: "A scored report with prioritized recommendations — what to fix first and exactly how to fix it.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="bg-[#dff2ed] py-14 sm:py-20 font-lazzer"
    >
      <div className="w-full px-4 sm:px-8 lg:px-12">

        <div className="grid items-center gap-14 md:grid-cols-2">


          {/* Left */}
          <div>

            <div className="mb-5 text-sm font-semibold uppercase tracking-wider text-blue-600">
              HOW IT WORKS
            </div>

            <h2 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              From website URL
              <span className="bg-gradient-to-r from-blue-600 to-indigo-400 bg-clip-text text-transparent">
                {" "}to growth insights
              </span>
            </h2>

            <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-600">
              Run a complete website audit and discover exactly what needs
              improvement with clear, actionable recommendations.
            </p>


            <div className="mt-8 space-y-5">

              {STEPS.map((s, i) => (
                <div
                  key={s.title}
                  className="flex items-start gap-4"
                >

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <s.icon className="h-5 w-5" aria-hidden />
                  </div>


                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                        Step {i + 1}
                      </span>

                      <h3 className="font-semibold text-slate-900">
                        {s.title}
                      </h3>
                    </div>

                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      {s.body}
                    </p>
                  </div>

                </div>
              ))}

            </div>

          </div>



          {/* Right Demo Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">

            <div className="rounded-xl bg-slate-100 px-5 py-4 text-sm text-slate-500">
              https://yourwebsite.com
            </div>


            <div className="mt-5 rounded-2xl bg-blue-50 p-5">

              <div className="text-sm font-semibold text-blue-700">
                AUDIT REPORT
              </div>

              <div className="mt-3 text-xl font-semibold text-slate-900">
                Website Score: 86/100
              </div>


              <div className="mt-5 space-y-3 text-sm">

                <div className="flex justify-between">
                  <span className="text-slate-600">
                    SEO Health
                  </span>
                  <strong>
                    92%
                  </strong>
                </div>


                <div className="flex justify-between">
                  <span className="text-slate-600">
                    Performance
                  </span>
                  <strong>
                    84%
                  </strong>
                </div>


                <div className="flex justify-between">
                  <span className="text-slate-600">
                    Accessibility
                  </span>
                  <strong>
                    90%
                  </strong>
                </div>

              </div>

            </div>


            <div className="mt-5 rounded-2xl border border-dashed border-blue-300 p-5">

              <div className="text-sm font-semibold text-blue-700">
                AUDIT INSIGHT
              </div>

              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Your website is performing well, but improving page speed and
                content structure can increase visibility.
              </p>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
/* ------------------------------------------------------------------ */
/* Report preview                                                      */
/* ------------------------------------------------------------------ */

export function ReportPreview() {
  return (
    <section className="bg-[#dff2ed] py-14 sm:py-20 font-lazzer">
      <div className="w-full px-4 sm:px-8 lg:px-12">
      <div className="grid items-center gap-14 lg:grid-cols-2">


        {/* Left Content */}
        <div>

          <div className="mb-5 text-sm font-semibold uppercase tracking-wider text-blue-600">
            SMART REPORTING
          </div>


          <h2 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Reports built for
            <span className="bg-gradient-to-r from-blue-600 to-indigo-400 bg-clip-text text-transparent">
              {" "}real improvements
            </span>
          </h2>


          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            No confusing scores. Every issue comes with evidence, impact,
            and clear steps to improve your website.
          </p>


          <ul className="mt-8 space-y-4">

            {[
              "Overall health score with detailed breakdowns",
              "Evidence behind every detected issue",
              "Simple recommendations anyone can follow",
              "Prioritized fixes based on impact",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm text-slate-700"
              >
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500"
                />
                {item}
              </li>
            ))}

          </ul>

        </div>



        {/* Report Preview Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl">


          {/* Header */}
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-5">

            <div>
              <div className="text-sm font-semibold text-slate-900">
                example.com
              </div>

              <div className="mt-1 text-xs text-slate-500">
                Audit completed recently
              </div>
            </div>


            <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-blue-500 text-xl font-bold text-slate-900">
              86
            </div>

          </div>



          {/* Report Items */}
          <div className="mt-5 space-y-3">


            <PreviewRow
              icon={
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              }
              title="SEO structure"
              detail="All important metadata detected"
            />


            <PreviewRow
              icon={
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              }
              title="Page performance"
              detail="Mobile speed needs improvement"
            />


            <PreviewRow
              icon={
                <XCircle className="h-5 w-5 text-red-500" />
              }
              title="Missing optimization"
              detail="Improve content structure and keywords"
            />


            <PreviewRow
              icon={
                <Lock className="h-5 w-5 text-blue-600" />
              }
              title="AI visibility insights"
              detail="Available with Premium"
              locked
            />

          </div>


        </div>

      </div>
      </div>
    </section>
  );
}

function PreviewRow({
  icon,
  title,
  detail,
  locked = false,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  locked?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      {icon}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-ink">{title}</div>
        <div className={`text-xs ${locked ? "text-premium-600" : "text-ink-muted"}`}>
          {detail}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Free vs Premium comparison + pricing                                */
/* ------------------------------------------------------------------ */

const PLAN_ROWS: Array<{ label: string; free: boolean | string; premium: boolean | string }> = [
  { label: "Website audits per month", free: "3", premium: "50" },
  { label: "Overall website score", free: true, premium: true },
  { label: "Core SEO & speed checks", free: true, premium: true },
  { label: "Essential recommendations", free: true, premium: true },
  { label: "All audit sections unlocked", free: false, premium: true },
  { label: "Full evidence & detected values", free: false, premium: true },
  { label: "Prioritized improvement roadmap", free: false, premium: true },
  { label: "Downloadable PDF reports", free: false, premium: true },
  { label: "Historical comparisons", free: false, premium: true },
];

function PlanCell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm font-medium text-ink">{value}</span>;
  }
  return value ? (
    <Check className="mx-auto h-4 w-4 text-success-600" aria-label="Included" />
  ) : (
    <Minus className="mx-auto h-4 w-4 text-slate-300" aria-label="Not included" />
  );
}

export function Pricing() {
  return (
    <section
      id="pricing"
      className="bg-[#dff2ed] py-14 sm:py-20 font-lazzer"
    >
      <div className="w-full px-4 sm:px-8 lg:px-12">


        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">

          <div className="mb-5 text-sm font-semibold uppercase tracking-wider text-blue-600">
            PRICING
          </div>

          <h2 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Simple pricing that
            <span className="bg-gradient-to-r from-blue-600 to-indigo-400 bg-clip-text text-transparent">
              {" "}scales with you
            </span>
          </h2>

          <p className="mt-5 text-lg text-slate-600">
            Start with a free audit and upgrade when you need deeper insights,
            reports, and advanced recommendations.
          </p>

        </div>



        {/* Cards */}
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">


          {/* Free */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8">

            <h3 className="text-lg font-semibold text-slate-900">
              Free
            </h3>


            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-5xl font-semibold text-slate-950">
                $0
              </span>

              <span className="text-sm text-slate-500">
                / forever
              </span>
            </div>


            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Essential website checks to understand your current performance.
            </p>


            <Link
              href="/signup"
              className="mt-8 block rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-medium text-slate-900 transition hover:bg-slate-50"
            >
              Create free account
            </Link>


            <ul className="mt-8 space-y-3 text-sm text-slate-600">

              <li>✓ Basic SEO checks</li>
              <li>✓ Performance overview</li>
              <li>✓ Limited recommendations</li>

            </ul>

          </div>




          {/* Premium */}
          <div className="relative rounded-3xl border-2 border-blue-600 bg-white p-8 shadow-xl">


            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white">
              MOST POPULAR
            </div>


            <h3 className="text-lg font-semibold text-slate-900">
              Premium
            </h3>


            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-5xl font-semibold text-slate-950">
                $29
              </span>

              <span className="text-sm text-slate-500">
                / month
              </span>
            </div>


            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Complete audit insights with detailed reports, evidence,
              exports, and history.
            </p>


            <Link
              href="/signup"
              className="mt-8 block rounded-xl bg-black px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Start Premium
            </Link>


            <ul className="mt-8 space-y-3 text-sm text-slate-600">

              <li>✓ Full audit sections</li>
              <li>✓ Detailed recommendations</li>
              <li>✓ PDF exports</li>
              <li>✓ Audit history</li>

            </ul>


          </div>


        </div>



        {/* Comparison */}
        <div className="mx-auto mt-14 max-w-5xl overflow-hidden rounded-2xl border border-slate-200">

          <table className="w-full text-left">

            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-900">
                  Features
                </th>

                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">
                  Free
                </th>

                <th className="px-6 py-4 text-center text-sm font-semibold text-blue-600">
                  Premium
                </th>
              </tr>
            </thead>


            <tbody>

              {PLAN_ROWS.map((row) => (
                <tr
                  key={row.label}
                  className="border-t border-slate-100"
                >

                  <td className="px-6 py-4 text-sm text-slate-600">
                    {row.label}
                  </td>


                  <td className="px-6 py-4 text-center">
                    <PlanCell value={row.free} />
                  </td>


                  <td className="px-6 py-4 text-center">
                    <PlanCell value={row.premium} />
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>


      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ                                                                 */
/* ------------------------------------------------------------------ */

const FAQS = [
  {
    q: "Do I need to install anything on my website?",
    a: "No. The Rank Writers analyzes your live public website from the outside — the same way search engines, Googlebot, and visitors see it. No scripts, plugins, or code changes are required.",
  },
  {
    q: "Is the free audit really free?",
    a: "Yes. You can run an audit and inspect your core SEO, speed, and schema results without entering a credit card.",
  },
  {
    q: "What schema markup types are supported?",
    a: "Our Schema Markup Suite supports Organization, LocalBusiness, FAQPage, Article, Product, BreadcrumbList, WebSite, and more with instant JSON-LD generation and live syntax validation.",
  },
  {
    q: "How long does a website audit take?",
    a: "Most audits complete in under a minute, delivering full technical SEO, Core Web Vitals, and structured data diagnostics.",
  },
  {
    q: "What features are live vs coming soon?",
    a: "Our core Website SEO Audits, Page Speed & Core Web Vitals, and Schema Markup & Structured Data Suite are fully live and active. Backlinks Explorer, Keyword Rank Tracker, and Keyword Research Studio are in active development and coming soon.",
  },
  {
    q: "Can I audit any website?",
    a: "You can audit any publicly reachable website over HTTP or HTTPS.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Yes. You can cancel your subscription at any time directly from your billing dashboard with zero hassle.",
  },
];

export function Faq() {
  return (
    <section
      id="faq"
      className="bg-[#dff2ed] py-14 sm:py-20 font-lazzer"
    >
      <div className="w-full px-4 sm:px-8 lg:px-12">


        {/* Heading */}
        <div className="text-center">

          <div className="mb-5 text-sm font-semibold uppercase tracking-wider text-blue-600">
            FAQ
          </div>


          <h2 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Frequently asked
            <span className="bg-gradient-to-r from-blue-600 to-indigo-400 bg-clip-text text-transparent">
              {" "}questions
            </span>
          </h2>


          <p className="mt-4 text-lg text-slate-600">
            Everything you need to know about website audits and reports.
          </p>

        </div>



        {/* FAQ Items */}
        <div className="mt-12 overflow-hidden rounded-3xl border border-slate-200 bg-white">

          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group border-b border-slate-100 last:border-none"
            >

              <summary
                className="
                  flex cursor-pointer list-none items-center justify-between
                  gap-5 px-6 py-5 text-left text-base font-medium
                  text-slate-900 transition
                  hover:bg-slate-50
                  [&::-webkit-details-marker]:hidden
                "
              >

                {f.q}


                <span
                  className="
                    flex h-7 w-7 shrink-0 items-center justify-center
                    rounded-full border border-slate-200
                    text-lg text-slate-500
                    transition-transform
                    group-open:rotate-45
                  "
                >
                  +
                </span>

              </summary>


              <div className="px-6 pb-5">

                <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
                  {f.a}
                </p>

              </div>


            </details>
          ))}

        </div>


      </div>
    </section>
  );
}
/* ------------------------------------------------------------------ */
/* Latest Writings (Blog Section)                                      */
/* ------------------------------------------------------------------ */

const ARTICLES = [
  {
    title: "How to Optimize Your Site for ChatGPT and LLM Search Engines",
    excerpt: "Learn the key strategies for ensuring your brand gets cited in AI-generated answers across ChatGPT, Gemini, and Perplexity.",
    category: "SEO & AI",
    date: "FEB 12, 2026",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    href: "#",
  },
  {
    title: "Understanding Technical SEO Audits: 70+ Critical Factors",
    excerpt: "A comprehensive guide to analyzing and fixing crawlability, indexability, speed, schema markup, and mobile usability issues.",
    category: "TECHNICAL SEO",
    date: "FEB 08, 2026",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80",
    href: "#",
  },
  {
    title: "Why Page Type Grouping Changes Everything in SEO Reporting",
    excerpt: "Discover how organizing your site by page types helps you identify high-impact issues faster and scale reporting for clients.",
    category: "GROWTH",
    date: "JAN 28, 2026",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
    href: "#",
  },
];

export function LatestWritings() {
  return (
    <section className="bg-[#dff2ed] py-14 sm:py-20 font-lazzer">
      <div className="w-full px-4 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 font-lazzer">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-900" />
              <span>INSIGHTS &amp; GUIDES</span>
            </div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold text-[#111827] tracking-tight font-lazzer">
              Latest writings
            </h2>
          </div>
          <Link
            href="#"
            className="mt-4 sm:mt-0 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-black transition-colors font-lazzer"
          >
            <span>View All Articles</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* 3 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {ARTICLES.map((article) => (
            <article
              key={article.title}
              className="flex flex-col rounded-sm border border-slate-200/80 bg-white overflow-hidden shadow-xs hover:shadow-sm transition-all duration-200 group"
            >
              <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-100">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="flex flex-col flex-1 p-5 sm:p-6">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-3">
                  <span className="text-[#2563eb] font-bold uppercase">{article.category}</span>
                  <span>{article.date}</span>
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900 group-hover:text-black transition-colors line-clamp-2 leading-snug font-lazzer">
                  {article.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed flex-1">
                  {article.excerpt}
                </p>
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 group-hover:text-black transition-colors">
                    Read article <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Final CTA Banner (Dark Card)                                      */
/* ------------------------------------------------------------------ */

export function FinalCta() {
  return (
    <section className="bg-[#dff2ed] py-14 sm:py-20 font-lazzer">
      <div className="w-full px-4 sm:px-8 lg:px-12">
        <div className="relative overflow-hidden rounded-sm bg-[#111827] p-8 sm:p-12 lg:p-16 text-white shadow-xl">
          {/* Subtle Background Glow */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#c084fc]/15 blur-3xl" />

          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            {/* Left Content */}
            <div className="lg:col-span-7 flex flex-col items-start text-left z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-slate-200">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>COMPLETE SEO &amp; AI MONITORING</span>
              </div>

              <h2 className="mt-5 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight font-lazzer">
                Dominate Search in Google &amp; AI Engines
              </h2>

              <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                Start tracking your SEO performance, monitoring AI visibility across 6 engines, and auditing 70+ technical factors today.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-bold text-slate-950 shadow-xs transition-colors hover:bg-slate-100 font-lazzer cursor-pointer"
                >
                  Start for Free
                </Link>
                <Link
                  href="#pricing"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 bg-transparent px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 font-lazzer cursor-pointer"
                >
                  See Pricing
                </Link>
              </div>
            </div>

            {/* Right Dashboard Mockup Image */}
            <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-lg lg:max-w-none rounded-sm border border-slate-700/60 bg-slate-900/80 p-1.5 shadow-2xl overflow-hidden">
                <img
                  src="https://media.adaptocms.com/60659756-4e49-4975-8fd0-de59ae94dd96/images/d7a7330e-80f9-4ad6-a50d-823d8b38385c.webp"
                  alt="SEO & AI Monitoring Dashboard"
                  className="w-full h-auto object-cover rounded-xs block"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Marketing Footer                                                    */
/* ------------------------------------------------------------------ */

export function MarketingFooter() {
  return (
    <footer className="bg-[#dff2ed] border-t border-slate-300/40 pt-16 pb-12 text-slate-600 font-lazzer">
      <div className="w-full px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Brand Column */}
          <div className="lg:col-span-3 xl:col-span-4 flex flex-col items-start text-left space-y-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <BrandIcon className="h-8 w-8 text-[rgb(24,30,21)] shrink-0" />
              <span className="font-display text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap font-lazzer">
                The Rank Writers
              </span>
            </Link>

            <p className="text-sm leading-relaxed text-slate-600 max-w-sm">
              Comprehensive SEO audit tool and AI engine visibility platform. Analyze, monitor, and optimize your organic search presence.
            </p>

            {/* Quick Audit Form */}
            <div className="w-full max-w-sm">
              <AuditUrlForm size="md" buttonText="Audit" hideFooterText />
            </div>

            {/* NVIDIA Inception Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-sm border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 whitespace-nowrap font-lazzer">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              <span>NVIDIA Inception Program Member</span>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 text-slate-400">
              <a href="#" className="p-1.5 rounded-sm hover:bg-slate-100 hover:text-slate-900 transition-colors" aria-label="LinkedIn">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.7a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26Z" />
                </svg>
              </a>
              <a href="#" className="p-1.5 rounded-sm hover:bg-slate-100 hover:text-slate-900 transition-colors" aria-label="Facebook">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z" />
                </svg>
              </a>
              <a href="#" className="p-1.5 rounded-sm hover:bg-slate-100 hover:text-slate-900 transition-colors" aria-label="Instagram">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a href="#" className="p-1.5 rounded-sm hover:bg-slate-100 hover:text-slate-900 transition-colors" aria-label="X">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* 5 Link Columns */}
          <div className="lg:col-span-9 xl:col-span-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 sm:gap-8">
            {/* Column 1: PRODUCT */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4 whitespace-nowrap font-lazzer">
                PRODUCT
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
                <li className="whitespace-nowrap"><Link href="#features" className="hover:text-black transition-colors">Technical SEO Audit</Link></li>
                <li className="whitespace-nowrap"><Link href="/dashboard/schema" className="hover:text-black transition-colors">Schema Markup Suite</Link></li>
                <li className="whitespace-nowrap"><Link href="/tools/speed-core-vitals" className="hover:text-black transition-colors">Page Speed &amp; Vitals</Link></li>
                <li className="whitespace-nowrap"><Link href="/tools/seo-health-check" className="hover:text-black transition-colors">SEO Health Check</Link></li>
                <li className="whitespace-nowrap"><Link href="/pricing" className="hover:text-black transition-colors">Pricing</Link></li>
              </ul>
            </div>

            {/* Column 2: COMPANY */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4 whitespace-nowrap font-lazzer">
                COMPANY
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
                <li className="whitespace-nowrap"><Link href="/about" className="hover:text-black transition-colors">About Us</Link></li>
                <li className="whitespace-nowrap"><Link href="/blog" className="hover:text-black transition-colors">Blog &amp; Guides</Link></li>
                <li className="whitespace-nowrap"><Link href="/contact" className="hover:text-black transition-colors">Contact Support</Link></li>
                <li className="whitespace-nowrap"><Link href="/privacy" className="hover:text-black transition-colors">Privacy Policy</Link></li>
                <li className="whitespace-nowrap"><Link href="/terms" className="hover:text-black transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            {/* Column 3: FEATURES */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4 whitespace-nowrap font-lazzer">
                FEATURES
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
                <li className="whitespace-nowrap"><Link href="#features" className="hover:text-black transition-colors">SEO Health Check <span className="text-[10px] text-emerald-600 font-bold">(Live)</span></Link></li>
                <li className="whitespace-nowrap"><Link href="/dashboard/schema" className="hover:text-black transition-colors">Schema Generator <span className="text-[10px] text-emerald-600 font-bold">(Live)</span></Link></li>
                <li className="whitespace-nowrap"><Link href="/tools/speed-core-vitals" className="hover:text-black transition-colors">Core Web Vitals <span className="text-[10px] text-emerald-600 font-bold">(Live)</span></Link></li>
                <li className="whitespace-nowrap"><span className="text-slate-400">Backlinks <span className="text-[10px] text-amber-600 font-bold">(Soon)</span></span></li>
                <li className="whitespace-nowrap"><span className="text-slate-400">Rank Tracker <span className="text-[10px] text-amber-600 font-bold">(Soon)</span></span></li>
                <li className="whitespace-nowrap"><span className="text-slate-400">Keyword Studio <span className="text-[10px] text-amber-600 font-bold">(Soon)</span></span></li>
              </ul>
            </div>

            {/* Column 4: USE CASES */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4 whitespace-nowrap font-lazzer">
                USE CASES
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
                <li className="whitespace-nowrap"><Link href="#saas" className="hover:text-black transition-colors">For SaaS Marketers</Link></li>
                <li className="whitespace-nowrap"><Link href="#content-led" className="hover:text-black transition-colors">Content Companies</Link></li>
                <li className="whitespace-nowrap"><Link href="#agencies" className="hover:text-black transition-colors">Growth Agencies</Link></li>
                <li className="whitespace-nowrap"><Link href="#ecommerce" className="hover:text-black transition-colors">E-commerce Brands</Link></li>
                <li className="whitespace-nowrap"><Link href="#enterprise" className="hover:text-black transition-colors">Enterprises</Link></li>
              </ul>
            </div>

            {/* Column 5: FREE TOOLS */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4 whitespace-nowrap font-lazzer">
                FREE TOOLS
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
                <li className="whitespace-nowrap"><Link href="/tools/seo-health-check" className="hover:text-black transition-colors">SEO Health Check</Link></li>
                <li className="whitespace-nowrap"><Link href="/dashboard/schema" className="hover:text-black transition-colors">Schema Validator</Link></li>
                <li className="whitespace-nowrap"><Link href="/tools/speed-core-vitals" className="hover:text-black transition-colors">Speed &amp; Core Vitals</Link></li>
                <li className="whitespace-nowrap"><Link href="/tools/mobile-ux-review" className="hover:text-black transition-colors">Mobile UX Review</Link></li>
                <li className="whitespace-nowrap"><Link href="/tools/security-trust" className="hover:text-black transition-colors">Security &amp; SSL Check</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500 whitespace-nowrap">
          <p>© {new Date().getFullYear()} The Rank Writers. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
            <Link href="/security" className="hover:text-slate-900 transition-colors">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}