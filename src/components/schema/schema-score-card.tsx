"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, AlertOctagon, Sparkles, Award } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SchemaScoreCardProps {
  overallScore: number;
  totalSchemas: number;
  validCount: number;
  errorCount: number;
  warningCount: number;
  opportunityCount: number;
  richResultsEligible: string[];
}

export function SchemaScoreCard({
  overallScore,
  totalSchemas,
  validCount,
  errorCount,
  warningCount,
  opportunityCount,
  richResultsEligible,
}: SchemaScoreCardProps) {
  // Score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800";
    if (score >= 50) return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800";
    return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800";
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return "Excellent Structured Data";
    if (score >= 75) return "Good Schema Coverage";
    if (score >= 50) return "Moderate / Action Required";
    if (score > 0) return "Poor / Critical Errors";
    return "No Structured Data Found";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      {/* Overall Score Card */}
      <div className="md:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Schema Health Score
          </span>
          <Award className="w-5 h-5 text-indigo-500" />
        </div>

        <div className="my-4 flex items-baseline gap-3">
          <div
            className={cn(
              "text-5xl font-extrabold tracking-tight px-4 py-2 rounded-xl border",
              getScoreColor(overallScore)
            )}
          >
            {overallScore}
            <span className="text-xl font-normal text-zinc-400 dark:text-zinc-500">/100</span>
          </div>
          <div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
              {getScoreGrade(overallScore)}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {totalSchemas} schema blocks evaluated
            </div>
          </div>
        </div>

        {/* Rich Results Eligible Pills */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Rich Result Types Active ({richResultsEligible.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {richResultsEligible.length > 0 ? (
              richResultsEligible.map((type) => (
                <span
                  key={type}
                  className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                >
                  {type}
                </span>
              ))
            ) : (
              <span className="text-xs text-zinc-400 italic">None detected</span>
            )}
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Valid Schemas */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Valid Schemas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{validCount}</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
              {totalSchemas > 0 ? `${Math.round((validCount / totalSchemas) * 100)}% passing` : "0%"}
            </div>
          </div>
        </div>

        {/* Errors */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Errors</span>
            <AlertOctagon className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{errorCount}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
              {errorCount > 0 ? "Requires fix" : "Clean"}
            </div>
          </div>
        </div>

        {/* Warnings */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Warnings</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{warningCount}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
              {warningCount > 0 ? "Minor issues" : "None"}
            </div>
          </div>
        </div>

        {/* Opportunities */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Enhance</span>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {opportunityCount}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
              Recommended fields
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
