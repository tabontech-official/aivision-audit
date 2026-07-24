"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileSearch,
  Globe,
  CreditCard,
  User,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { logoutAction } from "@/app/(auth)/actions";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/reports", label: "Reports", icon: FileSearch },
  { href: "/dashboard/websites", label: "Websites", icon: Globe },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

export function DashboardSidebar({
  email,
  name,
  plan,
}: {
  email: string;
  name: string | null;
  plan: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <Link href="/" className="flex items-center gap-2" aria-label="AuditFlow home">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-base font-bold text-white">
            A
          </div>
          <span className="text-lg font-semibold tracking-tight text-ink">AuditFlow</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Dashboard">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-secondary hover:bg-slate-50 hover:text-ink",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {plan === "FREE" && (
        <div className="mx-3 mb-3 rounded-lg border border-premium-100 bg-premium-50 p-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-premium-700">
            <Sparkles className="h-4 w-4" aria-hidden />
            Go Premium
          </div>
          <p className="mt-1 text-xs text-ink-secondary">
            Unlock every section, full evidence, and PDF exports.
          </p>
          <Link
            href="/dashboard/billing"
            className="mt-2.5 block rounded-lg bg-premium-700 px-3 py-1.5 text-center text-xs font-semibold text-white hover:bg-premium-600"
          >
            Upgrade
          </Link>
        </div>
      )}

      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-2 px-2 pb-2">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-ink" title={name ?? email}>
              {name ?? "Account"}
            </div>
            <div className="truncate text-xs text-ink-muted" title={email}>
              {email}
            </div>
          </div>
          <Badge variant={plan === "PREMIUM" ? "premium" : "neutral"}>
            {plan === "PREMIUM" ? "Premium" : "Free"}
          </Badge>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-slate-50 hover:text-ink"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
