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
} from "lucide-react";
import { SchemaScoreCard } from "./schema-score-card";
import { SchemaSerpPreview } from "./schema-serp-preview";
import { SchemaDetectedTree } from "./schema-detected-tree";
import { SchemaIssuesList } from "./schema-issues-list";
import { SchemaGenerator } from "./schema-generator";
import { SchemaValidatorTool } from "./schema-validator-tool";
import { SchemaValidationResult } from "@/services/schema/types";
import { cn } from "@/lib/utils/cn";

interface SchemaDashboardProps {
  initialUrl?: string;
  initialDomain?: string;
}

export function SchemaDashboard({ initialUrl, initialDomain }: SchemaDashboardProps) {
  const [targetUrl, setTargetUrl] = useState<string>(initialUrl || "https://thesmithmarketing.com");
  const [activeTab, setActiveTab] = useState<"AUDIT" | "GENERATOR" | "VALIDATOR">("AUDIT");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<(SchemaValidationResult & { domain: string; url: string }) | null>(null);

  const runAudit = async (forceRefresh = false) => {
    if (!targetUrl.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/schema/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl.trim(), forceRefresh }),
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

  const domain = auditData?.domain || initialDomain || "website.com";

  return (
    <div className="space-y-6 font-sans">
      {/* 1. FIXED TOP BAR: Attached Edge-to-Edge, Sticky beneath Dashboard TopBar */}
      <div className="sticky top-[52px] z-20 -mx-4 -mt-6 sm:-mx-8 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-8 py-2.5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-orange-50 text-[#FF4D00] shrink-0 border border-orange-200/60">
              <FileCode className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight">
                  {domain ? `${domain} Schema Markup` : "Schema Markup & Rich Results"}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-bold text-[#FF4D00] font-sans border border-orange-200">
                  <ShieldCheck className="h-3 w-3" />
                  <span>{auditData ? `${auditData.overallScore}/100 Health` : "Structured Data"}</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans leading-tight mt-0.5">
                Audit, validate, and generate Google-compliant JSON-LD structured data and rich results snippets.
              </p>
            </div>
          </div>

          {/* View Switcher Tabs in Fixed Header */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab("AUDIT")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-bold rounded-[8px] transition-all cursor-pointer",
                activeTab === "AUDIT"
                  ? "bg-gradient-to-r from-[#FF6B00] to-[#FF3D00] text-white shadow-2xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              )}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Live Audit</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("GENERATOR")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-bold rounded-[8px] transition-all cursor-pointer",
                activeTab === "GENERATOR"
                  ? "bg-gradient-to-r from-[#FF6B00] to-[#FF3D00] text-white shadow-2xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Schema Generator</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("VALIDATOR")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-bold rounded-[8px] transition-all cursor-pointer",
                activeTab === "VALIDATOR"
                  ? "bg-gradient-to-r from-[#FF6B00] to-[#FF3D00] text-white shadow-2xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              )}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Code Validator</span>
            </button>
          </div>
        </div>

        {/* Fixed URL Scan Bar attached inside sticky header */}
        {activeTab === "AUDIT" && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-200/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runAudit(true);
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://example.com/page"
                  className="w-full text-xs font-medium pl-9 pr-3 py-1.5 rounded-[8px] border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-orange-500 focus:border-[#FF4D00]"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !targetUrl.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-display font-bold rounded-[8px] bg-gradient-to-r from-[#FF6B00] to-[#FF3D00] hover:opacity-95 disabled:opacity-50 text-white transition-opacity shadow-2xs cursor-pointer shrink-0"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>{loading ? "Scanning..." : "Scan Webpage"}</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-[8px] text-xs text-rose-700 flex items-center gap-2 font-medium">
          <AlertOctagon className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: LIVE AUDIT */}
      {activeTab === "AUDIT" && (
        <>
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-xs">
              <RefreshCw className="w-8 h-8 text-[#FF4D00] animate-spin mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900 font-display">
                Extracting & Auditing Structured Data...
              </h3>
              <p className="text-xs text-slate-500 font-sans mt-1">
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

              {/* SERP Simulator */}
              <SchemaSerpPreview url={targetUrl} domain={domain} items={auditData.items || []} />

              {/* Detected Schemas Tree */}
              <SchemaDetectedTree items={auditData.items || []} />

              {/* Issues & Improvement Checklist */}
              <SchemaIssuesList issues={auditData.issues || []} />
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-xs">
              <FileCode className="w-12 h-12 text-orange-400 mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-bold text-slate-900 font-display">
                Ready to Audit Structured Data
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4 font-sans">
                Enter any webpage URL above and click &quot;Scan Webpage&quot; to inspect its embedded Schema.org markup and Google Rich Results eligibility.
              </p>
              <button
                type="button"
                onClick={() => runAudit(false)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-display font-bold rounded-[8px] bg-gradient-to-r from-[#FF6B00] to-[#FF3D00] text-white hover:opacity-95 transition-opacity cursor-pointer shadow-2xs"
              >
                Scan Sample ({targetUrl})
              </button>
            </div>
          )}
        </>
      )}

      {/* TAB 2: SCHEMA GENERATOR */}
      {activeTab === "GENERATOR" && <SchemaGenerator />}

      {/* TAB 3: CODE VALIDATOR */}
      {activeTab === "VALIDATOR" && <SchemaValidatorTool />}
    </div>
  );
}
