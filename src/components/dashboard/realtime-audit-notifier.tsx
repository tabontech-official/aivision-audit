"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ExternalLink,
  X,
  RotateCw,
  Bell,
  ArrowRight,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type LiveAudit = {
  id: string;
  publicId: string;
  domain: string;
  url: string;
  status: string;
  currentStage: string | null;
  progressPercent: number;
  createdAt: string;
  updatedAt: string;
};

export type LiveNotification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  readAt: string | null;
  createdAt: string;
};

export function RealtimeAuditNotifier({
  onUnreadCountChange,
}: {
  onUnreadCountChange?: (count: number) => void;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeAudits, setActiveAudits] = useState<LiveAudit[]>([]);
  const [liveToast, setLiveToast] = useState<{
    id: string;
    title: string;
    body: string | null;
    linkUrl: string | null;
    domain?: string;
  } | null>(null);

  const prevActiveIdsRef = useRef<Set<string>>(new Set());
  const seenNotifIdsRef = useRef<Set<string>>(new Set());
  const idToPublicIdRef = useRef<Map<string, string>>(new Map());
  const initialLoadDoneRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    let pollTimer: ReturnType<typeof setTimeout>;

    const pollLiveStatus = async () => {
      try {
        const res = await fetch("/api/notifications/live", { cache: "no-store" });
        if (!res.ok) return;

        const data = (await res.json()) as {
          ok: boolean;
          activeAudits: LiveAudit[];
          notifications: LiveNotification[];
          unreadCount: number;
        };

        if (isCancelled || !data.ok) return;

        setActiveAudits(data.activeAudits || []);
        if (onUnreadCountChange) {
          onUnreadCountChange(data.unreadCount || 0);
        }

        // Keep map of audit ID -> public ID
        data.activeAudits?.forEach((a) => {
          if (a.id && a.publicId) {
            idToPublicIdRef.current.set(a.id, a.publicId);
          }
        });

        const recentReportsMap = new Map<string, string>();
        (data as unknown as { recentReports?: Array<{ id: string; publicId: string; status: string }> }).recentReports?.forEach((r) => {
          if (r.id) recentReportsMap.set(r.id, r.status);
          if (r.publicId) recentReportsMap.set(r.publicId, r.status);
        });

        const currentActiveIds = new Set(data.activeAudits.map((a) => a.id));

        // Check for audits that finished in this session
        if (initialLoadDoneRef.current) {
          for (const prevId of prevActiveIdsRef.current) {
            if (!currentActiveIds.has(prevId)) {
              const auditPublicId = idToPublicIdRef.current.get(prevId);
              const finishedStatus = recentReportsMap.get(prevId) || (auditPublicId ? recentReportsMap.get(auditPublicId) : null);

              // If the audit was cancelled, stopped, or failed, do NOT show "Site Audit Completed!"
              if (finishedStatus === "FAILED") {
                continue;
              }

              // Audit has finished! Look for its notification
              const matchingNotif = data.notifications?.find(
                (n) => (n.linkUrl?.includes(prevId) || (auditPublicId && n.linkUrl?.includes(auditPublicId))) && n.type === "REPORT_READY",
              );

              // Navigate to Report tab
              let destinationUrl = auditPublicId
                ? `/dashboard/reports/${auditPublicId}`
                : "/dashboard";

              if (matchingNotif?.linkUrl) {
                destinationUrl = matchingNotif.linkUrl;
              }

              if (matchingNotif && !seenNotifIdsRef.current.has(matchingNotif.id)) {
                seenNotifIdsRef.current.add(matchingNotif.id);
                setLiveToast({
                  id: matchingNotif.id,
                  title: matchingNotif.title,
                  body: matchingNotif.body,
                  linkUrl: destinationUrl,
                });
              } else if (finishedStatus === "COMPLETED" || finishedStatus === "PARTIAL") {
                setLiveToast({
                  id: `audit-${prevId}-${Date.now()}`,
                  title: "Site Audit Completed!",
                  body: "Your website audit has finished processing. Check out your report.",
                  linkUrl: destinationUrl,
                });
              }
            }
          }

          // Check for any newly arrived unread notifications
          if (data.notifications && data.notifications.length > 0) {
            const newest = data.notifications[0];
            if (newest && !newest.readAt && !seenNotifIdsRef.current.has(newest.id)) {
              seenNotifIdsRef.current.add(newest.id);
              let destUrl = newest.linkUrl || "/dashboard";
              setLiveToast({
                id: newest.id,
                title: newest.title,
                body: newest.body,
                linkUrl: destUrl,
              });
            }
          }
        } else {
          // Record existing notification IDs on initial mount so we don't spam old notifications
          data.notifications?.forEach((n) => seenNotifIdsRef.current.add(n.id));
          initialLoadDoneRef.current = true;
        }

        prevActiveIdsRef.current = currentActiveIds;
      } catch (e) {
        // Silently handle transient poll network errors
      } finally {
        if (!isCancelled) {
          // Poll faster (3s) when an audit is currently running, or 7s when idle
          const nextInterval = activeAudits.length > 0 ? 3000 : 7000;
          pollTimer = setTimeout(pollLiveStatus, nextInterval);
        }
      }
    };

    void pollLiveStatus();

    return () => {
      isCancelled = true;
      clearTimeout(pollTimer);
    };
  }, [activeAudits.length, onUnreadCountChange]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <>
      {/* 1. REAL-TIME COMPLETION TOAST (Top-Right Floating Alert) */}
      {liveToast && (
        <div className="fixed top-6 right-6 z-[9999] max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-300 font-lazzer">
          <div className="rounded-2xl border border-emerald-500/80 bg-slate-950 p-4 text-white shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 mt-0.5">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white font-lazzer">
                      {liveToast.title}
                    </span>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                      Live Alert
                    </span>
                  </div>
                  {liveToast.body && (
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed font-lazzer">
                      {liveToast.body}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLiveToast(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3.5 flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setLiveToast(null)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Dismiss
              </button>
              <Link
                href={liveToast.linkUrl || "/dashboard"}
                onClick={() => setLiveToast(null)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer font-lazzer"
              >
                <span>View Report</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 2. FLOATING BACKGROUND AUDIT MONITOR PILL (Bottom-Right) */}
      {activeAudits.length > 0 && activeAudits[0] && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-300 font-lazzer pointer-events-auto">
          <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md w-80 sm:w-96 flex items-center gap-3">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <RotateCw className="h-4.5 w-4.5 animate-spin text-emerald-600" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-xs font-bold text-slate-900 truncate">
                  Auditing {activeAudits[0].domain}
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full shrink-0">
                  {Math.round(activeAudits[0].progressPercent || 15)}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                Running in background. Continue using platform.
              </p>
            </div>

            <Link
              href={`/analyze/${activeAudits[0].publicId}`}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 hover:bg-black text-white px-3 py-1.5 text-xs font-bold shrink-0 transition-colors shadow-2xs font-lazzer cursor-pointer"
              title="View live progress screen"
            >
              <span>View</span>
            </Link>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
