"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Globe } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Authenticated "run a new audit" form. Posts to /api/audits (which enforces
 * the user's allowance) and navigates to the analysis progress screen.
 */
export function NewAuditForm({ disabled = false }: { disabled?: boolean }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    let trimmed = url.trim();
    if (!trimmed) {
      setError("Enter a website URL.");
      return;
    }
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
      setUrl(trimmed);
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/audits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmed }),
        });
        const data = (await res.json()) as { reportPublicId?: string; error?: string };
        if (!res.ok || !data.reportPublicId) {
          setError(data.error ?? "Something went wrong. Please try again.");
          return;
        }
        const domain = (trimmed.replace(/^https?:\/\//i, "").split("/")[0]) || "";
        router.push(`/dashboard?project=${encodeURIComponent(domain)}`);
        router.refresh();
      } catch {
        setError("We couldn't reach the server. Try again.");
      }
    });
  };

  return (
    <div>
      <form
        onSubmit={onSubmit}
        className={cn(
          "flex items-center gap-2 rounded-xl border bg-white p-1.5 shadow-card transition-shadow focus-within:shadow-card-hover",
          error ? "border-danger-500" : "border-slate-200",
          disabled && "opacity-60",
        )}
      >
        <Globe className="ml-2.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
        <input
          type="text"
          inputMode="url"
          value={url}
          disabled={disabled || pending}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter a website URL to audit"
          aria-label="Website URL"
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
        />
        <button
          type="submit"
          disabled={disabled || pending}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-400"
        >
          {pending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Starting…
            </>
          ) : (
            <>
              Audit
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
    </div>
  );
}
