"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Globe, Sparkles, UserCheck } from "lucide-react";
import {
  continueWithEmailSchema,
  type ContinueWithEmailInput,
} from "@/lib/validation/auth";
import { checkEmailAction, continueWithEmailAction } from "@/app/(auth)/actions";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

/**
 * The single sign-in / sign-up module, used both by the audit gate and by the
 * marketing header. Email first, then a password step that states plainly
 * whether we're signing the visitor in or creating their account.
 *
 * The extra step buys the one thing a combined form can't give: a mistyped
 * address is visible *before* it becomes a second empty account, which is the
 * difference between a returning Premium customer signing in and that same
 * customer wondering where their subscription went. Creating an account still
 * costs nothing beyond the password — no name, no confirm field, no
 * verification wall between them and the audit.
 */
export function AuthGateModal({
  open,
  onClose,
  targetUrl,
  onAuthenticated,
}: {
  open: boolean;
  onClose: () => void;
  /**
   * The URL the visitor typed, shown so they know the audit is still queued.
   * Omitted when the gate is opened just to sign in (e.g. from the header).
   */
  targetUrl?: string;
  /** `redirectTo` is where the server suggests sending them; audit callers ignore it. */
  onAuthenticated: (redirectTo: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  /** null = still on the email step; otherwise which branch we're taking. */
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

  // Reopening the gate should start clean, not mid-flow from last time.
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

      onAuthenticated(result.redirectTo);
    });
  };

  const email = getValues("email");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        returning === null
          ? targetUrl
            ? "Sign in to start your audit"
            : "Log in or sign up"
          : returning
            ? "Welcome back"
            : "Create your free account"
      }
    >
      {targetUrl && (
        <div className="mb-5 flex items-start gap-2.5 rounded-lg bg-slate-50 px-3.5 py-3">
          <Globe className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">Ready to analyze</p>
            <p className="truncate text-sm text-ink-muted" title={targetUrl}>
              {targetUrl}
            </p>
          </div>
        </div>
      )}

      {returning === null ? (
        <form onSubmit={onEmailStep} className="space-y-4" noValidate>
          {serverError && <Alert variant="error">{serverError}</Alert>}
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="you@company.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <Button type="submit" className="w-full" size="lg" loading={pending}>
            Continue
          </Button>
          <p className="text-center text-xs text-ink-muted">
            We&apos;ll sign you in, or set up a free account if you&apos;re new.
          </p>
        </form>
      ) : (
        <form onSubmit={onPasswordStep} className="space-y-4" noValidate>
          {serverError && <Alert variant="error">{serverError}</Alert>}

          <div
            className={`flex items-start gap-2.5 rounded-lg px-3.5 py-3 ${
              returning ? "bg-brand-50" : "bg-success-50"
            }`}
          >
            {returning ? (
              <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
            ) : (
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-success-600" aria-hidden />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink">
                {returning ? (
                  <>
                    Signing in as <span className="font-medium">{email}</span>
                  </>
                ) : (
                  <>
                    Creating a new account for{" "}
                    <span className="font-medium">{email}</span>
                  </>
                )}
              </p>
              <button
                type="button"
                onClick={() => {
                  setServerError(null);
                  setReturning(null);
                }}
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                <ArrowLeft className="h-3 w-3" aria-hidden />
                Use a different email
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Input
              label={returning ? "Password" : "Choose a password"}
              type="password"
              autoComplete={returning ? "current-password" : "new-password"}
              autoFocus
              placeholder={returning ? "Your password" : "At least 8 characters"}
              hint={
                returning
                  ? undefined
                  : "At least 8 characters, including a letter and a number."
              }
              error={errors.password?.message}
              {...register("password")}
            />
            {returning && (
              <div className="flex justify-end pt-0.5">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  Forgot password?
                </Link>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg" loading={pending}>
            {targetUrl
              ? returning
                ? "Sign in & start audit"
                : "Create account & start audit"
              : returning
                ? "Log in"
                : "Create account"}
          </Button>
        </form>
      )}
    </Modal>
  );
}
