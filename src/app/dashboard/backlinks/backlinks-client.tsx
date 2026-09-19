"use client";

import React, { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Link2,
  Globe2,
  FileCode2,
  Tag,
  RotateCw,
  ShieldCheck,
  CheckCircle2,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { OverviewTab } from "@/components/backlinks/overview-tab";
import { BacklinksTab, type BacklinkItem } from "@/components/backlinks/backlinks-tab";
import { ReferringDomainsTab, type ReferringDomainRow } from "@/components/backlinks/referring-domains-tab";
import { AnchorsTab, type AnchorRow } from "@/components/backlinks/anchors-tab";
import { TopPagesTab, type TopPageRow } from "@/components/backlinks/top-pages-tab";
import { refreshBacklinkDataAction } from "./actions";

export interface BacklinkAuditPayload {
  id: string;
  websiteId: string;
  domain: string;
  totalBacklinks: number;
  referringDomains: number;
  referringPages: number;
  dofollowBacklinks: number;
  nofollowBacklinks: number;
  newBacklinks: number;
  lostBacklinks: number;
  referringIps: number;
  referringSubnets: number;
  domainRank: number;
  brokenBacklinks: number;
  suspiciousBacklinks: number;
  healthStatus: string;
  metricsJson?: unknown;
  fetchedAt: Date | string;
  expiresAt: Date | string;
  backlinks?: BacklinkItem[];
  referringDomainsList?: ReferringDomainRow[];
  anchors?: AnchorRow[];
  topPages?: TopPageRow[];
}

interface BacklinksClientViewProps {
  initialAudit: BacklinkAuditPayload | null;
  initialDomain: string;
  initialTab: string;
  allProjects: string[];
  isCached: boolean;
}

export function BacklinksClientView({
  initialAudit,
  initialDomain,
  initialTab,
  allProjects: _allProjects,
  isCached: _initialCached,
}: BacklinksClientViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<string>(
    ["overview", "backlinks", "referring_domains", "anchors", "top_pages"].includes(initialTab)
      ? initialTab
      : "overview"
  );

  const [audit, setAudit] = useState<BacklinkAuditPayload | null>(initialAudit);
  const [domainInput, setDomainInput] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    if (initialDomain) params.set("project", initialDomain);
    router.replace(`/dashboard/backlinks?${params.toString()}`);
  };

  const handleManualRefresh = () => {
    if (!initialDomain) return;
    startTransition(async () => {
      setFeedback(null);
      const res = await refreshBacklinkDataAction(initialDomain);
      if (res.ok && res.data) {
        setAudit(res.data);
        setFeedback({ type: "success", message: "Backlink profile refreshed successfully." });
      } else {
        setFeedback({
          type: "error",
          message: !res.ok ? res.error : "Failed to fetch backlink data from RankParse.",
        });
      }
    });
  };

  const handleAuditNewDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) return;
    let clean = domainInput.trim().toLowerCase();
    clean = clean.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0] || clean;
    router.push(`/dashboard/backlinks?project=${encodeURIComponent(clean)}&tab=overview`);
  };

  // Format last updated time
  const formatFetchedAt = (dateStr: string | Date | undefined) => {
    if (!dateStr) return "Just now";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "Recently" : d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="w-full">
      {/* 1. FIXED TOP BAR: Attached Edge-to-Edge, Zero Roundness, Sticky beneath Dashboard TopBar */}
      <div className="sticky top-[52px] z-20 -mx-4 -mt-6 sm:-mx-8 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-8 pt-3.5 pb-0 shadow-2xs space-y-3">
        {/* Top Header Row: Domain Info & Action Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-[#FF4D00]">
                <Link2 className="h-4.5 w-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-lg font-bold tracking-tight text-slate-900">
                    {initialDomain ? initialDomain : "Backlinks Profile"}
                  </h1>
                  {initialDomain && audit && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 font-sans border border-slate-200">
                      <Database className="h-3 w-3 text-slate-400" />
                      <span>72h Cache Active</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-sans">
                  {initialDomain && audit
                    ? `Last verified: ${formatFetchedAt(audit?.fetchedAt)} • Backlink Intelligence Engine`
                    : "Audit backlink equity, referring domains, authority metrics, and anchor distributions"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {initialDomain && (
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF3D00] px-4 py-2 text-xs font-display font-bold text-white shadow-xs hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={cn("h-3.5 w-3.5", isPending && "animate-spin")} />
                <span>
                  {isPending
                    ? "Analyzing Backlinks..."
                    : audit
                    ? `Refresh Backlinks for ${initialDomain}`
                    : `Run Backlink Analysis for ${initialDomain}`}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Tab Row inside Header */}
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-none pt-1">
          {[
            { id: "overview", label: "Overview", icon: ShieldCheck, badgeBg: "bg-blue-600" },
            { id: "backlinks", label: "Backlinks", icon: Link2, badgeBg: "bg-purple-600" },
            { id: "referring_domains", label: "Referring Domains", icon: Globe2, badgeBg: "bg-slate-700" },
            { id: "anchors", label: "Anchor Text", icon: Tag, badgeBg: "bg-rose-600" },
            { id: "top_pages", label: "Top Pages", icon: FileCode2, badgeBg: "bg-emerald-600" },
            // Note: "New & Lost" tab is hidden because RankParse does not currently supply historical new/lost backlink tracking data.
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 pb-2.5 pt-1 text-xs font-sans transition-all whitespace-nowrap cursor-pointer border-b-2 -mb-[1px]",
                  isSelected
                    ? "border-slate-900 text-slate-900 font-bold"
                    : "border-transparent text-slate-500 font-medium hover:text-slate-900 hover:border-slate-300"
                )}
              >
                <div className={cn("flex h-6 w-6 items-center justify-center rounded-[6px] text-white shadow-2xs shrink-0", tab.badgeBg)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-6 space-y-6">
        {feedback && (
          <div
            className={cn(
              "flex items-start gap-3 rounded-2xl p-4 text-xs font-sans border shadow-xs transition-all",
              feedback.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            )}
          >
            {feedback.type === "error" ? (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-200 text-rose-700 font-bold text-[11px] mt-0.5">
                !
              </span>
            ) : (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
            )}
            <div className="space-y-1">
              <span className="font-bold block text-sm">
                {feedback.type === "error" ? "Backlink Intelligence Notice" : "Success"}
              </span>
              <p className="font-medium text-xs leading-relaxed">{feedback.message}</p>
            </div>
          </div>
        )}

        {/* Tab Content Rendering — only shown when real audit data exists */}
        <div className="pt-2">
          {!audit ? (
            /* Empty State: No real audit data in database */
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-5 font-sans">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200">
                <Link2 className="h-7 w-7 text-slate-400" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h2 className="font-display text-lg font-bold text-slate-800">No Backlink Data Yet</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  No backlink audit has been run for{" "}
                  <strong className="text-slate-700">{initialDomain || "this domain"}</strong>
                  . Click the button above to run real backlink analysis with RankParse.
                </p>
              </div>
              {initialDomain && (
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF3D00] px-5 py-2.5 text-sm font-display font-bold text-white shadow-xs hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  <RotateCw className={cn("h-4 w-4", isPending && "animate-spin")} />
                  <span>{isPending ? "Fetching..." : `Run Backlink Analysis for ${initialDomain}`}</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {activeTab === "overview" && (
                <OverviewTab audit={audit} onNavigateTab={handleTabChange} />
              )}

              {activeTab === "backlinks" && (
                <BacklinksTab
                  backlinks={audit.backlinks || []}
                  domain={initialDomain}
                  totalBacklinks={audit.totalBacklinks}
                />
              )}

              {activeTab === "referring_domains" && (
                <ReferringDomainsTab referringDomains={audit.referringDomainsList || []} />
              )}

              {activeTab === "anchors" && (
                <AnchorsTab anchors={audit.anchors || []} totalBacklinks={audit.totalBacklinks} />
              )}

              {activeTab === "top_pages" && (
                <TopPagesTab topPages={audit.topPages || []} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
