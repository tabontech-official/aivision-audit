import type { Metadata } from "next";
import Link from "next/link";
import { Users, FileSearch, Activity, Blocks, ArrowRight } from "lucide-react";
import { db } from "@/lib/db/client";
import { requireMasterAdmin } from "@/lib/auth/rbac";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Overview" };
export const revalidate = 60;

export default async function MasterAdminOverview() {
  const admin = await requireMasterAdmin();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [userCount, reportCount, reportsToday, runningCount, draftVersion, recentLogs, adminUser] =
    await Promise.all([
      db.user.count({ where: { deletedAt: null } }),
      db.report.count({ where: { deletedAt: null } }),
      db.report.count({ where: { createdAt: { gte: todayStart }, deletedAt: null } }),
      db.report.count({ where: { status: { in: ["QUEUED", "PROCESSING"] } } }),
      db.templateVersion.findFirst({
        where: { status: "DRAFT", template: { isDefault: true } },
        orderBy: { versionNumber: "desc" },
      }),
      db.adminActivityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { actor: { select: { email: true } } },
      }),
      db.user.findUnique({ where: { id: admin.id }, select: { mustChangePassword: true } }),
    ]);

  const stats = [
    { label: "Registered users", value: userCount, icon: Users },
    { label: "Total reports", value: reportCount, icon: FileSearch },
    { label: "Audits today", value: reportsToday, icon: Activity },
    { label: "Running now", value: runningCount, icon: Blocks },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Overview</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Platform status at a glance.
        </p>
      </div>

      {adminUser?.mustChangePassword && (
        <Alert variant="warning">
          You&apos;re still using the initial seeded password.{" "}
          <Link href="/master-admin/settings#password" className="font-medium underline">
            Change it now
          </Link>
          .
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <s.icon className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <div className="text-2xl font-bold leading-tight text-ink">{s.value}</div>
              <div className="text-xs text-ink-muted">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Template status */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink">Report template</h2>
            <Link
              href="/master-admin/builder"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Open builder <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          <div className="mt-4 flex items-center gap-3 text-sm text-ink-secondary">
            {draftVersion ? (
              <>
                <Badge variant="draft">Draft v{draftVersion.versionNumber}</Badge>
                <span>in progress — publish it to affect new audits</span>
              </>
            ) : (
              <span>No draft in progress. Editing in the builder creates one.</span>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink">Recent admin activity</h2>
            <Link
              href="/master-admin/logs"
              className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              All logs <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          <ul className="mt-4 space-y-2.5">
            {recentLogs.length === 0 && (
              <li className="text-sm text-ink-muted">No activity yet.</li>
            )}
            {recentLogs.map((log) => (
              <li key={log.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-ink-secondary">
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-ink">
                    {log.action}
                  </code>{" "}
                  <span className="text-ink-muted">by {log.actor?.email ?? "system"}</span>
                </span>
                <time className="shrink-0 text-xs tabular-nums text-ink-muted">
                  {log.createdAt.toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
