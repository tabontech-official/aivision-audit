"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
  ShieldCheck,
  CheckCheck,
  Trash2,
  ExternalLink,
} from "lucide-react";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
  deleteNotificationAction,
  clearAllNotificationsAction,
} from "./actions";
import { cn } from "@/lib/utils/cn";

export interface SerializedNotification {
  id: string;
  type: "REPORT_READY" | "REPORT_FAILED" | "PLAN_UPGRADED" | "PLAN_DOWNGRADED" | "PAYMENT_FAILED" | "SYSTEM";
  title: string;
  body: string | null;
  linkUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

export function NotificationsClient({
  initialNotifications,
}: {
  initialNotifications: SerializedNotification[];
}) {
  const [notifications, setNotifications] = useState<SerializedNotification[]>(initialNotifications);
  const [filter, setFilter] = useState<"ALL" | "AUDITS" | "SECURITY" | "UNREAD">("ALL");
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const auditCount = notifications.filter((n) => n.type === "REPORT_READY" || n.type === "REPORT_FAILED").length;
  const securityCount = notifications.filter((n) => n.type === "SYSTEM" || n.type.includes("PLAN")).length;

  const filtered = notifications.filter((n) => {
    if (filter === "UNREAD") return !n.readAt;
    if (filter === "AUDITS") return n.type === "REPORT_READY" || n.type === "REPORT_FAILED";
    if (filter === "SECURITY") return n.type === "SYSTEM" || n.type.includes("PLAN");
    return true;
  });

  const handleMarkRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
    startTransition(async () => {
      await markNotificationReadAction(id);
    });
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
    );
    startTransition(async () => {
      await markAllNotificationsReadAction();
    });
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    startTransition(async () => {
      await deleteNotificationAction(id);
    });
  };

  const handleClearAll = () => {
    if (!confirm("Are you sure you want to clear all notifications?")) return;
    setNotifications([]);
    startTransition(async () => {
      await clearAllNotificationsAction();
    });
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getIcon = (type: SerializedNotification["type"]) => {
    switch (type) {
      case "REPORT_READY":
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      case "REPORT_FAILED":
        return <XCircle className="h-5 w-5 text-rose-600" />;
      case "PLAN_UPGRADED":
      case "PLAN_DOWNGRADED":
        return <Sparkles className="h-5 w-5 text-purple-600" />;
      case "SYSTEM":
        return <ShieldCheck className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 font-lazzer">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-normal">
            Real-time audit completions, system diagnostics, and security updates.
          </p>
        </div>

        {/* Global Action Buttons */}
        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5 text-slate-500" />
                <span>Mark all as read</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleClearAll}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-600 shadow-2xs hover:bg-rose-50 hover:border-rose-200 transition-all cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear all</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setFilter("ALL")}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer",
            filter === "ALL"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
          )}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("UNREAD")}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer",
            filter === "UNREAD"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
          )}
        >
          Unread ({unreadCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("AUDITS")}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer",
            filter === "AUDITS"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
          )}
        >
          Audit Reports ({auditCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("SECURITY")}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer",
            filter === "SECURITY"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
          )}
        >
          Security &amp; System ({securityCount})
        </button>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Bell className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">
            {filter === "UNREAD" ? "No unread notifications" : "No notifications yet"}
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            {filter === "UNREAD"
              ? "You are all caught up! New audit reports and security alerts will appear here."
              : "When you run an audit or diagnostic check, instant completion updates will arrive here."}
          </p>
          <div className="mt-5">
            <Link
              href="/dashboard/reports"
              className="inline-flex items-center justify-center rounded-full bg-[#181818] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-black transition-colors font-lazzer"
            >
              Run a New Audit
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => {
            const isUnread = !item.readAt;
            return (
              <div
                key={item.id}
                className={cn(
                  "group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 sm:p-5 transition-all duration-150",
                  isUnread
                    ? "border-slate-300 bg-white shadow-xs ring-1 ring-emerald-500/10"
                    : "border-slate-200/80 bg-white/70 hover:bg-white"
                )}
              >
                {/* Left: Icon & Content */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                      item.type === "REPORT_READY"
                        ? "bg-emerald-50 border-emerald-200/60"
                        : item.type === "REPORT_FAILED"
                        ? "bg-rose-50 border-rose-200/60"
                        : "bg-slate-50 border-slate-200/60"
                    )}
                  >
                    {getIcon(item.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className={cn(
                          "text-sm tracking-tight truncate",
                          isUnread ? "font-bold text-slate-950" : "font-medium text-slate-800"
                        )}
                      >
                        {item.title}
                      </h4>
                      {isUnread && (
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Unread" />
                      )}
                    </div>

                    {item.body && (
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {item.body}
                      </p>
                    )}

                    <span className="mt-1.5 block text-[11px] font-medium text-slate-400">
                      {formatTimeAgo(item.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {item.linkUrl && (
                    <Link
                      href={item.linkUrl}
                      onClick={() => {
                        if (isUnread) handleMarkRead(item.id);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-black transition-colors"
                    >
                      <span>View Report</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}

                  {isUnread && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(item.id)}
                      title="Mark as read"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                      <CheckCheck className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    title="Delete notification"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
