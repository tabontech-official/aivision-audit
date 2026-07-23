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
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(79,70,229,0.08),transparent)]"
        aria-hidden
      />
      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
        <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Professional website audits in minutes
        </span>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          See What Is Holding Your Website Back
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-secondary">
          Run a professional website audit in minutes. Get clear scores, actionable
          recommendations, and a prioritized improvement plan.
        </p>
        <div className="mt-9 flex w-full justify-center">
          <AuditUrlForm size="lg" />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Credibility strip                                                   */
/* ------------------------------------------------------------------ */

const CRED_STATS = [
  { value: "60+", label: "Automated checks per audit" },
  { value: "10", label: "Audit categories covered" },
  { value: "2 min", label: "Average time to results" },
  { value: "Free", label: "To run your first audit" },
];

export function CredibilityStrip() {
  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4">
        {CRED_STATS.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-2xl font-bold text-ink">{s.value}</div>
            <div className="mt-1 text-sm text-ink-muted">{s.label}</div>
          </div>
        ))}
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
    <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-ink">
          Everything that matters, in one report
        </h2>
        <p className="mt-4 text-ink-secondary">
          AuditFlow inspects your live website the way search engines, browsers, and real
          visitors experience it — then explains exactly what to fix.
        </p>
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card p-6 transition-shadow hover:shadow-card-hover">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <f.icon className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="mt-4 font-semibold text-ink">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{f.body}</p>
          </div>
        ))}
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
    <section id="how-it-works" className="border-y border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink">How it works</h2>
          <p className="mt-4 text-ink-secondary">From URL to action plan in three steps.</p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-card">
                <s.icon className="h-6 w-6" aria-hidden />
              </div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
                Step {i + 1}
              </div>
              <h3 className="mt-2 font-semibold text-ink">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-secondary">
                {s.body}
              </p>
            </div>
          ))}
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
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-ink">
            A report you can actually act on
          </h2>
          <p className="mt-4 leading-relaxed text-ink-secondary">
            No vague grades. Every check shows what we found, what we expected, why it
            matters, and the specific change that fixes it — ordered by impact.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Overall score with per-section breakdowns",
              "Detected values and evidence for every check",
              "Plain-English fixes, not jargon",
              "Quick wins highlighted separately from long-term work",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-ink-secondary">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-600" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Illustrative mock report card */}
        <div className="card overflow-hidden">
          <div className="border-b border-slate-100 bg-surface-subtle px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-ink">example.com</div>
                <div className="text-xs text-ink-muted">Audited just now</div>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-warning-500 text-lg font-bold text-ink">
                72
              </div>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            <PreviewRow
              icon={<CheckCircle2 className="h-4 w-4 text-success-600" />}
              title="Title tag present"
              detail="58 characters — good length"
            />
            <PreviewRow
              icon={<AlertTriangle className="h-4 w-4 text-warning-600" />}
              title="Largest Contentful Paint"
              detail="3.4s on mobile — aim for under 2.5s"
            />
            <PreviewRow
              icon={<XCircle className="h-4 w-4 text-danger-600" />}
              title="Meta description missing"
              detail="Add a 120–160 character summary"
            />
            <PreviewRow
              icon={<Lock className="h-4 w-4 text-premium-600" />}
              title="Conversion analysis"
              detail="Unlock with Premium"
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
    <section id="pricing" className="border-y border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink">
            Start free. Upgrade when you need depth.
          </h2>
          <p className="mt-4 text-ink-secondary">
            Every audit starts with a genuinely useful free report. Premium unlocks the
            complete picture.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          {/* Free */}
          <div className="card flex flex-col p-7">
            <h3 className="font-semibold text-ink">Free</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-ink">$0</span>
              <span className="text-sm text-ink-muted">/ forever</span>
            </div>
            <p className="mt-3 text-sm text-ink-secondary">
              Essential checks to understand where your website stands.
            </p>
            <Link
              href="/signup"
              className="mt-6 rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-medium text-ink transition-colors hover:bg-slate-50"
            >
              Create free account
            </Link>
          </div>

          {/* Premium */}
          <div className="relative flex flex-col rounded-card border-2 border-premium-600 bg-white p-7 shadow-card">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-premium-600 px-3 py-0.5 text-xs font-semibold text-white">
              Most popular
            </span>
            <h3 className="font-semibold text-ink">Premium</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-ink">$29</span>
              <span className="text-sm text-ink-muted">/ month</span>
            </div>
            <p className="mt-3 text-sm text-ink-secondary">
              The complete audit toolkit: every section, full evidence, PDF exports, and
              history.
            </p>
            <Link
              href="/signup"
              className="mt-6 rounded-lg bg-premium-700 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-premium-600"
            >
              Start with Premium
            </Link>
          </div>
        </div>

        {/* Comparison table */}
        <div className="mx-auto mt-12 max-w-4xl overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 pr-4 text-sm font-semibold text-ink">What you get</th>
                <th className="w-28 py-3 text-center text-sm font-semibold text-ink">Free</th>
                <th className="w-28 py-3 text-center text-sm font-semibold text-premium-700">
                  Premium
                </th>
              </tr>
            </thead>
            <tbody>
              {PLAN_ROWS.map((row) => (
                <tr key={row.label} className="border-b border-slate-100">
                  <td className="py-3 pr-4 text-sm text-ink-secondary">{row.label}</td>
                  <td className="py-3 text-center">
                    <PlanCell value={row.free} />
                  </td>
                  <td className="py-3 text-center">
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
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h2 className="text-center text-3xl font-bold tracking-tight text-ink">
        Frequently asked questions
      </h2>
      <div className="mt-10 divide-y divide-slate-200">
        {FAQS.map((f) => (
          <details key={f.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium text-ink [&::-webkit-details-marker]:hidden">
              {f.q}
              <span className="text-xl leading-none text-ink-muted transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ink-secondary">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Final CTA                                                           */
/* ------------------------------------------------------------------ */

export function FinalCta() {
  return (
    <section className="border-t border-slate-200 bg-gradient-to-b from-white to-brand-50/50">
      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center sm:px-6">
        <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-ink">
          Find out what&apos;s holding your website back — right now
        </h2>
        <p className="mt-4 max-w-xl text-ink-secondary">
          Your first audit takes two minutes and costs nothing.
        </p>
        <div className="mt-8 flex w-full justify-center">
          <AuditUrlForm size="lg" />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row">
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
                A
              </div>
              <span className="font-semibold tracking-tight text-ink">AuditFlow</span>
            </div>
            <p className="mt-3 text-sm text-ink-muted">
              Professional website audits with clear scores and actionable recommendations.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <div className="text-sm font-semibold text-ink">Product</div>
              <ul className="mt-3 space-y-2 text-sm text-ink-secondary">
                <li><a href="#features" className="hover:text-ink">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-ink">How It Works</a></li>
                <li><a href="#pricing" className="hover:text-ink">Pricing</a></li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold text-ink">Account</div>
              <ul className="mt-3 space-y-2 text-sm text-ink-secondary">
                <li><Link href="/login" className="hover:text-ink">Log in</Link></li>
                <li><Link href="/signup" className="hover:text-ink">Sign up</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold text-ink">Legal</div>
              <ul className="mt-3 space-y-2 text-sm text-ink-secondary">
                <li><Link href="/terms" className="hover:text-ink">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-ink">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-100 pt-6 text-sm text-ink-muted">
          © {new Date().getFullYear()} AuditFlow. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
