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
        "w-full rounded-2xl border border-slate-200/90 bg-white p-0 shadow-2xl backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm",
        "animate-fade-in",
        wide ? "max-w-3xl" : "max-w-lg",
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-6 sm:px-7 py-5">
        <h2 className="font-display text-xl font-bold tracking-tight text-slate-900">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
        >
          <X className="h-4.5 w-4.5" aria-hidden />
        </button>
      </div>
      {/* text-left: modals opened from centered layouts (e.g. the marketing
          hero) would otherwise inherit text-center onto every form label. */}
      <div className="max-h-[75vh] overflow-y-auto px-6 sm:px-7 py-6 text-left">{children}</div>
    </dialog>
  );
}
