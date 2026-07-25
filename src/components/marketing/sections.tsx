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
} from "lucide-react";
import { AuditUrlForm } from "./audit-url-form";

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

export function Hero() {
  return (
    <section className="relative overflow-hidden">

      {/* Background */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(37,99,235,0.08),transparent)]"
        aria-hidden
      />


      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">


        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          AI-powered website intelligence
        </div>



        {/* Heading */}
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">

          Understand What’s
          <span className="bg-gradient-to-r from-blue-600 to-indigo-400 bg-clip-text text-transparent">
            {" "}Holding Your Website Back
          </span>

        </h1>



        {/* Description */}
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">

          Get a complete website audit covering SEO, performance,
          accessibility, and conversion issues with clear fixes you can act on.

        </p>



        {/* Audit Input */}
        <div className="mt-8 w-full max-w-xl">
          <AuditUrlForm size="md" />
        </div>



        {/* Trust line */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-500">

          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            No signup required
          </span>

          <span className="text-slate-300">•</span>

          <span>
            Instant website analysis
          </span>

          <span className="text-slate-300">•</span>

          <span>
            Actionable recommendations
          </span>

        </div>


      </div>

    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Credibility strip                                                   */
/* ------------------------------------------------------------------ */

const CRED_STATS = [
  { value: "60+", label: "Automated Checks Per Audit" },
  { value: "10", label: "Audit Categories Covered" },
  { value: "2 min", label: "Average Time To Results" },
];

export function CredibilityStrip() {
  return (
    <section className="border-y border-slate-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">

        {/* Heading */}
        <h2 className="mx-auto max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          The Most{" "}
          <span className="bg-gradient-to-r from-blue-600 to-indigo-400 bg-clip-text text-transparent">
            Powerful
          </span>{" "}
          Website Audit Platform
        </h2>


        {/* Sub heading */}
        <p className="mt-4 text-xl font-medium text-slate-900 sm:text-2xl">
          Trusted by businesses and agencies to improve website performance
        </p>


        {/* Optional logo row */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-40">
          <span className="text-lg font-semibold">Agency</span>
          <span className="text-lg font-semibold">SaaS</span>
          <span className="text-lg font-semibold">Commerce</span>
          <span className="text-lg font-semibold">Startups</span>
          <span className="text-lg font-semibold">Teams</span>
        </div>


        {/* Stats */}
        <div className="mt-14 flex flex-col items-center justify-center gap-10 sm:flex-row sm:gap-24">

          {CRED_STATS.map((s) => (
            <div key={s.label} className="text-center">

              <div className="text-4xl font-bold tracking-tight text-blue-700 sm:text-5xl">
                {s.value}
              </div>

              <div className="mt-2 text-sm font-medium text-slate-400">
                {s.label}
              </div>

            </div>
          ))}

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
    <section
      id="features"
      className="border-y border-slate-100 bg-white"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">


        {/* Heading */}
        <div className="mx-auto max-w-3xl text-center">

          <div className="mb-5 text-sm font-semibold uppercase tracking-wider text-blue-600">
            FEATURES
          </div>


          <h2 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Everything you need to
            <span className="bg-gradient-to-r from-blue-600 to-indigo-400 bg-clip-text text-transparent">
              {" "}improve your website
            </span>
          </h2>


          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            AuditFlow analyzes your website from every important angle and
            gives you clear recommendations instead of confusing reports.
          </p>

        </div>



        {/* Feature Grid */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">


          {FEATURES.map((f) => (

            <div
              key={f.title}
              className="
                group rounded-3xl border border-slate-200
                bg-white p-7 transition-all
                hover:-translate-y-1
                hover:border-slate-300
                hover:shadow-xl
              "
            >

              {/* Icon */}
              <div
                className="
                  flex h-12 w-12 items-center justify-center
                  rounded-2xl bg-blue-50 text-blue-600
                  transition group-hover:bg-blue-600
                  group-hover:text-white
                "
              >
                <f.icon
                  className="h-6 w-6"
                  aria-hidden
                />
              </div>



              {/* Content */}
              <h3 className="mt-6 text-lg font-semibold text-slate-950">
                {f.title}
              </h3>


              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {f.body}
              </p>


            </div>

          ))}


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
/* Final CTA                                                           */
/* ------------------------------------------------------------------ */

export function FinalCta() {
  return (
    <section className="border-t border-slate-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">

        <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-16 text-center sm:px-12">

          {/* Background glow */}
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_0%,rgba(59,130,246,0.35),transparent)]"
            aria-hidden
          />


          <div className="relative">

            <h2 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Find what&apos;s holding your website back
              <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                {" "}today
              </span>
            </h2>


            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Run your first audit in minutes. No setup, no credit card,
              just clear insights and actionable improvements.
            </p>


            <div className="mt-8 flex justify-center">
              <AuditUrlForm size="lg" />
            </div>


          </div>

        </div>

      </div>
    </section>
  );
}


/* ------------------------------------------------------------------ */
/* Footer */
/* ------------------------------------------------------------------ */

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-100 bg-white">

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">


        <div className="grid gap-10 md:grid-cols-4">


          {/* Brand */}
          <div className="md:col-span-2">

            <div className="flex items-center gap-2">

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-sm font-bold text-white">
                A
              </div>

              <span className="font-semibold tracking-tight text-slate-950">
                AuditFlow
              </span>

            </div>


            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
              Professional website audits with clear scores,
              actionable recommendations, and growth insights.
            </p>

          </div>




          {/* Product */}
          <div>

            <div className="text-sm font-semibold text-slate-950">
              Product
            </div>

            <ul className="mt-4 space-y-3 text-sm text-slate-600">

              <li>
                <a href="#features" className="hover:text-black">
                  Features
                </a>
              </li>

              <li>
                <a href="#how-it-works" className="hover:text-black">
                  How It Works
                </a>
              </li>

              <li>
                <a href="#pricing" className="hover:text-black">
                  Pricing
                </a>
              </li>

            </ul>

          </div>




          {/* Account */}
          <div>

            <div className="text-sm font-semibold text-slate-950">
              Account
            </div>

            <ul className="mt-4 space-y-3 text-sm text-slate-600">

              <li>
                <Link href="/login" className="hover:text-black">
                  Log in
                </Link>
              </li>

              <li>
                <Link href="/signup" className="hover:text-black">
                  Sign up
                </Link>
              </li>

            </ul>

          </div>


        </div>



        {/* Bottom */}
        <div className="mt-12 flex flex-col gap-3 border-t border-slate-100 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">

          <span>
            © {new Date().getFullYear()} AuditFlow. All rights reserved.
          </span>


          <div className="flex gap-5">

            <Link href="/terms" className="hover:text-black">
              Terms
            </Link>

            <Link href="/privacy" className="hover:text-black">
              Privacy
            </Link>

          </div>

        </div>


      </div>

    </footer>
  );
}