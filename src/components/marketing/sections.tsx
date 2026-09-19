import Link from "next/link";
import {
  Gauge,
  Search,
  Accessibility,
  Smartphone,
  ShieldCheck,
  TrendingUp,
  Sparkles,
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
  Zap,
  Link2,
  Award,
  Flag,
  BookOpen,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import { AuditUrlForm } from "./audit-url-form";

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-10 pb-16 sm:pt-14 sm:pb-24 border-b border-slate-100">
      {/* Background grid lines pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-60" />

      {/* Ambient background glow */}
      <div className="absolute top-0 right-1/4 -z-10 h-96 w-96 rounded-full bg-orange-100/40 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Copy, Input & Social Proof */}
          <div className="flex flex-col items-start text-left lg:col-span-5 xl:col-span-5 z-10">
            {/* Top AI Badge & Model Icon Boxes */}
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center rounded-lg border border-slate-200/90 bg-white px-3 py-1.5 shadow-2xs">
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-slate-700">
                  AI SEARCH IS YOUR GROWTH ADVANTAGE
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {/* OpenAI / ChatGPT icon box */}
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/90 bg-white shadow-2xs">
                  <svg className="h-4 w-4 text-slate-800" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1683a.071.071 0 0 1 .038.052v5.5826a4.5045 4.5045 0 0 1-4.4945 4.4947zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4997 4.4997 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1683a.0757.0757 0 0 1-.071 0l-4.8303-2.7866A4.5045 4.5045 0 0 1 2.3408 7.8956zm16.0993 3.8558L12.5973 8.3829l2.02-1.1635a.0804.0804 0 0 1 .071 0l4.8303 2.7913a4.4947 4.4947 0 0 1-.6765 8.1042v-5.6773a.79.79 0 0 0-.4023-.6862zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.407 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4997 4.4997 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1635a.0804.0804 0 0 1-.038-.0568V6.06a4.4997 4.4997 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.445a.7948.7948 0 0 0-.3927.6813l-.0048 6.7368zm1.093-1.0744l2.6045-1.5046 2.6045 1.5046v3.0044l-2.6045 1.5046-2.6045-1.5046z"/>
                  </svg>
                </div>
                {/* Anthropic sunburst icon box */}
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/90 bg-white shadow-2xs">
                  <svg className="h-4 w-4 text-[#D97757]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l1.2 5.3 4.2-3.4-1.8 5.1 5.3-.2-4.4 3.2 4.7 2.6-5.4 1 2.8 4.7-4.8-2.6.2 5.4-3.2-4.4-2.6 4.7-1-5.4-4.7 2.8 2.6-4.8-5.4.2 4.4-3.2-4.7-2.6 5.4-1-2.8-4.7 4.8 2.6-.2-5.4 3.2 4.4z" />
                  </svg>
                </div>
                {/* Perplexity icon box */}
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/90 bg-white shadow-2xs">
                  <svg className="h-4 w-4 text-[#20B2AA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" />
                  </svg>
                </div>
                {/* Google G icon box */}
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/90 bg-white shadow-2xs">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Main Headline - Extra tight line spacing */}
            <h1 className="font-display font-semibold text-[#181D27] text-3xl sm:text-4xl md:text-[44px] lg:text-[48px] xl:text-[54px] 2xl:text-[58px] leading-[1.0] sm:leading-[1.02] tracking-[-0.03em]">
              <span className="block sm:whitespace-nowrap">Reclaim Lost Traffic</span>
              <span className="block sm:whitespace-nowrap">with LLM-Ready</span>
              <span className="block sm:whitespace-nowrap">SEO Intelligence</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-lg lg:text-[19px] leading-relaxed text-[#475467] max-w-xl">
              SEO insights by page group. AI brand visibility. Domain-level audits. Keyword tracking. Backlinks checker. Plus much more.
            </p>

            {/* Audit Input Form */}
            <div className="mt-8 w-full max-w-lg">
              <AuditUrlForm
                size="lg"
                placeholder="Website URL"
                buttonText="Free Checkup"
                hideFooterText
              />
            </div>

            {/* Social Proof */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <div className="flex -space-x-2 overflow-hidden">
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="User avatar"
                />
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                  alt="User avatar"
                />
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                  alt="User avatar"
                />
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
                  alt="User avatar"
                />
                <img
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80"
                  alt="User avatar"
                />
              </div>

              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <div className="flex text-amber-400 text-sm">
                    {"★".repeat(5)}
                  </div>
                  <span className="text-xs font-bold text-slate-900">Trusted by +85,000</span>
                </div>
                <span className="text-[12px] text-slate-500 font-medium">
                  SaaS Marketers &amp; Growth Agencies
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Top Portion of Dashboard Mockup Image */}
          <div className="lg:col-span-7 xl:col-span-7 relative flex items-center justify-start lg:justify-end">
            <div className="relative w-full lg:w-[860px] xl:w-[980px] 2xl:w-[1080px] lg:max-w-none lg:-mr-40 xl:-mr-60 2xl:-mr-72 transition-all duration-300">
              <div className="rounded-2xl shadow-2xl border border-slate-200/90 bg-white overflow-hidden p-1 sm:p-1.5 h-[480px] sm:h-[560px] lg:h-[640px]">
                <img
                  src="https://media.adaptocms.com/60659756-4e49-4975-8fd0-de59ae94dd96/images/d7a7330e-80f9-4ad6-a50d-823d8b38385c.webp"
                  alt="SEO and AI Search Intelligence Dashboard Preview"
                  className="w-full h-full object-cover object-top rounded-xl block"
                  loading="eager"
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
/* Credibility strip                                                   */
/* ------------------------------------------------------------------ */

export function CredibilityStrip() {
  return (
    <section className="bg-white py-16 sm:py-24 border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 items-start">
          {/* Left Column: Heading, Subtitle, Stats & CTAs */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col items-start text-left">
            {/* Eyebrow Tag */}
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF4D00] font-mono">
              <span className="inline-block h-2 w-2 rounded-full border-2 border-[#FF4D00] bg-white" />
              <span>SMARTER INSIGHTS. BETTER RANKINGS. ZERO GUESSWORK</span>
            </div>

            {/* Main Headline */}
            <h2 className="mt-4 font-display text-3xl sm:text-4xl lg:text-[44px] font-bold text-slate-900 leading-[1.14] tracking-tight max-w-3xl">
              The Rank Writers helps you rank higher on Google and AI Engines.
            </h2>

            {/* Description */}
            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl font-normal">
              Automated monitoring catches issues within 24 hours. AI visibility tracking shows exactly how you appear in ChatGPT, Gemini and other LLMs. Multi-site dashboard manages all your clients domains easily.
            </p>

            {/* Horizontal Line Divider */}
            <div className="my-8 w-full border-t border-slate-100" />

            {/* Stats 3x2 Grid */}
            <div className="grid w-full grid-cols-1 sm:grid-cols-3 gap-y-7 gap-x-6">
              {/* Stat 1 */}
              <div className="border-l-2 border-[#FF4D00] pl-4">
                <div className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-[#FF4D00] tracking-tight">
                  +85,000
                </div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  CLIENTS WORLDWIDE
                </div>
              </div>

              {/* Stat 2 */}
              <div className="border-l-2 border-[#FF4D00] pl-4">
                <div className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-[#FF4D00] tracking-tight">
                  +12
                </div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  YEARS OF SEO EXCELLENCE
                </div>
              </div>

              {/* Stat 3 */}
              <div className="border-l-2 border-[#FF4D00] pl-4">
                <div className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-[#FF4D00] tracking-tight">
                  +30M
                </div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  UNIQUE URLS CHECKED
                </div>
              </div>

              {/* Stat 4 */}
              <div className="border-l-2 border-[#FF4D00] pl-4">
                <div className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-[#FF4D00] tracking-tight">
                  6 AI
                </div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  ENGINES TRACKED
                </div>
              </div>

              {/* Stat 5 */}
              <div className="border-l-2 border-[#FF4D00] pl-4">
                <div className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-[#FF4D00] tracking-tight">
                  +70
                </div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  TECHNICAL SEO FACTORS
                </div>
              </div>

              {/* Stat 6 */}
              <div className="border-l-2 border-[#FF4D00] pl-4">
                <div className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal text-[#FF4D00] tracking-tight">
                  +120
                </div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  COUNTRIES SERVED
                </div>
              </div>
            </div>

            {/* Horizontal Line Divider */}
            <div className="my-8 w-full border-t border-slate-100" />

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-[#FF4D00] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#E64500]"
              >
                Start for Free
              </Link>
              <Link
                href="#pricing"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                See Pricing
              </Link>
            </div>
          </div>

          {/* Right Column: Use Cases Stack */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-6 pt-2">
            {/* Item 1 */}
            <div className="border-b border-slate-100 pb-6">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#FF4D00]">
                  <Box className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">For SaaS Marketers</h3>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    Monitor product pages, track AI citations, prove marketing ROI fast.
                  </p>
                  <Link
                    href="#saas"
                    className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-[#FF4D00] transition-colors"
                  >
                    About SaaS Marketers <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Item 2 */}
            <div className="border-b border-slate-100 pb-6">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#FF4D00]">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">For Content-Led Companies</h3>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    Large-site audits. AI citation tracking. Content performance intel.
                  </p>
                  <Link
                    href="#content"
                    className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-[#FF4D00] transition-colors"
                  >
                    About Content-Led Companies <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Item 3 */}
            <div className="border-b border-slate-100 pb-6">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#FF4D00]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">For Growth Agencies</h3>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    Multi-client command center. White-label reports. AI + traditional SEO.
                  </p>
                  <Link
                    href="#agencies"
                    className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-[#FF4D00] transition-colors"
                  >
                    About Growth Agencies <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Item 4 */}
            <div>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#FF4D00]">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">For E-commerce Brands</h3>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                    Monitor product pages, schemas, feeds. Rank in Google and ChatGPT.
                  </p>
                  <Link
                    href="#ecommerce"
                    className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-[#FF4D00] transition-colors"
                  >
                    About E-commerce Brands <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
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
    icon: Gauge,
    title: "Page Speed & Core Web Vitals",
    body: "Real Google PageSpeed data for mobile and desktop — LCP, CLS, TBT, and the fixes that move them.",
  },
  {
    icon: Search,
    title: "SEO Analysis",
    body: "Titles, descriptions, headings, canonicals, robots, sitemaps — every on-page signal search engines read.",
  },
  {
    icon: TrendingUp,
    title: "Conversion Optimization",
    body: "CTAs, forms, trust signals, and contact visibility — the elements that turn visitors into customers.",
  },
  {
    icon: Accessibility,
    title: "Accessibility Review",
    body: "Alt text, contrast, labels, and language declarations so every visitor can use your site.",
  },
  {
    icon: ShieldCheck,
    title: "Security Checks",
    body: "HTTPS, HSTS, and security headers that protect your visitors and your reputation.",
  },
  {
    icon: Smartphone,
    title: "Mobile Usability",
    body: "Viewport configuration and mobile experience signals for the majority of your traffic.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-white py-16 sm:py-24 border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header (Centered) */}
        <div className="mx-auto max-w-3xl text-center">
          {/* Eyebrow Tag */}
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF4D00] font-mono justify-center">
            <span className="inline-block h-2 w-2 rounded-full border-2 border-[#FF4D00] bg-white" />
            <span>FIND &amp; FIX SEO ISSUES IN MINUTES, NOT WEEKS</span>
            <span className="inline-block h-2 w-2 rounded-full border-2 border-[#FF4D00] bg-white" />
          </div>

          {/* Main Headline */}
          <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            The Rank Writers’ Features
          </h2>

          {/* Description */}
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Complete SEO intelligence without the chaos. Track traditional rankings, monitor AI visibility across 6 engines, audit 70+ technical factors, and get white-label reports, all automatically organized by page type.
          </p>
        </div>

        {/* Feature Blocks Stack */}
        <div className="mt-16 sm:mt-20 space-y-20 lg:space-y-28">
          {/* Feature 1: Deep Domain Analysis */}
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
            {/* Left Content */}
            <div className="flex flex-col items-start text-left lg:col-span-5">
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Deep Domain Analysis
              </h3>
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600">
                Stop Drowning in URL Lists. Start Making Strategic Decisions. Every other SEO tool treats your site as a flat list of URLs. We understand it’s a structured organization of page types, and optimize accordingly.
              </p>

              {/* Bullet Checklist */}
              <ul className="mt-6 space-y-3">
                <li className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-slate-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  <span>Scan entire website for technical issues</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-slate-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  <span>Get domain authority score and improvements</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-slate-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  <span>Get top-performing pages and opportunities</span>
                </li>
              </ul>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-xl bg-[#FF4D00] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#E64500]"
                >
                  Run your Deep Analysis
                </Link>
                <Link
                  href="#deep-analysis"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Learn more
                </Link>
              </div>
            </div>

            {/* Right Image */}
            <div className="lg:col-span-7">
              <div className="relative rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl overflow-hidden">
                <img
                  src="https://media.adaptocms.com/60659756-4e49-4975-8fd0-de59ae94dd96/images/859bd674-2772-4e3b-aa58-38735ce25c78.webp"
                  alt="Deep Domain Analysis Dashboard Preview"
                  className="w-full h-auto object-cover rounded-xl block"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* Feature 2: LLM Visibility Checker */}
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
            {/* Left Image */}
            <div className="order-2 lg:order-1 lg:col-span-7">
              <div className="relative rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl overflow-hidden">
                <img
                  src="https://media.adaptocms.com/60659756-4e49-4975-8fd0-de59ae94dd96/images/72e5d272-688e-4864-862c-c3a325a11c97.webp"
                  alt="LLM Visibility Checker Dashboard Preview"
                  className="w-full h-auto object-cover rounded-xl block"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Right Content */}
            <div className="order-1 lg:order-2 flex flex-col items-start text-left lg:col-span-5">
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                LLM Visibility Checker
              </h3>
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600">
                Monitor brand mentions, citation frequency, sentiment analysis, and share of voice vs. competitors. Identify which content gets cited most often and optimize for AI recommendations before your competitors do.
              </p>

              {/* Bullet Checklist */}
              <ul className="mt-6 space-y-3">
                <li className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-slate-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  <span>Monitor brand mentions across AI platforms</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-slate-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  <span>Compare against competitors in AI search</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-slate-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  <span>See how you perform against prompts</span>
                </li>
              </ul>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-xl bg-[#FF4D00] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#E64500]"
                >
                  Check your LLM Visibility
                </Link>
                <Link
                  href="#llm-visibility"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Learn more
                </Link>
              </div>
            </div>
          </div>
          {/* Feature 3: AI Content Analysis */}
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
            {/* Left Content */}
            <div className="flex flex-col items-start text-left lg:col-span-5">
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                AI Content Analysis
              </h3>
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600">
                Understand how LLMs perceive your domain’s content and trust. See exactly how ChatGPT, Gemini, Perplexity, Claude, Copilot, and AI Overviews interpret your brand authority, cite your content, and recommend your products.
              </p>

              {/* Bullet Checklist */}
              <ul className="mt-6 space-y-3">
                <li className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-slate-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  <span>Discover content gaps preventing AI citations</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-slate-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  <span>Optimize existing pages for LLM comprehension</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-slate-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  <span>Track trust signals that influence AI</span>
                </li>
              </ul>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-xl bg-[#FF4D00] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#E64500]"
                >
                  Check your Content
                </Link>
                <Link
                  href="#ai-content"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Learn more
                </Link>
              </div>
            </div>

            {/* Right Image */}
            <div className="lg:col-span-7">
              <div className="relative rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl overflow-hidden">
                <img
                  src="https://media.adaptocms.com/60659756-4e49-4975-8fd0-de59ae94dd96/images/72e5d272-688e-4864-862c-c3a325a11c97.webp"
                  alt="AI Content Analysis Dashboard Preview"
                  className="w-full h-auto object-cover rounded-xl block"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* Feature 4: Technical SEO Audits */}
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14">
            {/* Left Image */}
            <div className="order-2 lg:order-1 lg:col-span-7">
              <div className="relative rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl overflow-hidden">
                <img
                  src="https://media.adaptocms.com/60659756-4e49-4975-8fd0-de59ae94dd96/images/859bd674-2772-4e3b-aa58-38735ce25c78.webp"
                  alt="Technical SEO Audits Dashboard Preview"
                  className="w-full h-auto object-cover rounded-xl block"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Right Content */}
            <div className="order-1 lg:order-2 flex flex-col items-start text-left lg:col-span-5">
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Technical SEO Audits
              </h3>
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600">
                Analyze every page across your site for critical issues: page speed, mobile optimization, meta tags, schema markup, SSL security, crawlability, internal linking, image optimization, and more. Get detailed explanations of each issue.
              </p>

              {/* Bullet Checklist */}
              <ul className="mt-6 space-y-3">
                <li className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-slate-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  <span>70+ checks per page</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-slate-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  <span>Prioritized fix list</span>
                </li>
                <li className="flex items-center gap-2.5 text-sm sm:text-base font-medium text-slate-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  <span>How-to-fix guides</span>
                </li>
              </ul>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-xl bg-[#FF4D00] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#E64500]"
                >
                  Check your SEO
                </Link>
                <Link
                  href="#technical-seo"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Learn more
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
    title: "Site Speed & Outage",
    body: "Monitor uptime and page load speed across all key pages.",
    checklist: [
      "Real-time uptime monitoring",
      "Page speed tracking",
      "Instant alerts",
    ],
    linkText: "More on Site Speed & Outage",
    linkHref: "#site-speed",
  },
  {
    icon: Link2,
    title: "Backlinks Checker",
    body: "Track referring domains, authority, and new link growth.",
    checklist: [
      "Monitor backlink profile",
      "Analyze link quality",
      "Spot toxic links",
    ],
    linkText: "More on Backlinks Checker",
    linkHref: "#backlinks",
  },
  {
    icon: Award,
    title: "Top Keywords",
    body: "Identify your highest-performing keywords and traffic drivers.",
    checklist: [
      "Discover which keywords drive traffic",
      "Track performance trends",
      "Find quick-win opportunities",
    ],
    linkText: "More on Top Keywords",
    linkHref: "#top-keywords",
  },
  {
    icon: Flag,
    title: "Keyword Position Tracker",
    body: "Monitor keyword rankings across pages, countries, and SERPs.",
    checklist: [
      "Daily rank tracking",
      "Multi-location monitoring",
      "Competitor comparison",
    ],
    linkText: "More on Keyword Position Tracker",
    linkHref: "#rank-tracker",
  },
  {
    icon: BookOpen,
    title: "Keyword Research",
    body: "Find high-intent keyword ideas to grow your organic reach.",
    checklist: [
      "Discover untapped keywords",
      "Analyze keyword difficulty",
      "Get content ideas",
    ],
    linkText: "More on Keyword Research",
    linkHref: "#keyword-research",
  },
  {
    icon: Briefcase,
    title: "White Label Reports",
    body: "Generate branded SEO reports ready for clients or teams.",
    checklist: [
      "Customize layout and branding",
      "Export and share reports instantly",
      "Customize what metrics you show",
    ],
    linkText: "More on White Label Reports",
    linkHref: "#white-label",
  },
];

export function OtherFeatures() {
  return (
    <section className="bg-[#FCFCFB] py-16 sm:py-24 border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-8 sm:mb-10 text-left">
          Other Features
        </h2>

        {/* 6 Cards Grid (3 cols x 2 rows) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {OTHER_FEATURES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-2xs hover:shadow-md transition-all duration-200"
              >
                <div>
                  {/* Icon & Title */}
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-5 w-5 shrink-0 text-[#FF4D00]" />
                    <h3 className="text-lg font-bold text-slate-900">
                      {item.title}
                    </h3>
                  </div>

                  {/* Body Subtitle */}
                  <p className="mt-2.5 text-sm text-slate-600 leading-relaxed font-normal">
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
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom Link */}
                <div className="mt-6 pt-2">
                  <Link
                    href={item.linkHref}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#FF4D00] hover:underline transition-all"
                  >
                    <span>{item.linkText}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
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
    <section className="bg-white py-16 sm:py-24 border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Header Area */}
        <div className="flex flex-col items-start text-left max-w-3xl">
          {/* Eyebrow Tag */}
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF4D00] font-mono">
            <span className="inline-block h-2 w-2 rounded-full border-2 border-[#FF4D00] bg-white" />
            <span>THE PROBLEM YOU DON&apos;T KNOW YOU HAVE</span>
          </div>

          {/* Headline */}
          <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-[46px] font-bold text-slate-900 leading-[1.12] tracking-tight">
            Search is shifting to AI. And you&apos;re invisible.
          </h2>

          {/* Subtitle */}
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            40% of searches now happen in AI engines. Your competitors appear in ChatGPT, Gemini, Perplexity and other LLM generated answers. You are not.
          </p>
        </div>

        {/* 2-Column Content Grid */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14 items-center">
          {/* Left Column: 4 Problem Cards (2x2) + CTA */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-start text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
              {/* Card 1 */}
              <div className="flex flex-col items-start text-left">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200/80 bg-red-50 text-red-500 shadow-2xs">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </div>
                <h3 className="mt-3.5 text-base font-bold text-slate-900 leading-snug">
                  You&apos;re losing deals to competitors cited by AI
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Prospects ask ChatGPT for recommendations. Your competitors get cited. You don&apos;t. By the time they reach your site, the decision&apos;s already made, without you in consideration.
                </p>
              </div>

              {/* Card 2 */}
              <div className="flex flex-col items-start text-left">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200/80 bg-red-50 text-red-500 shadow-2xs">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </div>
                <h3 className="mt-3.5 text-base font-bold text-slate-900 leading-snug">
                  You don&apos;t know what prompts are triggering competitors
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Competitors dominate specific AI prompts in your category. You don&apos;t know which questions trigger citations or how to compete.
                </p>
              </div>

              {/* Card 3 */}
              <div className="flex flex-col items-start text-left">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200/80 bg-red-50 text-red-500 shadow-2xs">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </div>
                <h3 className="mt-3.5 text-base font-bold text-slate-900 leading-snug">
                  Your brand is not mentioned by LLM agents
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  ChatGPT, Claude, Gemini, Perplexity, none cite your brand. Competitors with similar products appear in AI answers. You&apos;re invisible where 40% of searches now happen.
                </p>
              </div>

              {/* Card 4 */}
              <div className="flex flex-col items-start text-left">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200/80 bg-red-50 text-red-500 shadow-2xs">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </div>
                <h3 className="mt-3.5 text-base font-bold text-slate-900 leading-snug">
                  You don&apos;t know how to optimize for AI visibility
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  LLMs need structured data, clear facts, and trust signals, not keywords. Your Google #1 ranking might score 0/100 for AI-readiness. Different game, different rules.
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-10">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-[#FF4D00] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#E64500]"
              >
                Check your AI Visibility
              </Link>
            </div>
          </div>

          {/* Right Column: Hand-Drawn Arrow & AI Search Comparison Illustration */}
          <div className="lg:col-span-6 xl:col-span-6 relative flex flex-col items-center">
            {/* Orange Curved Arrow SVG Accent */}
            <div className="absolute -top-12 right-12 z-10 hidden sm:block">
              <svg className="w-28 h-28 text-[#FF4D00]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M15,20 C45,5 85,25 70,60 C60,85 30,70 45,45 C55,30 75,50 72,75" />
                <path d="M62,68 L72,77 L80,65" />
              </svg>
            </div>

            {/* AI Search Comparison Graphic */}
            <div className="relative w-full rounded-2xl border border-slate-200 bg-white p-1 sm:p-1.5 shadow-xl overflow-hidden">
              <img
                src="https://media.adaptocms.com/60659756-4e49-4975-8fd0-de59ae94dd96/images/6e33c578-ab31-4a3a-a6ce-6766a3e27b5b.jpg?w=1216&format=webp&quality=100"
                alt="AI Engine Search Shift Comparison Preview"
                className="w-full h-auto object-cover rounded-xl block"
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
      className="border-y border-slate-100 bg-white"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">

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
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
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
      className="border-y border-slate-100 bg-white"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">


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
    a: "No. AuditFlow analyzes your live public website from the outside — the same way search engines and visitors see it. No scripts, plugins, or code changes are required.",
  },
  {
    q: "Is the free audit really free?",
    a: "Yes. You can run an audit and see your core results without a credit card. Creating a free account unlocks your full free-tier report and saves your history.",
  },
  {
    q: "How long does an audit take?",
    a: "Most audits complete in one to three minutes, depending on your website's size and response speed.",
  },
  {
    q: "What's the difference between Free and Premium?",
    a: "Free covers the essential checks and top recommendations. Premium unlocks every audit section, full evidence for each check, a prioritized roadmap, PDF exports, and historical comparisons.",
  },
  {
    q: "Can I audit any website?",
    a: "You can audit any publicly reachable website over HTTP or HTTPS. Private, internal, or password-protected pages can't be analyzed.",
  },
  {
    q: "Can I cancel Premium anytime?",
    a: "Yes. Premium is a monthly subscription you can cancel at any time — you keep access until the end of your billing period.",
  },
];

export function Faq() {
  return (
    <section
      id="faq"
      className="border-y border-slate-100 bg-white"
    >
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">


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
    <section className="bg-white py-16 sm:py-24 border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF4D00] font-mono">
              <span className="inline-block h-2 w-2 rounded-full border-2 border-[#FF4D00] bg-white" />
              <span>INSIGHTS &amp; GUIDES</span>
            </div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Latest writings
            </h2>
          </div>
          <Link
            href="#"
            className="mt-4 sm:mt-0 inline-flex items-center gap-2 text-sm font-semibold text-[#FF4D00] hover:text-[#E64500] transition-colors"
          >
            <span>View All Articles</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* 3 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {ARTICLES.map((article) => (
            <article
              key={article.title}
              className="flex flex-col rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 group"
            >
              <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-100">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="flex flex-col flex-1 p-6">
                <div className="flex items-center justify-between text-xs font-mono font-medium text-slate-500 mb-3">
                  <span className="text-[#FF4D00] font-bold">{article.category}</span>
                  <span>{article.date}</span>
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900 group-hover:text-[#FF4D00] transition-colors line-clamp-2 leading-snug">
                  {article.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 line-clamp-3 leading-relaxed flex-1">
                  {article.excerpt}
                </p>
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 group-hover:text-[#FF4D00] transition-colors">
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
    <section className="bg-white py-16 sm:py-24 border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#18110D] p-8 sm:p-12 lg:p-16 text-white shadow-2xl">
          {/* Subtle Background Glow */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#FF4D00]/20 blur-3xl" />

          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            {/* Left Content */}
            <div className="lg:col-span-7 flex flex-col items-start text-left z-10">
              <div className="inline-flex items-center gap-2 rounded-md border border-[#FF4D00]/30 bg-[#FF4D00]/10 px-3 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-[#FF4D00]">
                <span className="inline-block h-2 w-2 rounded-full bg-[#FF4D00]" />
                <span>COMPLETE SEO &amp; AI MONITORING</span>
              </div>

              <h2 className="mt-5 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                Dominate Search in Google &amp; AI Engines
              </h2>

              <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                Start tracking your SEO performance, monitoring AI visibility across 6 engines, and auditing 70+ technical factors today.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-xl bg-[#FF4D00] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#E64500]"
                >
                  Start for Free
                </Link>
                <Link
                  href="#pricing"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  See Pricing
                </Link>
              </div>
            </div>

            {/* Right Dashboard Mockup Image */}
            <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-lg lg:max-w-none rounded-2xl border border-slate-700/60 bg-slate-900/80 p-1.5 shadow-2xl overflow-hidden">
                <img
                  src="https://media.adaptocms.com/60659756-4e49-4975-8fd0-de59ae94dd96/images/d7a7330e-80f9-4ad6-a50d-823d8b38385c.webp"
                  alt="SEO & AI Monitoring Dashboard"
                  className="w-full h-auto object-cover rounded-xl block"
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
    <footer className="bg-white border-t border-slate-100 pt-16 pb-12 text-slate-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Brand Column */}
          <div className="lg:col-span-3 xl:col-span-4 flex flex-col items-start text-left space-y-6">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <img
                src="/images/rank_writers_logo.png"
                alt="The Rank Writers logo"
                className="h-8 w-8 object-contain shrink-0"
              />
              <span className="font-display text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap">
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
            <div className="inline-flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 whitespace-nowrap">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              <span>NVIDIA Inception Program Member</span>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 text-slate-400">
              <a href="#" className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors" aria-label="LinkedIn">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.7a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26Z" />
                </svg>
              </a>
              <a href="#" className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors" aria-label="Facebook">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z" />
                </svg>
              </a>
              <a href="#" className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors" aria-label="Instagram">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a href="#" className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors" aria-label="X">
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
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 mb-4 whitespace-nowrap">
                PRODUCT
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
                <li className="whitespace-nowrap"><Link href="#features" className="hover:text-[#FF4D00] transition-colors">Deep Domain Analysis</Link></li>
                <li className="whitespace-nowrap"><Link href="#llm" className="hover:text-[#FF4D00] transition-colors">LLM Visibility Checker</Link></li>
                <li className="whitespace-nowrap"><Link href="#content" className="hover:text-[#FF4D00] transition-colors">AI Content Analysis</Link></li>
                <li className="whitespace-nowrap"><Link href="#technical" className="hover:text-[#FF4D00] transition-colors">Technical SEO Audits</Link></li>
                <li className="whitespace-nowrap"><Link href="#pricing" className="hover:text-[#FF4D00] transition-colors">Pricing</Link></li>
                <li className="whitespace-nowrap"><Link href="/api" className="hover:text-[#FF4D00] transition-colors">API Access</Link></li>
              </ul>
            </div>

            {/* Column 2: COMPANY */}
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 mb-4 whitespace-nowrap">
                COMPANY
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
                <li className="whitespace-nowrap"><Link href="/about" className="hover:text-[#FF4D00] transition-colors">About Us</Link></li>
                <li className="whitespace-nowrap"><Link href="/blog" className="hover:text-[#FF4D00] transition-colors">Blog</Link></li>
                <li className="whitespace-nowrap"><Link href="/careers" className="hover:text-[#FF4D00] transition-colors">Careers</Link></li>
                <li className="whitespace-nowrap"><Link href="/press" className="hover:text-[#FF4D00] transition-colors">Press</Link></li>
                <li className="whitespace-nowrap"><Link href="/contact" className="hover:text-[#FF4D00] transition-colors">Contact Us</Link></li>
                <li className="whitespace-nowrap"><Link href="/partners" className="hover:text-[#FF4D00] transition-colors">Partners</Link></li>
              </ul>
            </div>

            {/* Column 3: FEATURES */}
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 mb-4 whitespace-nowrap">
                FEATURES
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
                <li className="whitespace-nowrap"><Link href="#speed" className="hover:text-[#FF4D00] transition-colors">Site Speed &amp; Outage</Link></li>
                <li className="whitespace-nowrap"><Link href="#backlinks" className="hover:text-[#FF4D00] transition-colors">Backlinks Checker</Link></li>
                <li className="whitespace-nowrap"><Link href="#keywords" className="hover:text-[#FF4D00] transition-colors">Top Keywords</Link></li>
                <li className="whitespace-nowrap"><Link href="#tracker" className="hover:text-[#FF4D00] transition-colors">Position Tracker</Link></li>
                <li className="whitespace-nowrap"><Link href="#research" className="hover:text-[#FF4D00] transition-colors">Keyword Research</Link></li>
                <li className="whitespace-nowrap"><Link href="#whitelabel" className="hover:text-[#FF4D00] transition-colors">White Label Reports</Link></li>
              </ul>
            </div>

            {/* Column 4: USE CASES */}
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 mb-4 whitespace-nowrap">
                USE CASES
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
                <li className="whitespace-nowrap"><Link href="#saas" className="hover:text-[#FF4D00] transition-colors">For SaaS Marketers</Link></li>
                <li className="whitespace-nowrap"><Link href="#content-led" className="hover:text-[#FF4D00] transition-colors">Content Companies</Link></li>
                <li className="whitespace-nowrap"><Link href="#agencies" className="hover:text-[#FF4D00] transition-colors">Growth Agencies</Link></li>
                <li className="whitespace-nowrap"><Link href="#ecommerce" className="hover:text-[#FF4D00] transition-colors">E-commerce Brands</Link></li>
                <li className="whitespace-nowrap"><Link href="#enterprise" className="hover:text-[#FF4D00] transition-colors">Enterprise</Link></li>
              </ul>
            </div>

            {/* Column 5: COMPARISONS */}
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 mb-4 whitespace-nowrap">
                COMPARISONS
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
                <li className="whitespace-nowrap"><Link href="/vs/semrush" className="hover:text-[#FF4D00] transition-colors">vs Semrush</Link></li>
                <li className="whitespace-nowrap"><Link href="/vs/ahrefs" className="hover:text-[#FF4D00] transition-colors">vs Ahrefs</Link></li>
                <li className="whitespace-nowrap"><Link href="/vs/moz" className="hover:text-[#FF4D00] transition-colors">vs Moz</Link></li>
                <li className="whitespace-nowrap"><Link href="/vs/screaming-frog" className="hover:text-[#FF4D00] transition-colors">vs Screaming Frog</Link></li>
                <li className="whitespace-nowrap"><Link href="/vs/gsc" className="hover:text-[#FF4D00] transition-colors">vs Search Console</Link></li>
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