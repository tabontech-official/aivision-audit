"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { updateUserAction } from "./actions";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  plan: string;
  verified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  reportCount: number;
};

export function UsersTable({
  currentAdminId,
  users,
  total,
  page,
  pageSize,
  query,
}: {
  currentAdminId: string;
  users: UserRow[];
  total: number;
  page: number;
  pageSize: number;
  query: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState(query);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const update = (userId: string, patch: { role?: string; plan?: string }) => {
    setFlash(null);
    startTransition(async () => {
      const result = await updateUserAction({ userId, ...patch });
      if (result.ok) {
        setFlash({ kind: "success", text: result.message ?? "Updated." });
        router.refresh();
      } else {
        setFlash({ kind: "error", text: result.error });
      }
    });
  };

  const selectCls =
    "h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-50 disabled:text-ink-muted";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Users</h1>
          <p className="mt-1 text-sm text-ink-secondary">{total} registered users</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/master-admin/users?q=${encodeURIComponent(search)}`);
          }}
          className="relative"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email or name…"
            aria-label="Search users"
            className="h-10 w-64 rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </form>
      </div>

      {flash && (
        <Alert variant={flash.kind === "success" ? "success" : "error"}>{flash.text}</Alert>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Reports</th>
              <th className="px-4 py-3 font-medium">Last login</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                  No users found.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-surface-subtle/60">
                <td className="px-4 py-3">
                  <div className="font-medium text-ink">{u.name ?? "—"}</div>
                  <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                    {u.email}
                    {u.verified ? (
                      <Badge variant="enabled">verified</Badge>
                    ) : (
                      <Badge variant="disabled">unverified</Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    disabled={pending || u.id === currentAdminId}
                    onChange={(e) => update(u.id, { role: e.target.value })}
                    aria-label={`Role for ${u.email}`}
                    className={selectCls}
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MASTER_ADMIN">Master Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.plan}
                    disabled={pending}
                    onChange={(e) => update(u.id, { plan: e.target.value })}
                    aria-label={`Plan for ${u.email}`}
                    className={selectCls}
                  >
                    <option value="FREE">Free</option>
                    <option value="PREMIUM">Premium</option>
                  </select>
                </td>
                <td className="px-4 py-3 tabular-nums text-ink-secondary">{u.reportCount}</td>
                <td className="px-4 py-3 text-xs text-ink-muted">
                  {u.lastLoginAt
                    ? new Date(u.lastLoginAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })
                    : "never"}
                </td>
                <td className="px-4 py-3 text-xs text-ink-muted">
                  {new Date(u.createdAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-ink-secondary">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/master-admin/users?q=${encodeURIComponent(query)}&page=${page - 1}`}
                className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/master-admin/users?q=${encodeURIComponent(query)}&page=${page + 1}`}
                className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
