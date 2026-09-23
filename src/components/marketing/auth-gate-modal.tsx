"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Globe, CheckCircle2, UserCheck, X } from "lucide-react";
import {
  continueWithEmailSchema,
  type ContinueWithEmailInput,
} from "@/lib/validation/auth";
import { checkEmailAction, continueWithEmailAction } from "@/app/(auth)/actions";
import { BrandIcon } from "@/components/ui/brand-icon";
import { Alert } from "@/components/ui/alert";

export function AuthGateModal({
  open,
  onClose,
  targetUrl,
  onAuthenticated,
}: {
  open: boolean;
  onClose: () => void;
  targetUrl?: string;
  onAuthenticated?: (redirectTo: string) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  /** null = email step; true = existing user login; false = new user signup */
  const [returning, setReturning] = useState<boolean | null>(null);

  const {
    register,
    trigger,
    getValues,
    setError,
    reset,
    formState: { errors },
  } = useForm<ContinueWithEmailInput>({
    resolver: zodResolver(continueWithEmailSchema),
  });

  // Reset state when opening/closing
  useEffect(() => {
    if (!open) {
      setReturning(null);
      setServerError(null);
      reset();
    }
  }, [open, reset]);

  const onEmailStep = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    startTransition(async () => {
      if (!(await trigger("email"))) return;
      const result = await checkEmailAction(getValues("email"));
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      setReturning(result.exists);
    });
  };

  const onPasswordStep = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    startTransition(async () => {
      if (!(await trigger())) return;
      const result = await continueWithEmailAction(getValues());

      if (!result.ok) {
        setServerError(result.error);
        for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
          if (messages?.[0] && (field === "email" || field === "password")) {
            setError(field, { message: messages[0] });
          }
        }
        return;
      }

      if (onAuthenticated) {
        onAuthenticated(result.redirectTo);
      } else {
        router.push(result.redirectTo ?? "/dashboard");
        router.refresh();
      }
    });
  };

  const email = getValues("email");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-lazzer">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200/90 z-10 transition-all animate-fade-in">
        {/* Top Header with Theme Branding */}
        <div className="bg-[#dff2ed] px-6 pt-6 pb-5 border-b border-slate-200/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrandIcon className="h-7 w-7 text-[rgb(24,30,21)]" />
              <span className="font-display font-bold text-base sm:text-lg text-slate-900 tracking-tight">
                AI Vision Audit
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-slate-600 hover:bg-white hover:text-black transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 max-h-[80vh] overflow-y-auto">
          {/* Target URL Alert if present */}
          {targetUrl && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-[#b2dfd4] bg-[#f0f9f6] p-3 text-xs sm:text-sm text-slate-800">
              <Globe className="h-4 w-4 shrink-0 text-emerald-700" />
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-slate-900">Queued audit: </span>
                <span className="font-mono text-slate-700 truncate">{targetUrl}</span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {serverError && (
            <div className="mb-5">
              <Alert variant="error">{serverError}</Alert>
            </div>
          )}

          {/* Title & Subtitle */}
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">
              {returning === null
                ? targetUrl
                  ? "Sign in to start your audit"
                  : "Log in or sign up"
                : returning
                  ? "Welcome back"
                  : "Create your free account"}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
              {returning === null
                ? "Enter your email to continue. We'll sign you in or create your account."
                : returning
                  ? "Enter your password to access your dashboard."
                  : "Set a password to create your account and access your reports."}
            </p>
          </div>

          {/* STEP 1: EMAIL INPUT */}
          {returning === null ? (
            <form onSubmit={onEmailStep} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    autoComplete="email"
                    autoFocus
                    placeholder="you@company.com"
                    className="w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#388bfd] focus:ring-2 focus:ring-[#388bfd]/20"
                    {...register("email")}
                  />
                </div>
                {errors.email?.message && (
                  <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full inline-flex items-center justify-center rounded-full bg-[#181818] hover:bg-black text-white font-semibold py-3 text-sm transition-all shadow-xs disabled:opacity-60 cursor-pointer font-lazzer"
                >
                  {pending ? "Continuing..." : "Continue with email"}
                </button>
              </div>

              <p className="text-center text-xs text-slate-500 leading-relaxed pt-1">
                We&apos;ll sign you in, or set up a free account if you&apos;re new.
              </p>
            </form>
          ) : (
            /* STEP 2: PASSWORD INPUT (LOGIN OR SIGNUP) */
            <form onSubmit={onPasswordStep} className="space-y-4" noValidate>
              {/* Account Status Banner */}
              <div
                className={`flex items-start gap-3 rounded-xl border p-3.5 ${
                  returning
                    ? "bg-slate-50 border-slate-200/90"
                    : "bg-[#f0f9f6] border-[#b2dfd4]"
                }`}
              >
                {returning ? (
                  <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-800" aria-hidden />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-slate-900">
                    {returning ? (
                      <>
                        Signing in as <span className="font-bold text-slate-950">{email}</span>
                      </>
                    ) : (
                      <>
                        Creating new account for <span className="font-bold text-slate-950">{email}</span>
                      </>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setServerError(null);
                      setReturning(null);
                    }}
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="h-3 w-3" aria-hidden />
                    Use a different email
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  {returning ? "Password" : "Choose a password"}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    autoComplete={returning ? "current-password" : "new-password"}
                    autoFocus
                    placeholder={returning ? "Your password" : "At least 8 characters"}
                    className="w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#388bfd] focus:ring-2 focus:ring-[#388bfd]/20"
                    {...register("password")}
                  />
                </div>
                {errors.password?.message ? (
                  <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                ) : (
                  !returning && (
                    <p className="mt-1 text-[11px] text-slate-500">
                      Must be 8+ characters with at least one letter and number.
                    </p>
                  )
                )}
              </div>

              {returning && (
                <div className="flex justify-end pt-0.5">
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-slate-700 hover:text-black transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full inline-flex items-center justify-center rounded-full bg-[#181818] hover:bg-black text-white font-semibold py-3 text-sm transition-all shadow-xs disabled:opacity-60 cursor-pointer font-lazzer"
                >
                  {pending
                    ? returning
                      ? "Signing in..."
                      : "Creating account..."
                    : targetUrl
                      ? returning
                        ? "Sign in & start audit"
                        : "Create account & start audit"
                      : returning
                        ? "Log in"
                        : "Create free account"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthGateModal;

