"use client";

import React, { useState, useMemo } from "react";
import { AlertOctagon, AlertTriangle, Sparkles, CheckCircle2, ArrowRight, Filter } from "lucide-react";
import { SchemaIssueItem } from "@/services/schema/types";

interface SchemaIssuesListProps {
  issues: SchemaIssueItem[];
}

export function SchemaIssuesList({ issues }: SchemaIssuesListProps) {
  const [filter, setFilter] = useState<"ALL" | "ERROR" | "WARNING" | "OPPORTUNITY">("ALL");

  const filteredIssues = useMemo(() => {
    if (filter === "ERROR") return issues.filter((i) => i.severity === "Error");
    if (filter === "WARNING") return issues.filter((i) => i.severity === "Warning");
    if (filter === "OPPORTUNITY") return issues.filter((i) => i.severity === "Opportunity");
    return issues;
  }, [issues, filter]);

  const errorCount = issues.filter((i) => i.severity === "Error").length;
  const warningCount = issues.filter((i) => i.severity === "Warning").length;
  const opportunityCount = issues.filter((i) => i.severity === "Opportunity").length;

  if (issues.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center shadow-sm">
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
        <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Zero Schema Issues Found!</h4>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mt-1">
          All structured data elements meet Google Rich Results validation specifications without syntax errors or missing required properties.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-500" />
            Validation Findings & Action Items ({issues.length})
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Resolve required errors and recommended enhancements to maximize rich snippet visibility
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              filter === "ALL"
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            All ({issues.length})
          </button>
          <button
            onClick={() => setFilter("ERROR")}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              filter === "ERROR"
                ? "bg-red-600 text-white"
                : "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100"
            }`}
          >
            Errors ({errorCount})
          </button>
          <button
            onClick={() => setFilter("WARNING")}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              filter === "WARNING"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-100"
            }`}
          >
            Warnings ({warningCount})
          </button>
          <button
            onClick={() => setFilter("OPPORTUNITY")}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              filter === "OPPORTUNITY"
                ? "bg-indigo-600 text-white"
                : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100"
            }`}
          >
            Opportunities ({opportunityCount})
          </button>
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {filteredIssues.map((issue, idx) => {
          const isError = issue.severity === "Error";
          const isWarning = issue.severity === "Warning";

          return (
            <div
              key={idx}
              className={`border rounded-xl p-4 transition-all ${
                isError
                  ? "border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20"
                  : isWarning
                  ? "border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20"
                  : "border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {isError ? (
                      <AlertOctagon className="w-4 h-4 text-red-600 dark:text-red-400" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-md ${
                          isError
                            ? "bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300"
                            : isWarning
                            ? "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300"
                            : "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300"
                        }`}
                      >
                        {issue.severity}
                      </span>
                      <span className="text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-200/70 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                        @{issue.schemaType}
                      </span>
                      {issue.field && (
                        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                          prop: <code className="text-zinc-800 dark:text-zinc-200 font-semibold">{issue.field}</code>
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                      {issue.message}
                    </p>

                    <div className="bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-600 dark:text-zinc-300 flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">How to Fix: </span>
                        {issue.recommendation}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
