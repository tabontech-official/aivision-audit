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
}: {
  size?: "md" | "lg";
  autoFocus?: boolean;
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
      setError("Enter your store URL to get started.");
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
    <div className="w-full max-w-xl">
      <form
        onSubmit={onSubmit}
        className={cn(
          "flex w-full items-center gap-2 rounded-xl border bg-white p-1.5 shadow-card transition-shadow focus-within:shadow-card-hover",
          error ? "border-danger-500" : "border-slate-200",
        )}
        noValidate
      >
        <Globe
          className={cn("ml-2.5 shrink-0 text-ink-muted", isLg ? "h-5 w-5" : "h-4 w-4")}
          aria-hidden
        />
        <input
          type="text"
          inputMode="url"
          autoComplete="url"
          autoFocus={autoFocus}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://yourstore.com"
          aria-label="Store URL"
          aria-invalid={error ? true : undefined}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-ink placeholder:text-ink-muted focus:outline-none",
            isLg ? "py-2.5 text-base" : "py-1.5 text-sm",
          )}
        />
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-400",
            isLg ? "px-5 py-3 text-sm" : "px-4 py-2 text-sm",
          )}
        >
          {pending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Starting…
            </>
          ) : (
            <>
              Audit my store
              <ArrowRight className="h-4 w-4" aria-hidden />
            </>
          )}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger-600">
          {error}
        </p>
      )}
      <p className="mt-2.5 text-sm text-ink-muted">
        Free · No credit card · Not on Shopify? We&apos;ll still run our universal checks.
      </p>

      <AuthGateModal
        open={gateUrl !== null}
        onClose={() => setGateUrl(null)}
        targetUrl={gateUrl ?? ""}
        onAuthenticated={onAuthenticated}
      />
    </div>
  );
}
