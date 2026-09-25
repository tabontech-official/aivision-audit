"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  ExternalLink,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Layers,
  Code,
  Laptop,
  Globe,
  ChevronRight,
  Sparkles,
  UserPlus,
  Check,
  HelpCircle,
  Copy,
  Terminal,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  generateIssueDiagnostics,
  type IssueDiagnosticDetail,
} from "@/services/inspection/issue-diagnostics";
import type { IssueItem } from "./site-audit-dashboard";

interface IssueDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  issue: IssueItem | null;
  domain: string;
  platform?: "Shopify" | "WordPress" | "Custom";
  onRecheck?: (issueId: string) => void;
  isRechecking?: boolean;
  recheckResult?: { ok: boolean; status?: string; message?: string } | null;
  onOpenUpgradeModal?: () => void;
}

export function IssueDetailDrawer({
  isOpen,
  onClose,
  issue,
  domain,
  platform = "Shopify",
  onRecheck,
  isRechecking = false,
  recheckResult,
  onOpenUpgradeModal,
}: IssueDetailDrawerProps) {
  const [activeCodeTab, setActiveCodeTab] = useState<"html" | "liquid">("html");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  if (!isOpen || !issue) return null;

  const diagnostics: IssueDiagnosticDetail = generateIssueDiagnostics(issue, domain, platform);
  const isSchema = diagnostics.title.toLowerCase().includes("schema") || (issue.category && issue.category.toLowerCase().includes("schema"));

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const severityColor =
    diagnostics.severity === "Critical"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : diagnostics.severity === "High"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-blue-50 text-blue-700 border-blue-200";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 font-lazzer">
      <div className="relative w-full max-w-2xl sm:max-w-3xl bg-white shadow-2xl flex flex-col h-full overflow-hidden border-l border-slate-200 animate-in slide-in-from-right duration-250">
        
        {/* Top Sticky Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-extrabold border uppercase tracking-wider", severityColor)}>
              {diagnostics.severity}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {issue.category || "Technical SEO"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              {shareCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <UserPlus className="h-3.5 w-3.5 text-slate-500" />}
              <span>{shareCopied ? "Link Copied" : "Share"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors cursor-pointer"
              title="Close drawer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-900">
          
          {/* 1. OVERVIEW */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-950">
              {diagnostics.title}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Affected Page</span>
                <a
                  href={diagnostics.affectedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1 mt-0.5 truncate max-w-[260px]"
                >
                  <span className="truncate">{diagnostics.affectedUrl}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Page Type</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{diagnostics.pageType}</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
              {diagnostics.problem}
            </p>
          </div>

          {/* 2. EVIDENCE */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Terminal className="h-4 w-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Audit Evidence &amp; Values
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-rose-200/80 bg-rose-50/40 p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
                  Detected Value
                </span>
                <div className="text-xs font-mono font-medium text-rose-950 break-words">
                  {diagnostics.detectedValue}
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Expected Value
                </span>
                <div className="text-xs font-mono font-medium text-emerald-950 break-words">
                  {diagnostics.expectedValue}
                </div>
              </div>
            </div>

            {/* Evidence HTML Snippet */}
            {diagnostics.htmlSnippet && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>Detected HTML / Evidence</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(diagnostics.htmlSnippet!, "evidence")}
                    className="hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    {copiedCode === "evidence" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedCode === "evidence" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
                  <code>{diagnostics.htmlSnippet}</code>
                </pre>
              </div>
            )}
          </div>

          {/* 3. LOCATION & DOM PATH */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Layers className="h-4 w-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Location &amp; Source Identification
              </h3>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-2.5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-bold">Rendered DOM Location:</span>
                <span className="font-mono font-bold text-slate-900">{diagnostics.domLocation}</span>
              </div>

              {diagnostics.selector && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-bold">CSS Selector:</span>
                  <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-semibold">{diagnostics.selector}</span>
                </div>
              )}

              <div className="space-y-1 pt-1">
                <span className="text-slate-500 font-bold block">Source Code Location:</span>
                <p className="font-semibold text-slate-800">
                  {diagnostics.sourceLocationLabel}
                </p>
                {diagnostics.likelyLocation && (
                  <p className="text-slate-600 text-[11px] font-normal italic mt-0.5">
                    💡 <strong>Likely implementation location:</strong> {diagnostics.likelyLocation}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 4. WHY THIS MATTERS */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <HelpCircle className="h-4 w-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Why This Matters
              </h3>
            </div>
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs sm:text-[13px] text-slate-800 leading-relaxed">
              {diagnostics.whyItMatters}
            </div>
          </div>

          {/* 5. HOW TO FIX IT */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                How To Fix It (Step-by-Step)
              </h3>
            </div>
            <ol className="space-y-2 text-xs sm:text-[13px] text-slate-700 pl-4 list-decimal leading-relaxed">
              {diagnostics.howToFixSteps.map((step, idx) => (
                <li key={idx} className="font-medium text-slate-800">
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* 6. EXACT CODE FIX (BEFORE / AFTER) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Exact Code Fix Example
                </h3>
              </div>

              {diagnostics.liquidBefore && (
                <div className="flex items-center rounded-lg bg-slate-100 p-0.5 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveCodeTab("html")}
                    className={cn("px-2.5 py-1 rounded-md transition-all cursor-pointer", activeCodeTab === "html" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900")}
                  >
                    HTML
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCodeTab("liquid")}
                    className={cn("px-2.5 py-1 rounded-md transition-all cursor-pointer", activeCodeTab === "liquid" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900")}
                  >
                    Shopify Liquid
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {/* Current Flawed Code */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-rose-700">
                  <span>Current (Flawed)</span>
                </div>
                <pre className="p-3 rounded-xl bg-rose-950/90 text-rose-200 font-mono text-xs overflow-x-auto border border-rose-900 leading-relaxed">
                  <code>
                    {activeCodeTab === "liquid" && diagnostics.liquidBefore ? diagnostics.liquidBefore : diagnostics.codeBefore}
                  </code>
                </pre>
              </div>

              {/* Recommended Fixed Code */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700">
                  <span>Recommended (Fixed)</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(activeCodeTab === "liquid" && diagnostics.liquidAfter ? diagnostics.liquidAfter : diagnostics.codeAfter, "fixed")}
                    className="hover:text-emerald-900 inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCode === "fixed" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedCode === "fixed" ? "Copied Fix" : "Copy Code"}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-emerald-950/95 text-emerald-200 font-mono text-xs overflow-x-auto border border-emerald-800 leading-relaxed">
                  <code>
                    {activeCodeTab === "liquid" && diagnostics.liquidAfter ? diagnostics.liquidAfter : diagnostics.codeAfter}
                  </code>
                </pre>
              </div>
            </div>
          </div>

          {/* 7. SHOPIFY / CMS SPECIFIC NO-CODE GUIDANCE */}
          {diagnostics.platformGuidance && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Globe className="h-4 w-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  {diagnostics.platformGuidance.platform} Admin No-Code Guidance
                </h3>
              </div>
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-2 text-xs">
                {diagnostics.platformGuidance.adminSteps?.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-slate-800 font-medium">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification Feedback Banner */}
          {recheckResult && (
            <div className={cn(
              "rounded-xl p-4 text-xs font-semibold space-y-1.5 animate-in fade-in-50 border",
              recheckResult.ok && recheckResult.status === "Fixed"
                ? "bg-emerald-50 text-emerald-950 border-emerald-300"
                : "bg-rose-50 text-rose-950 border-rose-300"
            )}>
              <div className="flex items-center gap-1.5 font-bold">
                {recheckResult.ok && recheckResult.status === "Fixed" ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>✓ Fix Verified: Issue Resolved on Checked Page</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>Verification Check: Still Failing</span>
                  </>
                )}
              </div>
              <p className="text-slate-700 leading-relaxed font-normal">
                {recheckResult.message || (recheckResult.ok ? "Your changes successfully passed live inspection." : "The issue was still detected in the live HTML response.")}
              </p>
            </div>
          )}

        </div>

        {/* Bottom Sticky Action Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="w-full sm:w-auto flex items-center gap-2">
            {isSchema && (
              <Link
                href={`/dashboard/schema?url=${encodeURIComponent(issue.fixUrl || domain)}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <FileCode className="h-4 w-4" />
                <span>Open Schema Builder</span>
              </Link>
            )}
          </div>

          <div className="w-full sm:w-auto flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>

            {onRecheck && (
              <button
                type="button"
                disabled={isRechecking}
                onClick={() => onRecheck(issue.id)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 hover:bg-black text-white px-5 py-2.5 text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={cn("h-4 w-4", isRechecking && "animate-spin")} />
                <span>{isRechecking ? "Rechecking Issue..." : "Recheck Issue"}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
