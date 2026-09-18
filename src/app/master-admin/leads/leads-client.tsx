"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type SerializedLead = {
  id: string;
  email: string;
  domain: string;
  websiteUrl: string;
  firstSeen: string;
  marketingConsent: boolean;
  consentAt: string | null;
  unsubscribed: boolean;
  platform: string | null;
  themeName: string | null;
  appCount: number | null;
  plusLikelihood: string | null;
  auditCount: number;
  latestScore: number | null;
  scoreTrend: number | null;
  convertedAccount: boolean;
  convertedPaid: boolean;
};

const PLATFORM_OPTIONS = [
  "SHOPIFY", "HYDROGEN", "WORDPRESS", "WOOCOMMERCE", "WEBFLOW", "WIX",
  "SQUARESPACE", "NEXTJS", "UNKNOWN",
];

export type FunnelSummaryProps = {
  windowDays: number;
  auditStarted: number;
  emailSignup: number;
  auditCompleted: number;
  teaserViewed: number;
  signupCompleted: number;
  deltaEmailsSent: number;
  comparisonsViewed: number;
  marketingConsentCount: number;
};

export function LeadsClient({
  funnel,
  leads,
  total,
  page,
  pageSize,
  platforms,
  filters,
}: {
  funnel: FunnelSummaryProps;
  leads: SerializedLead[];
  total: number;
  page: number;
  pageSize: number;
  platforms: Array<{ platform: string; count: number }>;
  filters: { search: string; platform: string; consent: string; converted: string };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(filters.search);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    // A filter change resets pagination; paging itself must not.
    if (key !== "page") next.delete("page");
    router.push(`/master-admin/leads?${next.toString()}`);
  };

  const exportCsv = () => {
    const header = [
      "email", "domain", "website_url", "first_seen", "marketing_consent", "consent_at",
      "unsubscribed", "platform", "theme", "app_count", "plus_likelihood",
      "audits_run", "latest_score", "score_trend", "converted_account", "converted_paid",
    ];
    const rows = leads.map((l) =>
      [
        l.email, l.domain, l.websiteUrl, l.firstSeen, l.marketingConsent, l.consentAt ?? "",
        l.unsubscribed, l.platform ?? "", l.themeName ?? "", l.appCount ?? "",
        l.plusLikelihood ?? "", l.auditCount, l.latestScore ?? "", l.scoreTrend ?? "",
        l.convertedAccount, l.convertedPaid,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-page${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-ink">
            <Users className="h-6 w-6 text-brand-600" aria-hidden />
            Leads
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Every email captured on the landing form, joined to its audits, platform, and
            conversion state. {total} lead{total === 1 ? "" : "s"} match the current filters.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {platforms.map((p) => (
              <Badge key={p.platform} variant="neutral">
                {p.platform}: {p.count}
              </Badge>
            ))}
          </div>
        </div>
        <Button variant="secondary" onClick={exportCsv} disabled={leads.length === 0}>
          <Download className="h-4 w-4" aria-hidden />
          Export CSV
        </Button>
      </div>

      {/* Funnel. Audits require an account, so every start here is already a
          signed-in user — the rate that matters is how many finish. */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Funnel · last {funnel.windowDays} days
          </div>
          <div className="flex flex-wrap items-baseline gap-x-4 text-sm">
            <span className="text-ink-muted">
              audits completed:{" "}
              <span className="font-semibold text-ink">
                {funnel.auditStarted > 0
                  ? `${Math.round((funnel.auditCompleted / funnel.auditStarted) * 100)}%`
                  : "—"}
              </span>
            </span>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-center sm:grid-cols-3 lg:grid-cols-6">
          {(
            [
              ["Audits started", funnel.auditStarted],
              ["Audits completed", funnel.auditCompleted],
              ["Accounts created", funnel.signupCompleted],
              ["Marketing consent", funnel.marketingConsentCount],
              ["Delta emails", funnel.deltaEmailsSent],
              ["Comparisons viewed", funnel.comparisonsViewed],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-lg bg-surface-subtle px-2 py-2.5">
              <div className="text-lg font-bold tabular-nums text-ink">{value}</div>
              <div className="text-[11px] text-ink-muted">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap items-center gap-2 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setFilter("search", search.trim());
          }}
          className="flex min-w-56 flex-1 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3"
        >
          <Search className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email or domain…"
            className="h-9 min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
          />
        </form>
        <select
          value={filters.platform}
          onChange={(e) => setFilter("platform", e.target.value)}
          className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm"
          aria-label="Filter by platform"
        >
          <option value="">All platforms</option>
          {PLATFORM_OPTIONS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={filters.consent}
          onChange={(e) => setFilter("consent", e.target.value)}
          className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm"
          aria-label="Filter by consent"
        >
          <option value="">Any consent</option>
          <option value="yes">Consented</option>
          <option value="no">No consent</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>
        <select
          value={filters.converted}
          onChange={(e) => setFilter("converted", e.target.value)}
          className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm"
          aria-label="Filter by conversion"
        >
          <option value="">Any status</option>
          <option value="account">Has account</option>
          <option value="none">Not converted</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-ink-muted">
              <th className="px-4 py-3 font-semibold">Lead</th>
              <th className="px-4 py-3 font-semibold">Platform</th>
              <th className="px-4 py-3 font-semibold">Theme / Apps</th>
              <th className="px-4 py-3 font-semibold">Audits</th>
              <th className="px-4 py-3 font-semibold">Score</th>
              <th className="px-4 py-3 font-semibold">Consent</th>
              <th className="px-4 py-3 font-semibold">Converted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-muted">
                  No leads match these filters yet.
                </td>
              </tr>
            )}
            {leads.map((lead) => (
              <tr key={lead.id} className="align-top hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <div className="font-medium text-ink">{lead.email}</div>
                  <div className="text-xs text-ink-muted">
                    {lead.domain} · first seen{" "}
                    {new Date(lead.firstSeen).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {lead.platform ? (
                    <Badge variant={lead.platform === "SHOPIFY" || lead.platform === "HYDROGEN" ? "enabled" : "neutral"}>
                      {lead.platform}
                    </Badge>
                  ) : (
                    <span className="text-ink-muted">—</span>
                  )}
                  {lead.plusLikelihood === "possible" && (
                    <div className="mt-1 text-[11px] text-ink-muted">Plus possible</div>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-ink-secondary">
                  {lead.themeName ?? "—"}
                  {lead.appCount !== null && (
                    <div className="text-ink-muted">{lead.appCount} apps</div>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums">{lead.auditCount}</td>
                <td className="px-4 py-3 tabular-nums">
                  {lead.latestScore !== null ? Math.round(lead.latestScore) : "—"}
                  {lead.scoreTrend !== null && (
                    <span
                      className={
                        "ml-1 text-xs " +
                        (lead.scoreTrend > 0
                          ? "text-success-600"
                          : lead.scoreTrend < 0
                            ? "text-danger-600"
                            : "text-ink-muted")
                      }
                    >
                      {lead.scoreTrend > 0 ? "+" : ""}
                      {lead.scoreTrend}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {lead.unsubscribed ? (
                    <Badge variant="disabled">Unsubscribed</Badge>
                  ) : lead.marketingConsent ? (
                    <div>
                      <Badge variant="enabled">Consented</Badge>
                      {lead.consentAt && (
                        <div className="mt-1 text-[11px] text-ink-muted">
                          {new Date(lead.consentAt).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Badge variant="neutral">No</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  {lead.convertedPaid ? (
                    <Badge variant="published">Paid</Badge>
                  ) : lead.convertedAccount ? (
                    <Badge variant="enabled">Account</Badge>
                  ) : (
                    <span className="text-ink-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-ink-secondary">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setFilter("page", String(page - 1))}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setFilter("page", String(page + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
