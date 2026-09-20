"use client";

import React, { useState } from "react";
import { CheckCircle2, AlertOctagon, Code, Play, RefreshCw } from "lucide-react";
import { SchemaValidationResult } from "@/services/schema/types";

export function SchemaValidatorTool() {
  const [inputCode, setInputCode] = useState<string>(`{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Super Fast Running Shoes",
  "image": "https://example.com/shoes.jpg",
  "offers": {
    "@type": "Offer",
    "price": "89.99",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.7",
    "reviewCount": "89"
  }
}`);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SchemaValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleValidate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Strip <script> wrapper if user pasted full HTML tag
      let cleanInput = inputCode.trim();
      if (cleanInput.startsWith("<script") && cleanInput.endsWith("</script>")) {
        cleanInput = cleanInput.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
      }

      const res = await fetch("/api/schema/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawJson: cleanInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Validation failed");
      }

      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Validation error");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Code className="w-4 h-4 text-indigo-500" />
            Direct Schema Code Validator
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Paste raw JSON-LD code to test syntax and Google Rich Results eligibility
          </p>
        </div>

        <button
          onClick={handleValidate}
          disabled={loading || !inputCode.trim()}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-colors shadow-xs"
        >
          {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          {loading ? "Testing..." : "Validate Code"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor column */}
        <div className="lg:col-span-6">
          <textarea
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            rows={12}
            className="w-full text-xs font-mono p-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-950 text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            placeholder="Paste your JSON-LD code here..."
          />
        </div>

        {/* Results column */}
        <div className="lg:col-span-6 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50 dark:bg-zinc-950/50 flex flex-col justify-between">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {result ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Score:</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {result.overallScore}/100
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-500 font-semibold">{result.errorCount} Errors</span>
                  <span className="text-xs text-amber-500 font-semibold">{result.warningCount} Warnings</span>
                </div>
              </div>

              {result.issues.length === 0 ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    100% Valid Schema Markup
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Ready for Google Rich Results search appearance!
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.issues.map((iss, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-lg border text-xs ${
                        iss.severity === "Error"
                          ? "bg-red-50 dark:bg-red-950/40 border-red-200 text-red-700 dark:text-red-300"
                          : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      <div className="font-semibold">{iss.message}</div>
                      <div className="text-[11px] opacity-80 mt-0.5">{iss.recommendation}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : !error ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center text-zinc-400">
              <Code className="w-8 h-8 mb-2 opacity-50" />
              <div className="text-xs">Click "Validate Code" to inspect the JSON-LD snippet</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
