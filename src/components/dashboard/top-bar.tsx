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
  const handleLogout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await logoutAction();
    } catch (_err) {
      // Ignore Next.js redirect errors
    }
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-20 flex h-[52px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      {/* Search Input with Orange Focus Ring */}
      <div className="flex-1 max-w-md">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-[8px] border border-slate-200 bg-slate-50/80 py-1.5 pl-9 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-[#FF4D00] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 transition-all font-sans"
          />
        </div>
      </div>

      {/* Right Utility Icons & Profile */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          aria-label="Settings"
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
        >
          <Settings className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label="Help"
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
        >
          <HelpCircle className="h-4 w-4" />
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#FF4D00]" />
        </button>

        {/* User Avatar & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="h-8 w-8 rounded-full overflow-hidden ring-2 ring-[#FF4D00]/30 shrink-0">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt={name ?? email}
              className="h-full w-full object-cover"
            />
          </div>
          <form action={logoutAction} onSubmit={handleLogout}>
            <button
              type="submit"
              title="Log out"
              aria-label="Log out"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
