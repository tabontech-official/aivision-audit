"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, Bell, User, LogOut, ChevronDown } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils/cn";
import { RealtimeAuditNotifier } from "./realtime-audit-notifier";

export function DashboardTopBar({
  email,
  name,
  plan,
}: {
  email: string;
  name: string | null;
  plan?: string;
  roleLabel?: string;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await logoutAction();
    } catch {
      // Ignore Next.js redirect errors
    }
    window.location.href = "/";
  };

  const displayName = name?.trim() || email.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-[56px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6 font-lazzer">
      {/* Real-time background audit and completion listener */}
      <RealtimeAuditNotifier onUnreadCountChange={setUnreadCount} />

      {/* Search Input with Brand Focus Ring */}
      <div className="flex-1 max-w-md">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-300/30 transition-all font-lazzer"
          />
        </div>
      </div>

      {/* Right Utility: Notifications & Profile Dropdown */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <Link
          href="/dashboard/notifications"
          aria-label="Notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          title="Notifications & Audit Alerts"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500/80 ring-2 ring-white" />
          )}
        </Link>

        {/* User Profile Button with Dropdown Popover */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-full p-1 pl-1.5 pr-2.5 text-left border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer focus:outline-none"
            aria-expanded={profileOpen}
            aria-haspopup="true"
          >
            <div className="h-7 w-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold ring-2 ring-slate-100 shrink-0">
              {initials}
            </div>
            <span className="hidden sm:inline-block max-w-[120px] truncate text-xs font-semibold text-slate-800">
              {displayName}
            </span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-slate-400 transition-transform duration-200",
                profileOpen && "rotate-180"
              )}
            />
          </button>

          {/* Dropdown Menu (Profile & Logout) */}
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-150 z-50">
              {/* User Info Header */}
              <div className="px-3 py-2.5 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {displayName}
                </div>
                <div className="text-[11px] text-slate-500 truncate" title={email}>
                  {email}
                </div>
                <div className="mt-1.5 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60 uppercase tracking-wider">
                  {plan === "PREMIUM" ? "Pro Plan" : "Free Plan"}
                </div>
              </div>

              {/* Action 1: Profile */}
              <div className="py-1">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <User className="h-4 w-4 text-slate-500" />
                  <span>Profile</span>
                </Link>
              </div>

              {/* Action 2: Logout */}
              <div className="pt-1 border-t border-slate-100">
                <form action={logoutAction} onSubmit={handleLogout}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 text-rose-500" />
                    <span>Log Out</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
