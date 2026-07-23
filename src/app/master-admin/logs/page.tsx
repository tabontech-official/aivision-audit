import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db/client";
import { requireMasterAdmin } from "@/lib/auth/rbac";

export const metadata: Metadata = { title: "Activity Logs" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireMasterAdmin();
  const { page = "1" } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);

  const [logs, total] = await Promise.all([
    db.adminActivityLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { email: true } } },
    }),
    db.adminActivityLog.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Activity Logs</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Every admin mutation, newest first.
        </p>
      </div>

      <div className="card divide-y divide-slate-100">
        {logs.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-ink-muted">No activity yet.</p>
        )}
        {logs.map((log) => (
          <details key={log.id} className="group px-5 py-3">
            <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 [&::-webkit-details-marker]:hidden">
              <span className="min-w-0 truncate text-sm">
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-ink">
                  {log.action}
                </code>{" "}
                <span className="text-ink-secondary">{log.entityType}</span>{" "}
                <span className="text-ink-muted">by {log.actor?.email ?? "system"}</span>
              </span>
              <time className="shrink-0 text-xs tabular-nums text-ink-muted">
                {log.createdAt.toLocaleString("en-US", {
                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </time>
            </summary>
            {(log.before !== null || log.after !== null) && (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {log.before !== null && (
                  <pre className="overflow-x-auto rounded-lg bg-slate-50 p-2.5 text-xs text-ink-secondary">
                    before: {JSON.stringify(log.before, null, 2)}
                  </pre>
                )}
                {log.after !== null && (
                  <pre className="overflow-x-auto rounded-lg bg-slate-50 p-2.5 text-xs text-ink-secondary">
                    after: {JSON.stringify(log.after, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </details>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-ink-secondary">
          <span>Page {pageNum} of {totalPages}</span>
          <div className="flex gap-2">
            {pageNum > 1 && (
              <Link href={`/master-admin/logs?page=${pageNum - 1}`} className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50">
                Previous
              </Link>
            )}
            {pageNum < totalPages && (
              <Link href={`/master-admin/logs?page=${pageNum + 1}`} className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
