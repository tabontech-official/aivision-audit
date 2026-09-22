"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  FileText,
  Sparkles,
  Key,
  ChevronDown,
  ChevronsUpDown,
  Search,
  Plus,
  Minus,
  Check,
  Globe,
  CheckCircle2,
  SearchCheck,
  Link2,
  Code2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { rescanWebsiteAction } from "@/app/dashboard/reports/actions";
import { scoreColor } from "@/components/report/score-ring";

const DEFAULT_REPORT_SECTIONS = [
  { name: "Page Speed & Core Web Vitals", slug: "page-speed", count: 10 },
  { name: "Technical SEO Core", slug: "technical-seo-core", count: 10 },
  { name: "SEO Fundamentals", slug: "seo-fundamentals", count: 16 },
  { name: "Crawlability", slug: "crawlability", count: 10 },
  { name: "Indexability", slug: "indexability", count: 10 },
  { name: "Redirects & URL Health", slug: "redirects-url-health", count: 10 },
  { name: "XML Sitemap", slug: "xml-sitemap", count: 10 },
  { name: "HTTP & Server Delivery", slug: "http-server-delivery", count: 10 },
  { name: "Internal Linking", slug: "internal-linking", count: 10 },
  { name: "Content Quality", slug: "content-quality", count: 3 },
  { name: "Canonicalization", slug: "canonicalization", count: 10 },
  { name: "URL Architecture", slug: "url-architecture", count: 10 },
  { name: "AI Search Visibility", slug: "ai-visibility", count: 7 },
  { name: "Robots & Crawler Directives", slug: "robots-crawler-directives", count: 10 },
  { name: "Images & Alternative Text", slug: "images-alternative-text", count: 10 },
  { name: "Headings & Semantic Structure", slug: "headings-semantic-structure", count: 10 },
  { name: "Shopify Performance & App Bloat", slug: "shopify-performance", count: 8 },
  { name: "Mobile Usability", slug: "mobile", count: 10 },
  { name: "Shopify Store Policies", slug: "shopify-policies", count: 7 },
  { name: "Shopify Product Page Readiness", slug: "shopify-product-readiness", count: 10 },
  { name: "Shopify URL & Indexing Hygiene", slug: "shopify-url-hygiene", count: 5 },
  { name: "AI Discoverability", slug: "ai-discoverability", count: 4 },
];

function extractDomain(url: string): string {
  let cleaned = url.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  const parts = cleaned.split("/");
  const domainPart = parts[0] ? parts[0].split("?")[0]?.split("#")[0] : "";
  return domainPart || cleaned;
}

export function DashboardSidebar({
  email: _email,
  name: _name,
  initialProjects = [],
  reportSections = [],
  projectSectionScores = {},
}: {
  email: string;
  name: string | null;
  plan?: string;
  initialProjects?: string[];
  reportSections?: { name: string; slug: string; count: number }[];
  projectSectionScores?: Record<string, Record<string, number | null>>;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentProjectParam = searchParams.get("project");
  const currentSectionParam = searchParams.get("section");

  // Section collapse state
  const [overviewOpen, setOverviewOpen] = useState(true);
  const [optimizationOpen, setOptimizationOpen] = useState(true);
  const [growthOpen, setGrowthOpen] = useState(true);
  const [aiFixesOpen, setAiFixesOpen] = useState(true);

  const [projects, setProjects] = useState<string[]>(initialProjects);
  const [selectedProject, setSelectedProject] = useState(
    currentProjectParam ?? initialProjects[0] ?? ""
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const activeSections = reportSections.length > 0 ? reportSections : DEFAULT_REPORT_SECTIONS;

  // Sync projects state if initialProjects changes
  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  // Sync selected project if URL query param or initialProjects change
  useEffect(() => {
    if (currentProjectParam) {
      setSelectedProject(currentProjectParam);
    } else if (initialProjects.length > 0 && (!selectedProject || !initialProjects.includes(selectedProject))) {
      setSelectedProject(initialProjects[0] ?? "");
    } else if (initialProjects.length === 0) {
      setSelectedProject("");
    }
  }, [currentProjectParam, initialProjects, selectedProject]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"existing" | "new">("existing");
  const [selectedExistingProj, setSelectedExistingProj] = useState<string>("");
  const [pendingSectionSlug, setPendingSectionSlug] = useState<string | null>(null);
  const [newUrlInput, setNewUrlInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<{
    type: "new" | "existing";
    message: string;
  } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered projects list
  const filteredProjects = projects.filter((p) =>
    p.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectProject = (proj: string) => {
    setSelectedProject(proj);
    setIsDropdownOpen(false);
    setSearchQuery("");
    router.push(`/dashboard?project=${encodeURIComponent(proj)}`);
  };

  // Open modal if user clicks menu item without selected project
  const handleSidebarItemClick = (e: React.MouseEvent, sectionSlug?: string) => {
    if (!selectedProject) {
      e.preventDefault();
      setPendingSectionSlug(sectionSlug || null);
      if (projects.length > 0) {
        setModalMode("existing");
        setSelectedExistingProj(projects[0] || "");
      } else {
        setModalMode("new");
      }
      setIsModalOpen(true);
    }
  };

  // Handle Existing Project Selection
  const handleSelectExistingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExistingProj) return;
    setSelectedProject(selectedExistingProj);
    setIsModalOpen(false);
    const targetUrl = pendingSectionSlug
      ? `/dashboard/reports?project=${encodeURIComponent(selectedExistingProj)}&section=${encodeURIComponent(pendingSectionSlug)}`
      : `/dashboard?project=${encodeURIComponent(selectedExistingProj)}`;
    router.push(targetUrl);
  };

  // Handle Project Analysis Submit (Real Audit Engine)
  const handleAnalyzeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let raw = newUrlInput.trim();
    if (!raw) return;
    if (!/^https?:\/\//i.test(raw)) {
      raw = `https://${raw}`;
    }

    setIsAnalyzing(true);
    setModalFeedback(null);

    const res = await rescanWebsiteAction(raw);

    if (res.ok && res.redirectTo) {
      const extractedDomain = extractDomain(raw);
      setProjects((prev) => (prev.includes(extractedDomain) ? prev : [extractedDomain, ...prev]));
      setSelectedProject(extractedDomain);
      setIsModalOpen(false);
      setNewUrlInput("");
      setIsAnalyzing(false);
      router.push(res.redirectTo);
    } else {
      setIsAnalyzing(false);
      setModalFeedback({
        type: "existing",
        message: !res.ok ? res.error : "Failed to start site audit. Check domain URL.",
      });
    }
  };

  const isDashboardActive = pathname === "/dashboard";
  const isReportsActive = pathname.startsWith("/dashboard/reports") && !currentSectionParam;
  const isSchemaActive = pathname.startsWith("/dashboard/schema");
  const isBillingActive = pathname.startsWith("/dashboard/billing");

  return (
    <>
      <aside className="sticky top-0 h-screen w-64 border-r border-slate-200/80 bg-white flex flex-col shrink-0 overflow-hidden font-lazzer select-none">
        {/* 1. TOP: Brand Logo Header */}
        <div className="flex h-[56px] items-center gap-2.5 px-4 border-b border-slate-100 shrink-0 bg-white">
          <img
            src="/images/logo.png"
            alt="The Rank Writers Logo"
            className="h-7 w-7 object-contain shrink-0"
          />
          <span className="font-lazzer text-sm sm:text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
            The Rank Writers
          </span>
        </div>

        {/* Project Selector - Clean Dropdown */}
        <div className="px-3 pt-3 pb-2 shrink-0 relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 py-1.5 pl-3 pr-2.5 text-xs font-semibold text-slate-800 shadow-2xs hover:bg-slate-100/70 hover:border-slate-300 focus:outline-none transition-all text-left"
          >
            <span className="truncate pr-2 font-medium text-slate-900">
              {selectedProject || "Select or Add Project"}
            </span>
            <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          </button>

          {/* Floating Dropdown Popover */}
          {isDropdownOpen && (
            <div className="absolute left-3 right-3 top-full mt-1 z-50 rounded-xl border border-slate-200 bg-white p-2 shadow-xl space-y-2 animate-in fade-in duration-150">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-500 focus:bg-white focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Projects List */}
              <div className="max-h-[175px] overflow-y-auto space-y-0.5 divide-y divide-slate-50 pr-0.5">
                {filteredProjects.length === 0 ? (
                  <div className="px-3 py-2 text-center text-xs text-slate-400">
                    {projects.length === 0
                      ? "No projects created yet."
                      : "No matching project."}
                  </div>
                ) : (
                  filteredProjects.map((proj) => {
                    const isSelected = proj === selectedProject;
                    return (
                      <button
                        key={proj}
                        type="button"
                        onClick={() => handleSelectProject(proj)}
                        className={cn(
                          "w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left font-medium transition-colors",
                          isSelected
                            ? "bg-slate-100 text-slate-950 font-bold"
                            : "text-slate-700 hover:bg-slate-100"
                        )}
                      >
                        <span className="truncate pr-2">{proj}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-slate-900 shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>

              {/* New Project Button */}
              <div className="pt-1.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsModalOpen(true);
                    setSearchQuery("");
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Project</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2. SCROLLABLE NAVIGATION LIST */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
          {/* SECTION 1: Overview */}
          <div>
            <button
              type="button"
              onClick={() => setOverviewOpen(!overviewOpen)}
              className="flex w-full items-center justify-between py-1.5 px-2 text-[13px] font-semibold text-slate-800 hover:text-slate-950 transition-colors cursor-pointer"
            >
              <span>Overview</span>
              <span className="flex h-4 w-4 items-center justify-center rounded border border-slate-300 text-slate-400">
                {overviewOpen ? (
                  <Minus className="h-2.5 w-2.5 stroke-[2.5]" />
                ) : (
                  <Plus className="h-2.5 w-2.5 stroke-[2.5]" />
                )}
              </span>
            </button>

            {overviewOpen && (
              <div className="space-y-0.5 mt-1">
                {/* Performance / SEO Dashboard */}
                <Link
                  href="/dashboard"
                  prefetch={true}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                    isDashboardActive
                      ? "bg-slate-100/90 text-slate-950 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  {isDashboardActive ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-slate-900 text-white shrink-0">
                      <BarChart3 className="h-3 w-3" />
                    </div>
                  ) : (
                    <BarChart3 className="h-4 w-4 text-slate-500 shrink-0" />
                  )}
                  <span className="truncate">Performance</span>
                </Link>

                {/* Page Audit */}
                <Link
                  href={selectedProject ? `/dashboard/reports?project=${encodeURIComponent(selectedProject)}` : "/dashboard/reports"}
                  prefetch={true}
                  onClick={(e) => handleSidebarItemClick(e)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                    isReportsActive
                      ? "bg-slate-100/90 text-slate-950 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  {isReportsActive ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-slate-900 text-white shrink-0">
                      <FileText className="h-3 w-3" />
                    </div>
                  ) : (
                    <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                  )}
                  <span className="truncate">Page Audit</span>
                </Link>
              </div>
            )}
          </div>

          <div className="my-2 border-t border-slate-100" />

          {/* SECTION 2: Optimization / Tools */}
          <div>
            <button
              type="button"
              onClick={() => setOptimizationOpen(!optimizationOpen)}
              className="flex w-full items-center justify-between py-1.5 px-2 text-[13px] font-semibold text-slate-800 hover:text-slate-950 transition-colors cursor-pointer"
            >
              <span>Optimization</span>
              <span className="flex h-4 w-4 items-center justify-center rounded border border-slate-300 text-slate-400">
                {optimizationOpen ? (
                  <Minus className="h-2.5 w-2.5 stroke-[2.5]" />
                ) : (
                  <Plus className="h-2.5 w-2.5 stroke-[2.5]" />
                )}
              </span>
            </button>

            {optimizationOpen && (
              <div className="space-y-0.5 mt-1">
                {/* Schema Markup */}
                <Link
                  href={selectedProject ? `/dashboard/schema?project=${encodeURIComponent(selectedProject)}` : "/dashboard/schema"}
                  prefetch={true}
                  onClick={(e) => handleSidebarItemClick(e)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                    isSchemaActive
                      ? "bg-slate-100/90 text-slate-950 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  {isSchemaActive ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-slate-900 text-white shrink-0">
                      <Code2 className="h-3 w-3" />
                    </div>
                  ) : (
                    <Code2 className="h-4 w-4 text-slate-500 shrink-0" />
                  )}
                  <span className="truncate">Schema Markup</span>
                </Link>

                {/* AI Automation Fixes Accordion Header */}
                <button
                  type="button"
                  onClick={() => setAiFixesOpen(!aiFixesOpen)}
                  className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Sparkles className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="truncate">AI Automation Fixes</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200 text-slate-400 shrink-0",
                      aiFixesOpen && "rotate-180"
                    )}
                  />
                </button>

                {aiFixesOpen && (
                  <div className="space-y-0.5 pl-4 border-l border-slate-200 my-1 ml-2.5">
                    {activeSections.map((item, idx) => {
                      const isSelected = currentSectionParam === item.slug;
                      const rawScore = selectedProject ? projectSectionScores[selectedProject]?.[item.slug] : null;
                      const displayValue = rawScore !== null && rawScore !== undefined ? Math.round(rawScore) : null;
                      const colorHex = displayValue !== null ? scoreColor(displayValue) : "#94a3b8";

                      return (
                        <Link
                          key={idx}
                          href={
                            selectedProject
                              ? `/dashboard/reports?project=${encodeURIComponent(selectedProject)}&section=${encodeURIComponent(item.slug)}`
                              : `/dashboard/reports?section=${encodeURIComponent(item.slug)}`
                          }
                          prefetch={true}
                          onClick={(e) => handleSidebarItemClick(e, item.slug)}
                          className={cn(
                            "flex items-center justify-between rounded-md px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer",
                            isSelected
                              ? "bg-slate-100 text-slate-950 font-semibold"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          )}
                        >
                          <span className="truncate pr-2" title={item.name}>{item.name}</span>
                          {Boolean(selectedProject) && (
                            <span
                              className="shrink-0 font-bold tabular-nums text-[11px]"
                              style={{ color: colorHex }}
                            >
                              {displayValue !== null ? displayValue : item.count}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="my-2 border-t border-slate-100" />

          {/* SECTION 3: Growth & Intelligence (Coming Soon Modules) */}
          <div>
            <button
              type="button"
              onClick={() => setGrowthOpen(!growthOpen)}
              className="flex w-full items-center justify-between py-1.5 px-2 text-[13px] font-semibold text-slate-800 hover:text-slate-950 transition-colors cursor-pointer"
            >
              <span>Growth</span>
              <span className="flex h-4 w-4 items-center justify-center rounded border border-slate-300 text-slate-400">
                {growthOpen ? (
                  <Minus className="h-2.5 w-2.5 stroke-[2.5]" />
                ) : (
                  <Plus className="h-2.5 w-2.5 stroke-[2.5]" />
                )}
              </span>
            </button>

            {growthOpen && (
              <div className="space-y-0.5 mt-1">
                {/* Backlinks */}
                <div
                  className="flex items-center justify-between rounded-lg px-2.5 py-2 text-[13px] font-medium text-slate-500 hover:bg-slate-50/60 select-none cursor-default"
                  title="Backlinks — Coming in next update"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Link2 className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="truncate">Backlinks</span>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 border border-slate-200 shrink-0">
                    Coming Soon
                  </span>
                </div>

                {/* Keywords */}
                <div
                  className="flex items-center justify-between rounded-lg px-2.5 py-2 text-[13px] font-medium text-slate-500 hover:bg-slate-50/60 select-none cursor-default"
                  title="Keywords — Coming in next update"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Key className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="truncate">Keywords</span>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 border border-slate-200 shrink-0">
                    Coming Soon
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. FOOTER: Upgrade Link */}
        <div className="shrink-0 bg-white border-t border-slate-100 px-3 py-2.5">
          <Link
            href={selectedProject ? `/dashboard/billing?project=${encodeURIComponent(selectedProject)}` : "/dashboard/billing"}
            prefetch={true}
            onClick={(e) => handleSidebarItemClick(e)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
              isBillingActive
                ? "bg-slate-100/90 text-slate-950 font-semibold"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            {isBillingActive ? (
              <div className="flex h-5 w-5 items-center justify-center rounded bg-slate-900 text-white shrink-0">
                <Zap className="h-3 w-3" />
              </div>
            ) : (
              <Zap className="h-4 w-4 text-slate-500 shrink-0" />
            )}
            <span className="truncate">Upgrade Plan</span>
          </Link>
        </div>
      </aside>

      {/* PROJECT SELECTION / NEW AUDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 font-lazzer">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 border border-slate-100 relative">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-900">
                  <Globe className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {projects.length > 0 ? "Select Project or Get Audit" : "Get Your Site Audit"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setModalFeedback(null);
                  setNewUrlInput("");
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </div>

            {/* If user has existing projects: Show Two Options */}
            {projects.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setModalMode("existing")}
                    className={cn(
                      "py-2 px-3 rounded-lg text-center transition-all cursor-pointer",
                      modalMode === "existing"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    Existing Project
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalMode("new")}
                    className={cn(
                      "py-2 px-3 rounded-lg text-center transition-all cursor-pointer",
                      modalMode === "new"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    )}
                  >
                    Get Another Audit Report
                  </button>
                </div>

                {modalMode === "existing" ? (
                  <form onSubmit={handleSelectExistingSubmit} className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        Select an Existing Project
                      </label>
                      <select
                        value={selectedExistingProj}
                        onChange={(e) => setSelectedExistingProj(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300/40 bg-white cursor-pointer"
                      >
                        {projects.map((proj) => (
                          <option key={proj} value={proj}>
                            {proj}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
                      >
                        <span>Open Project</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleAnalyzeSubmit} className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        Website URL or Domain
                      </label>
                      <input
                        type="text"
                        value={newUrlInput}
                        onChange={(e) => setNewUrlInput(e.target.value)}
                        placeholder="e.g. example.com"
                        required
                        autoFocus
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300/40"
                      />
                    </div>

                    {modalFeedback && (
                      <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 text-xs font-semibold">
                        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{modalFeedback.message}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isAnalyzing}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2 text-xs font-bold text-white shadow-md disabled:opacity-50 transition-all cursor-pointer"
                      >
                        {isAnalyzing ? (
                          <span>Analyzing...</span>
                        ) : (
                          <>
                            <SearchCheck className="h-4 w-4" />
                            <span>Analyze Website</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* If user has NO projects: Only show "Get Your Site Audit" option */
              <form onSubmit={handleAnalyzeSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Get Your Site Audit
                  </label>
                  <p className="text-xs text-slate-500">
                    Enter your website domain below to start your health & performance audit.
                  </p>
                  <input
                    type="text"
                    value={newUrlInput}
                    onChange={(e) => setNewUrlInput(e.target.value)}
                    placeholder="Enter website domain (e.g. example.com)"
                    required
                    autoFocus
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300/40"
                  />
                </div>

                {modalFeedback && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 text-xs font-semibold">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{modalFeedback.message}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAnalyzing}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2 text-xs font-bold text-white shadow-md disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isAnalyzing ? (
                      <span>Analyzing...</span>
                    ) : (
                      <>
                        <SearchCheck className="h-4 w-4" />
                        <span>Get Site Audit</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
