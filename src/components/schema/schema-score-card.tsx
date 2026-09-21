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
  // Score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (score >= 50) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-rose-600 bg-rose-50 border-rose-200";
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return "Excellent Structured Data";
    if (score >= 75) return "Good Schema Coverage";
    if (score >= 50) return "Moderate / Action Required";
    if (score > 0) return "Poor / Critical Errors";
    return "No Structured Data Found";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 font-sans">
      {/* Overall Score Card */}
      <div className="md:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
            Schema Health Score
          </span>
          <Award className="w-5 h-5 text-[#FF4D00]" />
        </div>

        <div className="my-4 flex items-baseline gap-3">
          <div
            className={cn(
              "font-display text-4xl font-extrabold tracking-tight px-3.5 py-1.5 rounded-[8px] border",
              getScoreColor(overallScore)
            )}
          >
            {overallScore}
            <span className="text-lg font-normal text-slate-400">/100</span>
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm font-display">
              {getScoreGrade(overallScore)}
            </div>
            <div className="text-xs text-slate-500 font-sans">
              {totalSchemas} schema blocks evaluated
            </div>
          </div>
        </div>

        {/* Rich Results Eligible Pills */}
        <div className="pt-3 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5 font-sans">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF4D00]" />
            <span>Rich Result Types Active ({richResultsEligible.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {richResultsEligible.length > 0 ? (
              richResultsEligible.map((type) => (
                <span
                  key={type}
                  className="px-2 py-0.5 text-[11px] font-bold rounded-[6px] bg-orange-50 text-[#FF4D00] border border-orange-200"
                >
                  {type}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic font-sans">None detected</span>
            )}
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Valid Schemas */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider font-sans">Valid Schemas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <div className="font-display text-3xl font-extrabold text-slate-900">{validCount}</div>
            <div className="text-xs text-emerald-600 font-medium font-sans mt-0.5">
              {totalSchemas > 0 ? `${Math.round((validCount / totalSchemas) * 100)}% passing` : "0%"}
            </div>
          </div>
        </div>

        {/* Errors */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider font-sans">Errors</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-3">
            <div className="font-display text-3xl font-extrabold text-rose-600">{errorCount}</div>
            <div className="text-xs text-slate-500 font-medium font-sans mt-0.5">
              {errorCount > 0 ? "Requires fix" : "Clean"}
            </div>
          </div>
        </div>

        {/* Warnings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider font-sans">Warnings</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <div className="font-display text-3xl font-extrabold text-amber-600">{warningCount}</div>
            <div className="text-xs text-slate-500 font-medium font-sans mt-0.5">
              {warningCount > 0 ? "Minor issues" : "None"}
            </div>
          </div>
        </div>

        {/* Opportunities */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider font-sans">Enhance</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-3">
            <div className="font-display text-3xl font-extrabold text-indigo-600">
              {opportunityCount}
            </div>
            <div className="text-xs text-slate-500 font-medium font-sans mt-0.5">
              Recommended fields
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
