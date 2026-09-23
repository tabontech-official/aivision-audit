"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Blocks,
  Contact,
  Users,
  FileSearch,
  Settings,
  ScrollText,
  Terminal,
  LogOut,
  CreditCard,
  Receipt,
  SlidersHorizontal,
  History,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { logoutAction } from "@/app/(auth)/actions";

const MAIN_NAV = [
  { href: "/master-admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/master-admin/articles", label: "Articles & Blog", icon: BookOpen },
  { href: "/master-admin/builder", label: "Report Builder", icon: Blocks },
  { href: "/master-admin/leads", label: "Leads", icon: Contact },
  { href: "/master-admin/users", label: "Users", icon: Users },
  { href: "/master-admin/reports", label: "Reports", icon: FileSearch },
  { href: "/master-admin/logs", label: "Activity Logs", icon: ScrollText },
  { href: "/master-admin/settings", label: "Platform Settings", icon: Settings },
];

const BILLING_NAV = [
  { href: "/master-admin/billing/plans", label: "Plans & Pricing", icon: CreditCard },
  { href: "/master-admin/billing/subscriptions", label: "Subscriptions", icon: Receipt },
  { href: "/master-admin/billing/settings", label: "Stripe & Payments", icon: SlidersHorizontal },
  { href: "/master-admin/billing/logs", label: "Billing Logs", icon: History },
];

/** Only rendered when the developer tools are switched on for this deployment. */
const DEV_NAV = {
  href: "/master-admin/dev",
  label: "Pipeline Console",
  icon: Terminal,
};

export function AdminSidebar({
  adminEmail,
  showDevTools = false,
}: {
  adminEmail: string;
  showDevTools?: boolean;
}) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-[#dff2ed]">
          AVA
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold leading-tight text-slate-900">AI Vision Audit</div>
          <div className="text-[11px] font-medium leading-tight text-slate-500">Master Admin</div>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-3" aria-label="Admin">
        <div>
          <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Core
          </div>
          <div className="space-y-0.5">
            {MAIN_NAV.map((item) => {
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
                      ? "bg-[#dff2ed] font-semibold text-slate-900 shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-slate-900" : "text-slate-400")} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Billing & Stripe
          </div>
          <div className="space-y-0.5">
            {BILLING_NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-[#dff2ed] font-semibold text-slate-900 shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-slate-900" : "text-slate-400")} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {showDevTools && (
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Development
            </div>
            <Link
              href={DEV_NAV.href}
              aria-current={pathname.startsWith(DEV_NAV.href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith(DEV_NAV.href)
                  ? "bg-[#dff2ed] font-semibold text-slate-900 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <DEV_NAV.icon className="h-4 w-4 shrink-0" aria-hidden />
              {DEV_NAV.label}
            </Link>
          </div>
        )}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="truncate px-3 pb-2 text-xs text-slate-500" title={adminEmail}>
          {adminEmail}
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
