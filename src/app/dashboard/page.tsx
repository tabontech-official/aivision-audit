import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileSearch, Globe, Zap } from "lucide-react";
import { requireUser } from "@/lib/auth/rbac";
import { db } from "@/lib/db/client";
import { getAllowance } from "@/services/audits/allowance";
import { NewAuditForm } from "@/components/dashboard/new-audit-form";
import { ScorePill } from "@/components/report/score-ring";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import type { UserPlan } from "@prisma/client";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

function statusBadge(status: string) {
  switch (status) {
    case "COMPLETED": return <Badge variant="enabled">Completed</Badge>;
    case "PARTIAL": return <Badge variant="medium">Partial</Badge>;
    case "FAILED": return <Badge variant="critical">Failed</Badge>;
    case "PROCESSING":
    case "QUEUED": return <Badge variant="info">In progress</Badge>;
    default: return <Badge variant="neutral">{status}</Badge>;
  }
}

export default async function DashboardOverview() {
  const user = await requireUser();
  const plan = user.plan as UserPlan;

  const [allowance, recentReports, websiteCount, totalReports] = await Promise.all([
    getAllowance(user.id, plan),
    db.report.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { website: { select: { domain: true } } },
    }),
    db.website.count({ where: { userId: user.id, deletedAt: null } }),
    db.report.count({ where: { userId: user.id, deletedAt: null } }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">Run a new audit or review your reports.</p>
      </div>

      {!user.isEmailVerified && (
        <Alert variant="warning">
          Your email isn&apos;t verified yet.{" "}
          <Link href="/verify-email" className="font-medium underline">
            Verify now
          </Link>{" "}
          to remove audit limits.
        </Alert>
      )}

      {/* New audit */}
      <div className="card p-6">
        <h2 className="font-semibold text-ink">New website audit</h2>
        <p className="mt-1 text-sm text-ink-secondary">
          {allowance.remaining > 0
            ? `${allowance.remaining} of ${allowance.limit} audits remaining this month.`
            : "You've used all your audits this month."}
        </p>
        <div className="mt-4">
          <NewAuditForm disabled={allowance.remaining <= 0} />
        </div>
        {allowance.remaining <= 0 && plan === "FREE" && (
          <p className="mt-3 text-sm text-ink-secondary">
            <Link href="/dashboard/billing" className="font-medium text-premium-700 hover:text-premium-600">
              Upgrade to Premium
            </Link>{" "}
            for {50} audits per month.
          </p>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Zap} label="Audits this month" value={`${allowance.used} / ${allowance.limit}`} />
        <StatCard icon={FileSearch} label="Total reports" value={String(totalReports)} />
        <StatCard icon={Globe} label="Websites tracked" value={String(websiteCount)} />
      </div>

      {/* Recent reports */}
      <div className="card">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-ink">Recent reports</h2>
          <Link
            href="/dashboard/reports"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            View all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        {recentReports.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <FileSearch className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
            <p className="mt-3 text-sm text-ink-muted">No audits yet. Run your first one above.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentReports.map((r) => (
              <li key={r.id}>
                <Link
                  href={
                    r.status === "COMPLETED" || r.status === "PARTIAL"
                      ? `/dashboard/reports/${r.publicId}`
                      : `/analyze/${r.publicId}`
                  }
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-subtle/60"
                >
                  <ScorePill score={r.overallScore} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-ink">{r.website.domain}</div>
                    <div className="text-xs text-ink-muted">
                      {r.grade ?? "—"} ·{" "}
                      {r.createdAt.toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </div>
                  </div>
                  {statusBadge(r.status)}
                  <ArrowRight className="h-4 w-4 text-ink-muted" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
}) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div>
        <div className="text-xl font-bold leading-tight text-ink">{value}</div>
        <div className="text-xs text-ink-muted">{label}</div>
      </div>
    </div>
  );
}
