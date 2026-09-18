import type { Metadata } from "next";
import Link from "next/link";
import { Globe, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth/rbac";
import { db } from "@/lib/db/client";
import { ScorePill } from "@/components/report/score-ring";

export const metadata: Metadata = { title: "Websites" };
export const dynamic = "force-dynamic";

export default async function WebsitesPage() {
  const user = await requireUser();

  const websites = await db.website.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { lastAuditedAt: { sort: "desc", nulls: "last" } },
    include: {
      reports: {
        where: { deletedAt: null, status: { in: ["COMPLETED", "PARTIAL"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { publicId: true, overallScore: true, grade: true, createdAt: true },
      },
      _count: {
        select: {
          reports: { where: { deletedAt: null } },
          findings: {
            where: { state: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "STILL_FAILING", "REGRESSED"] } },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Websites</h1>
        <p className="mt-1 text-sm text-ink-secondary">{websites.length} tracked</p>
      </div>

      {websites.length === 0 ? (
        <div className="card px-5 py-16 text-center">
          <Globe className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
          <p className="mt-3 text-sm text-ink-muted">
            No websites yet. Run an audit from your dashboard to start tracking one.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Run an audit
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {websites.map((w) => {
            const latest = w.reports[0];
            return (
              <Link
                key={w.id}
                href={`/dashboard/websites/${w.id}`}
                className="card flex items-center gap-4 p-5 transition-shadow hover:shadow-card-hover"
              >
                <ScorePill score={latest?.overallScore ?? null} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-ink">{w.domain}</div>
                  <div className="truncate text-xs text-ink-muted">{w.url}</div>
                  <div className="mt-1 text-xs text-ink-muted">
                    {w._count.reports} audit{w._count.reports === 1 ? "" : "s"}
                    {w._count.findings > 0 && ` · ${w._count.findings} open finding${w._count.findings === 1 ? "" : "s"}`}
                    {w.auditSchedule !== "NONE" && ` · ${w.auditSchedule.toLowerCase()} audits`}
                    {latest &&
                      ` · last ${new Date(latest.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric",
                      })}`}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
