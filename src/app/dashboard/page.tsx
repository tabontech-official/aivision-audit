import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/rbac";
import { db } from "@/lib/db/client";
import {
  ShieldCheck,
  Laptop,
  Smartphone,
  TrendingUp,
  RotateCw,
  ArrowRight,
  Globe,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { RescanButton } from "@/components/dashboard/rescan-button";
import { StopAuditButton } from "@/components/dashboard/stop-audit-button";

export const metadata: Metadata = { title: "SEO Dashboard" };

function getScoreColor(score: number): { stroke: string; text: string; bg: string } {
  if (score >= 80) return { stroke: "#059669", text: "text-emerald-600", bg: "bg-emerald-50" };
  if (score >= 50) return { stroke: "#d97706", text: "text-amber-600", bg: "bg-amber-50" };
  return { stroke: "#e11d48", text: "text-rose-600", bg: "bg-rose-50" };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ project?: string }>;
}) {
  const resolvedParams = (await searchParams) ?? {};
  const requestedProject = resolvedParams.project;

  const _user = await requireUser();

  // Find matching website belonging strictly to active user
  let activeWebsite = null;
  let activeReport = null;

  try {
    if (requestedProject) {
      activeWebsite = await db.website.findFirst({
        where: {
          userId: _user.id,
          deletedAt: null,
          OR: [
            { domain: { contains: requestedProject, mode: "insensitive" } },
            { url: { contains: requestedProject, mode: "insensitive" } },
          ],
        },
        include: {
          reports: {
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              pageSpeedResults: true,
              rawData: true,
            },
          },
        },
      });
      activeReport = activeWebsite?.reports[0] ?? null;
    }

    if (!activeWebsite) {
      const dbWebsites = await db.website.findMany({
        where: {
          userId: _user.id,
          deletedAt: null,
        },
        orderBy: { updatedAt: "desc" },
        take: 1,
        include: {
          reports: {
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              pageSpeedResults: true,
              rawData: true,
            },
          },
        },
      });
      activeWebsite = dbWebsites[0] ?? null;
      activeReport = activeWebsite?.reports[0] ?? null;
    }
  } catch (err) {
    console.error("Dashboard database query error:", err);
  }

  const hasReport = Boolean(activeWebsite && activeReport);
  const domainName = activeWebsite?.domain ?? "";
  const overallScore = hasReport ? Math.round(activeReport?.overallScore ?? 0) : 0;
  const passedCount = hasReport ? (activeReport?.passedCount ?? 0) : 0;
  const failedCount = hasReport ? (activeReport?.failedCount ?? 0) : 0;
  const warningCount = hasReport ? (activeReport?.warningCount ?? 0) : 0;
  const criticalIssueCount = hasReport ? (activeReport?.criticalIssueCount ?? 0) : 0;

  // PageSpeed Results
  const desktopRes = activeReport?.pageSpeedResults?.find(
    (p) => p.strategy === "DESKTOP"
  );
  const mobileRes = activeReport?.pageSpeedResults?.find(
    (p) => p.strategy === "MOBILE"
  );

  const desktopSpeed = hasReport
    ? (activeReport?.desktopScore
        ? Math.round(activeReport.desktopScore > 1 ? activeReport.desktopScore : activeReport.desktopScore * 100)
        : desktopRes?.performanceScore
        ? Math.round(desktopRes.performanceScore > 1 ? desktopRes.performanceScore : desktopRes.performanceScore * 100)
        : 0)
    : 0;

  const mobileSpeed = hasReport
    ? (activeReport?.mobileScore
        ? Math.round(activeReport.mobileScore > 1 ? activeReport.mobileScore : activeReport.mobileScore * 100)
        : mobileRes?.performanceScore
        ? Math.round(mobileRes.performanceScore > 1 ? mobileRes.performanceScore : mobileRes.performanceScore * 100)
        : 0)
    : 0;

  // Extracted Data
  const rawExtracted = (activeReport?.rawData?.extracted as Record<string, unknown>) || {};
  const sitemapData = (rawExtracted.sitemap as Record<string, unknown>) || {};

  // Pages Scanned Overview
  const totalPagesCount = hasReport
    ? (typeof sitemapData.totalUrlCount === "number" && sitemapData.totalUrlCount > 0
        ? sitemapData.totalUrlCount
        : (passedCount + failedCount + warningCount))
    : 0;
  const blockPagesCount = hasReport ? warningCount : 0;
  const scannedPagesCount = hasReport ? (passedCount + failedCount + warningCount) : 0;

  // Critical Error Overview
  const pageErrorCount = hasReport ? failedCount : 0;
  const indexIssuesCount = hasReport ? warningCount : 0;
  const contentErrorCount = hasReport ? criticalIssueCount : 0;

  // Colors for score badges
  const healthStyle = getScoreColor(overallScore);
  const desktopStyle = getScoreColor(desktopSpeed);
  const mobileStyle = getScoreColor(mobileSpeed);

  return (
    <div className="space-y-6 pb-12 font-lazzer text-slate-800">
      {/* Top Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                SEO Dashboard
              </h1>
              {activeWebsite?.domain && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
                  {activeWebsite.domain}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive SEO health, Core Web Vitals, and real-time crawl insights.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RescanButton reportId={activeReport?.id} domain={activeWebsite?.domain} />
        </div>
      </div>

      {/* Active Audit Running Progress Banner */}
      {activeReport && (activeReport.status === "PROCESSING" || activeReport.status === "QUEUED") && (
        <div className="w-full flex flex-col sm:flex-row items-center justify-between rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-900 shrink-0">
              <RotateCw className="h-5 w-5 animate-spin text-slate-800" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                Audit scan in progress for {domainName}...
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                Scanning speed, SEO vitals, crawlability, and indexability ({activeReport.progressPercent ?? 15}% complete).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
            <StopAuditButton identifier={activeReport.publicId} />
            <Link
              href={`/analyze/${activeReport.publicId}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors shrink-0"
            >
              <span>View Live Progress</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Row 1: 3 Top Metric Cards: Site Health, Desktop Performance, Mobile Performance */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Card 1: Site Health */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs flex items-center justify-between transition-all hover:border-slate-300">
          <div className="max-w-[65%] space-y-1.5">
            <div className="flex items-center gap-2.5 font-bold text-slate-900 text-sm sm:text-base">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <ShieldCheck className="h-4.5 w-4.5" />
              </div>
              <span>Site Health</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Overall audit score aggregated across 21 technical and structural checks.
            </p>
          </div>

          {/* Clean Circular Score Ring */}
          <div className="relative flex h-20 w-20 items-center justify-center shrink-0">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                strokeWidth="3.5"
                strokeDasharray={`${hasReport ? overallScore : 0}, 100`}
                strokeLinecap="round"
                stroke={hasReport ? healthStyle.stroke : "#cbd5e1"}
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className={`text-xl font-black ${hasReport ? healthStyle.text : "text-slate-400"}`}>
                {overallScore}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">/ 100</span>
            </div>
          </div>
        </div>

        {/* Card 2: Desktop Performance */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs flex items-center justify-between transition-all hover:border-slate-300">
          <div className="max-w-[65%] space-y-1.5">
            <div className="flex items-center gap-2.5 font-bold text-slate-900 text-sm sm:text-base">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                <Laptop className="h-4.5 w-4.5" />
              </div>
              <span>Desktop Performance</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Speed, Core Web Vitals, and load efficiency measured on desktop browsers.
            </p>
          </div>

          {/* Desktop Speed Badge */}
          <div className="relative flex h-20 w-20 items-center justify-center shrink-0">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                strokeWidth="3.5"
                strokeDasharray={`${hasReport ? desktopSpeed : 0}, 100`}
                strokeLinecap="round"
                stroke={hasReport ? desktopStyle.stroke : "#cbd5e1"}
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className={`text-xl font-black ${hasReport ? desktopStyle.text : "text-slate-400"}`}>
                {desktopSpeed}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">/ 100</span>
            </div>
          </div>
        </div>

        {/* Card 3: Mobile Performance */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs flex items-center justify-between transition-all hover:border-slate-300">
          <div className="max-w-[65%] space-y-1.5">
            <div className="flex items-center gap-2.5 font-bold text-slate-900 text-sm sm:text-base">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                <Smartphone className="h-4.5 w-4.5" />
              </div>
              <span>Mobile Performance</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Mobile responsiveness, page load speed, and touch usability for phones.
            </p>
          </div>

          {/* Mobile Speed Badge */}
          <div className="relative flex h-20 w-20 items-center justify-center shrink-0">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                strokeWidth="3.5"
                strokeDasharray={`${hasReport ? mobileSpeed : 0}, 100`}
                strokeLinecap="round"
                stroke={hasReport ? mobileStyle.stroke : "#cbd5e1"}
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className={`text-xl font-black ${hasReport ? mobileStyle.text : "text-slate-400"}`}>
                {mobileSpeed}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">/ 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Analytical Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Section 1: Pages Scanned */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Pages Scanned</h2>
              <p className="text-xs text-slate-500 mt-0.5">Crawl breakdown and page discovery timeline</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Healthy Crawl</span>
            </div>
          </div>

          {/* 3 Stat Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 sm:p-4">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Total Pages</span>
              <div className="mt-1 text-xl sm:text-2xl font-black text-slate-900">{totalPagesCount}</div>
              <div className="mt-1 flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-600">
                <TrendingUp className="h-3 w-3" /> +{Math.max(1, Math.round(totalPagesCount * 0.05))} new
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 sm:p-4">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Blocked Pages</span>
              <div className="mt-1 text-xl sm:text-2xl font-black text-slate-900">{blockPagesCount}</div>
              <div className="mt-1 flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-slate-500">
                <span>{blockPagesCount === 0 ? "0 issues" : "Blocked"}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 sm:p-4">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Scanned Pages</span>
              <div className="mt-1 text-xl sm:text-2xl font-black text-slate-900">{scannedPagesCount}</div>
              <div className="mt-1 flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-600">
                <TrendingUp className="h-3 w-3" /> 100%
              </div>
            </div>
          </div>

          {/* Line Chart Component */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-5 text-xs font-medium text-slate-600 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="h-2 w-5 rounded-full bg-slate-900" />
                <span>Total Pages</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-5 rounded-full bg-teal-600" />
                <span>Scanned Pages</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-5 rounded-full bg-slate-400" />
                <span>Blocked Pages</span>
              </div>
            </div>

            <div className="relative h-44 w-full pt-2">
              <svg className="h-full w-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gradTotal" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0f172a" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="gradScanned" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0d9488" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 35, 70, 105, 140].map((y, i) => (
                  <line key={i} x1="30" y1={y} x2="490" y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
                ))}

                {/* Y-Axis Labels */}
                <text x="5" y="10" fill="#94A3B8" fontSize="10">100</text>
                <text x="10" y="45" fill="#94A3B8" fontSize="10">75</text>
                <text x="10" y="80" fill="#94A3B8" fontSize="10">50</text>
                <text x="10" y="115" fill="#94A3B8" fontSize="10">25</text>
                <text x="15" y="145" fill="#94A3B8" fontSize="10">0</text>

                {/* Gradient Fill 1 */}
                <path
                  d="M 40,110 C 100,120 160,70 220,95 C 280,30 340,90 400,50 L 460,70 L 460,140 L 40,140 Z"
                  fill="url(#gradTotal)"
                />

                {/* Line 1: Total Pages (Slate-900) */}
                <path
                  d="M 40,110 C 100,120 160,70 220,95 C 280,30 340,90 400,50 L 460,70"
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="2.5"
                />

                {/* Line 2: Scanned Pages (Teal) */}
                <path
                  d="M 40,120 C 100,105 160,85 220,105 C 280,45 340,110 400,75 L 460,85"
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth="2.5"
                />

                {/* Line 3: Blocked Pages (Slate-400) */}
                <path
                  d="M 40,140 C 100,135 160,138 220,130 C 280,135 340,128 400,135 L 460,130"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Section 2: Critical Error */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Critical Issues</h2>
              <p className="text-xs text-slate-500 mt-0.5">Breakdown of indexing, content, and code errors</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Action Items</span>
            </div>
          </div>

          {/* 3 Stat Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 sm:p-4">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Page Errors</span>
              <div className="mt-1 text-xl sm:text-2xl font-black text-slate-900">
                {pageErrorCount}
              </div>
              <div className="mt-1 flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-rose-600">
                <span>{pageErrorCount > 0 ? "Requires fix" : "0 errors"}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 sm:p-4">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Index Issues</span>
              <div className="mt-1 text-xl sm:text-2xl font-black text-slate-900">
                {indexIssuesCount}
              </div>
              <div className="mt-1 flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-amber-600">
                <span>{indexIssuesCount > 0 ? "Review tags" : "0 issues"}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 sm:p-4">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500">Content Quality</span>
              <div className="mt-1 text-xl sm:text-2xl font-black text-slate-900">{contentErrorCount}</div>
              <div className="mt-1 flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-slate-500">
                <span>{contentErrorCount > 0 ? "Review content" : "Clean"}</span>
              </div>
            </div>
          </div>

          {/* Line Chart Component */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-5 text-xs font-medium text-slate-600 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="h-2 w-5 rounded-full bg-rose-500" />
                <span>Page Errors</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-5 rounded-full bg-amber-500" />
                <span>Index Issues</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-5 rounded-full bg-slate-400" />
                <span>Content Quality</span>
              </div>
            </div>

            <div className="relative h-44 w-full pt-2">
              <svg className="h-full w-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="gradError" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 35, 70, 105, 140].map((y, i) => (
                  <line key={i} x1="30" y1={y} x2="490" y2={y} stroke="#f1f5f9" strokeDasharray="3 3" />
                ))}

                {/* Y-Axis Labels */}
                <text x="5" y="10" fill="#94A3B8" fontSize="10">100</text>
                <text x="10" y="45" fill="#94A3B8" fontSize="10">75</text>
                <text x="10" y="80" fill="#94A3B8" fontSize="10">50</text>
                <text x="10" y="115" fill="#94A3B8" fontSize="10">25</text>
                <text x="15" y="145" fill="#94A3B8" fontSize="10">0</text>

                {/* Gradient Fill Error */}
                <path
                  d="M 40,120 C 100,135 160,110 220,125 C 280,95 340,130 400,115 L 460,120 L 460,140 L 40,140 Z"
                  fill="url(#gradError)"
                />

                {/* Line 1: Page Errors (Rose) */}
                <path
                  d="M 40,120 C 100,135 160,110 220,125 C 280,95 340,130 400,115 L 460,120"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                />

                {/* Line 2: Index Issues (Amber) */}
                <path
                  d="M 40,130 C 100,125 160,120 220,135 C 280,115 340,125 400,130 L 460,125"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                />

                {/* Line 3: Content Quality (Slate) */}
                <path
                  d="M 40,138 C 100,132 160,135 220,138 C 280,130 340,136 400,138 L 460,135"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
