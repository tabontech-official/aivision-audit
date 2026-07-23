"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Blocks,
  Users,
  FileSearch,
  Settings,
  ScrollText,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { logoutAction } from "@/app/(auth)/actions";

const NAV = [
  { href: "/master-admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/master-admin/builder", label: "Report Builder", icon: Blocks },
  { href: "/master-admin/users", label: "Users", icon: Users },
  { href: "/master-admin/reports", label: "Reports", icon: FileSearch },
  { href: "/master-admin/logs", label: "Activity Logs", icon: ScrollText },
  { href: "/master-admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar({ adminEmail }: { adminEmail: string }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-base font-bold text-white">
          A
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-tight text-ink">AuditFlow</div>
          <div className="text-[11px] leading-tight text-ink-muted">Master Admin</div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Admin">
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

      <div className="border-t border-slate-100 p-3">
        <div className="truncate px-3 pb-2 text-xs text-ink-muted" title={adminEmail}>
          {adminEmail}
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
