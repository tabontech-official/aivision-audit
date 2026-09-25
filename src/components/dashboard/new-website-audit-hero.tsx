"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  ArrowRight,
  ShieldCheck,
  Gauge,
  FileCode,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { BrandIcon } from "@/components/ui/brand-icon";
import { claimWelcomeRewardAndRunAuditAction, rescanWebsiteAction } from "@/app/dashboard/reports/actions";
import { Sparkles, Gift } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface NewWebsiteAuditHeroProps {
  userEmail: string;
  userName: string | null;
  planKey: string;
  planName: string;
  pageCreditsLimit: number;
  initialPendingUrl?: string;
}

export function NewWebsiteAuditHero({
  userEmail,
  userName,
  planKey,
  planName,
  pageCreditsLimit,
  initialPendingUrl,
}: NewWebsiteAuditHeroProps) {
  const router = useRouter();
  const [url, setUrl] = useState(initialPendingUrl || "");
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const normalizeUrl = (val: string) => {
    let trimmed = val.trim();
    if (!trimmed) return "";
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    }
    return trimmed;
  };

  const [congratulation, setCongratulation] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = normalizeUrl(url);
    if (!cleanUrl) {
      setError("Please enter a valid website URL or domain name.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const res = await claimWelcomeRewardAndRunAuditAction(cleanUrl);
        if (res.ok) {
          setCongratulation("🎉 Congratulations! You received 10 Free Bonus Credits and started your free first website audit (0 credits deducted)!");
          const domain = res.domain || (cleanUrl.replace(/^https?:\/\//i, "").split("/")[0]) || "";
          router.push(`/dashboard?project=${encodeURIComponent(domain)}&reward=claimed`);
          router.refresh();
        } else {
          // Fallback to rescanWebsiteAction if reward was already claimed
          const fallbackRes = await rescanWebsiteAction(cleanUrl);
          if (fallbackRes.ok) {
            const domain = (cleanUrl.replace(/^https?:\/\//i, "").split("/")[0]) || "";
            router.push(`/dashboard?project=${encodeURIComponent(domain)}`);
            router.refresh();
          } else {
            setError(fallbackRes.error || res.error || "Failed to start audit. Please verify the URL and try again.");
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      }
    });
  };

  const displayName = userName?.trim() || userEmail.split("@")[0] || "there";

  return (
    <div className="w-full max-w-4xl mx-auto py-8 sm:py-12 px-2 sm:px-4 font-lazzer">
      {/* Main Container */}
      <div className="relative rounded-3xl border border-slate-200/90 bg-gradient-to-b from-[#f4fbf9] via-white to-white p-6 sm:p-10 md:p-12 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
        
        {/* Subtle decorative glow accents */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-100/50 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[#dff2ed]/60 blur-3xl" />

        <div className="relative z-10 w-full flex flex-col items-start">
          
          {/* Header Row: Welcome Gift & Plan Badge */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <BrandIcon className="w-8 h-8" />
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-950 shadow-2xs">
              <Gift className="w-3.5 h-3.5 text-emerald-600" />
              <span>Welcome Gift: +10 Free Credits &amp; Free First Audit</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
              <span>{planName}</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight text-left">
            Claim reward and run your free audit
          </h1>

          {/* Subtitle */}
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed text-left max-w-2xl font-normal">
            Welcome, <strong className="text-slate-900 font-semibold">{displayName}</strong>! Claim 10 bonus credits immediately. Your first website audit is 100% free of cost with 0 credits deducted from your account.
          </p>

          {/* Congratulation Success Alert */}
          {congratulation && (
            <div className="w-full mt-5 flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50/95 p-4 text-emerald-950 shadow-xs animate-in fade-in-50 duration-200">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs sm:text-sm font-bold">
                {congratulation}
              </div>
            </div>
          )}

          {/* URL Input Form */}
          <form onSubmit={handleSubmit} className="mt-7 w-full space-y-3" noValidate>
            <div className="w-full p-1.5 sm:p-2 rounded-2xl sm:rounded-full bg-slate-900/[0.03] border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] backdrop-blur-md transition-all">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                
                {/* White Input Pill */}
                <div className="flex-1 flex items-center bg-white rounded-xl sm:rounded-full border border-slate-200/90 shadow-2xs px-4 sm:px-5 py-2.5 sm:py-3 transition-all duration-200 focus-within:border-[#388bfd] focus-within:ring-4 focus-within:ring-[#388bfd]/20">
                  <Globe className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
                  <input
                    type="text"
                    inputMode="url"
                    value={url}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder={isFocused ? "" : "https://yourwebsite.com"}
                    disabled={isPending}
                    className="w-full bg-transparent text-sm sm:text-base font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none border-0 p-0 focus:ring-0"
                  />
                </div>

                {/* Brand Purple Action Button */}
                <button
                  type="submit"
                  disabled={isPending || !url.trim()}
                  className="bg-[#c084fc] hover:bg-[#b572fa] active:bg-[#a85cf7] text-slate-950 font-bold px-7 py-3 sm:py-3.5 rounded-xl sm:rounded-full text-xs sm:text-sm transition-all shadow-xs hover:shadow-md shrink-0 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 font-lazzer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Claiming &amp; Crawling...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>Claim 10 Credits &amp; Run Free Audit</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}
          </form>

          {/* 3 Core Pillar Feature Cards */}
          <div className="mt-8 pt-7 border-t border-slate-100 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card 1: Technical SEO */}
            <div className="rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-start text-left">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">Technical SEO</h2>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated inspection of crawlability, HTTPS SSL, indexability, redirects, status codes, and sitemaps.
              </p>
            </div>

            {/* Card 2: Core Web Vitals */}
            <div className="rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-start text-left">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 rounded-xl bg-sky-50 text-sky-700 border border-sky-200/70">
                  <Gauge className="w-4 h-4" />
                </div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">Core Web Vitals</h2>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Live Google Lighthouse page speed metrics for Mobile and Desktop with real LCP, CLS, and INP scores.
              </p>
            </div>

            {/* Card 3: Schema Markup */}
            <div className="rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-start text-left">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/70">
                  <FileCode className="w-4 h-4" />
                </div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">Schema Markup</h2>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Instant extraction, syntax validation, Google Rich Results preview, and visual JSON-LD schema builder.
              </p>
            </div>
          </div>

          {/* Trust Banner / Benefits */}
          <div className="mt-7 pt-5 border-t border-slate-100/80 w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Instant live crawl
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                No code installation needed
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Detailed issue fix guides
              </span>
            </div>
            <span className="text-slate-400 font-mono text-[11px]">
              Ready in ~60 seconds
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
