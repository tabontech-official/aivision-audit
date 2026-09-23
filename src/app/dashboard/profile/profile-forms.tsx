"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Shield,
  Key,
  Smartphone,
  Mail,
  CheckCircle2,
  BellRing,
  Laptop,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import {
  updateProfileAction,
  toggleTwoFactorAction,
  updateEmailPreferencesAction,
} from "./actions";
import { changePasswordAction } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils/cn";

export function ProfileForms({
  name: initialName,
  email,
  plan,
  role: _role,
  verified,
  joined,
  lastLogin,
  auditEmails: initialAuditEmails,
  marketingConsent: initialMarketingConsent,
}: {
  name: string;
  email: string;
  plan: string;
  role: string;
  verified: boolean;
  joined: string | null;
  lastLogin: string | null;
  auditEmails: boolean;
  marketingConsent: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  // Profile info state
  const [name, setName] = useState(initialName);

  // Password state
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwError, setPwError] = useState<string | null>(null);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<"email" | "authenticator">("email");

  // Email preferences state
  const [auditEmails, setAuditEmails] = useState(initialAuditEmails);
  const [marketingConsent, setMarketingConsent] = useState(initialMarketingConsent);

  const displayName = name.trim() || email.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) => {
    setFlash(null);
    startTransition(async () => {
      const r = await fn();
      if (r.ok) {
        setFlash({ kind: "success", text: r.message ?? "Settings updated successfully." });
        router.refresh();
      } else {
        setFlash({ kind: "error", text: r.error ?? "Something went wrong." });
      }
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);

    if (!pw.currentPassword) {
      setPwError("Please enter your current password.");
      return;
    }
    if (pw.newPassword.length < 8) {
      setPwError("New password must be at least 8 characters long.");
      return;
    }
    if (pw.newPassword !== pw.confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }

    run(async () => {
      const r = await changePasswordAction({
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      if (r.ok) {
        setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
      return r;
    });
  };

  const handleTwoFactorToggle = () => {
    const nextState = !twoFactorEnabled;
    run(async () => {
      const res = await toggleTwoFactorAction({
        enabled: nextState,
        method: twoFactorMethod === "email" ? "Email Security Code" : "Authenticator App",
      });
      if (res.ok) {
        setTwoFactorEnabled(nextState);
      }
      return res;
    });
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    run(() =>
      updateEmailPreferencesAction({
        auditEmails,
        marketingConsent,
      })
    );
  };

  return (
    <div className="space-y-8 font-lazzer">
      {/* Top Banner & User Summary Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          {/* Avatar & Identifiers */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="flex h-16 w-16 sm:h-18 sm:w-18 shrink-0 items-center justify-center rounded-2xl bg-[#181818] text-xl sm:text-2xl font-bold text-white shadow-md ring-4 ring-slate-100">
              {initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {displayName}
                </h1>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider",
                    plan === "PREMIUM"
                      ? "bg-purple-100 text-purple-800 border border-purple-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  )}
                >
                  {plan === "PREMIUM" ? "Pro Plan" : "Free Plan"}
                </span>
                {verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 font-normal">{email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-medium">
                {joined && (
                  <span>
                    Member since{" "}
                    {new Date(joined).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
                {lastLogin && (
                  <span>
                    • Last login{" "}
                    {new Date(lastLogin).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {flash && (
        <Alert variant={flash.kind === "success" ? "success" : "error"} className="rounded-xl">
          {flash.text}
        </Alert>
      )}

      {/* Grid: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Personal Information & Email Preferences */}
        <div className="lg:col-span-6 space-y-8">
          {/* 1. Personal Information */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                <User className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
                <p className="text-xs text-slate-500 font-normal">
                  Update your public display name and contact profile.
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                run(() => updateProfileAction({ name }));
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Display Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="rounded-xl font-normal text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Input
                    value={email}
                    disabled
                    className="rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed font-normal text-sm pr-24"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Primary
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Email is linked to your authentication credentials and account identifier.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  loading={pending}
                  className="rounded-full bg-[#181818] hover:bg-black text-white px-6 font-semibold text-xs h-9 cursor-pointer shadow-xs"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>

          {/* 2. Email & Audit Preferences */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                <BellRing className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Email &amp; Alert Notifications</h2>
                <p className="text-xs text-slate-500 font-normal">
                  Control transactional audit alerts and platform updates.
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-4">
              {/* Audit Result Emails */}
              <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 p-3.5 bg-slate-50/50">
                <div>
                  <div className="text-xs font-bold text-slate-900">Audit Completion Emails</div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Receive email reports with grade breakdowns whenever an audit finishes.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={auditEmails}
                  onChange={(e) => setAuditEmails(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 mt-0.5 cursor-pointer"
                />
              </div>

              {/* Product Updates */}
              <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 p-3.5 bg-slate-50/50">
                <div>
                  <div className="text-xs font-bold text-slate-900">Platform Updates &amp; SEO Guides</div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Get notified about new schema templates, Google algorithm shifts, and Core Web Vitals lab features.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 mt-0.5 cursor-pointer"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  loading={pending}
                  variant="secondary"
                  className="rounded-full border border-slate-300 px-5 font-semibold text-xs h-9 cursor-pointer hover:bg-slate-50"
                >
                  Save Preferences
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Security & Two-Step Verification (2FA) */}
        <div className="lg:col-span-6 space-y-8">
          {/* 3. Two-Step Verification (2FA) Security */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Shield className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Two-Step Verification (2FA)</h2>
                  <p className="text-xs text-slate-500 font-normal">
                    Add an extra layer of security to prevent unauthorized access.
                  </p>
                </div>
              </div>

              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold",
                  twoFactorEnabled
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                )}
              >
                {twoFactorEnabled ? "Active" : "Disabled"}
              </span>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                When two-step verification is enabled, you will be prompted for a secure verification code in addition to your password upon logging in.
              </p>

              {/* Method Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTwoFactorMethod("email")}
                  className={cn(
                    "flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer",
                    twoFactorMethod === "email"
                      ? "border-slate-900 bg-slate-50/80 ring-1 ring-slate-900/10 shadow-2xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <Mail className="h-4 w-4 text-slate-700" />
                    {twoFactorMethod === "email" && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-slate-900" />
                    )}
                  </div>
                  <div className="mt-2 text-xs font-bold text-slate-900">Email OTP Code</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Sends single-use code to your email
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTwoFactorMethod("authenticator")}
                  className={cn(
                    "flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer",
                    twoFactorMethod === "authenticator"
                      ? "border-slate-900 bg-slate-50/80 ring-1 ring-slate-900/10 shadow-2xs"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <Smartphone className="h-4 w-4 text-slate-700" />
                    {twoFactorMethod === "authenticator" && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-slate-900" />
                    )}
                  </div>
                  <div className="mt-2 text-xs font-bold text-slate-900">Authenticator App</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Google Authenticator or 1Password
                  </div>
                </button>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {twoFactorEnabled
                    ? "Your account is protected."
                    : "Recommended for high security."}
                </span>

                <Button
                  type="button"
                  onClick={handleTwoFactorToggle}
                  loading={pending}
                  className={cn(
                    "rounded-full px-5 font-semibold text-xs h-9 cursor-pointer shadow-xs",
                    twoFactorEnabled
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "bg-[#181818] hover:bg-black text-white"
                  )}
                >
                  {twoFactorEnabled ? "Disable 2-Step" : "Enable 2-Step"}
                </Button>
              </div>
            </div>
          </div>

          {/* 4. Password Management */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                <Key className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Change Password</h2>
                <p className="text-xs text-slate-500 font-normal">
                  Ensure your password uses at least 8 characters.
                </p>
              </div>
            </div>

            {pwError && (
              <Alert variant="error" className="rounded-xl">
                {pwError}
              </Alert>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Current Password
                </label>
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={pw.currentPassword}
                  onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))}
                  placeholder="••••••••"
                  className="rounded-xl font-normal text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    New Password
                  </label>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={pw.newPassword}
                    onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))}
                    placeholder="At least 8 characters"
                    className="rounded-xl font-normal text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={pw.confirmPassword}
                    onChange={(e) => setPw((p) => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="Repeat new password"
                    className="rounded-xl font-normal text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  loading={pending}
                  variant="secondary"
                  className="rounded-full border border-slate-300 px-5 font-semibold text-xs h-9 cursor-pointer hover:bg-slate-50"
                >
                  Update Password
                </Button>
              </div>
            </form>
          </div>

          {/* 5. Active Sessions Overview */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                <Laptop className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Active Sessions</h2>
                <p className="text-xs text-slate-500 font-normal">
                  Devices currently signed into your AI Vision Audit account.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Current Web Session</div>
                  <div className="text-[11px] text-slate-500">macOS / Chrome Browser • Active Now</div>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                Online
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
