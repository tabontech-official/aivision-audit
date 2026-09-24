"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
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
  const initialLoadDoneRef = useRef(false);

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

        const currentActiveIds = new Set(data.activeAudits.map((a) => a.id));

        // Check for audits that finished in this session
        if (initialLoadDoneRef.current) {
          for (const prevId of prevActiveIdsRef.current) {
            if (!currentActiveIds.has(prevId)) {
              // Audit has finished! Look for its notification
              const matchingNotif = data.notifications?.find(
                (n) => n.linkUrl?.includes(prevId) || n.type === "REPORT_READY",
              );
              if (matchingNotif && !seenNotifIdsRef.current.has(matchingNotif.id)) {
                seenNotifIdsRef.current.add(matchingNotif.id);
                setLiveToast({
                  id: matchingNotif.id,
                  title: matchingNotif.title,
                  body: matchingNotif.body,
                  linkUrl: matchingNotif.linkUrl || "/dashboard",
                });
              } else {
                setLiveToast({
                  id: `audit-${prevId}-${Date.now()}`,
                  title: "Site Audit Completed!",
                  body: "Your website audit has finished processing in the background.",
                  linkUrl: "/dashboard",
                });
              }
            }
          }

          // Check for any newly arrived unread notifications
          if (data.notifications && data.notifications.length > 0) {
            const newest = data.notifications[0];
            if (newest && !newest.readAt && !seenNotifIdsRef.current.has(newest.id)) {
              seenNotifIdsRef.current.add(newest.id);
              setLiveToast({
                id: newest.id,
                title: newest.title,
                body: newest.body,
                linkUrl: newest.linkUrl || "/dashboard",
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

  return (
    <>
      {/* 1. REAL-TIME COMPLETION TOAST (Top-Right Floating Alert) */}
      {liveToast && (
        <div className="fixed top-5 right-5 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="rounded-2xl border-2 border-emerald-500/80 bg-slate-950 p-4 text-white shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 mt-0.5">
                  <Sparkles className="h-5 w-5" />
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
        <div className="fixed bottom-5 right-5 z-40 animate-in fade-in slide-in-from-bottom-3 duration-200 font-lazzer">
          <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-xl backdrop-blur-md max-w-xs sm:max-w-sm flex items-center gap-3">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <RotateCw className="h-4 w-4 animate-spin text-indigo-600" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 truncate">
                  Auditing: {activeAudits[0].domain}
                </span>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full shrink-0">
                  {Math.round(activeAudits[0].progressPercent)}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                Running in background. Continue using platform.
              </p>
            </div>

            <Link
              href={`/analyze/${activeAudits[0].publicId}`}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 hover:bg-black text-white px-2.5 py-1.5 text-xs font-semibold shrink-0 transition-colors shadow-2xs"
              title="View live progress screen"
            >
              <span>View</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
