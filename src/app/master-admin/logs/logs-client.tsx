"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Info,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Code2,
  Clock,
  Layers,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

export type SerializedSystemLog = {
  id: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  category: string;
  message: string;
  reportId: string | null;
  websiteUrl: string | null;
  stage: string | null;
  durationMs: number | null;
  meta: Record<string, unknown> | null;
  stackTrace: string | null;
  createdAt: string;
};

export type SerializedAdminLog = {
  id: string;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  ipAddress: string | null;
  createdAt: string;
};

export function LogsClientView({
  systemLogs,
  adminLogs,
  totalSystemLogs,
  totalAdminLogs,
  categories,
}: {
  systemLogs: SerializedSystemLog[];
  adminLogs: SerializedAdminLog[];
  totalSystemLogs: number;
  totalAdminLogs: number;
  categories: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const activeTab = searchParams.get("tab") ?? "system";
  const search = searchParams.get("search") ?? "";
  const level = searchParams.get("level") ?? "";
  const category = searchParams.get("category") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const updateFilters = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === null || v === "") params.delete(k);
      else params.set(k, v);
    });
    // Reset page on filter change if search or category changes
    if (newParams.page === undefined) params.set("page", "1");
    startTransition(() => {
      router.push(`/master-admin/logs?${params.toString()}`);
    });
  };

  const getLevelBadge = (lvl: string) => {
    switch (lvl) {
      case "ERROR":
        return <Badge variant="critical" className="flex gap-1 items-center"><AlertCircle className="h-3 w-3" /> ERROR</Badge>;
      case "WARN":
        return <Badge variant="draft" className="flex gap-1 items-center"><AlertTriangle className="h-3 w-3" /> WARN</Badge>;
      case "DEBUG":
        return <Badge variant="neutral" className="flex gap-1 items-center"><Code2 className="h-3 w-3" /> DEBUG</Badge>;
      default:
        return <Badge variant="info" className="flex gap-1 items-center"><Info className="h-3 w-3" /> INFO</Badge>;
    }
  };

  const pageSize = 50;
  const currentTotal = activeTab === "system" ? totalSystemLogs : totalAdminLogs;
  const totalPages = Math.max(1, Math.ceil(currentTotal / pageSize));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Application & Execution Logs</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Live pipeline execution logs, stuck audit diagnoses, error tracebacks, and admin action logs.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          loading={pending}
          onClick={() => {
            startTransition(() => {
              router.refresh();
            });
          }}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Logs
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          type="button"
          onClick={() => updateFilters({ tab: "system" })}
          className={cn(
            "pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2",
            activeTab === "system"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-ink-muted hover:text-ink",
          )}
        >
          <Layers className="h-4 w-4" />
          System & Pipeline Logs
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {totalSystemLogs}
          </span>
        </button>
        <button
          type="button"
          onClick={() => updateFilters({ tab: "admin" })}
          className={cn(
            "pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2",
            activeTab === "admin"
              ? "border-brand-600 text-brand-600"
              : "border-transparent text-ink-muted hover:text-ink",
          )}
        >
          <Clock className="h-4 w-4" />
          Admin Activity Logs
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {totalAdminLogs}
          </span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 space-y-3 bg-white">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
            <input
              type="text"
              placeholder="Search website URL, message, report ID, error..."
              value={search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {activeTab === "system" && (
            <>
              {/* Level filter */}
              <select
                value={level}
                onChange={(e) => updateFilters({ level: e.target.value })}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-ink focus:border-brand-500 focus:outline-none"
              >
                <option value="">All Log Levels</option>
                <option value="ERROR">ERROR (Only Failures)</option>
                <option value="WARN">WARN (Warnings)</option>
                <option value="INFO">INFO (Normal Flow)</option>
                <option value="DEBUG">DEBUG</option>
              </select>

              {/* Category filter */}
              <select
                value={category}
                onChange={(e) => updateFilters({ category: e.target.value })}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-ink focus:border-brand-500 focus:outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </>
          )}

          {(search || level || category) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateFilters({ search: "", level: "", category: "" })}
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Logs Table / List */}
      {activeTab === "system" ? (
        <div className="card overflow-hidden">
          {systemLogs.length === 0 ? (
            <div className="py-12 text-center text-sm text-ink-muted">
              No system logs found matching your filters.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {systemLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <div
                    key={log.id}
                    className={cn(
                      "transition-colors",
                      log.level === "ERROR" ? "bg-rose-50/40 hover:bg-rose-50/70" : "hover:bg-slate-50/70",
                    )}
                  >
                    <div
                      className="flex items-start gap-3 p-4 cursor-pointer select-none"
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    >
                      <button type="button" className="mt-0.5 text-ink-muted">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>

                      <div className="shrink-0">{getLevelBadge(log.level)}</div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-secondary">
                          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-ink font-semibold">
                            {log.category}
                          </code>
                          {log.stage && (
                            <Badge variant="neutral">Stage: {log.stage}</Badge>
                          )}
                          {log.websiteUrl && (
                            <span className="flex items-center gap-1 text-brand-600 font-medium truncate max-w-xs" title={log.websiteUrl}>
                              <Globe className="h-3 w-3" /> {log.websiteUrl}
                            </span>
                          )}
                          {log.durationMs !== null && (
                            <span className="text-slate-500 font-mono">
                              ⏱ {log.durationMs}ms
                            </span>
                          )}
                        </div>

                        <p className={cn("text-sm font-medium leading-relaxed text-ink", log.level === "ERROR" && "text-rose-900")}>
                          {log.message}
                        </p>

                        {log.reportId && (
                          <div className="text-xs text-ink-muted font-mono flex items-center gap-2">
                            <span>Report ID: {log.reportId}</span>
                            <a
                              href={`/analyze/${log.reportId}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-brand-600 hover:underline flex items-center gap-0.5"
                            >
                              Inspect Analyze Page <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>

                      <time className="shrink-0 text-xs tabular-nums text-ink-muted">
                        {new Date(log.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </time>
                    </div>

                    {/* Detailed drawer */}
                    {isExpanded && (
                      <div className="border-t border-slate-200/60 bg-slate-900 p-4 font-mono text-xs text-slate-100 space-y-3">
                        {log.stackTrace && (
                          <div>
                            <div className="text-rose-400 font-semibold mb-1">Stack Trace:</div>
                            <pre className="overflow-x-auto rounded bg-slate-950 p-3 text-rose-300 leading-relaxed max-h-60">
                              {log.stackTrace}
                            </pre>
                          </div>
                        )}

                        {log.meta && Object.keys(log.meta).length > 0 && (
                          <div>
                            <div className="text-emerald-400 font-semibold mb-1">Metadata Payload:</div>
                            <pre className="overflow-x-auto rounded bg-slate-950 p-3 text-emerald-300">
                              {JSON.stringify(log.meta, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Admin logs view */
        <div className="card divide-y divide-slate-100 overflow-hidden">
          {adminLogs.length === 0 ? (
            <p className="p-8 text-center text-sm text-ink-muted">No admin activity logs found.</p>
          ) : (
            adminLogs.map((log) => (
              <details key={log.id} className="group p-4">
                <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4">
                  <span className="min-w-0 truncate text-sm">
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-ink font-semibold">
                      {log.action}
                    </code>{" "}
                    <span className="text-ink-secondary">{log.entityType}</span>{" "}
                    <span className="text-ink-muted">by {log.actorEmail ?? "system"}</span>
                  </span>
                  <time className="shrink-0 text-xs tabular-nums text-ink-muted">
                    {new Date(log.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </time>
                </summary>
                {(log.before !== null || log.after !== null) && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {log.before !== null && (
                      <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-xs text-slate-300">
                        before: {JSON.stringify(log.before, null, 2)}
                      </pre>
                    )}
                    {log.after !== null && (
                      <pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-xs text-emerald-300">
                        after: {JSON.stringify(log.after, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </details>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-ink-secondary pt-2">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateFilters({ page: String(page - 1) })}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => updateFilters({ page: String(page + 1) })}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
