"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Globe } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AuthGateModal } from "@/components/marketing/auth-gate-modal";

/**
 * The primary conversion element: one URL field, one button — and an account
 * before any audit runs.
 *
 * Rather than asking up front, the visitor commits to a URL and posts it. The
 * server validates the URL FIRST and answers 401 if they aren't signed in,
 * which opens the gate; once authenticated we replay the same request, so the
 * audit they asked for is the one they get and they never retype the URL.
 *
 * An unauditable URL therefore never reaches the gate — a visitor is only
 * asked to sign up for a request that can actually succeed.
 */
export function AuditUrlForm({
  size = "lg",
  autoFocus = false,
  placeholder = "Website URL",
  buttonText = "Free Checkup",
  hideFooterText = false,
  className,
}: {
  size?: "md" | "lg";
  autoFocus?: boolean;
  placeholder?: string;
  buttonText?: string;
  hideFooterText?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [gateUrl, setGateUrl] = useState<string | null>(null);

  /** Returns true when the caller should open the sign-in gate. */
  const requestAudit = async (target: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });

      if (res.status === 401) return true;

      const data = (await res.json()) as { reportPublicId?: string; error?: string };
      if (!res.ok || !data.reportPublicId) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return false;
      }
      router.push(`/analyze/${data.reportPublicId}`);
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    }
    return false;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setError("Enter your website URL to get started.");
      return;
    }

    startTransition(async () => {
      if (await requestAudit(trimmed)) setGateUrl(trimmed);
    });
  };

  /** Signed in inside the modal — replay the audit they already asked for. */
  const onAuthenticated = () => {
    const target = gateUrl;
    setGateUrl(null);
    if (!target) return;
    setError(null);
    startTransition(async () => {
      if (await requestAudit(target)) {
        setError("Your session didn't stick. Please try again.");
      }
    });
  };

  const isLg = size === "lg";

  return (
    <div className={cn("w-full", className)}>
      <form
        onSubmit={onSubmit}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl border bg-white p-1.5 shadow-sm transition-all focus-within:border-slate-400 focus-within:shadow-md",
          error ? "border-red-500" : "border-slate-200",
        )}
        noValidate
      >
        <div className="ml-2.5 flex items-center text-slate-400">
          <svg
            className="h-4.5 w-4.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>
        <input
          type="text"
          inputMode="url"
          autoComplete="url"
          autoFocus={autoFocus}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={placeholder}
          aria-label="Website URL"
          aria-invalid={error ? true : undefined}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none pl-1",
            isLg ? "py-2.5 text-[15px]" : "py-1.5 text-sm",
          )}
        />
        <div className="hidden sm:flex items-center justify-center h-5 w-5 rounded border border-slate-200 bg-slate-50/80 text-slate-400 text-xs font-semibold select-none mr-1">
          +
        </div>
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#FF4D00] font-semibold text-white shadow-sm transition-colors hover:bg-[#E64500] disabled:cursor-not-allowed disabled:bg-orange-300",
            isLg ? "px-6 py-3 text-sm" : "px-4 py-2 text-sm",
          )}
        >
          {pending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Checking…
            </>
          ) : (
            buttonText
          )}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
      {!hideFooterText && (
        <p className="mt-2.5 text-xs text-slate-500">
          Free · No credit card required · Instant automated checkup
        </p>
      )}

      <AuthGateModal
        open={gateUrl !== null}
        onClose={() => setGateUrl(null)}
        targetUrl={gateUrl ?? ""}
        onAuthenticated={onAuthenticated}
      />
    </div>
  );
}
