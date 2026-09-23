import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/sections";
import { AuditUrlForm } from "@/components/marketing/audit-url-form";
import { AuthModalProvider, AuthActionButton } from "@/components/marketing/auth-modal-context";
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  Zap,
  Tag,
  Layers,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Gauge,
  Store,
  Boxes,
} from "lucide-react";

export const metadata: Metadata = {
  title: "AI Website Audits for E-Commerce Brands · AI Vision Audit",
  description:
    "Monitor product pages, validate complex Product and Offer schemas, audit merchant feeds, and win top rankings across Google Shopping and ChatGPT Search.",
};

export default async function EcommerceBrandsPage() {
  const session = await auth();

  return (
    <AuthModalProvider isLoggedIn={!!session?.user}>
      <MarketingHeader isLoggedIn={!!session?.user} />
      <main className="min-h-screen bg-white font-lazzer text-slate-900 selection:bg-[#dff2ed]">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-[#dff2ed] pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-slate-200/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center flex flex-col items-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800">
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>FOR E-COMMERCE &amp; DTC BRANDS</span>
              </div>

              <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.12]">
                Rank in Google &amp; AI Shopping Assistants
              </h1>

              <p className="mt-5 text-base sm:text-lg text-slate-700 leading-relaxed max-w-2xl font-normal">
                Monitor your product pages, validate complex Product &amp; Offer schema markup, audit merchant feeds, and secure prime placement across Google Search and ChatGPT.
              </p>

              {/* Instant Audit Form */}
              <div className="mt-10 w-full max-w-xl">
                <AuditUrlForm
                  size="lg"
                  placeholder="Enter product or store URL (e.g. https://yourbrand.com/products/item)"
                  buttonText="Audit Product Page"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Validates Product JSON-LD, stock signals, price drops, and mobile INP score
                </p>
              </div>

              {/* Stats Bar */}
              <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 w-full border-t border-slate-300/60 pt-8 text-left">
                <div className="rounded-xl bg-white/70 backdrop-blur-sm p-4 border border-slate-200/60 shadow-2xs">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">+38%</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Rich Snippet CTR Boost</div>
                </div>
                <div className="rounded-xl bg-white/70 backdrop-blur-sm p-4 border border-slate-200/60 shadow-2xs">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">100%</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Google Merchant Schema Sync</div>
                </div>
                <div className="rounded-xl bg-white/70 backdrop-blur-sm p-4 border border-slate-200/60 shadow-2xs">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">&lt; 1.2s</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Mobile LCP Benchmark</div>
                </div>
                <div className="rounded-xl bg-white/70 backdrop-blur-sm p-4 border border-slate-200/60 shadow-2xs">
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">0 Errors</div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">Out-of-Stock 404 Drops</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* E-commerce Challenges */}
        <section className="py-16 sm:py-24 border-b border-slate-100 bg-[#fbfcfb]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-900" />
                <span>E-COMMERCE GROWTH BOTTLENECK</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Why 68% of Online Stores Lose High-Intent Buyers
              </h2>
              <p className="mt-3 text-slate-600 text-base leading-relaxed">
                When product schema is broken or missing, Google removes star ratings, in-stock badges, and price drop highlights from search results, crushing your organic conversion rate.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs hover:border-slate-300 transition">
                <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm mb-5">
                  <Tag className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Broken Offer &amp; Price Schema</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Missing aggregateRating, lowPrice, or returnPolicy properties causing Google Search Console warnings and lost rich snippet stars.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs hover:border-slate-300 transition">
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm mb-5">
                  <Boxes className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Faceted Navigation &amp; Filter Bloat</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Filter parameters (color, size, price) generating thousands of duplicate thin pages that cannibalize your primary collection rankings.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xs hover:border-slate-300 transition">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm mb-5">
                  <Store className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Invisible to AI Shopping Bots</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Shoppers ask ChatGPT and Perplexity: &ldquo;What is the best waterproof trail shoe under $150?&rdquo; If your product specs aren’t machine-readable, you don&apos;t get recommended.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Deep Dive 1: Product & Merchant Schema */}
        <section className="py-16 sm:py-24 border-b border-slate-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-md bg-[#dff2ed] px-3 py-1 text-xs font-bold text-slate-900">
                  <Tag className="h-3.5 w-3.5" />
                  <span>STRUCTURED DATA AUTOMATION</span>
                </div>
                <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                  Flawless Product &amp; AggregateRating JSON-LD
                </h2>
                <p className="mt-4 text-base text-slate-600 leading-relaxed">
                  Generate and validate Google-compliant Product, Offer, MerchantReturnPolicy, and ShippingDetails markup with real-time stock sync.
                </p>

                <ul className="mt-6 space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Rich Snippet Guarantee:</strong> Qualify for gold star ratings, price tags, and in-stock badges.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Variant &amp; SKU Support:</strong> Correctly nest parent-child models for color and size swatches.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Merchant Return Policy:</strong> Satisfy Google’s latest requirement for free returns &amp; delivery windows.</span>
                  </li>
                </ul>

                <div className="mt-8">
                  <AuthActionButton
                    targetUrl="/dashboard/schema"
                    className="inline-flex items-center gap-2 rounded-full bg-[#181818] px-6 py-3 text-sm font-bold text-white transition hover:bg-black"
                  >
                    Build Product Schema
                    <ArrowRight className="h-4 w-4" />
                  </AuthActionButton>
                </div>
              </div>

              {/* Visual Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-900 p-6 sm:p-8 text-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-mono text-slate-300">Schema Inspector · Google Rich Results Ready</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800/60">
                    ELIGIBLE FOR RICH STARS
                  </span>
                </div>

                <div className="mt-6 space-y-4 font-mono text-xs">
                  <div className="rounded-lg bg-slate-800/80 p-4 border border-slate-700/60">
                    <div className="text-emerald-400 font-bold">&quot;@type&quot;: &quot;Product&quot;</div>
                    <div className="mt-2 text-slate-300">&quot;name&quot;: &quot;Ultralight Alpine Shell Jacket&quot;,</div>
                    <div className="text-slate-300">&quot;image&quot;: &quot;https://cdn.store.com/jacket-front.jpg&quot;,</div>
                    <div className="text-emerald-300 mt-1">&quot;offers&quot;: &#123;</div>
                    <div className="ml-4 text-emerald-300">&quot;@type&quot;: &quot;Offer&quot;,</div>
                    <div className="ml-4 text-slate-300">&quot;price&quot;: &quot;189.00&quot;,</div>
                    <div className="ml-4 text-slate-300">&quot;priceCurrency&quot;: &quot;USD&quot;,</div>
                    <div className="ml-4 text-emerald-400">&quot;availability&quot;: &quot;https://schema.org/InStock&quot;</div>
                    <div className="text-emerald-300">&#125;,</div>
                    <div className="text-slate-300 mt-1">&quot;aggregateRating&quot;: &#123;</div>
                    <div className="ml-4 text-amber-400">&quot;ratingValue&quot;: &quot;4.9&quot;, &quot;reviewCount&quot;: &quot;324&quot;</div>
                    <div className="text-slate-300">&#125;</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Deep Dive 2: Speed & Mobile Conversion */}
        <section className="py-16 sm:py-24 border-b border-slate-100 bg-[#fbfcfb]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Visual Card */}
              <div className="order-2 lg:order-1 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                  <span className="text-sm font-bold text-slate-900">Mobile Product Page Vitals</span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Core Web Vitals: PASSED
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-700">Interaction to Next Paint (INP)</span>
                    <span className="font-bold text-emerald-600">82ms (Instant add-to-cart)</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-700">Largest Contentful Paint (LCP)</span>
                    <span className="font-bold text-emerald-600">1.1s (Hero product render)</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-700">Cumulative Layout Shift (CLS)</span>
                    <span className="font-bold text-emerald-600">0.01 (No shifting buttons)</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-700">Image Compression &amp; WebP</span>
                    <span className="font-bold text-slate-900">Optimized across 12 viewports</span>
                  </div>
                </div>
              </div>

              {/* Text */}
              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 rounded-md bg-[#dff2ed] px-3 py-1 text-xs font-bold text-slate-900">
                  <Gauge className="h-3.5 w-3.5" />
                  <span>SPEED &amp; CHECKOUT EXPERIENCE</span>
                </div>
                <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                  Every 100ms Faster Means +1% Conversion Rate
                </h2>
                <p className="mt-4 text-base text-slate-600 leading-relaxed">
                  Mobile shoppers abandon sluggish product pages. AI Vision Audit continuously tests hero images, third-party analytics scripts, and cart hydration to eliminate render bottlenecks.
                </p>

                <ul className="mt-6 space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Third-Party Tag Audit:</strong> Identify heavy tracking pixels slowing down mobile checkout.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Dynamic Next-Gen Image Sizing:</strong> Detect uncompressed PNGs and missing responsive srcset rules.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Shopify &amp; WooCommerce Ready:</strong> Direct fix guidance tailored for your specific e-commerce stack.</span>
                  </li>
                </ul>

                <div className="mt-8">
                  <AuthActionButton
                    targetUrl="/tools/speed-core-vitals"
                    className="inline-flex items-center gap-2 rounded-full bg-[#181818] px-6 py-3 text-sm font-bold text-white transition hover:bg-black"
                  >
                    Test Store Speed
                    <ArrowRight className="h-4 w-4" />
                  </AuthActionButton>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-[#dff2ed] py-16 sm:py-20 border-t border-slate-200/80">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Transform Your E-Commerce Search Traffic Today
            </h2>
            <p className="mt-4 max-w-xl text-base text-slate-700">
              Audit your store pages for free. Uncover instant schema markup fixes, Core Web Vitals wins, and AI shopping visibility opportunities.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <AuthActionButton
                targetUrl="/dashboard"
                className="rounded-full bg-[#181818] px-8 py-3.5 text-sm font-bold text-white shadow-md hover:bg-black transition"
              >
                Start Free E-Commerce Audit
              </AuthActionButton>
              <Link
                href="/pricing"
                className="rounded-full border border-slate-700/60 bg-transparent px-8 py-3.5 text-sm font-bold text-slate-900 hover:bg-white/60 transition"
              >
                View Plans &amp; Pricing
              </Link>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </AuthModalProvider>
  );
}
