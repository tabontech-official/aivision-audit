"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AuthGateModal } from "@/components/marketing/auth-gate-modal";

export function HeroSearchForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [gateUrl, setGateUrl] = useState<string | null>(null);

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

  const normalizeUrl = (val: string) => {
    let trimmed = val.trim();
    if (!trimmed) return "";
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = `https://${trimmed}`;
    }
    return trimmed;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setGateUrl("");
      return;
    }

    const normalized = normalizeUrl(trimmed);
    setUrl(normalized);

    startTransition(async () => {
      if (await requestAudit(normalized)) {
        setGateUrl(normalized);
      }
    });
  };

  const onAuthenticated = () => {
    const target = gateUrl ? normalizeUrl(gateUrl) : "";
    setGateUrl(null);
    if (!target) return;
    setError(null);
    startTransition(async () => {
      if (await requestAudit(target)) {
        setError("Your session didn't stick. Please try again.");
      }
    });
  };

  return (
    <div className="w-full">
      <form onSubmit={onSubmit} className="w-full" noValidate>
        {/* Frosted glass outer glow wrapper */}
        <div className="p-1.5 sm:p-2 rounded-full bg-white/40 border border-white/80 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-md ring-1 ring-slate-900/5 transition-all">
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* White Input Capsule with dynamic blue focus ring only on click/focus */}
            <div className="flex-1 flex items-center justify-between bg-white rounded-full border border-slate-200/80 shadow-xs px-4 sm:px-5 py-2.5 sm:py-3 transition-all duration-200 focus-within:border-[#388bfd] focus-within:ring-4 focus-within:ring-[#388bfd]/30 focus-within:shadow-md">
              {/* Input text + cursor */}
              <div className="flex-1 flex items-center min-w-0">
                <input
                  type="text"
                  inputMode="url"
                  value={url}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={isFocused ? "" : "Enter your website"}
                  className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder:text-slate-500 font-normal outline-none focus:outline-none ring-0 focus:ring-0 focus-visible:outline-none focus-visible:ring-0 border-0 focus:border-0 shadow-none focus:shadow-none p-0 focus:placeholder-transparent"
                />
                {!url && !isFocused && (
                  <span className="text-slate-500 font-light text-base select-none ml-1 animate-pulse pointer-events-none">
                    |
                  </span>
                )}
              </div>
            </div>

            {/* Purple CTA Button */}
            <button
              type="submit"
              disabled={pending}
              className="bg-[#c084fc] hover:bg-[#b572fa] active:bg-[#a85cf7] text-slate-950 font-bold px-6 sm:px-7 py-3 sm:py-3.5 rounded-full text-xs sm:text-sm transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-60 font-lazzer"
            >
              {pending ? "Analyzing..." : "Get insights"}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <p role="alert" className="mt-2 text-xs font-semibold text-red-600">
          {error}
        </p>
      )}

      {/* Auth Gate Modal when login/signup is required for the audit */}
      {gateUrl !== null && (
        <AuthGateModal
          open={gateUrl !== null}
          targetUrl={gateUrl ?? ""}
          onClose={() => setGateUrl(null)}
          onAuthenticated={onAuthenticated}
        />
      )}
    </div>
  );
}
