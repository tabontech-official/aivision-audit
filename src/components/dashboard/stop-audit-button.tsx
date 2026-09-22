"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { XCircle, Loader2 } from "lucide-react";
import { cancelAuditAction } from "@/app/dashboard/reports/actions";

export function StopAuditButton({ identifier }: { identifier: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleStop = () => {
    startTransition(async () => {
      await cancelAuditAction(identifier);
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleStop}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white/90 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
      title="Stop / Cancel active audit"
    >
      {isPending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
          <span>Stopping...</span>
        </>
      ) : (
        <>
          <XCircle className="h-3.5 w-3.5" />
          <span>Stop Audit</span>
        </>
      )}
    </button>
  );
}
