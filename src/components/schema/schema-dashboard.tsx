"use client";

import React, { useState, useEffect } from "react";
import {
  Globe2,
  Sparkles,
  RefreshCw,
  Search,
  Code2,
  Wand2,
  CheckCircle2,
  AlertOctagon,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { SchemaScoreCard } from "./schema-score-card";
import { SchemaSerpPreview } from "./schema-serp-preview";
import { SchemaDetectedTree } from "./schema-detected-tree";
import { SchemaIssuesList } from "./schema-issues-list";
import { SchemaGenerator } from "./schema-generator";
import { SchemaValidatorTool } from "./schema-validator-tool";
import { SchemaValidationResult } from "@/services/schema/types";

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
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-indigo-500" />
            Schema Markup & Rich Results Suite
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Detect, audit, and generate Google Rich Results & AI Knowledge Graph structured data
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("AUDIT")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "AUDIT"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            <Search className="w-3.5 h-3.5 text-indigo-500" />
            Live Audit
          </button>
          <button
            onClick={() => setActiveTab("GENERATOR")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "GENERATOR"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-500" />
            Schema Generator
          </button>
          <button
            onClick={() => setActiveTab("VALIDATOR")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "VALIDATOR"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-500" />
            Code Validator
          </button>
        </div>
      </div>

      {/* URL Scan Bar (Shown on Live Audit tab) */}
      {activeTab === "AUDIT" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runAudit(true);
            }}
            className="flex flex-col sm:flex-row items-center gap-3"
          >
            <div className="relative flex-1 w-full">
              <Globe2 className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com/page"
                className="w-full text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="submit"
                disabled={loading || !targetUrl.trim()}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors shadow-xs"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                {loading ? "Scanning Schema..." : "Scan Webpage"}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: LIVE AUDIT */}
      {activeTab === "AUDIT" && (
        <>
          {loading ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-16 text-center shadow-sm">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Extracting & Auditing Structured Data...
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
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
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-16 text-center shadow-sm">
              <Sparkles className="w-12 h-12 text-indigo-400 mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Ready to Audit Structured Data
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-1 mb-4">
                Enter any webpage URL above and click "Scan Webpage" to inspect its embedded Schema.org markup and Google Rich Results eligibility.
              </p>
              <button
                onClick={() => runAudit(false)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
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
