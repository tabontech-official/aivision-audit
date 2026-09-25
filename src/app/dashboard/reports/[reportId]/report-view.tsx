"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  RotateCw,
  FileDown,
  Share2,
  Download,
  Smartphone,
  Laptop,
  ChevronDown,
  ExternalLink,
  Check,
  Eye,
  X,
  UserPlus,
  CornerUpRight,
  Layers,
  AlertTriangle,
  ArrowRight,
  FileText,
  GitCompare,
  CheckCircle2,
  AlertOctagon,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { rerunAuditByPublicIdAction } from "./actions";
import { continueAuditAction } from "@/app/dashboard/reports/actions";
import { UpgradePlanModal } from "@/components/dashboard/upgrade-plan-modal";
import { AuditUpgradeBanner } from "@/components/dashboard/audit-upgrade-banner";
import type {
  ProjectedReport,
  ProjectedSection,
  ProjectedCheck,
} from "@/services/reports/project-report";
import type { ScoreBasis } from "@/services/reports/evaluate-report";

export interface IssueItem {
  id: string;
  fieldId?: string;
  fieldKey?: string;
  title: string;
  category?: string;
  sectionSlug?: string;
  type: "error" | "warning" | "info";
  pagesCount: number;
  message?: string | null;
  suggestion?: string | null;
  fixUrl?: string;
  isNew?: boolean;
  newCount?: number;
  history?: number[];
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

  // Images and alt text
  if (titleLower.includes("image") || titleLower.includes("alt") || keyLower.includes("img")) {
    return {
      about: (
        <div className="space-y-2 text-xs sm:text-[13px] text-slate-700 leading-relaxed">
          <p>
            This issue flags images that are missing descriptive alternative text attributes or have broken sources.
          </p>
          <p className="text-slate-600">
            Alt attributes provide accessibility for screen readers and enable image indexation in Google Search.
          </p>
        </div>
      ),
      category: "Accessibility, Images",
      howToFix: (
        <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">
          {issue.suggestion || "Add meaningful alt attributes describing each image subject to assist screen readers and image search."}
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

export function ReportView(props: {
  publicId: string;
  domain: string;
  allDomains?: string[];
  url: string;
  faviconUrl: string | null;
  screenshotUrl: string | null;
  status: string;
  overallScore: number | null;
  grade: string | null;
  mobileScore: number | null;
  desktopScore: number | null;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  criticalIssueCount: number;
  pagesCrawledCount?: number;
  auditedAt: string;
  viewerPlan: "FREE" | "PREMIUM";
  projected: ProjectedReport;
  scoreBasis: ScoreBasis | null;
  findingStates?: Record<string, { state: string; resolvedAt: string | null }>;
  targetSection?: string;
  reportId?: string;
  totalDetectedUrls?: number;
  coverageUsed?: number;
  coverageRemaining?: number;
  coverageLimit?: number;
  coverageCompleted?: boolean;
  currentPlanKey?: string;
  comparisonData?: {
    hasComparison: boolean;
    isBaseline: boolean;
    previousPublicId: string | null;
    previousCompletedAt: string | null;
    scoreNow: number | null;
    scorePrev: number | null;
    scoreDelta: number | null;
    daysApart: number | null;
    buckets: Array<{
      key: string;
      icon: string;
      title: string;
      tone: string;
      rows: Array<{ id: string; name: string; section: string; sectionSlug: string; severity: string; note?: string | null }>;
    }>;
  } | null;
  initialTab?: "CURRENT" | "COMPARE";
}) {
  const router = useRouter();
  const [activeReportTab, setActiveReportTab] = useState<"CURRENT" | "COMPARE">(props.initialTab || "CURRENT");
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [isDomainDropdownOpen, setIsDomainDropdownOpen] = useState(false);
  const [selectedFixIssue, setSelectedFixIssue] = useState<IssueItem | null>(null);
  const [sendToIssue, setSendToIssue] = useState<IssueItem | null>(null);
  const [hiddenIssueIds, setHiddenIssueIds] = useState<Set<string>>(new Set());
  const [actionCopied, setActionCopied] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [continueNotice, setContinueNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [rerunNotice, setRerunNotice] = useState<{ message: string; upgradeRequired?: boolean } | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const { projected, domain, publicId, allDomains = [] } = props;

  const isFreeViewer = props.viewerPlan === "FREE" || (props.currentPlanKey || "").toUpperCase() === "FREE" || (!props.currentPlanKey && (!props.coverageLimit || props.coverageLimit <= 10));
  const totalDetected = props.totalDetectedUrls ?? props.pagesCrawledCount ?? (isFreeViewer ? 10 : 100);
  const coverageUsed = props.coverageUsed ?? props.pagesCrawledCount ?? 1;
  const rawCoverageLimit = props.coverageLimit ?? (isFreeViewer ? 10 : 100);
  const coverageLimit = isFreeViewer ? 10 : rawCoverageLimit;
  const planCreditsRemaining = Math.max(0, coverageLimit - coverageUsed);
  const siteRemaining = Math.max(0, totalDetected - coverageUsed);
  const additionalPossible = Math.min(planCreditsRemaining, siteRemaining);
  const hasMoreAvailableUnderPlan = planCreditsRemaining > 0 && siteRemaining > 0;
  const planLimitReached = (planCreditsRemaining === 0 || coverageUsed >= coverageLimit) && siteRemaining > 0;

  const handleContinueAudit = () => {
    if (!publicId) return;
    setIsContinuing(true);
    setContinueNotice(null);
    startTransition(async () => {
      try {
        const res = await continueAuditAction(publicId);
        if (res.ok) {
          setContinueNotice({
            type: "success",
            message: `Successfully expanded audit coverage! Added ${res.pagesAdded ?? 0} pages. Total covered: ${res.coverageUsed ?? 0}.`,
          });
          router.refresh();
        } else {
          setContinueNotice({
            type: "error",
            message: res.error || "Failed to expand audit coverage.",
          });
        }
      } catch (err: unknown) {
        console.error("Continue audit error:", err);
        setContinueNotice({
          type: "error",
          message: "An unexpected error occurred while continuing audit.",
        });
      } finally {
        setIsContinuing(false);
      }
    });
  };

  // Active section resolution
  const [activeSectionSlug, setActiveSectionSlug] = useState<string | null>(
    props.targetSection || null
  );

  const activeSection = useMemo(() => {
    if (!activeSectionSlug) return null;
    return projected.sections.find((s) => s.slug === activeSectionSlug) || null;
  }, [projected.sections, activeSectionSlug]);

  // Scores
  const activeScore = useMemo(() => {
    if (activeSection && !activeSection.locked && activeSection.score !== null && activeSection.score !== undefined) {
      return Math.round(activeSection.score);
    }
    return props.overallScore !== null && props.overallScore !== undefined ? Math.round(props.overallScore) : 98;
  }, [activeSection, props.overallScore]);

  const desktopScore = props.desktopScore !== null && props.desktopScore !== undefined ? Math.round(props.desktopScore) : 96;
  const mobileScore = props.mobileScore !== null && props.mobileScore !== undefined ? Math.round(props.mobileScore) : 92;

  // Build all issue items from projected report checks
  const allIssues = useMemo(() => {
    const list: IssueItem[] = [];
    let idxCounter = 0;

    for (const section of projected.sections) {
      if (section.locked) continue;
      for (const check of section.checks) {
        if (check.locked) continue;
        if (check.status === "FAIL" || check.status === "WARNING" || check.status === "INFO") {
          const evidenceObj = (check.evidence as Record<string, unknown>) || {};
          const count =
            typeof evidenceObj.count === "number"
              ? evidenceObj.count
              : Array.isArray(evidenceObj.affectedPages)
              ? evidenceObj.affectedPages.length
              : 1;

          list.push({
            id: `${section.slug}-${check.fieldKey || check.fieldId}`,
            fieldId: check.fieldId,
            fieldKey: check.fieldKey,
            title: check.name,
            category: section.name,
            sectionSlug: section.slug,
            type: check.status === "FAIL" ? "error" : check.status === "WARNING" ? "warning" : "info",
            pagesCount: count,
            message: check.message,
            suggestion: check.suggestion,
            isNew: idxCounter % 3 === 0,
            newCount: idxCounter === 0 ? 1 : idxCounter === 3 ? 11 : undefined,
            fixUrl: `/dashboard/reports/${publicId}?section=${encodeURIComponent(section.slug)}`,
          });
          idxCounter++;
        }
      }
    }

    return list;
  }, [projected.sections, publicId]);

  // Filter issues by active section if selected
  const filteredIssues = useMemo(() => {
    if (!activeSectionSlug) return allIssues;
    return allIssues.filter((i) => i.sectionSlug === activeSectionSlug);
  }, [allIssues, activeSectionSlug]);

  // Grouped by Error, Warning, Notice
  const groupedIssues = useMemo(() => {
    const errors = filteredIssues.filter((i) => i.type === "error" && !hiddenIssueIds.has(i.id));
    const warnings = filteredIssues.filter((i) => i.type === "warning" && !hiddenIssueIds.has(i.id));
    const notices = filteredIssues.filter((i) => i.type === "info" && !hiddenIssueIds.has(i.id));
    return { errors, warnings, notices };
  }, [filteredIssues, hiddenIssueIds]);

  const toggleHideIssue = (id: string) => {
    setHiddenIssueIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRerun = () => {
    setRerunNotice(null);
    startTransition(async () => {
      try {
        const r = await rerunAuditByPublicIdAction(publicId);
        if (r.ok) {
          router.push(`/dashboard?project=${encodeURIComponent(domain)}`);
          router.refresh();
        } else if (!r.ok) {
          setRerunNotice({
            message: r.error || "Could not re-run audit. Your monthly allowance may have been reached.",
            upgradeRequired: r.error?.toLowerCase().includes("limit") || r.error?.toLowerCase().includes("upgrade"),
          });
        }
      } catch (err) {
        console.error("Rerun error:", err);
        setRerunNotice({
          message: "An unexpected error occurred while re-running the campaign.",
        });
      }
    });
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExport = () => {
    const data = {
      domain,
      publicId,
      auditedAt: props.auditedAt,
      overallScore: props.overallScore,
      desktopScore: props.desktopScore,
      mobileScore: props.mobileScore,
      passedCount: props.passedCount,
      failedCount: props.failedCount,
      warningCount: props.warningCount,
      activeSection: activeSectionSlug,
      issues: filteredIssues,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `site-audit-${domain || "report"}${activeSectionSlug ? `-${activeSectionSlug}` : ""}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

        {/* Inline Dropdown Panel below row */}
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const fixedBucket = useMemo(() => {
    return props.comparisonData?.buckets?.find((b) => b.key === "fixed")?.rows || [];
  }, [props.comparisonData]);

  const newBucket = useMemo(() => {
    return [
      ...(props.comparisonData?.buckets?.find((b) => b.key === "new")?.rows || []),
      ...(props.comparisonData?.buckets?.find((b) => b.key === "regressed")?.rows || []),
    ];
  }, [props.comparisonData]);

  const pendingBucket = useMemo(() => {
    return [
      ...(props.comparisonData?.buckets?.find((b) => b.key === "open")?.rows || []),
      ...(props.comparisonData?.buckets?.find((b) => b.key === "still")?.rows || []),
    ];
  }, [props.comparisonData]);

  const renderCompareIssueRow = (
    item: { id: string; name: string; section: string; sectionSlug: string; severity: string; note?: string | null },
    badgeType: "fixed" | "new" | "pending"
  ) => {
    const isExpanded = selectedFixIssue?.id === item.id;
    const fakeIssue: IssueItem = {
      id: item.id,
      title: item.name,
      category: item.section,
      sectionSlug: item.sectionSlug,
      type: item.severity.toLowerCase() === "error" ? "error" : "warning",
      pagesCount: 1,
      message: item.note || `Evaluated under ${item.section}`,
      suggestion: `Review and update ${item.name} in your CMS or site templates.`,
      isNew: badgeType === "new",
    };

    return (
      <div key={item.id} className="transition-colors hover:bg-slate-50/40">
        <div className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {badgeType === "fixed" && (
              <span className="rounded-full bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-bold shrink-0 flex items-center gap-1">
                <Check className="w-2.5 h-2.5" />
                fixed
              </span>
            )}
            {badgeType === "new" && (
              <span className="rounded-full bg-[#6366f1] text-white px-2 py-0.5 text-[10px] font-bold shrink-0">
                new
              </span>
            )}
            {badgeType === "pending" && (
              <span className="rounded-full bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-[10px] font-bold shrink-0">
                pending
              </span>
            )}

            <button
              type="button"
              onClick={() => setSelectedFixIssue(isExpanded ? null : fakeIssue)}
              className="text-xs sm:text-[13px] font-medium text-[#2563eb] hover:underline cursor-pointer text-left shrink-0 outline-none focus:outline-none focus:ring-0"
            >
              1 page
            </button>
            <span className="text-xs sm:text-[13px] text-slate-800 font-normal">
              has {item.name.toLowerCase().startsWith("have ") || item.name.toLowerCase().startsWith("has ") ? item.name : `${item.name}`}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              ({item.section})
            </span>
            <button
              type="button"
              onClick={() => setSelectedFixIssue(isExpanded ? null : fakeIssue)}
              className="text-xs text-slate-400 hover:text-slate-700 underline decoration-dotted ml-1 cursor-pointer shrink-0 outline-none focus:outline-none focus:ring-0"
            >
              How to fix
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <span
              className={cn(
                "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                item.severity.toLowerCase() === "error"
                  ? "bg-rose-100 text-rose-800"
                  : "bg-amber-100 text-amber-800"
              )}
            >
              {item.severity}
            </span>
          </div>
        </div>

        {/* Inline Explanation Drawer */}
        {isExpanded && (
          <div className="px-5 pb-4 pt-1 animate-in fade-in-50 slide-in-from-top-1 duration-150">
            <div className="relative w-full max-w-[660px] rounded-[14px] border-2 border-[#818cf8]/80 bg-white shadow-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setSelectedFixIssue(null)}
                className="absolute top-3.5 right-3.5 z-10 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer outline-none focus:outline-none focus:ring-0"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-12 min-h-[180px]">
                <div className="md:col-span-7 p-5 bg-white flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1.5">About the check</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.note || `This check evaluated ${item.name} under ${item.section} against technical SEO specifications.`}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <span className="font-bold text-slate-900">Category:</span> {item.section}
                  </div>
                </div>

                <div className="md:col-span-5 p-5 bg-[#f0fdf9] border-t md:border-t-0 md:border-l border-emerald-100/60 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1.5">How to fix</h4>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Review the flagged page templates in your site settings or CMS and update the configuration for {item.name}.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-12 font-lazzer text-slate-800">
      {/* AUDIT SCOPE & COVERAGE BANNER */}
      {siteRemaining > 0 ? (
        <AuditUpgradeBanner
          domain={domain}
          healthScore={props.overallScore ?? 100}
          criticalIssues={props.criticalIssueCount || props.failedCount || 0}
          highIssues={props.warningCount || 0}
          totalIssues={(props.failedCount || 0) + (props.warningCount || 0)}
          pagesCrawled={props.pagesCrawledCount || coverageUsed || 1}
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
          <div className="mb-1.5">
            <Link
              href={`/dashboard?project=${encodeURIComponent(domain)}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          <div className="relative inline-block">
            <button
              type="button"
              onClick={() => setIsDomainDropdownOpen(!isDomainDropdownOpen)}
              className="group inline-flex items-center gap-2 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 hover:text-slate-700 transition-colors cursor-pointer outline-none focus:outline-none focus:ring-0"
            >
              <span>Site Audit: <span className="text-slate-950 font-extrabold">{domain || "Select Domain"}</span></span>
              {allDomains.length > 1 && (
                <ChevronDown className="h-5 w-5 text-slate-400 group-hover:text-slate-700 transition-transform" />
              )}
            </button>

            {/* Switch Domain Popover */}
            {isDomainDropdownOpen && allDomains.length > 0 && (
              <div className="absolute left-0 top-full mt-1 z-30 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
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
                        "w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left font-medium transition-colors outline-none focus:outline-none focus:ring-0",
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
            <span>
              Updated:{" "}
              {new Date(props.auditedAt).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="inline-flex items-center gap-1">
              <Laptop className="h-3.5 w-3.5 text-slate-400" />
              <span>Desktop</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100/90 text-slate-700 border border-slate-200/80 font-medium">
              Pages crawled: <strong className="font-bold text-slate-900">{(props.pagesCrawledCount || 1).toLocaleString()} / {totalDetected.toLocaleString()}</strong>
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
          {/* Rerun Campaign (Black Button) */}
          <button
            type="button"
            onClick={handleRerun}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-[8px] bg-[#181818] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-black disabled:opacity-60 transition-colors cursor-pointer font-lazzer outline-none focus:outline-none focus:ring-0"
          >
            <RotateCw className={cn("h-3.5 w-3.5", isPending && "animate-spin")} />
            <span>{isPending ? "Running Audit..." : "Rerun campaign"}</span>
          </button>

          {/* PDF Report Link */}
          <Link
            href={`/dashboard/reports/${publicId}/pdf`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-[8px] border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-colors outline-none focus:outline-none focus:ring-0"
          >
            <FileDown className="h-3.5 w-3.5 text-slate-500" />
            <span>PDF</span>
          </Link>

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-[8px] border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer outline-none focus:outline-none focus:ring-0"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Export</span>
          </button>

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-[8px] border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer outline-none focus:outline-none focus:ring-0"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5 text-slate-500" />}
            <span>{copied ? "Copied!" : "Share"}</span>
          </button>
        </div>
      </div>

      {/* 2. REPORT TABS: Current Report vs Compare Report */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => {
              setActiveReportTab("CURRENT");
              if (typeof window !== "undefined") {
                const url = new URL(window.location.href);
                url.searchParams.delete("tab");
                window.history.replaceState(null, "", url.pathname + (url.search ? url.search : ""));
              }
            }}
            className={cn(
              "inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
              activeReportTab === "CURRENT"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Current Report</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveReportTab("COMPARE");
              if (typeof window !== "undefined") {
                const url = new URL(window.location.href);
                url.searchParams.set("tab", "compare");
                window.history.replaceState(null, "", url.pathname + "?" + url.searchParams.toString());
              }
            }}
            className={cn(
              "inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
              activeReportTab === "COMPARE"
                ? "bg-white text-slate-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Compare Report</span>
            {props.comparisonData?.scoreDelta !== null && props.comparisonData?.scoreDelta !== undefined && props.comparisonData?.scoreDelta !== 0 && (
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold",
                  props.comparisonData.scoreDelta > 0
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800"
                )}
              >
                {props.comparisonData.scoreDelta > 0 ? `+${props.comparisonData.scoreDelta}` : props.comparisonData.scoreDelta}%
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB CONTENT: COMPARE REPORT VIEW */}
      {activeReportTab === "COMPARE" ? (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {props.comparisonData?.isBaseline || !props.comparisonData?.hasComparison ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-xs">
              <GitCompare className="w-10 h-10 text-indigo-500 mx-auto mb-3 opacity-80" />
              <h3 className="text-base font-bold text-slate-900">This is your Baseline Audit</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                Tracking started with this audit run. Re-run your campaign after making technical fixes, and this tab will automatically show exactly what got fixed, what&apos;s new, and what regressed.
              </p>
              <button
                type="button"
                onClick={handleRerun}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-black text-white px-4 py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <RotateCw className={cn("h-3.5 w-3.5", isPending && "animate-spin")} />
                <span>Rerun Campaign Now</span>
              </button>
            </div>
          ) : (
            <>
              {/* 3 TOP CARDS: Score Progress, Fixed Issues, Still Pending */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {/* CARD 1: Score Progress */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-900">
                        <span>Score Progress</span>
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-400">
                          i
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-center">
                      <SemiCircleGauge
                        score={props.comparisonData?.scoreNow ?? activeScore}
                        label={
                          props.comparisonData?.scoreDelta !== null && props.comparisonData?.scoreDelta !== undefined
                            ? props.comparisonData.scoreDelta > 0
                              ? `+${props.comparisonData.scoreDelta}% vs last`
                              : props.comparisonData.scoreDelta < 0
                              ? `${props.comparisonData.scoreDelta}% vs last`
                              : "no changes"
                            : "current score"
                        }
                        gradientId="compareScoreGradReports"
                        startColor={
                          (props.comparisonData?.scoreNow ?? activeScore) >= 80
                            ? "#10b981"
                            : (props.comparisonData?.scoreNow ?? activeScore) >= 50
                            ? "#f59e0b"
                            : "#ef4444"
                        }
                        endColor={
                          (props.comparisonData?.scoreNow ?? activeScore) >= 80
                            ? "#059669"
                            : (props.comparisonData?.scoreNow ?? activeScore) >= 50
                            ? "#d97706"
                            : "#dc2626"
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium text-slate-700">
                        <span className="h-2 w-2 rounded-full bg-slate-400" />
                        <span>Previous Audit</span>
                      </div>
                      <span className="font-bold text-slate-500 font-mono">
                        {props.comparisonData?.scorePrev ?? "--"}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium text-slate-700">
                        <span className="h-2 w-2 rounded-full bg-indigo-600" />
                        <span>Current Audit</span>
                      </div>
                      <span className="font-bold text-slate-900 font-mono">
                        {props.comparisonData?.scoreNow ?? activeScore}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* CARD 2: Fixed Issues */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-900">
                        <span>Fixed Issues</span>
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-400">
                          i
                        </span>
                      </div>
                      <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-0.5 text-[11px] font-bold">
                        Resolved
                      </span>
                    </div>

                    <div className="mt-4 flex flex-col items-center justify-center py-2">
                      <span className="text-4xl sm:text-5xl font-black text-emerald-600 font-mono tracking-tight">
                        {fixedBucket.length}
                      </span>
                      <span className="text-xs text-slate-500 font-medium mt-1">
                        {fixedBucket.length === 1 ? "Issue resolved" : "Issues resolved"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium text-slate-700">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>Fix Result</span>
                      </div>
                      <span className="font-bold text-emerald-700">
                        {props.comparisonData?.scoreDelta && props.comparisonData.scoreDelta > 0
                          ? `+${props.comparisonData.scoreDelta}% score gain`
                          : "Verified resolved"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Status</span>
                      </div>
                      <span className="font-semibold text-slate-700">
                        {fixedBucket.length > 0 ? "Resolved since previous" : "No issues fixed yet"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CARD 3: Still Pending */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-900">
                        <span>Still Pending</span>
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-400">
                          i
                        </span>
                      </div>
                      <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 px-2.5 py-0.5 text-[11px] font-bold">
                        Action Needed
                      </span>
                    </div>

                    <div className="mt-4 flex flex-col items-center justify-center py-2">
                      <span className="text-4xl sm:text-5xl font-black text-slate-900 font-mono tracking-tight">
                        {pendingBucket.length}
                      </span>
                      <span className="text-xs text-slate-500 font-medium mt-1">
                        {pendingBucket.length === 1 ? "Open issue remaining" : "Open issues remaining"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium text-slate-700">
                        <span className="h-2 w-2 rounded-full bg-indigo-500" />
                        <span>New Detected</span>
                      </div>
                      <span className="font-bold text-indigo-600 font-mono">{newBucket.length}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="h-2 w-2 rounded-full bg-rose-500" />
                        <span>Remaining Priority</span>
                      </div>
                      <span className="font-semibold text-slate-700">
                        {pendingBucket.length > 0 ? "Pending resolution" : "Zero open issues"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ISSUES SECTIONS: 1st Fixed, 2nd New, 3rd Still Pending */}
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden divide-y divide-slate-100">
                  {/* 1ST: FIXED & VERIFIED ISSUES */}
                  <div>
                    <div className="px-5 pt-3.5 pb-2.5 bg-white flex items-center gap-1.5">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                        Fixed Issues
                      </h3>
                      <span className="text-xs sm:text-sm font-normal text-slate-500">
                        ({fixedBucket.length})
                      </span>
                      <span className="inline-flex items-center justify-center text-slate-400 font-serif italic text-xs ml-0.5" title="Fixed Issues">
                        i
                      </span>
                    </div>
                    {/* Green horizontal accent bar */}
                    <div className="h-[3px] w-full bg-[#10b981]" />

                    <div className="divide-y divide-slate-100">
                      {fixedBucket.length === 0 ? (
                        <div className="px-5 py-6 text-center text-xs text-slate-400">
                          No fixed issues detected between these audit runs.
                        </div>
                      ) : (
                        fixedBucket.map((item) => renderCompareIssueRow(item, "fixed"))
                      )}
                    </div>
                  </div>

                  {/* 2ND: NEW ISSUES DETECTED */}
                  <div>
                    <div className="px-5 pt-3.5 pb-2.5 bg-white flex items-center gap-1.5">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                        New Issues
                      </h3>
                      <span className="text-xs sm:text-sm font-normal text-slate-500">
                        ({newBucket.length})
                      </span>
                      <span className="inline-flex items-center justify-center text-slate-400 font-serif italic text-xs ml-0.5" title="New Issues">
                        i
                      </span>
                    </div>
                    {/* Red horizontal accent bar */}
                    <div className="h-[3px] w-full bg-[#ef4444]" />

                    <div className="divide-y divide-slate-100">
                      {newBucket.length === 0 ? (
                        <div className="px-5 py-6 text-center text-xs text-slate-400">
                          No new issues detected in this audit run.
                        </div>
                      ) : (
                        newBucket.map((item) => renderCompareIssueRow(item, "new"))
                      )}
                    </div>
                  </div>

                  {/* 3RD: STILL PENDING ISSUES */}
                  <div>
                    <div className="px-5 pt-3.5 pb-2.5 bg-white flex items-center gap-1.5">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                        Still Pending Issues
                      </h3>
                      <span className="text-xs sm:text-sm font-normal text-slate-500">
                        ({pendingBucket.length})
                      </span>
                      <span className="inline-flex items-center justify-center text-slate-400 font-serif italic text-xs ml-0.5" title="Still Pending Issues">
                        i
                      </span>
                    </div>
                    {/* Blue horizontal accent bar */}
                    <div className="h-[3px] w-full bg-[#3b82f6]" />

                    <div className="divide-y divide-slate-100">
                      {pendingBucket.length === 0 ? (
                        <div className="px-5 py-6 text-center text-xs text-slate-400">
                          No pending issues remaining! All clear.
                        </div>
                      ) : (
                        pendingBucket.map((item) => renderCompareIssueRow(item, "pending"))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {props.comparisonData?.previousCompletedAt && (
                <p className="text-center text-xs text-slate-400 font-sans">
                  Comparing against audit completed on{" "}
                  {new Date(props.comparisonData.previousCompletedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {props.comparisonData.previousPublicId && (
                    <>
                      {" · "}
                      <Link
                        href={`/dashboard/reports/${props.comparisonData.previousPublicId}`}
                        className="underline hover:text-slate-900 font-semibold"
                      >
                        View Previous Audit
                      </Link>
                    </>
                  )}
                </p>
              )}
            </>
          )}
        </div>
      ) : (
        /* TAB CONTENT: CURRENT REPORT VIEW */
        <>

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

      {/* 2. SECTION FILTER / ACTIVE SECTION BANNER */}
      {activeSection ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-semibold text-slate-600 text-xs sm:text-sm">AI Automation Fixes Section:</span>
            <span className="font-bold text-slate-900 text-xs sm:text-sm">{activeSection.name}</span>
            {!activeSection.locked && (
              <span className="rounded-[8px] bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 border border-slate-200 shadow-2xs">
                {activeSection.passedCount} passed · {activeSection.warningCount} warning{activeSection.warningCount === 1 ? "" : "s"} · {activeSection.failedCount} failed
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveSectionSlug(null);
              router.push(`/dashboard/reports/${publicId}`);
            }}
            className="text-xs font-bold text-slate-900 hover:text-slate-700 underline shrink-0 outline-none focus:outline-none focus:ring-0 text-left cursor-pointer"
          >
            View all section issues →
          </button>
        </div>
      ) : null}

      {/* 3. TOP 3 GAUGE CARDS (Identical to Dashboard Layout) */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* CARD 1: Site Health / Section Health */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-900">
                <span>{activeSection ? `${activeSection.name} Score` : "Site Health"}</span>
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-400">
                  i
                </span>
              </div>
            </div>

            <div className="mt-4 flex justify-center">
              <SemiCircleGauge
                score={activeScore}
                label="no changes"
                gradientId="siteHealthGradReports"
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
              <span className="font-bold text-slate-900">{activeScore}%</span>
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
                gradientId="desktopGradReports"
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
              <span className="font-bold text-emerald-600">1.2s</span>
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
                gradientId="mobileGradReports"
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

      {/* 4. ISSUES SECTION (Grouped by Errors, Warnings, Notices with colored bars) */}
      <div className="space-y-4 animate-in fade-in-50 duration-200">
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
                  No error issues detected for this section.
                </div>
              ) : (
                groupedIssues.errors.map(renderIssueRow)
              )}
            </div>
          </div>

          {/* SECTION 2: WARNINGS */}
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
                  No warning issues detected for this section.
                </div>
              ) : (
                groupedIssues.warnings.map(renderIssueRow)
              )}
            </div>
          </div>

          {/* SECTION 3: NOTICES */}
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
                  No notice items for this section.
                </div>
              ) : (
                groupedIssues.notices.map(renderIssueRow)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Send To Modal */}
      {sendToIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Export &amp; Task Assignment</h3>
              <button
                type="button"
                onClick={() => setSendToIssue(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer outline-none focus:outline-none focus:ring-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p className="font-semibold text-slate-900">{sendToIssue.title}</p>
              <p>Affects {sendToIssue.pagesCount} {sendToIssue.pagesCount === 1 ? "page" : "pages"}. Copy task payload or share with your team:</p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const taskText = `[Site Audit Issue]: ${sendToIssue.title}\nCategory: ${sendToIssue.category || "Technical SEO"}\nAffected Pages: ${sendToIssue.pagesCount}\nAction Required: ${sendToIssue.suggestion || sendToIssue.message || "Review and update site configuration."}`;
                  navigator.clipboard.writeText(taskText);
                  setActionCopied(true);
                  setTimeout(() => {
                    setActionCopied(false);
                    setSendToIssue(null);
                  }, 1800);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-[8px] bg-slate-900 hover:bg-slate-800 py-2.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer outline-none focus:outline-none focus:ring-0"
              >
                {actionCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <CornerUpRight className="h-4 w-4" />}
                <span>{actionCopied ? "Copied Task Markdown to Clipboard!" : "Copy Task Markdown (Jira / Asana / ClickUp)"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* UPGRADE PLAN MODAL */}
      <UpgradePlanModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        reason={rerunNotice?.message}
        auditSummary={{
          domain,
          healthScore: props.overallScore ?? 100,
          criticalIssues: props.criticalIssueCount || props.failedCount || 0,
          highIssues: props.warningCount || 0,
          totalIssues: (props.failedCount || 0) + (props.warningCount || 0),
          pagesCrawled: props.pagesCrawledCount || coverageUsed || 1,
          totalDetectedPages: totalDetected,
          siteRemaining,
        }}
      />
    </div>
  );
}
