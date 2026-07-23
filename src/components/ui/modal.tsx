"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Accessible modal built on the native <dialog> element:
 * focus trapping, Escape handling, and backdrop come for free.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // Backdrop click closes (clicks on content don't reach the dialog itself)
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "w-full rounded-xl border border-slate-200 bg-white p-0 shadow-modal backdrop:bg-slate-900/40 backdrop:backdrop-blur-[2px]",
        "animate-fade-in",
        wide ? "max-w-3xl" : "max-w-lg",
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 className="font-semibold text-ink">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-slate-100 hover:text-ink"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
    </dialog>
  );
}
