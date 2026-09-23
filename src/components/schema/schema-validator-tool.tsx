"use client";

import React, { useState } from "react";
import { CheckCircle2, AlertOctagon, Code2, Play, RefreshCw, AlertTriangle, Copy, Check } from "lucide-react";
import { SchemaValidationResult } from "@/services/schema/types";
import { cn } from "@/lib/utils/cn";

const DEFAULT_SAMPLE_JSON = `{
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
}`;

export function SchemaValidatorTool() {
  const [inputCode, setInputCode] = useState<string>(DEFAULT_SAMPLE_JSON);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SchemaValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleFormat = () => {
    try {
      let cleanInput = inputCode.trim();
      if (cleanInput.startsWith("<script") && cleanInput.endsWith("</script>")) {
        cleanInput = cleanInput.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
      }
      const parsed = JSON.parse(cleanInput);
      setInputCode(JSON.stringify(parsed, null, 2));
    } catch {
      // ignore syntax error
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inputCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
            <Code2 className="w-4 h-4 text-slate-900" />
            Direct Schema Code Validator
          </h3>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Paste raw JSON-LD code to test syntax and Google Rich Results eligibility
          </p>
        </div>

        <button
          type="button"
          onClick={handleValidate}
          disabled={loading || !inputCode.trim()}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-black disabled:opacity-50 text-white transition-colors shadow-2xs cursor-pointer shrink-0"
        >
          {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{loading ? "Testing..." : "Validate Code"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Sleek Code Editor Window */}
        <div className="lg:col-span-6 flex flex-col bg-slate-950 rounded-[8px] border border-slate-800 text-slate-100 h-[400px] overflow-hidden shadow-2xs">
          {/* Code Window Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span className="font-semibold text-slate-200">JSON-LD Snippet</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleFormat}
                className="px-2 py-0.5 text-[11px] font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-[4px] transition-colors cursor-pointer"
                title="Format / Prettify JSON"
              >
                Format
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="px-2 py-0.5 text-[11px] font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-[4px] transition-colors cursor-pointer flex items-center gap-1"
                title="Copy code"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
              <button
                type="button"
                onClick={() => setInputCode(DEFAULT_SAMPLE_JSON)}
                className="px-2 py-0.5 text-[11px] font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-[4px] transition-colors cursor-pointer"
                title="Reset to sample JSON"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Textarea Editor with sleek dark scrollbar */}
          <textarea
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            className="w-full flex-1 p-3.5 font-mono text-xs text-emerald-300 bg-transparent border-0 focus:outline-hidden resize-none dark-scrollbar leading-relaxed"
            placeholder="Paste your JSON-LD code here..."
            spellCheck={false}
          />
        </div>

        {/* Right Column: Validation Results */}
        <div className="lg:col-span-6 border border-slate-200 rounded-[8px] p-4 bg-slate-50/70 flex flex-col justify-between h-[400px] shadow-2xs overflow-hidden">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-[8px] text-xs text-rose-700 font-medium flex items-center gap-2 mb-2 shrink-0">
              <AlertOctagon className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Score Header Bar */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 font-sans">Score:</span>
                  <span
                    className={cn(
                      "text-sm font-extrabold font-display px-2 py-0.5 rounded-[6px] border",
                      result.overallScore >= 80
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : result.overallScore >= 50
                        ? "text-amber-700 bg-amber-50 border-amber-200"
                        : "text-rose-700 bg-rose-50 border-rose-200"
                    )}
                  >
                    {result.overallScore}/100
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-[6px]">
                    {result.errorCount} Errors
                  </span>
                  <span className="text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-[6px]">
                    {result.warningCount} Warnings
                  </span>
                </div>
              </div>

              {/* Issues List with custom-scrollbar */}
              {result.issues.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-4 bg-emerald-50/70 border border-emerald-200 rounded-[8px] text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <div className="text-xs font-bold text-emerald-800 font-display">
                    100% Valid Schema Markup
                  </div>
                  <div className="text-[11px] text-emerald-700 font-sans mt-0.5">
                    Ready for Google Rich Results search appearance!
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 overflow-y-auto custom-scrollbar flex-1 pr-1.5">
                  {result.issues.map((iss, i) => (
                    <div
                      key={i}
                      className={cn(
                        "p-3 rounded-[8px] border text-xs font-sans shadow-2xs",
                        iss.severity === "Error"
                          ? "bg-rose-50/80 border-rose-200 text-rose-900"
                          : "bg-amber-50/80 border-amber-200 text-amber-900"
                      )}
                    >
                      <div className="font-bold flex items-center gap-1.5 mb-1">
                        {iss.severity === "Error" ? (
                          <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                        <span>{iss.message}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 pl-5">
                        {iss.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : !error ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center text-slate-400 font-sans">
              <Code2 className="w-10 h-10 mb-2 opacity-35 text-slate-400" />
              <div className="text-xs font-bold text-slate-600">Ready to Validate</div>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                Click &quot;Validate Code&quot; to test schema syntax and check Google Rich Results eligibility.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
