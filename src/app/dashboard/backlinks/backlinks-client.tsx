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
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { OverviewTab } from "@/components/backlinks/overview-tab";
import { BacklinksTab, type BacklinkItem } from "@/components/backlinks/backlinks-tab";
import { ReferringDomainsTab, type ReferringDomainRow } from "@/components/backlinks/referring-domains-tab";
import { AnchorsTab, type AnchorRow } from "@/components/backlinks/anchors-tab";
import { TopPagesTab, type TopPageRow } from "@/components/backlinks/top-pages-tab";
import { NewLostTab } from "@/components/backlinks/new-lost-tab";
import { RecommendationsTab, type BacklinkRecommendationItem } from "@/components/backlinks/recommendations-tab";
import { refreshBacklinkDataAction, resumeBacklinkAuditAction } from "./actions";

export interface BacklinkAuditPayload {
  id: string;
  websiteId: string;
  domain: string;
  totalBacklinks: number;
  totalIndexedBacklinks?: number;
  detailedBacklinksAvailable?: number;
  detailedBacklinksFetched?: number;
  referringDomains: number;
  referringPages: number;
  dofollowBacklinks: number | null;
  nofollowBacklinks: number | null;
  newBacklinks: number | null;
  lostBacklinks: number | null;
  referringIps: number | null;
  referringSubnets: number | null;
  domainRank: number | null;
  brokenBacklinks: number;
  suspiciousBacklinks: number;
  healthStatus: string;
  status?: string;
  fetchedRowsCount?: number;
  lastFetchedPage?: number;
  progressMessage?: string | null;
  metricsJson?: unknown;
  fetchedAt: Date | string;
  expiresAt: Date | string;
  backlinks?: BacklinkItem[];
  referringDomainsList?: ReferringDomainRow[];
  anchors?: AnchorRow[];
  topPages?: TopPageRow[];
  recommendations?: BacklinkRecommendationItem[];
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
    ["overview", "recommendations", "backlinks", "referring_domains", "anchors", "top_pages", "new_lost"].includes(initialTab)
      ? initialTab
      : "overview"
  );

  const [audit, setAudit] = useState<BacklinkAuditPayload | null>(initialAudit);
  const [domainInput, setDomainInput] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [isResuming, setIsResuming] = useState(false);
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
        setAudit(res.data as unknown as BacklinkAuditPayload);
        setFeedback({ type: "success", message: "Backlink profile refreshed successfully." });
      } else {
        setFeedback({
          type: "error",
          message: !res.ok ? res.error : "Failed to fetch backlink data.",
        });
      }
    });
  };

  const handleResumeFetch = () => {
    if (!initialDomain) return;
    setIsResuming(true);
    startTransition(async () => {
      setFeedback(null);
      const res = await resumeBacklinkAuditAction(initialDomain);
      setIsResuming(false);
      if (res.ok && res.data) {
        setAudit(res.data as unknown as BacklinkAuditPayload);
        setFeedback({
          type: "success",
          message: `Backlink fetch completed. ${res.data.fetchedRowsCount || res.data.totalBacklinks} backlinks saved.`,
        });
      } else {
        setFeedback({
          type: "error",
          message: !res.ok ? res.error : "Failed to resume backlink fetch.",
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

  const isPartiallyCompleted = audit?.status === "partially_completed";

  return (
    <div className="w-full">
      {/* 1. FIXED TOP BAR: Attached Edge-to-Edge, Zero Roundness, Sticky beneath Dashboard TopBar */}
      <div className="sticky top-[52px] z-20 -mx-4 -mt-6 sm:-mx-8 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-8 pt-2 pb-0 shadow-2xs space-y-1.5">
        {/* Top Header Row: Domain Info & Action Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#dff2ed] text-slate-900 shrink-0">
                <Link2 className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-base font-bold tracking-tight text-slate-900 leading-tight">
                    {initialDomain ? initialDomain : "Backlinks Profile"}
                  </h1>
                  {initialDomain && audit && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 font-sans border border-slate-200">
                      <Database className="h-2.5 w-2.5 text-slate-400" />
                      <span>72h Cache Active</span>
                    </span>
                  )}
                  {isPartiallyCompleted && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 font-sans border border-amber-200">
                      <span>Partial ({audit.fetchedRowsCount ?? 0} of {audit.totalBacklinks.toLocaleString()})</span>
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 font-sans leading-tight">
                  {initialDomain && audit
                    ? `Last verified: ${formatFetchedAt(audit?.fetchedAt)} • Backlink Intelligence Engine`
                    : "Audit backlink equity, referring domains, authority metrics, and anchor distributions"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isPartiallyCompleted && (
              <button
                type="button"
                onClick={handleResumeFetch}
                disabled={isPending || isResuming}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-display font-bold text-white shadow-xs hover:bg-amber-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={cn("h-3 w-3", (isPending || isResuming) && "animate-spin")} />
                <span>{(isPending || isResuming) ? "Resuming..." : "Resume Fetch"}</span>
              </button>
            )}

            {initialDomain && (
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isPending || isResuming}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-black transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={cn("h-3 w-3", (isPending && !isResuming) && "animate-spin")} />
                <span>
                  {isPending && !isResuming
                    ? "Fetching..."
                    : audit
                    ? `Refresh Backlinks for ${initialDomain}`
                    : `Run Backlink Analysis for ${initialDomain}`}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Tab Row inside Header */}
        <div className="flex items-center gap-4 sm:gap-5 overflow-x-auto scrollbar-none pt-0.5">
          {(() => {
            const metricsObj = (audit?.metricsJson && typeof audit?.metricsJson === "object" ? audit.metricsJson : {}) as Record<string, unknown>;
            const detailedFetchedCount = audit?.fetchedRowsCount ?? (metricsObj.detailedBacklinksFetched as number) ?? audit?.backlinks?.length ?? 0;

            return [
              { id: "overview", label: "Overview", icon: ShieldCheck, badgeBg: "bg-blue-600", count: undefined },
              { id: "recommendations", label: "Recommendations", icon: Sparkles, badgeBg: "bg-teal-600", count: audit?.recommendations?.length ? audit.recommendations.length : undefined },
              { id: "backlinks", label: "Backlinks", icon: Link2, badgeBg: "bg-purple-600", count: detailedFetchedCount > 0 ? detailedFetchedCount : undefined },
              { id: "referring_domains", label: "Referring Domains", icon: Globe2, badgeBg: "bg-slate-700", count: audit?.referringDomains ? audit.referringDomains : undefined },
              { id: "anchors", label: "Anchor Text", icon: Tag, badgeBg: "bg-rose-600", count: audit?.anchors?.length ? audit.anchors.length : undefined },
              { id: "top_pages", label: "Top Pages", icon: FileCode2, badgeBg: "bg-emerald-600", count: audit?.topPages?.length ? audit.topPages.length : undefined },
              { id: "new_lost", label: "New & Lost", icon: TrendingUp, badgeBg: "bg-amber-600", count: undefined },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 pb-1.5 pt-0.5 text-xs font-sans transition-all whitespace-nowrap cursor-pointer border-b-2 -mb-[1px]",
                    isSelected
                      ? "border-slate-900 text-slate-900 font-bold"
                      : "border-transparent text-slate-500 font-medium hover:text-slate-900 hover:border-slate-300"
                  )}
                >
                  <div className={cn("flex h-5 w-5 items-center justify-center rounded-[5px] text-white shadow-2xs shrink-0", tab.badgeBg)}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count !== null && (
                    <span
                      className={cn(
                        "ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold font-sans transition-colors",
                        isSelected
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                      )}
                    >
                      {tab.count.toLocaleString()}
                    </span>
                  )}
                </button>
              );
            });
          })()}
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
                  . Click the button above to run real backlink analysis.
                </p>
              </div>
              {initialDomain && (
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-black px-5 py-2.5 text-sm font-bold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
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

              {activeTab === "recommendations" && (
                <RecommendationsTab
                  recommendations={audit.recommendations || []}
                  domain={initialDomain}
                  onNavigateTab={handleTabChange}
                />
              )}

              {activeTab === "backlinks" && (() => {
                const metricsObj = (audit.metricsJson && typeof audit.metricsJson === "object" ? audit.metricsJson : {}) as Record<string, unknown>;
                const detailedFetched = audit.fetchedRowsCount ?? (metricsObj.detailedBacklinksFetched as number) ?? audit.backlinks?.length ?? 0;
                const detailedAvailable = audit.detailedBacklinksAvailable ?? (metricsObj.detailedBacklinksAvailable as number) ?? (metricsObj.availableRowRecords as number) ?? detailedFetched;
                const totalIndexed = audit.totalIndexedBacklinks ?? (metricsObj.totalIndexedBacklinks as number) ?? audit.totalBacklinks;

                return (
                  <BacklinksTab
                    backlinks={audit.backlinks || []}
                    domain={initialDomain}
                    totalIndexedBacklinks={totalIndexed}
                    detailedBacklinksAvailable={detailedAvailable}
                    detailedBacklinksFetched={detailedFetched}
                    totalBacklinks={audit.totalBacklinks}
                    status={audit.status}
                    onResumeFetch={handleResumeFetch}
                    isResuming={isResuming}
                  />
                );
              })()}

              {activeTab === "referring_domains" && (
                <ReferringDomainsTab referringDomains={audit.referringDomainsList || []} />
              )}

              {activeTab === "anchors" && (
                <AnchorsTab anchors={audit.anchors || []} totalBacklinks={audit.totalBacklinks} />
              )}

              {activeTab === "top_pages" && (
                <TopPagesTab topPages={audit.topPages || []} />
              )}

              {activeTab === "new_lost" && (
                <NewLostTab
                  newBacklinks={(audit.backlinks || []).filter((b) => b.isNew)}
                  lostBacklinks={(audit.backlinks || []).filter((b) => b.isLost || b.isBroken)}
                  domain={initialDomain}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
