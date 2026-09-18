"use client";

import { Search, Settings, HelpCircle, Bell, LogOut } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";

export function DashboardTopBar({
  email,
  name,
}: {
  email: string;
  name: string | null;
  plan?: string;
  roleLabel?: string;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-8">
      {/* Search Input */}
      <div className="flex-1 max-w-xl">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-full border border-slate-200 bg-slate-50/60 py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
      </div>

      {/* Right Utility Icons & Profile */}
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          aria-label="Settings"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
        >
          <Settings className="h-4.5 w-4.5" />
        </button>

        <button
          type="button"
          aria-label="Help"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
        >
          <HelpCircle className="h-4.5 w-4.5" />
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="h-9 w-9 rounded-full overflow-hidden ring-2 ring-indigo-500/30">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt={name ?? email}
              className="h-full w-full object-cover"
            />
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              title="Log out"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
