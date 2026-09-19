"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  FileText,
  Sparkles,
  Users,
  Key,
  Layers,
  ChevronDown,
  ChevronsUpDown,
  Search,
  Plus,
  Check,
  Globe,
  CheckCircle2,
  SearchCheck,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { rescanWebsiteAction } from "@/app/dashboard/reports/actions";
import { scoreColor } from "@/components/report/score-ring";

const DEFAULT_REPORT_SECTIONS = [
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
    if (!newUrlInput.trim()) return;

    setIsAnalyzing(true);
    setModalFeedback(null);

    const res = await rescanWebsiteAction(newUrlInput.trim());

    if (res.ok && res.redirectTo) {
      const extractedDomain = extractDomain(newUrlInput);
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

  return (
    <>
      <aside className="sticky top-0 h-screen w-64 border-r border-slate-200 bg-white flex flex-col shrink-0 overflow-hidden font-sans select-none">
        {/* 1. FIXED TOP: Brand Logo Header + Project Selector + Main Navigation Buttons */}
        <div className="shrink-0 bg-white z-10">
          {/* Top Compact Brand Header */}
          <div className="flex h-[52px] items-center gap-2.5 px-4 border-b border-slate-200 shrink-0 bg-white">
            <img
              src="/images/rank_writers_logo.png"
              alt="The Rank Writers logo"
              className="h-6 w-6 object-contain shrink-0"
            />
            <span className="font-display text-sm font-bold tracking-tight text-slate-900 whitespace-nowrap">
              The Rank Writers
            </span>
          </div>

          {/* Project Selector Section - Searchable Combobox */}
          <div className="px-3 pt-3 pb-2 border-b border-slate-100 relative" ref={dropdownRef}>
            <div className="px-2 mb-1 text-[11px] font-display font-bold uppercase tracking-wider text-slate-400">
              PROJECT
            </div>

            {/* Trigger Button */}
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-2.5 text-xs font-semibold text-slate-800 shadow-2xs hover:border-slate-300 focus:border-[#FF4D00] focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 transition-all text-left"
            >
              <span className="truncate pr-2 font-bold font-sans text-slate-900">
                {selectedProject || "Select or Add Project"}
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Floating Dropdown Popover */}
            {isDropdownOpen && (
              <div className="absolute left-3 right-3 top-full mt-1 z-50 rounded-xl border border-slate-200 bg-white p-2 shadow-xl space-y-2 animate-in fade-in duration-150">
                {/* Search Input inside Dropdown */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects..."
                    className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#FF4D00] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF4D00]"
                    autoFocus
                  />
                </div>

                {/* Projects List */}
                <div className="max-h-[175px] overflow-y-auto space-y-0.5 divide-y divide-slate-50 pr-0.5">
                  {filteredProjects.length === 0 ? (
                    <div className="px-3 py-2.5 text-center text-xs text-slate-400 font-sans">
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
                            "w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left font-medium transition-colors font-sans",
                            isSelected
                              ? "bg-orange-50 text-[#FF4D00] font-bold"
                              : "text-slate-700 hover:bg-slate-100"
                          )}
                        >
                          <span className="truncate pr-2">{proj}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-[#FF4D00] shrink-0" />}
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
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#FF6B00] to-[#FF3D00] px-3 py-2 text-xs font-display font-bold text-white shadow-2xs hover:opacity-95 transition-opacity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Project</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons Header */}
          <div className="px-3 pt-3 pb-1 space-y-1.5">
            <div className="px-2 text-[11px] font-display font-bold uppercase tracking-wider text-slate-400">
              NAVIGATION
            </div>

            {/* 1. SEO Dashboard */}
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-display font-bold uppercase tracking-wide transition-all shadow-xs",
                pathname === "/dashboard"
                  ? "bg-gradient-to-r from-[#FF6B00] to-[#FF3D00] text-white"
                  : "bg-orange-50/70 text-[#FF4D00] hover:bg-orange-100/80"
              )}
            >
              <BarChart3 className="h-4 w-4 shrink-0" />
              <span>SEO DASHBOARD</span>
            </Link>

            {/* 2. Page Audit */}
            <Link
              href={selectedProject ? `/dashboard/reports?project=${encodeURIComponent(selectedProject)}` : "/dashboard/reports"}
              onClick={(e) => handleSidebarItemClick(e)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-display font-bold uppercase tracking-wide transition-all",
                pathname.startsWith("/dashboard/reports")
                  ? "bg-gradient-to-r from-[#FF6B00] to-[#FF3D00] text-white shadow-xs"
                  : "bg-orange-50/70 text-[#FF4D00] hover:bg-orange-100/80"
              )}
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span>PAGE AUDIT</span>
            </Link>

            {/* 3. Backlinks */}
            <Link
              href={selectedProject ? `/dashboard/backlinks?project=${encodeURIComponent(selectedProject)}` : "/dashboard/backlinks"}
              onClick={(e) => handleSidebarItemClick(e)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-display font-bold uppercase tracking-wide transition-all",
                pathname.startsWith("/dashboard/backlinks")
                  ? "bg-gradient-to-r from-[#FF6B00] to-[#FF3D00] text-white shadow-xs"
                  : "bg-orange-50/70 text-[#FF4D00] hover:bg-orange-100/80"
              )}
            >
              <Link2 className="h-4 w-4 shrink-0" />
              <span>BACKLINKS</span>
            </Link>

            {/* 4. AI Automation Fixes Accordion Header */}
            <button
              type="button"
              onClick={() => setAiFixesOpen(!aiFixesOpen)}
              className="flex w-full items-center justify-between rounded-xl bg-orange-50/70 px-3.5 py-2.5 text-xs font-display font-bold uppercase tracking-wide text-[#FF4D00] hover:bg-orange-100/80 transition-all"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>AI AUTOMATION FIXES</span>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  aiFixesOpen && "rotate-180"
                )}
              />
            </button>
          </div>
        </div>

        {/* 2. MIDDLE SCROLLABLE: Dynamic Sub-items from Master Admin Report Builder */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
          {aiFixesOpen && (
            <div className="space-y-0.5 pl-3 border-l-2 border-slate-100 my-1 font-sans">
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
                    onClick={(e) => handleSidebarItemClick(e, item.slug)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] font-semibold font-sans transition-colors cursor-pointer",
                      isSelected
                        ? "bg-orange-50/80 text-[#FF4D00]"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <span className="truncate pr-2" title={item.name}>{item.name}</span>
                    {Boolean(selectedProject) && (
                      <span
                        className="shrink-0 font-semibold tabular-nums text-[11px]"
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

        {/* 3. FIXED BOTTOM: Competitors, Keywords, AI Schema Markup */}
        <div className="shrink-0 bg-white border-t border-slate-100 px-3 py-3 space-y-1.5">
          {/* Competitors */}
          <Link
            href={selectedProject ? `/dashboard/websites?project=${encodeURIComponent(selectedProject)}` : "/dashboard/websites"}
            onClick={(e) => handleSidebarItemClick(e)}
            className="flex items-center gap-3 rounded-xl bg-orange-50/70 px-3.5 py-2.5 text-xs font-display font-bold uppercase tracking-wide text-[#FF4D00] hover:bg-orange-100/80 transition-all"
          >
            <Users className="h-4 w-4 shrink-0" />
            <span>COMPETITORS</span>
          </Link>

          {/* Keywords */}
          <Link
            href={selectedProject ? `/dashboard/profile?project=${encodeURIComponent(selectedProject)}` : "/dashboard/profile"}
            onClick={(e) => handleSidebarItemClick(e)}
            className="flex items-center gap-3 rounded-xl bg-orange-50/70 px-3.5 py-2.5 text-xs font-display font-bold uppercase tracking-wide text-[#FF4D00] hover:bg-orange-100/80 transition-all"
          >
            <Key className="h-4 w-4 shrink-0" />
            <span>KEYWORDS</span>
          </Link>

          {/* AI Schema Markup */}
          <Link
            href={selectedProject ? `/dashboard/billing?project=${encodeURIComponent(selectedProject)}` : "/dashboard/billing"}
            onClick={(e) => handleSidebarItemClick(e)}
            className="flex items-center gap-3 rounded-xl bg-orange-50/70 px-3.5 py-2.5 text-xs font-display font-bold uppercase tracking-wide text-[#FF4D00] hover:bg-orange-100/80 transition-all"
          >
            <Layers className="h-4 w-4 shrink-0" />
            <span>AI SCHEMA MARKUP</span>
          </Link>
        </div>
      </aside>

      {/* PROJECT SELECTION / NEW AUDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 font-sans">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 border border-slate-100 relative">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-[#FF4D00]">
                  <Globe className="h-4.5 w-4.5" />
                </div>
                <h3 className="font-display text-base font-bold text-slate-900">
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
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold font-sans">
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
                      <label className="text-xs font-bold text-slate-700 font-sans">
                        Select an Existing Project
                      </label>
                      <select
                        value={selectedExistingProj}
                        onChange={(e) => setSelectedExistingProj(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-[#FF4D00] focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 font-sans bg-white cursor-pointer"
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
                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors font-sans cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF3D00] px-5 py-2 text-xs font-display font-bold text-white shadow-md hover:opacity-95 transition-all cursor-pointer"
                      >
                        <span>Open Project</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleAnalyzeSubmit} className="space-y-4 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 font-sans">
                        Website URL or Domain
                      </label>
                      <input
                        type="text"
                        value={newUrlInput}
                        onChange={(e) => setNewUrlInput(e.target.value)}
                        placeholder="e.g. example.com"
                        required
                        autoFocus
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#FF4D00] focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 font-sans"
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
                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors font-sans cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isAnalyzing}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF3D00] px-5 py-2 text-xs font-display font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
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
                  <label className="text-xs font-bold text-slate-700 font-sans">
                    Get Your Site Audit
                  </label>
                  <p className="text-xs text-slate-500 font-sans">
                    Enter your website domain below to start your health & performance audit.
                  </p>
                  <input
                    type="text"
                    value={newUrlInput}
                    onChange={(e) => setNewUrlInput(e.target.value)}
                    placeholder="Enter website domain (e.g. example.com)"
                    required
                    autoFocus
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#FF4D00] focus:outline-none focus:ring-2 focus:ring-[#FF4D00]/20 font-sans"
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
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors font-sans cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAnalyzing}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF3D00] px-5 py-2 text-xs font-display font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
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
