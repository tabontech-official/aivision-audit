"use client";

import { useState } from "react";
import {
  KeyRound,
  ShieldCheck,
  Zap,
  Globe,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  CreditCard,
  Lock,
} from "lucide-react";
import { saveStripeSettingsAction, testStripeConnectionAction } from "./actions";
import type { StripeSettings } from "@/services/billing/stripe-admin";

export function StripeSettingsClient({
  initialSettings,
  appUrl,
}: {
  initialSettings: StripeSettings;
  appUrl: string;
}) {
  const [mode, setMode] = useState<"test" | "live">(initialSettings.mode);
  const [publishableKey, setPublishableKey] = useState(initialSettings.publishableKey || "");
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [currency, setCurrency] = useState(initialSettings.currency || "usd");
  const [billingEnabled, setBillingEnabled] = useState(initialSettings.billingEnabled);

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; details?: any } | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const webhookEndpoint = `${appUrl.replace(/\/$/, "")}/api/stripe/webhook`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookEndpoint);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append("mode", mode);
    formData.append("publishableKey", publishableKey);
    if (secretKey.trim()) formData.append("secretKey", secretKey);
    if (webhookSecret.trim()) formData.append("webhookSecret", webhookSecret);
    formData.append("currency", currency);
    formData.append("billingEnabled", String(billingEnabled));

    const res = await saveStripeSettingsAction(formData);
    setSaving(false);

    if (res.ok) {
      setStatusMessage({ type: "success", text: res.message || "Settings saved successfully!" });
      setSecretKey("");
      setWebhookSecret("");
    } else {
      setStatusMessage({ type: "error", text: res.error || "Failed to save settings." });
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testStripeConnectionAction();
      setTestResult(res);
    } catch {
      setTestResult({ ok: false, message: "Connection test failed to execute." });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Stripe & Billing Configuration</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure Stripe API keys, test/live environments, webhooks, and default billing currencies.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`flex items-center gap-3 rounded-xl p-4 border text-sm font-medium ${
            statusMessage.type === "success"
              ? "bg-[#dff2ed]/60 border-[#2f7a68]/20 text-[#1b4e42]"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2f7a68]" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Mode Selector & Status Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Stripe Environment Mode</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Switch between sandbox testing and live production payment processing.
              </p>
            </div>
            <div className="inline-flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setMode("test")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                  mode === "test"
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                Test Mode
              </button>
              <button
                type="button"
                onClick={() => setMode("live")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                  mode === "live"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                Live Mode
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Default Billing Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="usd">USD — United States Dollar ($)</option>
                <option value="eur">EUR — Euro (€)</option>
                <option value="gbp">GBP — British Pound (£)</option>
                <option value="cad">CAD — Canadian Dollar (C$)</option>
                <option value="aud">AUD — Australian Dollar (A$)</option>
              </select>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div>
                <div className="text-xs font-bold text-slate-900">Enable Billing Engine</div>
                <div className="text-xs text-slate-500">Allow users to view pricing and checkout</div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={billingEnabled}
                  onChange={(e) => setBillingEnabled(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-slate-900 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
              </label>
            </div>
          </div>
        </div>

        {/* API Credentials */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#dff2ed] text-slate-900">
              <KeyRound className="h-4 w-4 text-[#1b4e42]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">API Credentials ({mode.toUpperCase()})</h2>
              <p className="text-xs text-slate-500">
                Encrypted in database with AES-256-GCM. Never transmitted in plaintext.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">
              Publishable Key ({mode.toUpperCase()})
            </label>
            <input
              type="text"
              value={publishableKey}
              onChange={(e) => setPublishableKey(e.target.value)}
              placeholder={mode === "live" ? "pk_live_..." : "pk_test_..."}
              className="mt-1.5 w-full font-mono text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Secret Key ({mode.toUpperCase()})
              </label>
              {initialSettings.secretKeySet && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <Lock className="h-3 w-3" />
                  Configured: {initialSettings.secretKeyMasked}
                </span>
              )}
            </div>
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder={initialSettings.secretKeySet ? "Leave empty to keep existing encrypted key" : (mode === "live" ? "sk_live_..." : "sk_test_...")}
              className="mt-1.5 w-full font-mono text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Webhook Signing Secret ({mode.toUpperCase()})
              </label>
              {initialSettings.webhookSecretSet && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <ShieldCheck className="h-3 w-3" />
                  Configured: {initialSettings.webhookSecretMasked}
                </span>
              )}
            </div>
            <input
              type="password"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder={initialSettings.webhookSecretSet ? "Leave empty to keep existing secret" : "whsec_..."}
              className="mt-1.5 w-full font-mono text-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Webhook Endpoint Instructions */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <CreditCard className="h-4 w-4 text-slate-700" />
            <span>Stripe Webhook Listener URL</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Add this webhook endpoint in your Stripe Dashboard under{" "}
            <strong>Developers → Webhooks → Add Endpoint</strong> and subscribe to events:
            <code className="mx-1 rounded bg-slate-200 px-1 py-0.5 text-[11px] font-mono">
              checkout.session.completed, customer.subscription.*, invoice.*
            </code>
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={webhookEndpoint}
              className="flex-1 font-mono text-xs rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-800 shadow-inner"
            />
            <button
              type="button"
              onClick={handleCopyWebhook}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-100 transition-colors"
            >
              {copiedWebhook ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedWebhook ? "Copied" : "Copy URL"}
            </button>
          </div>
        </div>

        {/* Form Action Buttons & Connection Tester */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${testing ? "animate-spin" : ""}`} />
            {testing ? "Testing Connection..." : "Test Stripe Connection"}
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-bold text-[#dff2ed] shadow hover:bg-slate-800 disabled:opacity-60 transition-colors"
          >
            {saving ? "Saving Changes..." : "Save Stripe Settings"}
          </button>
        </div>
      </form>

      {/* Connection Test Result Modal / Toast Box */}
      {testResult && (
        <div
          className={`rounded-2xl border p-5 shadow-sm space-y-2 ${
            testResult.ok
              ? "bg-[#dff2ed]/50 border-[#2f7a68]/30 text-[#143a31]"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            {testResult.ok ? (
              <CheckCircle2 className="h-5 w-5 text-[#2f7a68]" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600" />
            )}
            <span>{testResult.ok ? "Connection Successful" : "Connection Failed"}</span>
          </div>
          <p className="text-xs">{testResult.message}</p>
          {testResult.details && (
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-mono">
              <span className="rounded bg-white/80 px-2 py-0.5 border border-slate-200">
                Mode: {testResult.details.mode}
              </span>
              <span className="rounded bg-white/80 px-2 py-0.5 border border-slate-200">
                Currency: {testResult.details.defaultCurrency}
              </span>
              <span className="rounded bg-white/80 px-2 py-0.5 border border-slate-200">
                Livemode: {String(testResult.details.livemode)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
