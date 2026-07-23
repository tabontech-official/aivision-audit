"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { saveSettingsAction, savePagespeedKeyAction } from "./actions";
import { changePasswordAction } from "@/app/(auth)/actions";

type SettingsInitial = {
  product_name: string;
  support_email: string;
  free_audit_limit: number;
  premium_audit_limit: number;
  anonymous_report_expiration_days: number;
  anonymous_audits_per_hour_ip: number;
  maintenance_mode: boolean;
  terms_url: string;
  privacy_url: string;
  cookie_policy_url: string;
  score_ranges_json: string;
};

export function SettingsForm({
  initial,
  hasPagespeedKey,
  pagespeedFromEnv,
}: {
  initial: SettingsInitial;
  hasPagespeedKey: boolean;
  pagespeedFromEnv: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [form, setForm] = useState(initial);
  const [psiKey, setPsiKey] = useState("");
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });

  const set = <K extends keyof SettingsInitial>(key: K, value: SettingsInitial[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) => {
    setFlash(null);
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        setFlash({ kind: "success", text: result.message ?? "Saved." });
        router.refresh();
      } else {
        setFlash({ kind: "error", text: result.error ?? "Something went wrong." });
      }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Platform configuration. Changes apply immediately.
        </p>
      </div>

      {flash && (
        <Alert variant={flash.kind === "success" ? "success" : "error"}>{flash.text}</Alert>
      )}

      {/* General */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => saveSettingsAction(form));
        }}
        className="card space-y-5 p-6"
      >
        <h2 className="font-semibold text-ink">General</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Product name" value={form.product_name} onChange={(e) => set("product_name", e.target.value)} />
          <Input label="Support email" type="email" value={form.support_email} onChange={(e) => set("support_email", e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Free audits / month" type="number" min={0} value={form.free_audit_limit} onChange={(e) => set("free_audit_limit", Number(e.target.value))} />
          <Input label="Premium audits / month" type="number" min={0} value={form.premium_audit_limit} onChange={(e) => set("premium_audit_limit", Number(e.target.value))} />
          <Input label="Anon report expiry (days)" type="number" min={1} value={form.anonymous_report_expiration_days} onChange={(e) => set("anonymous_report_expiration_days", Number(e.target.value))} />
          <Input label="Anon audits / hour / IP" type="number" min={1} value={form.anonymous_audits_per_hour_ip} onChange={(e) => set("anonymous_audits_per_hour_ip", Number(e.target.value))} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Terms URL" value={form.terms_url} onChange={(e) => set("terms_url", e.target.value)} />
          <Input label="Privacy URL" value={form.privacy_url} onChange={(e) => set("privacy_url", e.target.value)} />
          <Input label="Cookie policy URL" value={form.cookie_policy_url} onChange={(e) => set("cookie_policy_url", e.target.value)} />
        </div>
        <label className="block text-sm font-medium text-ink">
          Score grade bands (JSON)
          <textarea
            value={form.score_ranges_json}
            onChange={(e) => set("score_ranges_json", e.target.value)}
            rows={6}
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <span className="mt-1 block text-xs text-ink-muted">
            Array of {`{ min, max, grade, color }`} — controls report grades.
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-secondary">
          <input
            type="checkbox"
            checked={form.maintenance_mode}
            onChange={(e) => set("maintenance_mode", e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Maintenance mode (blocks new audits)
        </label>
        <div className="flex justify-end border-t border-slate-100 pt-4">
          <Button type="submit" loading={pending}>
            <Save className="h-4 w-4" aria-hidden />
            Save settings
          </Button>
        </div>
      </form>

      {/* PageSpeed key */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            const r = await savePagespeedKeyAction(psiKey);
            if (r.ok) setPsiKey("");
            return r;
          });
        }}
        className="card space-y-4 p-6"
      >
        <h2 className="font-semibold text-ink">PageSpeed Insights API key</h2>
        <p className="text-sm text-ink-secondary">
          {pagespeedFromEnv
            ? "A key is configured via the PAGESPEED_API_KEY environment variable (env takes precedence)."
            : hasPagespeedKey
              ? "A key is saved. Enter a new one to replace it — the current key is never displayed."
              : "No key configured — speed metrics will be unavailable and reports finish as Partial."}
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            value={psiKey}
            onChange={(e) => setPsiKey(e.target.value)}
            placeholder="Paste API key"
            aria-label="PageSpeed API key"
            autoComplete="off"
            className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <Button type="submit" variant="secondary" loading={pending} disabled={!psiKey.trim()}>
            Save key
          </Button>
        </div>
      </form>

      {/* Password change */}
      <form
        id="password"
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            const r = await changePasswordAction(pw);
            if (r.ok) setPw({ currentPassword: "", newPassword: "" });
            return r;
          });
        }}
        className="card space-y-4 p-6"
      >
        <h2 className="flex items-center gap-2 font-semibold text-ink">
          <KeyRound className="h-4 w-4" aria-hidden />
          Change password
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={pw.currentPassword}
            onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))}
          />
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            hint="At least 8 characters with a letter and a number"
            value={pw.newPassword}
            onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))}
          />
        </div>
        <div className="flex justify-end border-t border-slate-100 pt-4">
          <Button type="submit" variant="secondary" loading={pending}>
            Update password
          </Button>
        </div>
      </form>
    </div>
  );
}
