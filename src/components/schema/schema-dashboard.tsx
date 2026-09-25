"use client";

import React, { useState, useEffect } from "react";
import {
  Globe,
  RefreshCw,
  Search,
  Code2,
  AlertOctagon,
  FileCode,
  FileText,
  ShieldCheck,
  Bookmark,
  Layers,
  ArrowRight,
} from "lucide-react";
import { SchemaScoreCard } from "./schema-score-card";
import { SchemaDetectedTree } from "./schema-detected-tree";
import { SchemaIssuesList } from "./schema-issues-list";
import { SchemaGenerator } from "./schema-generator";
import { SchemaValidatorTool } from "./schema-validator-tool";
import { SchemaHistoryList } from "./schema-history-list";
import { getUserSchemaUsageAction, SchemaItemRow } from "@/app/dashboard/schema/actions";
import { SchemaValidationResult } from "@/services/schema/types";
import { UpgradePlanModal } from "@/components/dashboard/upgrade-plan-modal";
import { cn } from "@/lib/utils/cn";

interface SchemaDashboardProps {
  initialUrl?: string;
  initialDomain?: string;
}

export function SchemaDashboard({ initialUrl, initialDomain }: SchemaDashboardProps) {
  const [targetUrl, setTargetUrl] = useState<string>(
    initialUrl || (initialDomain ? `https://${initialDomain}` : "")
  );
  const [activeTab, setActiveTab] = useState<"AUDIT" | "GENERATOR" | "VALIDATOR" | "SAVED">("AUDIT");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<(SchemaValidationResult & { domain: string; url: string }) | null>(null);
  const [editingSchema, setEditingSchema] = useState<SchemaItemRow | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [usage, setUsage] = useState<{
    used: number;
    limit: number;
    remaining: number;
    isUnlimited: boolean;
    enabled: boolean;
    periodResetsAt?: Date | null;
  } | null>(null);

  const loadUsage = async () => {
    try {
      const res = await getUserSchemaUsageAction();
      if (res.ok && res.usage) {
        setUsage(res.usage);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadUsage();
  }, []);

  const runAudit = async (forceRefresh = false) => {
    if (!targetUrl.trim()) return;
    setLoading(true);
    setError(null);

    try {
      let formatted = targetUrl.trim();
      if (!/^https?:\/\//i.test(formatted)) {
        formatted = `https://${formatted}`;
        setTargetUrl(formatted);
      }

      const res = await fetch("/api/schema/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formatted, forceRefresh }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to audit schema markup");
      }

      setAuditData(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Schema audit failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialUrl) {
      runAudit(false);
    }
  }, [initialUrl]);

  const handleEditSchema = (schema: SchemaItemRow) => {
    setEditingSchema(schema);
    setActiveTab("GENERATOR");
  };

  const domain = auditData?.domain || initialDomain || (targetUrl ? targetUrl.replace(/^https?:\/\//i, "").split("/")[0] : "") || "";
  const effectiveDomain = domain || "website.com";

  return (
    <div className="space-y-6 font-lazzer text-slate-800">
      {/* 1. FIXED TOP BAR */}
      <div className="sticky top-[52px] z-20 -mx-4 -mt-6 sm:-mx-8 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Header Title & Status */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shrink-0 shadow-xs">
              <FileCode className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight truncate">
                  {domain ? `${domain} Schema Markup` : "Schema Markup & Rich Results"}
                </h1>
                {auditData && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200/80">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    <span>{auditData.overallScore}/100 Health</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 leading-tight mt-0.5 truncate">
                Audit, validate, and generate Google-compliant JSON-LD structured data and rich results snippets.
              </p>
            </div>
          </div>

          {/* Segmented Tab Navigation (Single Clean Horizontal Row) */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200/80 shrink-0 gap-1 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab("AUDIT")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap",
                activeTab === "AUDIT"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Live Audit</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingSchema(null);
                setActiveTab("GENERATOR");
              }}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap",
                activeTab === "GENERATOR"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Schema Generator</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("VALIDATOR")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap",
                activeTab === "VALIDATOR"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code Validator</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("SAVED")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap",
                activeTab === "SAVED"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved Schemas</span>
            </button>
          </div>
        </div>

        {/* Monthly Usage Allowance Bar */}
        {usage && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-700">Monthly Schema Allowance:</span>
              {usage.isUnlimited ? (
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  Unlimited Generations
                </span>
              ) : (
                <span className="font-mono font-bold text-slate-900">
                  {usage.used} / {usage.limit} used ({usage.remaining} remaining)
                </span>
              )}
              {usage.periodResetsAt && (
                <span className="text-[11px] text-slate-400">
                  · Resets {new Date(usage.periodResetsAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>

            {!usage.isUnlimited && (
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(true)}
                className="text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-lg border border-amber-200 transition-colors inline-flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <span>Upgrade for More Schemas</span>
                <ArrowRight className="h-3.5 w-3.5 text-amber-700" />
              </button>
            )}
          </div>
        )}

        {/* Live URL Scan Input Bar */}
        {activeTab === "AUDIT" && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runAudit(true);
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://yourwebsite.com/product-or-page"
                  className="w-full text-xs font-semibold pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300/40 focus:border-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !targetUrl.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-black disabled:opacity-50 text-white transition-colors shadow-xs cursor-pointer shrink-0"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>{loading ? "Scanning..." : "Scan Webpage"}</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 font-semibold">
          <AlertOctagon className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: LIVE AUDIT */}
      {activeTab === "AUDIT" && (
        <>
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-xs">
              <RefreshCw className="w-8 h-8 text-slate-900 animate-spin mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900">
                Extracting & Auditing Structured Data...
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Parsing JSON-LD scripts, Microdata nodes, and testing Google Rich Results rules.
              </p>
            </div>
          ) : auditData ? (
            <div className="space-y-6">
              {/* Score Card */}
              <SchemaScoreCard
                overallScore={auditData.overallScore}
                totalSchemas={auditData.totalSchemas}
                validCount={auditData.validCount}
                errorCount={auditData.errorCount}
                warningCount={auditData.warningCount}
                opportunityCount={auditData.opportunityCount}
                richResultsEligible={auditData.summary?.richResultsEligible || []}
              />

              {/* 2-Column Split: Schemas on the Left, Recommendations on the Right */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Left Section: Detected Schema Blocks & Code Tree */}
                <div className="space-y-4">
                  <SchemaDetectedTree items={auditData.items || []} />
                </div>

                {/* Right Section: Validation Findings & Recommendations */}
                <div className="space-y-4">
                  <SchemaIssuesList issues={auditData.issues || []} />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-xs">
              <FileCode className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-bold text-slate-900">
                Ready to Audit Structured Data
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                Enter any webpage URL in the bar above and click &quot;Scan Webpage&quot; to inspect its embedded Schema.org markup and Google Rich Results eligibility.
              </p>
              {targetUrl && (
                <button
                  type="button"
                  onClick={() => runAudit(false)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-black text-white transition-colors cursor-pointer shadow-xs"
                >
                  Scan {targetUrl}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* TAB 2: SCHEMA GENERATOR */}
      {activeTab === "GENERATOR" && (
        <SchemaGenerator
          initialSchema={editingSchema}
          onSaved={() => {
            loadUsage();
          }}
          onRefreshUsage={loadUsage}
        />
      )}

      {/* TAB 3: SAVED SCHEMAS */}
      {activeTab === "SAVED" && (
        <SchemaHistoryList
          onEditSchema={handleEditSchema}
          onRefreshUsage={loadUsage}
        />
      )}

      {/* TAB 4: CODE VALIDATOR */}
      {activeTab === "VALIDATOR" && <SchemaValidatorTool />}

      {/* UPGRADE PLAN MODAL */}
      <UpgradePlanModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        reason="Upgrade to generate and validate unlimited Google-compliant Schema JSON-LD."
      />
    </div>
  );
}
