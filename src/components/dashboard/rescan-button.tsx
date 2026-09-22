"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Scan, RotateCw } from "lucide-react";
import { rescanWebsiteAction, rerunAuditAction } from "@/app/dashboard/reports/actions";

export function RescanButton({
  reportId,
  domain,
}: {
  reportId?: string | null;
  domain?: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleRescan = () => {
    if (!domain && !reportId) return;
    setErrorText(null);

    startTransition(async () => {
      try {
        let res;
        if (reportId) {
          res = await rerunAuditAction(reportId);
        } else if (domain) {
          res = await rescanWebsiteAction(domain);
        }

        if (res?.ok && res.redirectTo) {
          router.push(res.redirectTo);
        } else if (!res?.ok) {
          setErrorText(res?.error ?? "Failed to trigger re-scan.");
        }
      } catch (err: unknown) {
        console.error("Rescan click error:", err);
        setErrorText(err instanceof Error ? err.message : "Failed to trigger re-scan.");
      }
    });
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleRescan}
        disabled={isPending || (!reportId && !domain)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-800 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer font-lazzer"
      >
        {isPending ? (
          <>
            <RotateCw className="h-4 w-4 text-slate-900 animate-spin" />
            <span>Re-Scanning...</span>
          </>
        ) : (
          <>
            <Scan className="h-4 w-4 text-slate-500" />
            <span>Re-Scan</span>
          </>
        )}
      </button>

      {errorText && (
        <div className="absolute top-full right-0 mt-1.5 w-64 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 shadow-lg z-20">
          {errorText}
        </div>
      )}
    </div>
  );
}
