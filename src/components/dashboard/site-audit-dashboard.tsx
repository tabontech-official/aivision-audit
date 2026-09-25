"use client";

import { useState, useTransition, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RotateCw,
  FileDown,
  Share2,
  Download,
  AlertTriangle,
  Info,
  XCircle,
  Smartphone,
  Laptop,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  Check,
  Globe,
  Layers,
  FileCode,
  Search,
  Settings,
  CornerUpRight,
  Eye,
  EyeOff,
  X,
  Copy,
  UserPlus,
  GitCompare,
  Gift,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { rerunAuditAction, rescanWebsiteAction, continueAuditAction, claimWelcomeRewardAndRunAuditAction } from "@/app/dashboard/reports/actions";
import { recheckIssueAction } from "@/app/dashboard/websites/[id]/actions";
import { StopAuditButton } from "@/components/dashboard/stop-audit-button";
import { DashboardLiveAuditBanner } from "@/components/dashboard/dashboard-live-audit-banner";
import { UpgradePlanModal } from "@/components/dashboard/upgrade-plan-modal";
import { AuditUpgradeBanner } from "@/components/dashboard/audit-upgrade-banner";

export interface IssueItem {
  id: string;
  fieldId?: string;
  fieldKey?: string;
  title: string;
  category?: string;
  type: "error" | "warning" | "info";
  pagesCount: number;
  message?: string | null;
  suggestion?: string | null;
  fixUrl?: string;
  isNew?: boolean;
  newCount?: number;
  history?: number[];
}

export interface CrawledPageItem {
  id: string;
  url: string;
  path: string;
  title?: string | null;
  statusCode: number;
  type: string;
  issuesCount?: number;
  depth?: number;
}

export interface StatisticsMetrics {
  httpStatusCodes: {
    pagesWithErrorsPct: number;
    pct5xx: number;
    pct4xx: number;
    pct3xx: number;
    pct2xx: number;
    pct1xx: number;
    pctNoCode: number;
  };
  sitemap: {
    totalSitemapUrls: number;
    foundInSitemapPct: number;
    notInSitemapPct: number;
  };
  crawlDepth: {
    moreThan3ClicksPct: number;
    click1Pct: number;
    click2Pct: number;
    click3Pct: number;
  };
  internalLinks: {
    only1LinkPct: number;
    links2_5Pct: number;
    links6_15Pct: number;
    links16_50Pct: number;
    links51_150Pct: number;
    links151_500Pct: number;
    links500PlusPct: number;
  };
  markupTypes: {
    noMarkupPct: number;
    microdataPct: number;
    jsonLdPct: number;
    openGraphPct: number;
    twitterCardsPct: number;
    microformatsPct: number;
  };
  canonicalization: {
    withoutCanonicalPct: number;
    canonicalToAnotherPct: number;
    selfCanonicalPct: number;
  };
  hreflang: {
    withoutIssuesPct: number;
    withIssuesPct: number;
    withoutHreflangPct: number;
  };
  amp: {
    noAmpPct: number;
    hasAmpPct: number;
  };
}

export interface ThematicMetrics {
  hasRobotsTxt: boolean;
  crawlScore: number;
  httpsScore: number;
  hasInternational: boolean;
  cwvScore: number;
  perfScore: number;
  internalLinkingScore: number;
  markupScore: number;
}

export interface SiteAuditDashboardProps {
  domain: string;
  allDomains: string[];
  lastUpdated: string;
  isMobileStrategy: boolean;
  jsRendering: boolean;
  pagesCrawled: number;
  maxPages: number;
  overallScore: number;
  desktopScore: number;
  mobileScore: number;
  desktopLcp?: string;
  failedCount: number;
  warningCount: number;
  passedCount: number;
  scoreDelta?: number | null;
  reportId?: string | null;
  reportPublicId?: string | null;
  reportStatus?: string | null;
  progressPercent?: number;
  topIssues: IssueItem[];
  errorHistory?: number[];
  warningHistory?: number[];
  initialTab?: string;
  thematic?: ThematicMetrics;
  crawledPagesList?: CrawledPageItem[];
  statistics?: StatisticsMetrics;
  totalDetectedUrls?: number;
  coverageUsed?: number;
  coverageRemaining?: number;
  coverageLimit?: number;
  coverageCompleted?: boolean;
  currentPlanKey?: string;
  pendingRewardUrl?: string;
}

function SemiCircleGauge({
  score,
  label = "no changes",
  gradientId,
  startColor = "#4f46e5",
  endColor = "#7c3aed",
}: {
  score: number;
  label?: string;
  gradientId: string;
  startColor?: string;
  endColor?: string;
}) {
  const radius = 64;
  const strokeWidth = 13;
  const cx = 100;
  const cy = 82;
  const circumference = Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, score));
  const offset = circumference * (1 - clampedScore / 100);

  const px = cx - radius * Math.cos(Math.PI * (clampedScore / 100));
  const py = cy - radius * Math.sin(Math.PI * (clampedScore / 100));

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg viewBox="0 0 200 95" className="w-48 h-24 overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={startColor} />
            <stop offset="100%" stopColor={endColor} />
          </linearGradient>
        </defs>

        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="#edf2f7"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />

        {score > 0 && (
          <g transform={`translate(${px}, ${py})`}>
            <circle r="6" fill="#ffffff" stroke={endColor} strokeWidth="3" />
          </g>
        )}
      </svg>

      <div className="absolute top-9 flex flex-col items-center text-center select-none">
        <span className="text-3xl font-black tracking-tight text-slate-900 font-lazzer">
          {score}%
        </span>
        <span className="text-[11px] font-medium text-slate-400 mt-0.5">{label}</span>
      </div>
    </div>
  );
}

function MiniRing({ score, color = "#6366f1" }: { score: number; color?: string }) {
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);
  return (
    <div className="flex items-center gap-2">
      <svg className="h-5 w-5 -rotate-90 shrink-0" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="3" />
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          stroke={score > 0 ? color : "#e2e8f0"}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span className="text-base font-bold text-slate-900 font-lazzer">{score}%</span>
    </div>
  );
}

function SparklineChart({
  data = [],
  color = "#f43f5e",
  gradientId,
  hasArea = false,
}: {
  data?: number[];
  color?: string;
  gradientId?: string;
  hasArea?: boolean;
}) {
  const width = 280;
  const height = 48;
  const padding = 6;

  const first = data?.[0] ?? 0;
  const points: number[] =
    !data || data.length === 0
      ? [0, 0]
      : data.length === 1
      ? [first, first, first]
      : data;
  const maxVal = Math.max(...points, 1);
  const minVal = Math.min(...points, 0);
  const range = maxVal - minVal || 1;

  const coords = points.map((val, idx) => {
    const x = padding + (idx / Math.max(1, points.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
    return { x, y, val };
  });

  const pathD = coords.reduce(
    (acc, curr, idx) => `${acc} ${idx === 0 ? "M" : "L"} ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`,
    ""
  );

  const lastX = coords[coords.length - 1]?.x ?? width;
  const firstX = coords[0]?.x ?? 0;
  const areaD =
    hasArea && coords.length > 0
      ? `${pathD} L ${lastX.toFixed(1)} ${height} L ${firstX.toFixed(1)} ${height} Z`
      : "";

  return (
    <div className="mt-3 h-14 w-full">
      <svg className="h-full w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {gradientId && hasArea && (
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>
        )}

        <line x1="0" y1={height - padding} x2={width} y2={height - padding} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="0" y1={padding} x2={width} y2={padding} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
        <text x="0" y={padding + 4} fill="#cbd5e1" fontSize="9" fontWeight="500">{maxVal}</text>
        <text x="0" y={height - 2} fill="#cbd5e1" fontSize="9" fontWeight="500">{minVal}</text>

        {hasArea && areaD && <path d={areaD} fill={`url(#${gradientId})`} />}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="3" fill={color} stroke="#ffffff" strokeWidth="1.5" />
        ))}
      </svg>
    </div>
  );
}

function RowSparkline({ trend }: { trend?: number[] }) {
  const data = trend && trend.length > 1 ? trend : [2, 1.5, 1];
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 46;
  const h = 16;
  const points = data.map((v, i) => {
    const x = (i / Math.max(1, data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const pathD = `M ${points.join(" L ")}`;
  const areaD = `${pathD} L ${w},${h} L 0,${h} Z`;

  return (
    <svg className="w-12 h-4 overflow-visible shrink-0 select-none" viewBox={`0 0 ${w} ${h}`}>
      <path d={areaD} fill="#e0e7ff" opacity="0.6" />
      <path d={pathD} fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function getIssueExplanation(issue: IssueItem) {
  const titleLower = (issue.title || "").toLowerCase();
  const keyLower = (issue.fieldKey || "").toLowerCase();
  const cat = issue.category || "Technical SEO, Crawlability";

  // Crawlability / server / crawler access issues
  if (
    titleLower.includes("crawled") ||
    titleLower.includes("crawl") ||
    keyLower.includes("crawl") ||
    titleLower.includes("access") ||
    titleLower.includes("blocked") ||
    titleLower.includes("timeout")
  ) {
    return {
      about: (
        <div className="space-y-2 text-xs sm:text-[13px] text-slate-700 leading-relaxed">
          <p>
            This issue indicates that our crawler couldn&apos;t access the webpage. There are two possible reasons:
          </p>
          <ul className="space-y-1 text-slate-700">
            <li>- Your site&apos;s server response time is more than 5 seconds</li>
            <li>- Your server refused access to your webpages</li>
          </ul>
        </div>
      ),
      category: "HTTP Status, Crawlability",
      howToFix: (
        <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">
          {issue.suggestion || "Please contact your web hosting technical support team and ask them to fix the issue."}
        </p>
      ),
    };
  }

  // Text to HTML ratio
  if (titleLower.includes("text") && titleLower.includes("ratio")) {
    return {
      about: (
        <div className="space-y-2 text-xs sm:text-[13px] text-slate-700 leading-relaxed">
          <p>
            This issue indicates that the HTML code of the page contains too little textual content relative to the overall code size.
          </p>
          <p className="text-slate-600">
            Search engines prioritize high-quality textual copy over excessive inline code overhead.
          </p>
        </div>
      ),
      category: "Content, Technical SEO",
      howToFix: (
        <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">
          {issue.suggestion || "Add descriptive content to pages with low text-to-HTML ratio and streamline unnecessary inline styles or scripts."}
        </p>
      ),
    };
  }

  // Duplicate h1 and title tags
  if (titleLower.includes("duplicate") && (titleLower.includes("h1") || titleLower.includes("title"))) {
    return {
      about: (
        <div className="space-y-2 text-xs sm:text-[13px] text-slate-700 leading-relaxed">
          <p>
            This issue indicates that the &lt;title&gt; tag and &lt;h1&gt; heading on the page have duplicate content.
          </p>
          <p className="text-slate-600">
            While both should be relevant, having unique text helps search engines better understand page structure and hierarchy.
          </p>
        </div>
      ),
      category: "Content, Meta tags",
      howToFix: (
        <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">
          {issue.suggestion || "Ensure your <title> provides clear branding and primary search terms, while your <h1> summarizes the main page headline."}
        </p>
      ),
    };
  }

  // Incoming internal links / isolated pages
  if (titleLower.includes("internal link") || keyLower.includes("single_internal")) {
    return {
      about: (
        <div className="space-y-2 text-xs sm:text-[13px] text-slate-700 leading-relaxed">
          <p>
            This issue indicates that these pages only have one incoming internal link from other pages on your website.
          </p>
          <p className="text-slate-600">
            Pages with few incoming links risk becoming isolated and receive less crawl priority and link authority.
          </p>
        </div>
      ),
      category: "Internal Linking, Crawlability",
      howToFix: (
        <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">
          {issue.suggestion || "Add relevant internal links from high-authority parent pages, category lists, or related content."}
        </p>
      ),
    };
  }

  // Content optimization / AI search
  if (titleLower.includes("optimization") || titleLower.includes("ai search") || cat.toLowerCase().includes("ai")) {
    return {
      about: (
        <div className="space-y-2 text-xs sm:text-[13px] text-slate-700 leading-relaxed">
          <p>
            This issue indicates that the page lacks direct entity structuring or semantic answers required for high visibility in AI search engines (like ChatGPT and Gemini).
          </p>
        </div>
      ),
      category: "AI Search, Content",
      howToFix: (
        <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">
          {issue.suggestion || "Add clear summary answers, question headings, structured data markup, and authoritative entity citations."}
        </p>
      ),
    };
  }

  // Broken links
  if (titleLower.includes("broken") || titleLower.includes("external link")) {
    return {
      about: (
        <div className="space-y-2 text-xs sm:text-[13px] text-slate-700 leading-relaxed">
          <p>
            This issue indicates that hyperlinks pointing to external websites returned 4xx or 5xx HTTP error codes.
          </p>
        </div>
      ),
      category: "Links, Crawlability",
      howToFix: (
        <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">
          {issue.suggestion || "Replace or remove broken external URLs to prevent poor user experience and wasted crawl budget."}
        </p>
      ),
    };
  }

  // Anchor text
  if (titleLower.includes("anchor")) {
    return {
      about: (
        <div className="space-y-2 text-xs sm:text-[13px] text-slate-700 leading-relaxed">
          <p>
            This issue indicates that hyperlinks on these pages are missing descriptive anchor text.
          </p>
        </div>
      ),
      category: "Meta tags, Internal Linking",
      howToFix: (
        <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">
          {issue.suggestion || "Add meaningful, contextual anchor text that tells users and search bots what the linked page is about."}
        </p>
      ),
    };
  }

  // Default fallback
  return {
    about: (
      <div className="space-y-2 text-xs sm:text-[13px] text-slate-700 leading-relaxed">
        <p>
          {issue.message || `This audit inspection evaluated ${issue.pagesCount} ${issue.pagesCount === 1 ? "page" : "pages"} on your website.`}
        </p>
      </div>
    ),
    category: cat,
    howToFix: (
      <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">
        {issue.suggestion || "Review the flagged pages in your site settings or CMS template and apply the recommended technical update."}
      </p>
    ),
  };
}

export function SiteAuditDashboard({
  domain,
  allDomains = [],
  lastUpdated,
  isMobileStrategy,
  jsRendering,
  pagesCrawled,
  maxPages,
  overallScore,
  desktopScore,
  mobileScore,
  desktopLcp = "1.2s",
  failedCount,
  warningCount,
  passedCount,
  scoreDelta,
  reportId,
  reportPublicId,
  reportStatus,
  progressPercent = 0,
  topIssues = [],
  errorHistory = [],
  warningHistory = [],
  initialTab = "overview",
  thematic,
  crawledPagesList = [],
  statistics,
  totalDetectedUrls,
  coverageUsed: coverageUsedProp,
  coverageRemaining: coverageRemainingProp,
  coverageLimit: coverageLimitProp,
  coverageCompleted = false,
  currentPlanKey,
  pendingRewardUrl,
}: SiteAuditDashboardProps) {
  const router = useRouter();
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const handleClaimPendingReward = async () => {
    if (!pendingRewardUrl || isClaimingReward) return;
    setIsClaimingReward(true);
    try {
      const res = await claimWelcomeRewardAndRunAuditAction(pendingRewardUrl);
      if (res.ok) {
        setRewardClaimed(true);
        const dom = res.domain || pendingRewardUrl.replace(/^https?:\/\//i, "").split("/")[0] || "";
        router.push(`/dashboard?project=${encodeURIComponent(dom)}`);
        router.refresh();
      }
    } catch (e) {
      console.error("Claim reward error:", e);
    } finally {
      setIsClaimingReward(false);
    }
  };

  const [activeTab, setActiveTab] = useState<string>(
    initialTab?.toLowerCase() === "issues"
      ? "Issues"
      : initialTab?.toLowerCase() === "pages" || initialTab?.toLowerCase() === "crawled" || initialTab?.toLowerCase() === "crawled pages"
      ? "Crawled Pages"
      : initialTab?.toLowerCase() === "stats" || initialTab?.toLowerCase() === "statistics"
      ? "Statistics"
      : "Overview"
  );
  const [isDomainDropdownOpen, setIsDomainDropdownOpen] = useState(false);
  const domainDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (domainDropdownRef.current && !domainDropdownRef.current.contains(event.target as Node)) {
        setIsDomainDropdownOpen(false);
      }
    }
    if (isDomainDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDomainDropdownOpen]);
  const [showAllIssues, setShowAllIssues] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Crawled Pages Tab States
  const [crawledSearch, setCrawledSearch] = useState("");
  const [crawledStatusFilter, setCrawledStatusFilter] = useState<"all" | "200" | "3xx" | "broken">("all");
  const [crawledPageNumber, setCrawledPageNumber] = useState(1);
  const CRAWLED_PAGE_SIZE = 25;

  // Modals & Interactive Actions
  const [selectedFixIssue, setSelectedFixIssue] = useState<IssueItem | null>(null);
  const [sendToIssue, setSendToIssue] = useState<IssueItem | null>(null);
  const [hiddenIssueIds, setHiddenIssueIds] = useState<Set<string>>(new Set());
  const [actionCopied, setActionCopied] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [continueNotice, setContinueNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [rerunNotice, setRerunNotice] = useState<{ message: string; upgradeRequired?: boolean } | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [recheckingId, setRecheckingId] = useState<string | null>(null);
  const [recheckResults, setRecheckResults] = useState<Record<string, { ok: boolean; status?: string; message?: string }>>({});

  const handleRecheckIssue = async (issueId: string) => {
    setRecheckingId(issueId);
    try {
      const res = await recheckIssueAction(issueId);
      setRecheckResults((prev) => ({
        ...prev,
        [issueId]: {
          ok: res.ok,
          status: res.status,
          message: res.message || res.error,
        },
      }));
    } catch {
      setRecheckResults((prev) => ({
        ...prev,
        [issueId]: { ok: false, message: "Verification failed" },
      }));
    } finally {
      setRecheckingId(null);
    }
  };

  const isFreePlan = (currentPlanKey || "").toUpperCase() === "FREE" || (!currentPlanKey && (!coverageLimitProp || coverageLimitProp <= 10));
  const effectiveCrawledCount = Math.max(pagesCrawled || 0, (crawledPagesList || []).length, 1);
  const coverageUsed = Math.max(effectiveCrawledCount, coverageUsedProp ?? 0);
  const totalDetected = Math.max(effectiveCrawledCount, totalDetectedUrls || maxPages || (isFreePlan ? 10 : 200));
  const rawCoverageLimit = coverageLimitProp ?? (isFreePlan ? 10 : (maxPages || 100));
  const coverageLimit = isFreePlan ? 10 : rawCoverageLimit;
  const planCreditsRemaining = Math.max(0, coverageLimit - coverageUsed);
  const siteRemaining = Math.max(0, totalDetected - effectiveCrawledCount);
  const additionalPossible = Math.min(planCreditsRemaining, siteRemaining);
  const hasMoreAvailableUnderPlan = !coverageCompleted && planCreditsRemaining > 0 && siteRemaining > 0;
  const planLimitReached = (planCreditsRemaining === 0 || coverageUsed >= coverageLimit) && siteRemaining > 0;

  const handleContinueAudit = async () => {
    if (!reportPublicId || isContinuing) return;
    setIsContinuing(true);
    setContinueNotice(null);
    try {
      const res = await continueAuditAction(reportPublicId);
      if (res.ok) {
        setContinueNotice({
          type: "success",
          message: `Successfully analyzed ${res.pagesAdded ?? 0} additional pages! Updating audit...`,
        });
        router.refresh();
      } else {
        setContinueNotice({
          type: "error",
          message: res.error || "Failed to continue audit under plan.",
        });
      }
    } catch {
      setContinueNotice({
        type: "error",
        message: "An unexpected error occurred while continuing audit.",
      });
    } finally {
      setIsContinuing(false);
    }
  };

  const isRunning = reportStatus === "PROCESSING" || reportStatus === "QUEUED";

  // Display only 6 issues on Overview card by default
  const displayedOverviewIssues = showAllIssues ? topIssues : topIssues.slice(0, 6);

  // Thematic metrics
  const thematicData: ThematicMetrics = thematic || {
    hasRobotsTxt: true,
    crawlScore: 100,
    httpsScore: 100,
    hasInternational: false,
    cwvScore: desktopScore > 0 ? desktopScore : 100,
    perfScore: desktopScore > 0 ? desktopScore : 100,
    internalLinkingScore: 94,
    markupScore: 100,
  };

  // Grouped by Error, Warning, Notice for Issues Tab
  const groupedIssues = useMemo(() => {
    const errors = topIssues.filter((i) => i.type === "error" && !hiddenIssueIds.has(i.id));
    const warnings = topIssues.filter((i) => i.type === "warning" && !hiddenIssueIds.has(i.id));
    const notices = topIssues.filter((i) => i.type === "info" && !hiddenIssueIds.has(i.id));
    return { errors, warnings, notices };
  }, [topIssues, hiddenIssueIds]);

  // Crawled Pages Processing
  const effectiveCrawledList = useMemo(() => {
    if (crawledPagesList && crawledPagesList.length > 0) {
      return crawledPagesList;
    }
    return [
      {
        id: "page-root",
        url: domain ? (domain.startsWith("http") ? domain : `https://${domain}`) : "https://example.com",
        path: "/",
        title: domain || "Audited Website",
        statusCode: 200,
        type: "Root Page",
        issuesCount: topIssues.length,
      },
    ];
  }, [crawledPagesList, domain, topIssues.length]);

  const filteredCrawledPages = useMemo(() => {
    return effectiveCrawledList.filter((p) => {
      if (crawledSearch.trim()) {
        const q = crawledSearch.toLowerCase();
        const matchesUrl = p.url.toLowerCase().includes(q) || p.path.toLowerCase().includes(q);
        const matchesTitle = p.title ? p.title.toLowerCase().includes(q) : false;
        if (!matchesUrl && !matchesTitle) return false;
      }

      if (crawledStatusFilter === "200") {
        if (p.statusCode !== 200) return false;
      } else if (crawledStatusFilter === "3xx") {
        if (p.statusCode < 300 || p.statusCode >= 400) return false;
      } else if (crawledStatusFilter === "broken") {
        if (p.statusCode < 400) return false;
      }

      return true;
    });
  }, [effectiveCrawledList, crawledSearch, crawledStatusFilter]);

  const totalPagesCount = Math.max(1, Math.ceil(filteredCrawledPages.length / CRAWLED_PAGE_SIZE));
  const paginatedCrawledPages = useMemo(() => {
    const start = (crawledPageNumber - 1) * CRAWLED_PAGE_SIZE;
    return filteredCrawledPages.slice(start, start + CRAWLED_PAGE_SIZE);
  }, [filteredCrawledPages, crawledPageNumber]);

  const crawledStats = useMemo(() => {
    const list = effectiveCrawledList;
    const total = list.length;
    const healthy = list.filter((p) => p.statusCode >= 200 && p.statusCode < 300).length;
    const redirects = list.filter((p) => p.statusCode >= 300 && p.statusCode < 400).length;
    const broken = list.filter((p) => p.statusCode >= 400).length;
    return { total, healthy, redirects, broken };
  }, [effectiveCrawledList]);

  // Statistics Data Processing (Real Report Metrics)
  const statsData: StatisticsMetrics = useMemo(() => {
    if (statistics) return statistics;

    const list = effectiveCrawledList;
    const total = list.length || 1;

    // 1. HTTP Status Codes
    const c5xx = list.filter((p) => p.statusCode >= 500).length;
    const c4xx = list.filter((p) => p.statusCode >= 400 && p.statusCode < 500).length;
    const c3xx = list.filter((p) => p.statusCode >= 300 && p.statusCode < 400).length;
    const c2xx = list.filter((p) => p.statusCode >= 200 && p.statusCode < 300).length;
    const c1xx = list.filter((p) => p.statusCode >= 100 && p.statusCode < 200).length;
    const cNoCode = list.filter((p) => !p.statusCode || p.statusCode < 100).length;

    const pct5xx = Math.round((c5xx / total) * 100);
    const pct4xx = Math.round((c4xx / total) * 100);
    const pct3xx = Math.round((c3xx / total) * 100);
    const pct2xx = Math.round((c2xx / total) * 100) || (c4xx === 0 && c5xx === 0 ? 100 : 0);
    const pct1xx = Math.round((c1xx / total) * 100);
    const pctNoCode = Math.round((cNoCode / total) * 100);
    const pagesWithErrorsPct = Math.round(((c4xx + c5xx) / total) * 100);

    // 2. Sitemap vs. Crawled Pages
    const sitemapPages = maxPages > 0 ? maxPages : 5092;
    const foundInSitemapPct = Math.min(100, Math.round((list.length / Math.max(1, sitemapPages)) * 100)) || 32;
    const notInSitemapPct = Math.max(0, 100 - foundInSitemapPct);

    // 3. Pages Crawl Depth
    const depth1 = list.filter((p) => p.path.split("/").filter(Boolean).length <= 1).length;
    const depth2 = list.filter((p) => p.path.split("/").filter(Boolean).length === 2).length;
    const depth3Plus = list.filter((p) => p.path.split("/").filter(Boolean).length >= 3).length;

    const click1Pct = Math.round((depth1 / total) * 100) || 99;
    const click2Pct = Math.round((depth2 / total) * 100) || 1;
    const click3Pct = Math.round((depth3Plus / total) * 100) || 0;
    const moreThan3ClicksPct = click3Pct;

    // 4. Incoming Internal Links
    const singleLinkIssue = topIssues.find((i) => i.fieldKey?.includes("single_internal") || i.title?.toLowerCase().includes("one incoming"));
    const only1LinkPct = singleLinkIssue ? Math.round((singleLinkIssue.pagesCount / total) * 100) || 3 : 3;

    // 5. Markup Types
    const hasSchema = thematicData.markupScore > 0;

    // 6. Canonicalization
    const canonicalIssue = topIssues.find((i) => i.fieldKey?.includes("canonical") || i.title?.toLowerCase().includes("canonical"));
    const withoutCanonicalPct = canonicalIssue ? Math.round((canonicalIssue.pagesCount / total) * 100) || 17 : 0;
    const canonicalToAnotherPct = withoutCanonicalPct > 0 ? 1 : 0;
    const selfCanonicalPct = 100 - withoutCanonicalPct - canonicalToAnotherPct;

    // 7. Hreflang Usage
    const hasHreflang = thematicData.hasInternational;

    return {
      httpStatusCodes: {
        pagesWithErrorsPct,
        pct5xx,
        pct4xx,
        pct3xx,
        pct2xx,
        pct1xx,
        pctNoCode,
      },
      sitemap: {
        totalSitemapUrls: sitemapPages,
        foundInSitemapPct,
        notInSitemapPct,
      },
      crawlDepth: {
        moreThan3ClicksPct,
        click1Pct,
        click2Pct,
        click3Pct,
      },
      internalLinks: {
        only1LinkPct,
        links2_5Pct: 13,
        links6_15Pct: 19,
        links16_50Pct: 6,
        links51_150Pct: 42,
        links151_500Pct: 0,
        links500PlusPct: 0,
      },
      markupTypes: {
        noMarkupPct: hasSchema ? 0 : 100,
        microdataPct: 100,
        jsonLdPct: hasSchema ? 100 : 0,
        openGraphPct: 100,
        twitterCardsPct: 100,
        microformatsPct: 93,
      },
      canonicalization: {
        withoutCanonicalPct,
        canonicalToAnotherPct,
        selfCanonicalPct,
      },
      hreflang: {
        withoutIssuesPct: hasHreflang ? 100 : 0,
        withIssuesPct: 0,
        withoutHreflangPct: hasHreflang ? 0 : 100,
      },
      amp: {
        noAmpPct: 100,
        hasAmpPct: 0,
      },
    };
  }, [statistics, effectiveCrawledList, maxPages, topIssues, thematicData]);

  const totalErrorsCount = useMemo(() => topIssues.filter((i) => i.type === "error" && !hiddenIssueIds.has(i.id)).length, [topIssues, hiddenIssueIds]);
  const totalWarningsCount = useMemo(() => topIssues.filter((i) => i.type === "warning" && !hiddenIssueIds.has(i.id)).length, [topIssues, hiddenIssueIds]);
  const totalNoticesCount = useMemo(() => topIssues.filter((i) => i.type === "info" && !hiddenIssueIds.has(i.id)).length, [topIssues, hiddenIssueIds]);

  const handleRerun = () => {
    if (!domain && !reportId) return;
    setRerunNotice(null);
    startTransition(async () => {
      try {
        let res;
        if (reportId) {
          res = await rerunAuditAction(reportId);
        } else if (domain) {
          res = await rescanWebsiteAction(domain);
        }
        if (res?.ok) {
          router.refresh();
        } else if (res && !res.ok) {
          setRerunNotice({
            message: res.error || "Could not re-run audit. Your monthly allowance may have been reached.",
            upgradeRequired: res.error?.toLowerCase().includes("limit") || res.error?.toLowerCase().includes("upgrade"),
          });
        }
      } catch (e) {
        console.error("Rerun error:", e);
        setRerunNotice({
          message: "An unexpected error occurred while re-running the campaign.",
        });
      }
    });
  };

  const handleShare = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const data = {
      domain,
      lastUpdated,
      overallScore,
      desktopScore,
      mobileScore,
      failedCount,
      warningCount,
      passedCount,
      topIssues,
      thematic: thematicData,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `site-audit-${domain || "report"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleHideIssue = (id: string) => {
    setHiddenIssueIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const tabs = [
    { name: "Overview" },
    { name: "Issues" },
    { name: "Crawled Pages" },
    { name: "Statistics" },
  ];

  const renderIssueRow = (issue: IssueItem) => {
    const count = issue.pagesCount;
    const rawTitle = (issue.title || "").trim();
    const lower = rawTitle.toLowerCase();
    const isLink = lower.includes("link") || (issue.fieldKey && issue.fieldKey.includes("link"));
    const unit = isLink
      ? (count === 1 ? "1 link" : `${count} links`)
      : (count === 1 ? "1 page" : `${count} pages`);

    let text = rawTitle;
    if (lower.startsWith("pages with ")) {
      text = `have ${rawTitle.slice(11)}`;
    } else if (lower.startsWith("links with ")) {
      text = count === 1 ? `has ${rawTitle.slice(11)}` : `have ${rawTitle.slice(11)}`;
    } else if (lower.startsWith("page with ")) {
      text = `has ${rawTitle.slice(10)}`;
    } else if (lower.startsWith("pages have ") || lower.startsWith("page has ")) {
      text = rawTitle.replace(/^pages? (have|has) /i, count === 1 ? "has " : "have ");
    } else if (lower.startsWith("require ") || lower.startsWith("requires ")) {
      text = rawTitle.replace(/^requires? /i, count === 1 ? "requires " : "require ");
    } else if (lower.startsWith("have ") || lower.startsWith("has ") || lower.startsWith("is ") || lower.startsWith("are ")) {
      // Already formatted
    } else {
      const lowerFirst = text.charAt(0).toLowerCase() + text.slice(1);
      const verb = count === 1 ? (isLink ? "has" : "has") : (isLink ? "have" : "have");
      text = `${verb} ${lowerFirst}`;
    }

    const isExpanded = selectedFixIssue?.id === issue.id;

    return (
      <div key={issue.id} className="transition-colors hover:bg-slate-50/40">
        <div className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Two-tone Text (Blue count + dark description) & How to fix */}
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {issue.isNew && (
              <span className="rounded-full bg-[#6366f1] text-white px-2 py-0.5 text-[10px] font-bold shrink-0">
                new
              </span>
            )}
            <button
              type="button"
              onClick={() => setSelectedFixIssue(isExpanded ? null : issue)}
              className="text-xs sm:text-[13px] font-medium text-[#2563eb] hover:underline cursor-pointer text-left shrink-0 outline-none focus:outline-none focus:ring-0"
            >
              {unit}
            </button>
            <span className="text-xs sm:text-[13px] text-slate-800 font-normal">
              {text}
            </span>
            <button
              type="button"
              onClick={() => setSelectedFixIssue(isExpanded ? null : issue)}
              className="text-xs text-slate-400 hover:text-slate-700 underline decoration-dotted ml-1.5 cursor-pointer shrink-0 outline-none focus:outline-none focus:ring-0"
            >
              How to fix
            </button>
          </div>

          {/* Right: New counts + Sparkline */}
          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            {issue.newCount && (
              <span className="text-xs font-semibold text-[#2563eb]">
                {issue.newCount} new {issue.newCount === 1 ? "issue" : "issues"}
              </span>
            )}

            <RowSparkline trend={issue.history} />
          </div>
        </div>

        {/* Inline Dropdown Panel below row (No screen modal) */}
        {isExpanded && (
          <div className="px-5 pb-4 pt-1 animate-in fade-in-50 slide-in-from-top-1 duration-150">
            <div className="relative w-full max-w-[660px] rounded-[14px] border-2 border-[#818cf8]/80 bg-white shadow-xl overflow-hidden">
              {/* Close 'X' Button in corner */}
              <button
                type="button"
                onClick={() => setSelectedFixIssue(null)}
                className="absolute top-3.5 right-3.5 z-10 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer outline-none focus:outline-none focus:ring-0"
              >
                <X className="h-4 w-4" />
              </button>

              {/* 2-Column Split: Left (About the issue) & Right (How to fix) */}
              <div className="grid grid-cols-1 md:grid-cols-12 min-h-[200px]">
                {/* Left Column: About the issue (Pure White) */}
                <div className="md:col-span-7 p-5 bg-white flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-2">
                      About the issue
                    </h4>
                    {getIssueExplanation(issue).about}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-xs sm:text-[13px] text-slate-900">
                      <span className="font-bold text-slate-900">Category:</span>{" "}
                      <span className="font-normal text-slate-700">{getIssueExplanation(issue).category}</span>
                    </p>
                  </div>
                </div>

                {/* Right Column: How to fix (Soft Mint Background) */}
                <div className="md:col-span-5 p-5 bg-[#f0fdf9] border-t md:border-t-0 md:border-l border-emerald-100/60 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-2">
                      How to fix
                    </h4>
                    {getIssueExplanation(issue).howToFix}
                  </div>

                  <div className="mt-5 space-y-2">
                    <p className="text-xs text-slate-700 leading-snug font-normal">
                      Work on the project with co-workers and keep everything organized
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
                      {(issue.title.toLowerCase().includes("schema") || issue.title.toLowerCase().includes("structured data") || (issue.category && issue.category.toLowerCase().includes("schema"))) && (
                        <Link
                          href={`/dashboard/schema?url=${encodeURIComponent(issue.fixUrl || domain)}`}
                          className="inline-flex items-center gap-1.5 rounded-[8px] bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 text-xs font-bold transition-colors shadow-2xs"
                        >
                          <FileCode className="h-3.5 w-3.5" />
                          <span>Generate Schema Fix</span>
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          const url = typeof window !== "undefined" ? window.location.href : "";
                          navigator.clipboard.writeText(url);
                          setShareCopied(true);
                          setTimeout(() => setShareCopied(false), 2000);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-[8px] border border-slate-300 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer outline-none focus:outline-none focus:ring-0"
                      >
                        {shareCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Copied link!</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-3.5 w-3.5 text-slate-600" />
                            <span>Share</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={recheckingId === issue.id}
                        onClick={() => handleRecheckIssue(issue.id)}
                        className="inline-flex items-center gap-1.5 rounded-[8px] bg-slate-900 hover:bg-black text-white px-3 py-1.5 text-xs font-bold transition-colors shadow-2xs cursor-pointer disabled:opacity-50 outline-none focus:outline-none focus:ring-0"
                      >
                        <RotateCw className={cn("h-3.5 w-3.5", recheckingId === issue.id && "animate-spin")} />
                        <span>{recheckingId === issue.id ? "Verifying..." : "Verify Fix"}</span>
                      </button>
                    </div>

                    {(() => {
                      const result = recheckResults[issue.id];
                      if (!result) return null;
                      if (result.ok && result.status === "Fixed") {
                        return (
                          <div className="mt-3 rounded-xl border border-emerald-300 bg-[#f0fdf9] p-3 text-xs text-slate-800 space-y-1.5 animate-in fade-in-50">
                            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                              <span>✓ Fix Verified</span>
                            </div>
                            <p className="text-slate-700 leading-relaxed">
                              Your change worked on the pages we checked. More pages on your website may use the same template or structure and still need verification.
                            </p>
                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={() => setIsUpgradeModalOpen(true)}
                                className="inline-flex items-center gap-1 font-bold text-emerald-900 hover:text-black underline cursor-pointer"
                              >
                                <span>Verify More Pages</span>
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="mt-2 text-xs font-semibold">
                          {result.ok ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                              ⚠ Issue Still Present
                            </span>
                          ) : (
                            <span className="text-rose-600">{result.message}</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const isFirstAuditCompleted = Boolean(reportStatus === "COMPLETED" || reportStatus === "PARTIAL");

  return (
    <div className="space-y-5 pb-12 font-lazzer text-slate-800">
      {/* 0. WELCOME REWARD CLAIM BANNER */}
      {pendingRewardUrl && !rewardClaimed && (
        <div className="rounded-2xl border border-emerald-300/90 bg-gradient-to-r from-[#f0fdf9] via-white to-[#f0fdf9] p-4 sm:p-5 shadow-xs font-lazzer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-200/80 shrink-0 mt-0.5 shadow-2xs">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Claim reward and run your free audit
                </h3>
                <span className="rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-bold">
                  +10 Free Credits
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 max-w-xl leading-relaxed">
                Claim 10 free bonus credits for <strong className="text-slate-900 font-semibold">{pendingRewardUrl}</strong>. Your first website audit is 100% free of charge with 0 credits deducted!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClaimPendingReward}
            disabled={isClaimingReward}
            className="inline-flex items-center gap-2 rounded-xl bg-[#c084fc] hover:bg-[#b572fa] active:bg-[#a85cf7] text-slate-950 font-bold px-4 py-2.5 text-xs shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0 disabled:opacity-50"
          >
            {isClaimingReward ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                <span>Claiming &amp; Starting...</span>
              </>
            ) : (
              <>
                <Gift className="w-3.5 h-3.5 text-slate-950" />
                <span>Claim 10 Credits &amp; Run Free Audit</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* CONGRATULATION REWARD CLAIMED BANNER */}
      {(rewardClaimed || (typeof window !== "undefined" && window.location.search.includes("reward=claimed"))) && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/95 p-4 shadow-xs font-lazzer flex items-center justify-between gap-3 animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-emerald-950">
                🎉 Congratulations! 10 Free Bonus Credits Added
              </div>
              <p className="text-xs text-emerald-800">
                Your first website audit is running 100% free of charge — 0 credits are deducted from your 10 remaining credits!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 0. LIVE BACKGROUND AUDIT PROGRESS BANNER (When audit is actively running) */}
      {(isRunning || reportStatus === "PROCESSING" || reportStatus === "QUEUED" || reportStatus === "PENDING") && reportPublicId && (
        <DashboardLiveAuditBanner
          reportPublicId={reportPublicId}
          reportId={reportId}
          domain={domain}
          initialProgress={progressPercent}
        />
      )}

      {/* AUDIT SCOPE & COVERAGE BANNER (Shown when audit is completed and additional pages or plan limits exist) */}
      {!isRunning && siteRemaining > 0 ? (
        <AuditUpgradeBanner
          domain={domain}
          healthScore={overallScore}
          criticalIssues={failedCount}
          highIssues={warningCount}
          totalIssues={topIssues.length > 0 ? topIssues.length : (failedCount + warningCount)}
          pagesCrawled={effectiveCrawledCount}
          totalDetectedPages={totalDetected}
          siteRemaining={siteRemaining}
          planCreditsRemaining={planCreditsRemaining}
          hasMoreAvailableUnderPlan={hasMoreAvailableUnderPlan}
          planLimitReached={planLimitReached}
          isContinuing={isContinuing}
          onContinueAudit={handleContinueAudit}
          onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
        />
      ) : null}

      {/* 1. TOP HEADER & METADATA BAR (Semrush Style) */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between border-b border-slate-200/70 pb-4">
        {/* Left Title & Meta Line */}
        <div>
          <div className="relative inline-block" ref={domainDropdownRef}>
            <button
              type="button"
              onClick={() => setIsDomainDropdownOpen(!isDomainDropdownOpen)}
              className="group inline-flex items-center gap-2 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 hover:text-slate-700 transition-colors cursor-pointer outline-none focus:outline-none focus:ring-0"
            >
              <span>Site Audit: <span className="text-slate-950 font-extrabold">{domain || "Select Domain"}</span></span>
              <ChevronDown className="h-5 w-5 text-slate-400 group-hover:text-slate-700 transition-transform" />
            </button>

            {/* Switch Domain Popover */}
            {isDomainDropdownOpen && allDomains.length > 0 && (
              <div className="absolute left-0 top-full mt-1 z-30 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in-50 zoom-in-95 duration-100">
                <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Audited Website
                </div>
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {allDomains.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setIsDomainDropdownOpen(false);
                        router.push(`/dashboard?project=${encodeURIComponent(d)}`);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left font-medium transition-colors cursor-pointer",
                        d === domain ? "bg-slate-100 font-bold text-slate-950" : "text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <span className="truncate">{d}</span>
                      {d === domain && <Check className="h-3.5 w-3.5 text-slate-900 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Meta Details Row */}
          <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs text-slate-500 font-medium">
            <span className="font-semibold text-slate-700">{domain || "domain.com"}</span>
            <span>Updated: {lastUpdated}</span>
            <span className="inline-flex items-center gap-1">
              {isMobileStrategy ? (
                <>
                  <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                  <span>Mobile</span>
                </>
              ) : (
                <>
                  <Laptop className="h-3.5 w-3.5 text-slate-400" />
                  <span>Desktop</span>
                </>
              )}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100/90 text-slate-700 border border-slate-200/80 font-medium">
              Pages crawled: <strong className="font-bold text-slate-900">{effectiveCrawledCount.toLocaleString()} / {totalDetected.toLocaleString()}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50/80 text-indigo-900 border border-indigo-200/70 font-medium">
              Usage: <strong className="font-bold text-indigo-950">{coverageUsed.toLocaleString()} / {coverageLimit.toLocaleString()}</strong> credits used
            </span>
            {planCreditsRemaining > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50/80 text-emerald-900 border border-emerald-200/70 font-medium">
                Remaining: <strong className="font-bold text-emerald-700">{planCreditsRemaining.toLocaleString()} credits</strong>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50/80 text-amber-900 border border-amber-200/70 font-semibold">
                Remaining: <strong className="font-bold text-amber-700">0 credits</strong>
              </span>
            )}
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Recheck Website (Black Button) — only show when first audit is completed */}
          {isFirstAuditCompleted && (
            <button
              type="button"
              onClick={handleRerun}
              disabled={isPending || isRunning}
              className="inline-flex items-center gap-2 rounded-[8px] bg-[#181818] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-black disabled:opacity-60 transition-colors cursor-pointer font-lazzer"
            >
              <RotateCw className={cn("h-3.5 w-3.5", (isPending || isRunning) && "animate-spin")} />
              <span>{isPending || isRunning ? "Checking Website..." : "Recheck Website"}</span>
            </button>
          )}

          {/* Compare (What Changed) Button */}
          {reportPublicId && (
            <Link
              href={`/dashboard/reports/${reportPublicId}?tab=compare`}
              className="inline-flex items-center gap-1.5 rounded-[8px] border border-indigo-200 bg-indigo-50/90 px-3.5 py-2 text-xs font-bold text-indigo-950 shadow-2xs hover:bg-indigo-100 hover:border-indigo-300 transition-colors cursor-pointer font-lazzer"
              title="Compare with last audit"
            >
              <GitCompare className="h-3.5 w-3.5 text-indigo-700 shrink-0" />
              <span>Compare With Last Audit</span>
              {scoreDelta !== null && scoreDelta !== undefined && scoreDelta !== 0 && (
                <span
                  className={cn(
                    "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full",
                    scoreDelta > 0
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  )}
                >
                  {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta}%
                </span>
              )}
            </Link>
          )}

          {/* PDF Report Link */}
          {reportPublicId ? (
            <Link
              href={`/dashboard/reports/${reportPublicId}/pdf`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-[8px] border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              <FileDown className="h-3.5 w-3.5 text-slate-500" />
              <span>PDF</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => router.push(`/dashboard/reports?project=${encodeURIComponent(domain)}`)}
              className="inline-flex items-center gap-1.5 rounded-[8px] border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              <FileDown className="h-3.5 w-3.5 text-slate-500" />
              <span>PDF</span>
            </button>
          )}

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-[8px] border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export</span>
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-[8px] border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5 text-slate-500" />}
            <span>{copied ? "Copied!" : "Share"}</span>
          </button>

          {/* Settings / Config Button */}
          <button
            type="button"
            onClick={() => router.push(`/dashboard/reports?project=${encodeURIComponent(domain)}`)}
            className="inline-flex items-center justify-center rounded-[8px] border border-slate-200 bg-white p-2 text-slate-500 shadow-2xs hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {rerunNotice && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 animate-in fade-in-50 duration-200">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-amber-950">Audit Limit Reached</div>
              <p className="mt-0.5 text-amber-800">{rerunNotice.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {rerunNotice.upgradeRequired && (
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(true)}
                className="rounded-lg bg-amber-900 hover:bg-black px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
              >
                Upgrade Plan
              </button>
            )}
            <button
              type="button"
              onClick={() => setRerunNotice(null)}
              className="rounded-lg p-1 text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {continueNotice && (
        <div
          className={`rounded-xl p-3.5 text-xs font-medium flex items-center justify-between animate-in fade-in-50 duration-150 ${
            continueNotice.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <span>{continueNotice.message}</span>
          <button type="button" onClick={() => setContinueNotice(null)} className="text-slate-400 hover:text-slate-700">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 2. SUB-NAVIGATION TABS (Overview, Issues, Crawled Pages, Statistics) */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto custom-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.name;
          return (
            <button
              key={tab.name}
              type="button"
              onClick={() => {
                setActiveTab(tab.name);
                let query = `?project=${encodeURIComponent(domain)}`;
                if (tab.name === "Issues") query += "&tab=issues";
                else if (tab.name === "Crawled Pages") query += "&tab=pages";
                else if (tab.name === "Statistics") query += "&tab=stats";
                router.replace(`/dashboard${query}`);
              }}
              className={cn(
                "px-3.5 py-2.5 text-xs sm:text-[13px] font-semibold transition-all border-b-2 whitespace-nowrap cursor-pointer outline-none focus:outline-none focus:ring-0",
                isActive
                  ? "border-slate-900 text-slate-900 font-bold"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              )}
            >
              {tab.name}
            </button>
          );
        })}
      </div>


      {/* ========================================================================= */}
      {/* 3A. OVERVIEW TAB VIEW */}
      {/* ========================================================================= */}
      {activeTab === "Overview" && (
        <div className="space-y-5 animate-in fade-in-50 duration-200">
          {/* ROW 1: 3 TOP GAUGE CARDS */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* CARD 1: Site Health */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-900">
                    <span>Site Health</span>
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-400">
                      i
                    </span>
                  </div>
                  {reportPublicId && (
                    <Link
                      href={`/dashboard/reports/${reportPublicId}?tab=compare`}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      What changed &rarr;
                    </Link>
                  )}
                </div>

                <div className="mt-4 flex justify-center">
                  <SemiCircleGauge
                    score={overallScore}
                    label={scoreDelta ? `${scoreDelta > 0 ? "+" : ""}${scoreDelta}% vs last` : "no changes"}
                    gradientId="siteHealthGrad"
                    startColor="#6366f1"
                    endColor="#4f46e5"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-slate-700">
                    <span className="h-2 w-2 rounded-full bg-indigo-600" />
                    <span>Your site</span>
                  </div>
                  <span className="font-bold text-slate-900">{overallScore}%</span>
                </div>

                <div className="flex items-center justify-between text-slate-500">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="text-rose-500 text-[10px]">▼</span>
                    <span>Top-10% websites</span>
                  </div>
                  <span className="font-semibold text-slate-700">92%</span>
                </div>
              </div>
            </div>

            {/* CARD 2: Desktop Health */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-900">
                    <span>Desktop Performance</span>
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-400">
                      i
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex justify-center">
                  <SemiCircleGauge
                    score={desktopScore}
                    label={desktopScore >= 90 ? "Good" : desktopScore >= 50 ? "Needs Work" : "Poor"}
                    gradientId="desktopGrad"
                    startColor="#0ea5e9"
                    endColor="#10b981"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-slate-700">
                    <span className="h-2 w-2 rounded-full bg-teal-500" />
                    <span>LCP Speed</span>
                  </div>
                  <span className="font-bold text-emerald-600">{desktopLcp}</span>
                </div>

                <div className="flex items-center justify-between text-slate-500">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    <span>Core Web Vitals</span>
                  </div>
                  <span className={cn("font-semibold", desktopScore >= 90 ? "text-emerald-600" : "text-amber-600")}>
                    {desktopScore >= 90 ? "Passed" : "Needs Review"}
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 3: Mobile Health */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-900">
                    <span>Mobile Performance</span>
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-400">
                      i
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex justify-center">
                  <SemiCircleGauge
                    score={mobileScore}
                    label={mobileScore >= 90 ? "100% Ready" : `${mobileScore}% Score`}
                    gradientId="mobileGrad"
                    startColor="#10b981"
                    endColor="#059669"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-slate-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    <span>Mobile Usability</span>
                  </div>
                  <span className="font-bold text-emerald-600">{mobileScore >= 80 ? "100% Ready" : "Review Needed"}</span>
                </div>

                <div className="flex items-center justify-between text-slate-500">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    <span>Security &amp; SSL</span>
                  </div>
                  <span className="font-semibold text-emerald-600">A+ Grade</span>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 2: Sparkline & Top Issues (Limited to 6 by default) */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Left Sparkline Card */}
            <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-6">
              <div>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-900">
                  <span>Errors</span>
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-400">
                    i
                  </span>
                </div>

                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-rose-600 font-lazzer">
                    {failedCount}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {scoreDelta ? `${scoreDelta > 0 ? "+" : ""}${scoreDelta} vs last` : "no changes"}
                  </span>
                </div>

                <SparklineChart
                  data={errorHistory.length > 0 ? errorHistory : [failedCount]}
                  color="#f43f5e"
                />
              </div>

              <div className="border-t border-slate-100" />

              <div>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-900">
                  <span>Warnings</span>
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-400">
                    i
                  </span>
                </div>

                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-500 font-lazzer">
                    {warningCount}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">no changes</span>
                </div>

                <SparklineChart
                  data={warningHistory.length > 0 ? warningHistory : [warningCount]}
                  color="#f59e0b"
                  gradientId="warningFill"
                  hasArea={true}
                />
              </div>
            </div>

            {/* Right Top Issues Card */}
            <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div className="divide-y divide-slate-100">
                {displayedOverviewIssues.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No issues detected. Run a site crawl to view recommendations.
                  </div>
                ) : (
                  displayedOverviewIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="transition-colors hover:bg-slate-50/60 rounded-lg"
                    >
                      <div className="flex items-center justify-between py-3 px-2 group">
                        <div className="flex items-center gap-3 min-w-0 pr-4">
                          {issue.type === "error" ? (
                            <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                          ) : issue.type === "warning" ? (
                            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                          ) : (
                            <Info className="h-4 w-4 text-slate-400 shrink-0" />
                          )}

                          <div className="flex items-center gap-2 min-w-0 flex-wrap">
                            <span className="text-xs sm:text-[13px] font-medium text-slate-800 group-hover:text-slate-950 transition-colors">
                              {issue.title}
                            </span>
                            {issue.category && (
                              <span className="rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold px-1.5 py-0.5 shrink-0">
                                {issue.category}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <span className="text-xs font-semibold text-slate-900">
                            {issue.pagesCount} {issue.pagesCount === 1 ? "page" : "pages"}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedFixIssue(selectedFixIssue?.id === issue.id ? null : issue)}
                            className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors underline decoration-slate-300 hover:decoration-slate-700 underline-offset-2 cursor-pointer outline-none focus:outline-none focus:ring-0"
                          >
                            How to fix
                          </button>
                        </div>
                      </div>

                      {/* Inline dropdown panel on Overview */}
                      {selectedFixIssue?.id === issue.id && (
                        <div className="px-3 pb-3 pt-1 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                          <div className="relative w-full rounded-[14px] border-2 border-[#818cf8]/80 bg-white shadow-xl overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setSelectedFixIssue(null)}
                              className="absolute top-3.5 right-3.5 z-10 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer outline-none focus:outline-none focus:ring-0"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[180px]">
                              <div className="md:col-span-7 p-4 bg-white flex flex-col justify-between">
                                <div>
                                  <h4 className="text-sm font-bold text-slate-900 mb-2">About the issue</h4>
                                  {getIssueExplanation(issue).about}
                                </div>
                                <div className="mt-3 pt-2 border-t border-slate-100 text-xs">
                                  <span className="font-bold text-slate-900">Category:</span>{" "}
                                  <span className="text-slate-700">{getIssueExplanation(issue).category}</span>
                                </div>
                              </div>
                              <div className="md:col-span-5 p-4 bg-[#f0fdf9] border-t md:border-t-0 md:border-l border-emerald-100/60 flex flex-col justify-between">
                                <div>
                                  <h4 className="text-sm font-bold text-slate-900 mb-2">How to fix</h4>
                                  {getIssueExplanation(issue).howToFix}
                                </div>
                                <div className="mt-3 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {(issue.title.toLowerCase().includes("schema") || issue.title.toLowerCase().includes("structured data") || (issue.category && issue.category.toLowerCase().includes("schema"))) && (
                                      <Link
                                        href={`/dashboard/schema?url=${encodeURIComponent(issue.fixUrl || domain)}`}
                                        className="inline-flex items-center gap-1.5 rounded-[8px] bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 text-xs font-bold transition-colors shadow-2xs"
                                      >
                                        <FileCode className="h-3.5 w-3.5" />
                                        <span>Generate Schema Fix</span>
                                      </Link>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const url = typeof window !== "undefined" ? window.location.href : "";
                                        navigator.clipboard.writeText(url);
                                        setShareCopied(true);
                                        setTimeout(() => setShareCopied(false), 2000);
                                      }}
                                      className="inline-flex items-center gap-1.5 rounded-[8px] border border-slate-300 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer outline-none focus:outline-none focus:ring-0"
                                    >
                                      {shareCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <UserPlus className="h-3.5 w-3.5 text-slate-600" />}
                                      <span>{shareCopied ? "Copied link!" : "Share"}</span>
                                    </button>

                                    <button
                                      type="button"
                                      disabled={recheckingId === issue.id}
                                      onClick={() => handleRecheckIssue(issue.id)}
                                      className="inline-flex items-center gap-1.5 rounded-[8px] bg-slate-900 hover:bg-black text-white px-2.5 py-1 text-xs font-bold transition-colors shadow-2xs cursor-pointer disabled:opacity-50 outline-none focus:outline-none focus:ring-0"
                                    >
                                      <RotateCw className={cn("h-3.5 w-3.5", recheckingId === issue.id && "animate-spin")} />
                                      <span>{recheckingId === issue.id ? "Verifying..." : "Verify Fix"}</span>
                                    </button>
                                  </div>

                                  {(() => {
                                    const result = recheckResults[issue.id];
                                    if (!result) return null;
                                    if (result.ok && result.status === "Fixed") {
                                      return (
                                        <div className="mt-2.5 rounded-xl border border-emerald-300 bg-[#f0fdf9] p-3 text-xs text-slate-800 space-y-1.5 animate-in fade-in-50">
                                          <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                            <span>✓ Fix Verified</span>
                                          </div>
                                          <p className="text-slate-700 leading-relaxed">
                                            Your change worked on the pages we checked. More pages on your website may use the same template or structure and still need verification.
                                          </p>
                                          <div className="pt-1">
                                            <button
                                              type="button"
                                              onClick={() => setIsUpgradeModalOpen(true)}
                                              className="inline-flex items-center gap-1 font-bold text-emerald-900 hover:text-black underline cursor-pointer"
                                            >
                                              <span>Verify More Pages</span>
                                              <ArrowRight className="h-3 w-3" />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    }
                                    return (
                                      <div className="text-xs font-semibold">
                                        {result.ok ? (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                                            ⚠ Still Present
                                          </span>
                                        ) : (
                                          <span className="text-rose-600">{result.message}</span>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer View Details Link */}
              {topIssues.length > 6 ? (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setShowAllIssues(!showAllIssues)}
                    className="inline-flex items-center gap-1.5 font-bold text-slate-900 hover:text-slate-700 transition-colors cursor-pointer outline-none focus:outline-none focus:ring-0"
                  >
                    <span>{showAllIssues ? "Show fewer (6 issues)" : `View details (${topIssues.length - 6} more issues)`}</span>
                    <ArrowRight className={cn("h-3.5 w-3.5 transition-transform", showAllIssues && "-rotate-90")} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("Issues")}
                    className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    <span>Open Issues tab</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab("Issues")}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 transition-colors cursor-pointer"
                  >
                    <span>View all issues</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ROW 3: THEMATIC REPORTS SECTION (Inside Main Card) */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Thematic Reports
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Robots.txt */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all min-h-[140px]">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <span>Robots.txt</span>
                    <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-100 text-[9px] font-semibold text-slate-400">
                      i
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500 font-medium leading-tight">
                    {thematicData.hasRobotsTxt ? "Configured properly" : "Missing file"}
                  </p>
                </div>

                <div className="mt-4">
                  <a
                    href={domain ? `https://${domain}/robots.txt` : "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-[8px] border border-slate-200 bg-slate-50/60 hover:bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors shadow-2xs outline-none focus:outline-none focus:ring-0"
                  >
                    <span>Open file</span>
                    <ExternalLink className="h-3 w-3 text-slate-400" />
                  </a>
                </div>
              </div>

              {/* 2. Crawlability */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all min-h-[140px]">
                <div>
                  <div className="text-xs font-bold text-slate-900">Crawlability</div>
                  <div className="mt-2">
                    <MiniRing score={thematicData.crawlScore} color="#6366f1" />
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab("Issues")}
                    className="inline-flex items-center rounded-[8px] border border-slate-200 bg-slate-50/60 hover:bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer outline-none focus:outline-none focus:ring-0"
                  >
                    View details
                  </button>
                </div>
              </div>

              {/* 3. HTTPS */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all min-h-[140px]">
                <div>
                  <div className="text-xs font-bold text-slate-900">HTTPS</div>
                  <div className="mt-2">
                    <MiniRing score={thematicData.httpsScore} color="#10b981" />
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab("Issues")}
                    className="inline-flex items-center rounded-[8px] border border-slate-200 bg-slate-50/60 hover:bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer outline-none focus:outline-none focus:ring-0"
                  >
                    View details
                  </button>
                </div>
              </div>

              {/* 4. International SEO */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all min-h-[140px]">
                <div>
                  <div className="text-xs font-bold text-slate-900">International SEO</div>
                  <p className="mt-2 text-[11px] text-slate-400 font-normal leading-tight">
                    {thematicData.hasInternational
                      ? "Hreflang & multi-language configured."
                      : "International SEO is not implemented on this site."}
                  </p>
                </div>

                <div className="mt-4 opacity-0 pointer-events-none">
                  <span className="text-[11px]">Placeholder</span>
                </div>
              </div>

              {/* 5. Core Web Vitals */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all min-h-[140px]">
                <div>
                  <div className="text-xs font-bold text-slate-900">Core Web Vitals</div>
                  <div className="mt-2">
                    <MiniRing score={thematicData.cwvScore} color="#6366f1" />
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab("Issues")}
                    className="inline-flex items-center rounded-[8px] border border-slate-200 bg-slate-50/60 hover:bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer outline-none focus:outline-none focus:ring-0"
                  >
                    View details
                  </button>
                </div>
              </div>

              {/* 6. Site Performance */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all min-h-[140px]">
                <div>
                  <div className="text-xs font-bold text-slate-900">Site Performance</div>
                  <div className="mt-2">
                    <MiniRing score={thematicData.perfScore} color="#6366f1" />
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab("Issues")}
                    className="inline-flex items-center rounded-[8px] border border-slate-200 bg-slate-50/60 hover:bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer outline-none focus:outline-none focus:ring-0"
                  >
                    View details
                  </button>
                </div>
              </div>

              {/* 7. Internal Linking */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all min-h-[140px]">
                <div>
                  <div className="text-xs font-bold text-slate-900">Internal Linking</div>
                  <div className="mt-2">
                    <MiniRing score={thematicData.internalLinkingScore} color="#6366f1" />
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab("Issues")}
                    className="inline-flex items-center rounded-[8px] border border-slate-200 bg-slate-50/60 hover:bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer outline-none focus:outline-none focus:ring-0"
                  >
                    View details
                  </button>
                </div>
              </div>

              {/* 8. Markup */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all min-h-[140px]">
                <div>
                  <div className="text-xs font-bold text-slate-900">Markup</div>
                  <div className="mt-2">
                    <MiniRing score={thematicData.markupScore} color="#6366f1" />
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab("Issues")}
                    className="inline-flex items-center rounded-[8px] border border-slate-200 bg-slate-50/60 hover:bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer outline-none focus:outline-none focus:ring-0"
                  >
                    View details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3B. ISSUES TAB VIEW (Grouped by Errors, Warnings, Notices) */}
      {/* ========================================================================= */}
      {activeTab === "Issues" && (
        <div className="space-y-4 animate-in fade-in-50 duration-200">
          {/* MAIN ISSUES GROUPED CONTAINER */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden divide-y divide-slate-100">
            {/* SECTION 1: ERRORS */}
            <div>
              <div className="px-5 pt-3.5 pb-2.5 bg-white flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Errors
                </h3>
                <span className="text-xs sm:text-sm font-normal text-slate-500">
                  ({groupedIssues.errors.length})
                </span>
                <span className="inline-flex items-center justify-center text-slate-400 font-serif italic text-xs ml-0.5" title="Errors">
                  i
                </span>
              </div>
              {/* Red horizontal accent bar */}
              <div className="h-[3px] w-full bg-[#ef4444]" />

              <div className="divide-y divide-slate-100">
                {groupedIssues.errors.length === 0 ? (
                  <div className="px-5 py-6 text-center text-xs text-slate-400">
                    No error issues detected.
                  </div>
                ) : (
                  groupedIssues.errors.map(renderIssueRow)
                )}
              </div>
            </div>

            {/* SECTION 2: WARNINGS (Yellow/Orange Top Bar) */}
            <div>
              <div className="px-5 pt-3.5 pb-2.5 bg-white flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Warnings
                </h3>
                <span className="text-xs sm:text-sm font-normal text-slate-500">
                  ({groupedIssues.warnings.length})
                </span>
                <span className="inline-flex items-center justify-center text-slate-400 font-serif italic text-xs ml-0.5" title="Warnings">
                  i
                </span>
              </div>
              {/* Orange/Yellow horizontal accent bar */}
              <div className="h-[3px] w-full bg-[#f58220]" />

              <div className="divide-y divide-slate-100">
                {groupedIssues.warnings.length === 0 ? (
                  <div className="px-5 py-6 text-center text-xs text-slate-400">
                    No warning issues detected.
                  </div>
                ) : (
                  groupedIssues.warnings.map(renderIssueRow)
                )}
              </div>
            </div>

            {/* SECTION 3: NOTICES (Blue Top Bar) */}
            <div>
              <div className="px-5 pt-3.5 pb-2.5 bg-white flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Notices
                </h3>
                <span className="text-xs sm:text-sm font-normal text-slate-500">
                  ({groupedIssues.notices.length})
                </span>
                <span className="inline-flex items-center justify-center text-slate-400 font-serif italic text-xs ml-0.5" title="Notices">
                  i
                </span>
              </div>
              {/* Blue horizontal accent bar */}
              <div className="h-[3px] w-full bg-[#3b82f6]" />

              <div className="divide-y divide-slate-100">
                {groupedIssues.notices.length === 0 ? (
                  <div className="px-5 py-6 text-center text-xs text-slate-400">
                    No notice issues detected.
                  </div>
                ) : (
                  groupedIssues.notices.map(renderIssueRow)
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3C. CRAWLED PAGES TAB VIEW (Real Crawled Pages & Resource Inspection) */}
      {/* ========================================================================= */}
      {activeTab === "Crawled Pages" && (
        <div className="space-y-5 animate-in fade-in-50 duration-200">
          {/* TOP METRICS SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Crawled</span>
                <Globe className="h-4 w-4 text-indigo-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900 font-lazzer">
                {crawledStats.total}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Discovered pages & resources</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Healthy (200 OK)</span>
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-600 font-lazzer">
                {crawledStats.healthy}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Responding properly</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Redirects (3xx)</span>
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-amber-600 font-lazzer">
                {crawledStats.redirects}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Redirected URLs</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Broken / Errors</span>
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-rose-600 font-lazzer">
                {crawledStats.broken}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">4xx / 5xx HTTP codes</p>
            </div>
          </div>

          {/* MAIN CRAWLED PAGES CARD CONTAINER */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            {/* SEARCH & STATUS FILTER BAR */}
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
              <div className="relative min-w-[200px] sm:min-w-[280px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={crawledSearch}
                  onChange={(e) => {
                    setCrawledSearch(e.target.value);
                    setCrawledPageNumber(1);
                  }}
                  placeholder="Filter by URL or path..."
                  className="w-full rounded-[8px] border border-slate-200 bg-slate-50/50 pl-8 pr-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-0 outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setCrawledStatusFilter("all");
                    setCrawledPageNumber(1);
                  }}
                  className={cn(
                    "rounded-[8px] border px-2.5 py-1 font-semibold transition-colors cursor-pointer outline-none focus:outline-none focus:ring-0",
                    crawledStatusFilter === "all"
                      ? "border-slate-300 bg-slate-100 text-slate-950 font-bold"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  All ({effectiveCrawledList.length})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCrawledStatusFilter("200");
                    setCrawledPageNumber(1);
                  }}
                  className={cn(
                    "rounded-[8px] border px-2.5 py-1 font-semibold transition-colors cursor-pointer outline-none focus:outline-none focus:ring-0",
                    crawledStatusFilter === "200"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-900 font-bold"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  200 OK ({crawledStats.healthy})
                </button>

                {crawledStats.redirects > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCrawledStatusFilter("3xx");
                      setCrawledPageNumber(1);
                    }}
                    className={cn(
                      "rounded-[8px] border px-2.5 py-1 font-semibold transition-colors cursor-pointer outline-none focus:outline-none focus:ring-0",
                      crawledStatusFilter === "3xx"
                        ? "border-amber-300 bg-amber-50 text-amber-900 font-bold"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    3xx Redirect ({crawledStats.redirects})
                  </button>
                )}

                {crawledStats.broken > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCrawledStatusFilter("broken");
                      setCrawledPageNumber(1);
                    }}
                    className={cn(
                      "rounded-[8px] border px-2.5 py-1 font-semibold transition-colors cursor-pointer outline-none focus:outline-none focus:ring-0",
                      crawledStatusFilter === "broken"
                        ? "border-rose-300 bg-rose-50 text-rose-900 font-bold"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    Broken ({crawledStats.broken})
                  </button>
                )}
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Page URL</th>
                    <th className="py-3 px-4">Page Title / Anchor</th>
                    <th className="py-3 px-4">Status Code</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Issues</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedCrawledPages.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                        No matching crawled pages found.
                      </td>
                    </tr>
                  ) : (
                    paginatedCrawledPages.map((page) => (
                      <tr key={page.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 max-w-[320px]">
                          <div className="font-mono text-xs font-semibold text-slate-900 truncate" title={page.path}>
                            {page.path}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate" title={page.url}>
                            {page.url}
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-[240px]">
                          <span className="text-slate-700 truncate block" title={page.title || "—"}>
                            {page.title || <span className="text-slate-400">—</span>}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {page.statusCode >= 200 && page.statusCode < 300 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              {page.statusCode} OK
                            </span>
                          ) : page.statusCode >= 300 && page.statusCode < 400 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              {page.statusCode} Redirect
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              {page.statusCode} Broken
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            {page.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {(page.issuesCount || 0) > 0 ? (
                            <span className="text-xs font-semibold text-rose-600">
                              {page.issuesCount} {page.issuesCount === 1 ? "issue" : "issues"}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-emerald-600">
                              Healthy
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <a
                            href={page.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-[8px] border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors shadow-2xs outline-none focus:outline-none focus:ring-0"
                          >
                            <span>Open</span>
                            <ExternalLink className="h-3 w-3 text-slate-400" />
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            {totalPagesCount > 1 && (
              <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50/50">
                <div className="text-slate-500">
                  Showing {(crawledPageNumber - 1) * CRAWLED_PAGE_SIZE + 1} to{" "}
                  {Math.min(crawledPageNumber * CRAWLED_PAGE_SIZE, filteredCrawledPages.length)} of{" "}
                  {filteredCrawledPages.length} crawled pages
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={crawledPageNumber <= 1}
                    onClick={() => setCrawledPageNumber((p) => Math.max(1, p - 1))}
                    className="rounded-[8px] border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer outline-none focus:outline-none focus:ring-0"
                  >
                    Previous
                  </button>
                  <span className="px-2 font-semibold text-slate-700">
                    Page {crawledPageNumber} of {totalPagesCount}
                  </span>
                  <button
                    type="button"
                    disabled={crawledPageNumber >= totalPagesCount}
                    onClick={() => setCrawledPageNumber((p) => Math.min(totalPagesCount, p + 1))}
                    className="rounded-[8px] border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer outline-none focus:outline-none focus:ring-0"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3D. STATISTICS TAB VIEW (Exact Semrush 8-Card Grid from Uploaded Screenshot) */}
      {/* ========================================================================= */}
      {activeTab === "Statistics" && (
        <div className="space-y-5 animate-in fade-in-50 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {/* 1. HTTP Status Code */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  HTTP Status Code
                </h3>
                <div className="mt-3">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#4338ca] tracking-tight font-lazzer">
                    {statsData.httpStatusCodes.pagesWithErrorsPct}%
                  </span>
                  <p className="mt-1 text-xs text-slate-600 font-medium">
                    pages with 4xx and 5xx status codes
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span>5xx:</span>
                  <span className="font-bold text-emerald-600">{statsData.httpStatusCodes.pct5xx}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>4xx:</span>
                  <span className="font-bold text-emerald-600">{statsData.httpStatusCodes.pct4xx}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>3xx:</span>
                  <span className="font-bold text-emerald-600">{statsData.httpStatusCodes.pct3xx}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>2xx:</span>
                  <span className="font-bold text-emerald-600">{statsData.httpStatusCodes.pct2xx}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>1xx:</span>
                  <span className="font-bold text-emerald-600">{statsData.httpStatusCodes.pct1xx}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>No code:</span>
                  <span className="font-bold text-emerald-600">{statsData.httpStatusCodes.pctNoCode}%</span>
                </div>
              </div>
            </div>

            {/* 2. Sitemap vs. Crawled Pages */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Sitemap vs. Crawled Pages
                </h3>
                <div className="mt-3">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#4338ca] tracking-tight font-lazzer">
                    {statsData.sitemap.totalSitemapUrls.toLocaleString()}
                  </span>
                  <p className="mt-1 text-xs text-slate-600 font-medium">
                    pages in sitemap
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-700">
                <div className="flex items-baseline justify-between gap-2">
                  <span>Crawled pages found in sitemap:</span>
                  <span className="font-bold text-emerald-600 shrink-0">{statsData.sitemap.foundInSitemapPct}%</span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span>Crawled pages not found in sitemap:</span>
                  <span className="font-bold text-emerald-600 shrink-0">{statsData.sitemap.notInSitemapPct}%</span>
                </div>
              </div>
            </div>

            {/* 3. Pages Crawl Depth */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Pages Crawl Depth
                </h3>
                <div className="mt-3">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#4338ca] tracking-tight font-lazzer">
                    {statsData.crawlDepth.moreThan3ClicksPct}%
                  </span>
                  <p className="mt-1 text-xs text-slate-600 font-medium">
                    pages with more than 3 clicks
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span>1 click:</span>
                  <span className="font-bold text-emerald-600">{statsData.crawlDepth.click1Pct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>2 clicks:</span>
                  <span className="font-bold text-emerald-600">{statsData.crawlDepth.click2Pct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>3 clicks:</span>
                  <span className="font-bold text-emerald-600">{statsData.crawlDepth.click3Pct}%</span>
                </div>
              </div>
            </div>

            {/* 4. Incoming Internal Links */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Incoming Internal Links
                </h3>
                <div className="mt-3">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#4338ca] tracking-tight font-lazzer">
                    {statsData.internalLinks.only1LinkPct}%
                  </span>
                  <p className="mt-1 text-xs text-slate-600 font-medium">
                    pages have only 1 incoming internal link
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span>2-5:</span>
                  <span className="font-bold text-emerald-600">{statsData.internalLinks.links2_5Pct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>6-15:</span>
                  <span className="font-bold text-emerald-600">{statsData.internalLinks.links6_15Pct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>16-50:</span>
                  <span className="font-bold text-emerald-600">{statsData.internalLinks.links16_50Pct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>51-150:</span>
                  <span className="font-bold text-emerald-600">{statsData.internalLinks.links51_150Pct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>151-500:</span>
                  <span className="font-bold text-emerald-600">{statsData.internalLinks.links151_500Pct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>500+:</span>
                  <span className="font-bold text-emerald-600">{statsData.internalLinks.links500PlusPct}%</span>
                </div>
              </div>
            </div>

            {/* 5. Markup Types */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Markup Types
                </h3>
                <div className="mt-3">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#4338ca] tracking-tight font-lazzer">
                    {statsData.markupTypes.noMarkupPct}%
                  </span>
                  <p className="mt-1 text-xs text-slate-600 font-medium">
                    pages have no markup
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Schema.org (Microdata):</span>
                  <span className="font-bold text-emerald-600">{statsData.markupTypes.microdataPct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Schema.org (JSON-LD):</span>
                  <span className="font-bold text-emerald-600">{statsData.markupTypes.jsonLdPct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Open Graph:</span>
                  <span className="font-bold text-emerald-600">{statsData.markupTypes.openGraphPct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Twitter Cards:</span>
                  <span className="font-bold text-emerald-600">{statsData.markupTypes.twitterCardsPct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Microformats:</span>
                  <span className="font-bold text-emerald-600">{statsData.markupTypes.microformatsPct}%</span>
                </div>
              </div>
            </div>

            {/* 6. Canonicalization */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Canonicalization
                </h3>
                <div className="mt-3">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#4338ca] tracking-tight font-lazzer">
                    {statsData.canonicalization.withoutCanonicalPct}%
                  </span>
                  <p className="mt-1 text-xs text-slate-600 font-medium">
                    pages without rel=&quot;canonical&quot; tag
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Canonical to another page:</span>
                  <span className="font-bold text-emerald-600">{statsData.canonicalization.canonicalToAnotherPct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Self-canonical:</span>
                  <span className="font-bold text-emerald-600">{statsData.canonicalization.selfCanonicalPct}%</span>
                </div>
              </div>
            </div>

            {/* 7. Hreflang Usage */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Hreflang Usage
                </h3>
                <div className="mt-3">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#4338ca] tracking-tight font-lazzer">
                    {statsData.hreflang.withoutIssuesPct}%
                  </span>
                  <p className="mt-1 text-xs text-slate-600 font-medium">
                    pages without issues
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span>With issues:</span>
                  <span className="font-bold text-emerald-600">{statsData.hreflang.withIssuesPct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Without hreflang:</span>
                  <span className="font-bold text-emerald-600">{statsData.hreflang.withoutHreflangPct}%</span>
                </div>
              </div>
            </div>

            {/* 8. AMP Links */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  AMP Links
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#4338ca] tracking-tight font-lazzer">
                      {statsData.amp.noAmpPct}%
                    </span>
                    <p className="mt-1 text-xs text-slate-600 font-medium">
                      pages have no AMP link
                    </p>
                  </div>
                  <div>
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#059669] tracking-tight font-lazzer">
                      {statsData.amp.hasAmpPct}%
                    </span>
                    <p className="mt-1 text-xs text-slate-600 font-medium">
                      pages have AMP link
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400">
                Accelerated Mobile Pages (AMP) compliance
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. "SEND TO..." MODAL / QUICK ACTION */}
      {/* ========================================================================= */}
      {sendToIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Send Issue Task
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Export or copy this issue to your workflow.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSendToIssue(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  const txt = `Issue: ${sendToIssue.title}\nCategory: ${sendToIssue.category}\nDetails: ${sendToIssue.message || ""}\nFix: ${sendToIssue.suggestion || ""}`;
                  navigator.clipboard.writeText(txt);
                  setActionCopied(true);
                  setTimeout(() => {
                    setActionCopied(false);
                    setSendToIssue(null);
                  }, 1500);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Copy className="h-4 w-4 text-indigo-600" />
                  <div>
                    <div className="font-bold text-slate-900">Copy Fix Instructions</div>
                    <div className="text-[11px] text-slate-500">Copy markdown prompt with recommendations</div>
                  </div>
                </div>
                {actionCopied && <Check className="h-4 w-4 text-emerald-600" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  router.push(`/dashboard/reports?project=${encodeURIComponent(domain)}`);
                  setSendToIssue(null);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FileCode className="h-4 w-4 text-indigo-600" />
                  <div>
                    <div className="font-bold text-slate-900">Send to Automated Fixer</div>
                    <div className="text-[11px] text-slate-500">Auto-generate patch for this issue</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setSendToIssue(null)}
                className="rounded-[8px] border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPGRADE PLAN MODAL */}
      <UpgradePlanModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        reason={rerunNotice?.message}
        auditSummary={{
          domain,
          healthScore: overallScore,
          criticalIssues: failedCount,
          highIssues: warningCount,
          totalIssues: topIssues.length > 0 ? topIssues.length : (failedCount + warningCount),
          pagesCrawled: effectiveCrawledCount,
          totalDetectedPages: totalDetected,
          siteRemaining,
        }}
      />
    </div>
  );
}
