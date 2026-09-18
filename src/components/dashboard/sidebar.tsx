"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  Sparkles,
  Users,
  Key,
  Layers,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const AI_FIXES_ITEMS = [
  { label: "Meta tag in description", count: 1255 },
  { label: "Internal links", count: 1 },
  { label: "Add alt tag to image (key...", count: 797 },
  { label: "Keyphrase in URL", count: 33 },
  { label: "Keyphrase content place...", count: 318 },
  { label: "Keyword density", count: 659 },
  { label: "Keyword in subheadings", count: 357 },
  { label: "Add images with keywords", count: 247 },
  { label: "Title", count: 10 },
  { label: "External links", count: 200 },
];

export function DashboardSidebar({
  email: _email,
  name: _name,
}: {
  email: string;
  name: string | null;
  plan?: string;
}) {
  const pathname = usePathname();
  const [aiFixesOpen, setAiFixesOpen] = useState(true);
  const [selectedProject, setSelectedProject] = useState("Laser Revive");

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white shadow-xs overflow-y-auto font-sans">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm shadow-xs">
          RA
        </div>
        <span className="text-lg font-bold tracking-tight text-slate-900">
          Rank Authority
        </span>
      </div>

      <div className="flex-1 px-3 py-4 space-y-6">
        {/* Project Selector Section */}
        <div>
          <div className="px-2 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            PROJECT
          </div>
          <div className="relative">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-8 text-sm font-semibold text-slate-800 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="Laser Revive">Laser Revive</option>
              <option value="AuditFlow SaaS">AuditFlow SaaS</option>
              <option value="TechCorp Web">TechCorp Web</option>
            </select>
            <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* Navigation Menu */}
        <div>
          <div className="px-2 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            NAVIGATION
          </div>

          <div className="space-y-1.5">
            {/* 1. SEO Dashboard (Active Main Button) */}
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold uppercase tracking-wide transition-all shadow-xs",
                pathname === "/dashboard"
                  ? "bg-[#4F46E5] text-white"
                  : "bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100/70"
              )}
            >
              <BarChart3 className="h-4 w-4 shrink-0" />
              <span>SEO DASHBOARD</span>
            </Link>

            {/* 2. Page Audit */}
            <Link
              href="/dashboard/reports"
              className="flex items-center gap-3 rounded-xl bg-indigo-50/70 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wide text-indigo-700 hover:bg-indigo-100/70 transition-all"
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span>PAGE AUDIT</span>
            </Link>

            {/* 3. AI Automation Fixes Accordion */}
            <div>
              <button
                type="button"
                onClick={() => setAiFixesOpen(!aiFixesOpen)}
                className="flex w-full items-center justify-between rounded-xl bg-indigo-50/70 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wide text-indigo-700 hover:bg-indigo-100/70 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>AI AUTOMATION FIXES</span>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    aiFixesOpen && "rotate-180"
                  )}
                />
              </button>

              {aiFixesOpen && (
                <div className="mt-1.5 pl-2 space-y-1">
                  {AI_FIXES_ITEMS.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      <span className="truncate pr-2 font-medium">{item.label}</span>
                      <span className="shrink-0 rounded-full bg-[#1E293B] px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Competitors */}
            <Link
              href="/dashboard/websites"
              className="flex items-center gap-3 rounded-xl bg-indigo-50/70 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wide text-indigo-700 hover:bg-indigo-100/70 transition-all"
            >
              <Users className="h-4 w-4 shrink-0" />
              <span>COMPETITORS</span>
            </Link>

            {/* 5. Keywords */}
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-3 rounded-xl bg-indigo-50/70 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wide text-indigo-700 hover:bg-indigo-100/70 transition-all"
            >
              <Key className="h-4 w-4 shrink-0" />
              <span>KEYWORDS</span>
            </Link>

            {/* 6. AI Schema Markup */}
            <Link
              href="/dashboard/billing"
              className="flex items-center gap-3 rounded-xl bg-indigo-50/70 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wide text-indigo-700 hover:bg-indigo-100/70 transition-all"
            >
              <Layers className="h-4 w-4 shrink-0" />
              <span>AI SCHEMA MARKUP</span>
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
