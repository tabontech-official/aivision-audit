"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { Badge } from "@/components/ui/badge";

/**
 * Dashboard chrome shared by the user and admin shells.
 *
 * Both sidebars already carry a log-out control in their footer, but a footer
 * is the last place anyone looks for one — and on short viewports it sits below
 * the fold. This puts the account identity and log out top-right, where the
 * convention is, and keeps it visible on every page of both dashboards.
 */
export function DashboardTopBar({
  email,
  name,
  plan,
  roleLabel,
}: {
  email: string;
  name: string | null;
  /** User dashboard: renders a plan badge. */
  plan?: string;
  /** Admin dashboard: renders a role badge instead. */
  roleLabel?: string;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-end gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur sm:px-8">
      <div className="hidden min-w-0 text-right sm:block">
        <div className="truncate text-sm font-medium leading-tight text-ink">
          {name ?? "Account"}
        </div>
        <div className="truncate text-xs leading-tight text-ink-muted" title={email}>
          {email}
        </div>
      </div>

      {roleLabel ? (
        <Badge variant="system">{roleLabel}</Badge>
      ) : plan ? (
        <Badge variant={plan === "PREMIUM" ? "premium" : "neutral"}>
          {plan === "PREMIUM" ? "Premium" : "Free"}
        </Badge>
      ) : null}

      <form action={logoutAction}>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-ink-secondary transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-ink"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          Log out
        </button>
      </form>
    </header>
  );
}
