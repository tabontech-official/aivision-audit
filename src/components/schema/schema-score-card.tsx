"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, AlertOctagon, Award, Layers, ShieldCheck } from "lucide-react";
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
  // Score color styling
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-700 bg-emerald-50 border-emerald-200/80";
    if (score >= 50) return "text-amber-700 bg-amber-50 border-amber-200/80";
    return "text-rose-700 bg-rose-50 border-rose-200/80";
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return "Excellent Structured Data";
    if (score >= 75) return "Good Schema Coverage";
    if (score >= 50) return "Moderate / Action Required";
    if (score > 0) return "Poor / Critical Errors";
    return "No Structured Data Found";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 font-lazzer">
      {/* Overall Score Card (Compact Height) */}
      <div className="md:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
        <div>
          {/* Header Row */}
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Schema Health Score
            </span>
            <div className="p-1 rounded-lg bg-slate-100 text-slate-700">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Score & Grade */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "text-2xl sm:text-3xl font-extrabold tracking-tight px-3 py-1 rounded-xl border shrink-0",
                getScoreColor(overallScore)
              )}
            >
              {overallScore}
              <span className="text-sm font-normal text-slate-400">/100</span>
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                {getScoreGrade(overallScore)}
              </div>
              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                {totalSchemas} schema blocks evaluated
              </div>
            </div>
          </div>
        </div>

        {/* Rich Results Active Types */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
          <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Active Rich Results ({richResultsEligible.length}):</span>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {richResultsEligible.length > 0 ? (
              richResultsEligible.map((type) => (
                <span
                  key={type}
                  className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#dff2ed] text-emerald-900 border border-emerald-300/80"
                >
                  {type}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-slate-400 italic">None detected</span>
            )}
          </div>
        </div>
      </div>

      {/* 4 Compact Metric Cards */}
      <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Valid Schemas */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Valid</span>
            <div className="p-1 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{validCount}</div>
            <div className="text-[11px] text-emerald-600 font-bold mt-0.5">
              {totalSchemas > 0 ? `${Math.round((validCount / totalSchemas) * 100)}% passing` : "0%"}
            </div>
          </div>
        </div>

        {/* Errors */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Errors</span>
            <div className="p-1 rounded-lg bg-rose-50 text-rose-600">
              <AlertOctagon className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600">{errorCount}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              {errorCount > 0 ? "Requires fix" : "Clean"}
            </div>
          </div>
        </div>

        {/* Warnings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Warnings</span>
            <div className="p-1 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">{warningCount}</div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              {warningCount > 0 ? "Minor issues" : "None"}
            </div>
          </div>
        </div>

        {/* Enhance / Opportunities */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Enhance</span>
            <div className="p-1 rounded-lg bg-indigo-50 text-indigo-600">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
              {opportunityCount}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Recommended fields
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
