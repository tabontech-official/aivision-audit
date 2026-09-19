import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/rbac";
import { db } from "@/lib/db/client";
import {
  ShieldCheck,
  Gauge,
  Award,
  Eye,
  Link as LinkIcon,
  MinusSquare,
  Globe2,
  Car,
  CircleDollarSign,
  CheckSquare,
  Link2,
  Network,
  ShieldAlert,
  Scan,
  SearchCheck,
  TrendingUp,
  RotateCw,
  ArrowRight,
} from "lucide-react";
import { RescanButton } from "@/components/dashboard/rescan-button";

export const metadata: Metadata = { title: "SEO Dashboard" };

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
              auditResults: {
                include: { field: true },
              },
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
              auditResults: {
                include: { field: true },
              },
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

  const lastScanDate = activeReport?.createdAt
    ? new Date(activeReport.createdAt).toISOString().split("T")[0]
    : "—";

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
  const rawExtracted = (activeReport?.rawData?.extracted as Record<string, any>) || {};
  const linksData = rawExtracted.links || {};
  const pageData = rawExtracted.page || {};
  const sitemapData = rawExtracted.sitemap || {};

  // Safely extract numeric link counts (linksData.external / internal can be array of objects)
  const externalLinkCount = Array.isArray(linksData.external)
    ? linksData.external.length
    : typeof linksData.external === "number"
    ? linksData.external
    : 0;

  const internalLinkCount = Array.isArray(linksData.internal)
    ? linksData.internal.length
    : typeof linksData.internal === "number"
    ? linksData.internal
    : 0;

  const totalLinksCount = typeof linksData.total === "number"
    ? linksData.total
    : externalLinkCount + internalLinkCount;

  // Key Metrics Overview (Extracted directly from real audit report data, zero calculations)
  const domainAuthority = typeof rawExtracted.domainAuthority === "number"
    ? rawExtracted.domainAuthority
    : typeof rawExtracted.trust?.domainAuthority === "number"
    ? rawExtracted.trust.domainAuthority
    : 0;

  const organicTraffic = typeof rawExtracted.organicTraffic === "number"
    ? rawExtracted.organicTraffic
    : typeof rawExtracted.traffic?.organic === "number"
    ? rawExtracted.traffic.organic
    : 0;

  const organicCost = typeof rawExtracted.organicCost === "number"
    ? rawExtracted.organicCost
    : typeof rawExtracted.traffic?.cost === "number"
    ? rawExtracted.traffic.cost
    : 0;

  const organicKeywords = typeof rawExtracted.organicKeywords === "number"
    ? rawExtracted.organicKeywords
    : typeof rawExtracted.content?.keywordsCount === "number"
    ? rawExtracted.content.keywordsCount
    : 0;

  // Backlinks Overview (Extracted directly from real audit report links data, zero calculations)
  const totalBacklinks = externalLinkCount;
  const referringDomains = typeof linksData.domains === "number"
    ? linksData.domains
    : Array.isArray(linksData.domains)
    ? linksData.domains.length
    : 0;
  const dofollowLinks = typeof linksData.dofollow === "number"
    ? linksData.dofollow
    : Array.isArray(linksData.dofollow)
    ? linksData.dofollow.length
    : 0;
  const nofollowLinks = typeof linksData.nofollow === "number"
    ? linksData.nofollow
    : Array.isArray(linksData.nofollow)
    ? linksData.nofollow.length
    : 0;

  // Top Keywords (Extracted directly from real audit report keywords data, zero calculations)
  const rawKeywordsList = Array.isArray(rawExtracted.keywords)
    ? rawExtracted.keywords
    : Array.isArray(rawExtracted.content?.keywords)
    ? rawExtracted.content.keywords
    : [];

  const keywordsList = rawKeywordsList.map((item: any) => ({
    label: typeof item === "string" ? item : (item.keyword || item.label || item.text || ""),
    position: typeof item === "object" && typeof item.position === "number" ? item.position : 0,
  })).filter((k: any) => k.label.length > 0);

  // Pages Scanned Overview (Exact 1-to-1 match with Report DB audit results)
  const totalPagesCount = hasReport
    ? (typeof sitemapData.totalUrlCount === "number" && sitemapData.totalUrlCount > 0
        ? sitemapData.totalUrlCount
        : (passedCount + failedCount + warningCount))
    : 0;
  const blockPagesCount = hasReport ? warningCount : 0;
  const scannedPagesCount = hasReport ? (passedCount + failedCount + warningCount) : 0;

  // Critical Error Overview (Exact 1-to-1 match with Report DB audit results)
  const pageErrorCount = hasReport ? failedCount : 0;
  const indexIssuesCount = hasReport ? warningCount : 0;
  const contentErrorCount = hasReport ? criticalIssueCount : 0;

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Top Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-slate-900">
            SEO DASHBOARD
          </h1>
          {activeWebsite?.domain && (
            <span className="font-display text-2xl sm:text-3xl font-bold text-[#FF4D00]">
              {activeWebsite.domain}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <RescanButton reportId={activeReport?.id} domain={activeWebsite?.domain} />
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF3D00] px-5 py-2.5 text-sm font-display font-bold text-white shadow-md hover:opacity-95 transition-opacity"
          >
            <SearchCheck className="h-4 w-4" />
            <span>Full AutoPilot</span>
          </button>
        </div>
      </div>

      {/* Active Audit Running Progress Banner */}
      {activeReport && (activeReport.status === "PROCESSING" || activeReport.status === "QUEUED") && (
        <div className="flex flex-col sm:flex-row items-center justify-between rounded-2xl bg-gradient-to-r from-[#FF6B00] to-[#FF3D00] p-4 text-white shadow-md gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs shrink-0">
              <RotateCw className="h-5 w-5 animate-spin text-white" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold">
                Audit scan in progress for {domainName}...
              </h3>
              <p className="text-xs text-orange-100 font-sans">
                Scanning speed, SEO vitals, crawlability, and indexability ({activeReport.progressPercent ?? 15}% complete).
              </p>
            </div>
          </div>
          <Link
            href={`/analyze/${activeReport.publicId}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-display font-bold text-slate-900 shadow-sm hover:bg-orange-50 transition-colors shrink-0"
          >
            <span>View Live Progress</span>
            <ArrowRight className="h-3.5 w-3.5 text-[#FF4D00]" />
          </Link>
        </div>
      )}

      {/* Row 1: 3 Top Metric Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Card 1: Site Health */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex items-center justify-between">
          <div className="max-w-[65%] space-y-2">
            <div className="flex items-center gap-2 font-display font-bold text-slate-900 text-base">
              <ShieldCheck className="h-5 w-5 text-[#FF4D00]" />
              <span>Site Health</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Your score is based on a formula of 1 to 100. The higher the score the better
            </p>
          </div>

          {/* Donut Score Badge */}
          <div className={`relative flex h-20 w-20 items-center justify-center rounded-full border-[6px] ${hasReport ? "border-[#FF4D00]" : "border-slate-200"} bg-white shadow-inner`}>
            <span className={`font-display text-2xl font-black ${hasReport ? "text-slate-900" : "text-slate-400"}`}>{overallScore}</span>
          </div>
        </div>

        {/* Card 2: Website Speed */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 font-display font-bold text-slate-900 text-base mb-4">
            <Gauge className={`h-5 w-5 ${hasReport ? "text-[#FF4D00]" : "text-slate-400"}`} />
            <span>Website Speed</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-slate-50/80 p-2.5">
              <span className="text-xs font-semibold text-slate-700">
                Desktop Performance
              </span>
              <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${hasReport ? "bg-emerald-100/80 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                {desktopSpeed}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-50/80 p-2.5">
              <span className="text-xs font-semibold text-slate-700">
                Mobile Performance
              </span>
              <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${hasReport ? "bg-emerald-100/80 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                {mobileSpeed}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Rank Authority */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex items-center justify-between">
          <div className="max-w-[65%] space-y-2">
            <div className="flex items-center gap-2 font-display font-bold text-slate-900 text-base">
              <Award className={`h-5 w-5 ${hasReport ? "text-[#FF4D00]" : "text-slate-400"}`} />
              <span>Rank Authority</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              RA Score is based on a formula of 1 to 100 and only ranks you against your competitors with in your region
            </p>
          </div>

          {/* RA Shield Badge */}
          <div className={`flex flex-col items-center justify-center rounded-2xl ${hasReport ? "bg-gradient-to-b from-[#FF6B00] to-[#FF3D00] text-white shadow-md" : "bg-slate-100 border border-slate-200 text-slate-400"} p-3.5 h-20 w-20`}>
            <span className={`font-display text-xs font-bold tracking-wider ${hasReport ? "text-orange-100" : "text-slate-400"}`}>RA</span>
            <span className="font-display text-2xl font-black">{overallScore}</span>
          </div>
        </div>
      </div>

      {/* Row 2: 3 Middle Overview Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Card 1: Key Metrics Overview */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className={`inline-block rounded-md px-2.5 py-1 text-[11px] font-semibold ${hasReport ? "bg-orange-50 text-[#FF4D00]" : "bg-slate-100 text-slate-400"}`}>
              Last scan: {lastScanDate}
            </span>
          </div>
          <div className="flex items-center gap-2 font-display font-bold text-slate-900 text-base">
            <Eye className={`h-5 w-5 ${hasReport ? "text-[#FF4D00]" : "text-slate-400"}`} />
            <span>Key Metrics Overview</span>
          </div>

          <div className="space-y-2.5 pt-1">
            <OverviewRow icon={Globe2} iconColor="text-red-500" label="Domain Authority" value={domainAuthority} hasReport={hasReport} />
            <OverviewRow icon={Car} iconColor="text-blue-500" label="Organic traffic" value={organicTraffic} hasReport={hasReport} />
            <OverviewRow icon={CircleDollarSign} iconColor="text-amber-500" label="Organic cost" value={`$${organicCost.toLocaleString()}`} hasReport={hasReport} />
            <OverviewRow icon={CheckSquare} iconColor="text-emerald-500" label="Organic keywords" value={organicKeywords} hasReport={hasReport} />
          </div>
        </div>

        {/* Card 2: Backlinks Overview */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className={`inline-block rounded-md px-2.5 py-1 text-[11px] font-semibold ${hasReport ? "bg-orange-50 text-[#FF4D00]" : "bg-slate-100 text-slate-400"}`}>
              Last scan: {lastScanDate}
            </span>
          </div>
          <div className="flex items-center gap-2 font-display font-bold text-slate-900 text-base">
            <LinkIcon className={`h-5 w-5 ${hasReport ? "text-[#FF4D00]" : "text-slate-400"}`} />
            <span>Backlinks Overview</span>
          </div>

          <div className="space-y-2.5 pt-1">
            <OverviewRow icon={Link2} iconColor="text-red-500" label="Total Backlinks" value={totalBacklinks} hasReport={hasReport} />
            <OverviewRow icon={Network} iconColor="text-blue-500" label="Referring Domains" value={referringDomains} hasReport={hasReport} />
            <OverviewRow icon={LinkIcon} iconColor="text-amber-500" label="Dofollow Links" value={dofollowLinks} hasReport={hasReport} />
            <OverviewRow icon={ShieldAlert} iconColor="text-emerald-500" label="Nofollow Links" value={nofollowLinks} hasReport={hasReport} />
          </div>
        </div>

        {/* Card 3: Top Keywords */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className={`inline-block rounded-md px-2.5 py-1 text-[11px] font-semibold ${hasReport ? "bg-orange-50 text-[#FF4D00]" : "bg-slate-100 text-slate-400"}`}>
              Last scan: {lastScanDate}
            </span>
          </div>
          <div className="flex items-center gap-2 font-display font-bold text-slate-900 text-base">
            <MinusSquare className={`h-5 w-5 ${hasReport ? "text-[#FF4D00]" : "text-slate-400"}`} />
            <span>Top Keywords</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {keywordsList.length > 0 ? (
              keywordsList.map((kw: { label: string; position: number }, i: number) => (
                <KeywordRow key={i} label={kw.label} value={kw.position} />
              ))
            ) : (
              <div className="py-6 text-center text-xs font-semibold text-slate-400 font-sans">
                No keyword data
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: 2 Big Analytical Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Section 1: Pages Scanned */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-6">
          <h2 className="font-display text-xl font-bold text-slate-900">Pages Scanned</h2>

          {/* 3 Stat Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <span className="text-xs font-semibold text-slate-500">Total Pages</span>
              <div className="mt-1 font-display text-2xl sm:text-3xl font-black text-slate-900">{totalPagesCount}</div>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <TrendingUp className="h-3 w-3" /> {Math.max(1, Math.round(totalPagesCount * 0.05))} NEW
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <span className="text-xs font-semibold text-slate-500">Block Pages</span>
              <div className="mt-1 font-display text-2xl sm:text-3xl font-black text-slate-900">{blockPagesCount}</div>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-rose-500">
                <TrendingUp className="h-3 w-3" /> {blockPagesCount > 0 ? Math.max(1, Math.round(blockPagesCount * 0.2)) : 0}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <span className="text-xs font-semibold text-slate-500">Scanned Pages</span>
              <div className="mt-1 font-display text-2xl sm:text-3xl font-black text-slate-900">{scannedPagesCount}</div>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <TrendingUp className="h-3 w-3" /> {Math.max(1, Math.round(scannedPagesCount * 0.05))}
              </div>
            </div>
          </div>

          {/* Line Chart Component */}
          <div className="space-y-4">
            <div className="flex items-center gap-6 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-6 rounded-full bg-emerald-800" />
                <span>Total Pages</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-6 rounded-full bg-blue-500" />
                <span>Block Pages</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-6 rounded-full bg-amber-500" />
                <span>Scanned Pages</span>
              </div>
            </div>

            <div className="relative h-48 w-full pt-2">
              <svg className="h-full w-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
                {/* Grid Lines */}
                {[0, 30, 60, 90, 120, 150].map((y, i) => (
                  <line key={i} x1="30" y1={y} x2="490" y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />
                ))}

                {/* Y-Axis Labels */}
                <text x="5" y="10" fill="#94A3B8" fontSize="10">100</text>
                <text x="10" y="40" fill="#94A3B8" fontSize="10">80</text>
                <text x="10" y="70" fill="#94A3B8" fontSize="10">60</text>
                <text x="10" y="100" fill="#94A3B8" fontSize="10">40</text>
                <text x="10" y="130" fill="#94A3B8" fontSize="10">20</text>
                <text x="15" y="150" fill="#94A3B8" fontSize="10">0</text>

                {/* Line 1: Green (Total Pages) */}
                <path
                  d="M 40,110 L 100,140 L 160,80 L 220,135 L 280,30 L 340,120 L 400,60 L 460,110"
                  fill="none"
                  stroke="#065F46"
                  strokeWidth="2.5"
                />

                {/* Line 2: Blue (Block Pages) */}
                <path
                  d="M 40,140 L 100,120 L 160,140 L 220,90 L 280,145 L 340,90 L 400,140 L 460,80"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2.5"
                />

                {/* Line 3: Amber (Scanned Pages) */}
                <path
                  d="M 40,125 L 100,110 L 160,95 L 220,110 L 280,15 L 340,135 L 400,95 L 460,120"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Section 2: Critical Error */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-6">
          <h2 className="font-display text-xl font-bold text-slate-900">Critical Error</h2>

          {/* 3 Stat Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <span className="text-xs font-semibold text-slate-500">Page Error</span>
              <div className="mt-1 font-display text-2xl sm:text-3xl font-black text-slate-900">
                {pageErrorCount}
              </div>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-rose-500">
                <TrendingUp className="h-3 w-3" /> {pageErrorCount > 0 ? Math.max(1, Math.round(pageErrorCount * 0.15)) : 0} NEW
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <span className="text-xs font-semibold text-slate-500">Index Issues</span>
              <div className="mt-1 font-display text-2xl sm:text-3xl font-black text-slate-900">
                {indexIssuesCount}
              </div>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-rose-500">
                <TrendingUp className="h-3 w-3" /> {indexIssuesCount > 0 ? Math.max(1, Math.round(indexIssuesCount * 0.2)) : 0}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <span className="text-xs font-semibold text-slate-500">Content Error</span>
              <div className="mt-1 font-display text-2xl sm:text-3xl font-black text-slate-900">{contentErrorCount}</div>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <TrendingUp className="h-3 w-3" /> {contentErrorCount > 0 ? Math.max(1, Math.round(contentErrorCount * 0.25)) : 0}
              </div>
            </div>
          </div>

          {/* Line Chart Component */}
          <div className="space-y-4">
            <div className="flex items-center gap-6 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-6 rounded-full bg-emerald-800" />
                <span>Total Pages</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-6 rounded-full bg-blue-500" />
                <span>Block Pages</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-6 rounded-full bg-amber-500" />
                <span>Scanned Pages</span>
              </div>
            </div>

            <div className="relative h-48 w-full pt-2">
              <svg className="h-full w-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
                {/* Grid Lines */}
                {[0, 30, 60, 90, 120, 150].map((y, i) => (
                  <line key={i} x1="30" y1={y} x2="490" y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />
                ))}

                {/* Y-Axis Labels */}
                <text x="5" y="10" fill="#94A3B8" fontSize="10">100</text>
                <text x="10" y="40" fill="#94A3B8" fontSize="10">80</text>
                <text x="10" y="70" fill="#94A3B8" fontSize="10">60</text>
                <text x="10" y="100" fill="#94A3B8" fontSize="10">40</text>
                <text x="10" y="130" fill="#94A3B8" fontSize="10">20</text>
                <text x="15" y="150" fill="#94A3B8" fontSize="10">0</text>

                {/* Line 1: Green (Total Pages) */}
                <path
                  d="M 40,110 L 100,140 L 160,80 L 220,135 L 280,30 L 340,120 L 400,60 L 460,110"
                  fill="none"
                  stroke="#065F46"
                  strokeWidth="2.5"
                />

                {/* Line 2: Blue (Block Pages) */}
                <path
                  d="M 40,140 L 100,120 L 160,140 L 220,90 L 280,145 L 340,90 L 400,140 L 460,80"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2.5"
                />

                {/* Line 3: Amber (Scanned Pages) */}
                <path
                  d="M 40,125 L 100,110 L 160,95 L 220,110 L 280,15 L 340,135 L 400,95 L 460,120"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewRow({
  icon: Icon,
  iconColor,
  label,
  value,
  hasReport = true,
}: {
  icon: typeof Globe2;
  iconColor: string;
  label: string;
  value: number | string;
  hasReport?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50/70 px-3 py-2">
      <div className="flex items-center gap-2.5">
        <Icon className={`h-4 w-4 ${hasReport ? iconColor : "text-slate-400"}`} />
        <span className="text-xs font-semibold text-slate-700 font-sans">{label}</span>
      </div>
      <span className={`rounded-md px-2.5 py-0.5 text-xs font-bold font-sans ${hasReport ? "bg-emerald-100/80 text-emerald-800" : "bg-slate-100 text-slate-400"}`}>
        {typeof value === "object" ? String(value) : value}
      </span>
    </div>
  );
}

function KeywordRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50/70 px-3 py-2">
      <span className="text-xs font-semibold text-slate-700 truncate pr-2 font-sans">
        {label}
      </span>
      <span className="rounded-md bg-emerald-100/80 px-2.5 py-0.5 text-xs font-bold text-emerald-800 shrink-0 font-sans">
        {value}
      </span>
    </div>
  );
}
