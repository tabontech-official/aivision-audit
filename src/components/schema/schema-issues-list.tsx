"use client";

import React, { useState, useMemo } from "react";
import { AlertOctagon, AlertTriangle, Layers, CheckCircle2, ArrowRight, Filter } from "lucide-react";
import { SchemaIssueItem } from "@/services/schema/types";
import { cn } from "@/lib/utils/cn";

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
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs font-sans">
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
        <h4 className="text-sm font-bold text-slate-800 font-display">Zero Schema Issues Found!</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 font-sans">
          All structured data elements meet Google Rich Results validation specifications without syntax errors or missing required properties.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs font-lazzer">
      <div className="mb-4 pb-3.5 border-b border-slate-100">
        <div className="mb-3">
          <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-900" />
            Validation Findings &amp; Action Items ({issues.length})
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Resolve required errors and recommended enhancements to maximize rich snippet visibility
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={cn(
              "px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer",
              filter === "ALL"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            All ({issues.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("ERROR")}
            className={cn(
              "px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer",
              filter === "ERROR"
                ? "bg-rose-600 text-white shadow-2xs"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            )}
          >
            Errors ({errorCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("WARNING")}
            className={cn(
              "px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer",
              filter === "WARNING"
                ? "bg-amber-600 text-white shadow-2xs"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            )}
          >
            Warnings ({warningCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("OPPORTUNITY")}
            className={cn(
              "px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer",
              filter === "OPPORTUNITY"
                ? "bg-teal-700 text-white shadow-2xs"
                : "bg-teal-50 text-teal-800 hover:bg-teal-100"
            )}
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
              className={cn(
                "border rounded-xl p-4 transition-all",
                isError
                  ? "border-rose-200 bg-rose-50/40"
                  : isWarning
                  ? "border-amber-200 bg-amber-50/40"
                  : "border-teal-200 bg-teal-50/30"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {isError ? (
                      <AlertOctagon className="w-4 h-4 text-rose-600" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Layers className="w-4 h-4 text-teal-700" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={cn(
                          "text-[11px] font-bold uppercase px-2 py-0.5 rounded-md",
                          isError
                            ? "bg-rose-100 text-rose-800"
                            : isWarning
                            ? "bg-amber-100 text-amber-800"
                            : "bg-teal-100 text-teal-800"
                        )}
                      >
                        {issue.severity}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded-md">
                        @{issue.schemaType}
                      </span>
                      {issue.field && (
                        <span className="text-xs font-mono text-slate-500">
                          prop: <code className="text-slate-800 font-bold">{issue.field}</code>
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-bold text-slate-900 mb-2 font-sans">
                      {issue.message}
                    </p>

                    <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 flex items-start gap-2 font-sans">
                      <ArrowRight className="w-3.5 h-3.5 text-slate-900 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800">How to Fix: </span>
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
