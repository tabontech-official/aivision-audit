"use client";

import React from "react";
import { Search, TrendingUp, Gauge, DollarSign, Layers } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface KeywordMetricsOverviewProps {
  totalResults: number;
  avgSearchVolume: number;
  avgDifficulty: number;
  avgCpc: number;
}

export function KeywordMetricsOverview({
  totalResults,
  avgSearchVolume,
  avgDifficulty,
  avgCpc,
}: KeywordMetricsOverviewProps) {
  const getDifficultyColor = (kd: number) => {
    if (kd <= 29) return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800";
    if (kd <= 49) return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800";
    if (kd <= 69) return "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800";
    return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800";
  };

  const getDifficultyLabel = (kd: number) => {
    if (kd <= 29) return "Easy to Rank";
    if (kd <= 49) return "Moderate Competition";
    if (kd <= 69) return "Competitive";
    return "Very High Difficulty";
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Keywords Found */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Total Ideas</span>
          <Layers className="w-4 h-4 text-indigo-500" />
        </div>
        <div className="mt-3">
          <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {totalResults.toLocaleString()}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
            Keyword variations discovered
          </div>
        </div>
      </div>

      {/* 2. Avg Monthly Volume */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Avg Search Volume</span>
          <TrendingUp className="w-4 h-4 text-blue-500" />
        </div>
        <div className="mt-3">
          <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {avgSearchVolume.toLocaleString()}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">
            Monthly searches per query
          </div>
        </div>
      </div>

      {/* 3. Average Keyword Difficulty */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Avg Difficulty (KD)</span>
          <Gauge className="w-4 h-4 text-amber-500" />
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className={cn("text-3xl font-extrabold tracking-tight px-2.5 py-0.5 rounded-lg border", getDifficultyColor(avgDifficulty))}>
              {avgDifficulty}
            </span>
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {getDifficultyLabel(avgDifficulty)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Average CPC */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
          <span className="text-xs font-semibold uppercase tracking-wider">Avg Cost Per Click</span>
          <DollarSign className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="mt-3">
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
            ${avgCpc.toFixed(2)}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
            Estimated Google Ads CPC
          </div>
        </div>
      </div>
    </div>
  );
}
