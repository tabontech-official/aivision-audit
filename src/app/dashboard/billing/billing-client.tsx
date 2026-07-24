"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, Sparkles, ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { startCheckoutAction, openPortalAction } from "./actions";
import type { BillingInterval } from "@/lib/stripe/config";

export type BillingData = {
  plan: string;
  stripeConfigured: boolean;
  premium: {
    priceMonthly: number;
    priceYearly: number;
    features: string[];
  };
  subscription: {
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  invoices: Array<{
    id: string;
    number: string | null;
    amountCents: number;
    currency: string;
    issuedAt: string | null;
    hostedInvoiceUrl: string | null;
    pdfUrl: string | null;
  }>;
};

export function BillingClient({ data }: { data: BillingData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [interval, setIntervalState] = useState<BillingInterval>("monthly");
  const [refreshing, setRefreshing] = useState(false);

  const isPremium = data.plan === "PREMIUM";
  const checkout = searchParams.get("checkout");

  // On return from a successful checkout, refresh the JWT (plan claim) so the
  // upgrade takes effect without a re-login, then poll until the webhook lands.
  useEffect(() => {
    if (checkout !== "success" || isPremium) return;
    let attempts = 0;
    setRefreshing(true);
    const tick = async () => {
      attempts++;
      await update(); // re-reads plan from DB via the jwt update trigger
      router.refresh();
      if (attempts >= 5) setRefreshing(false);
    };
    const id = setInterval(tick, 2500);
    void tick();
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkout, isPremium]);

  const subscribe = () => {
    setError(null);
    startTransition(async () => {
      const r = await startCheckoutAction(interval);
      if (r.ok) window.location.href = r.url;
      else setError(r.error);
    });
  };

  const manage = () => {
    setError(null);
    startTransition(async () => {
      const r = await openPortalAction();
      if (r.ok) window.location.href = r.url;
      else setError(r.error);
    });
  };

  const price = interval === "yearly" ? data.premium.priceYearly : data.premium.priceMonthly;
  const per = interval === "yearly" ? "year" : "month";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Billing</h1>
        <p className="mt-1 text-sm text-ink-secondary">Manage your plan and subscription.</p>
      </div>

      {checkout === "success" && !isPremium && refreshing && (
        <Alert variant="info">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Payment received — activating your Premium plan…
          </span>
        </Alert>
      )}
      {checkout === "success" && isPremium && (
        <Alert variant="success">Welcome to Premium! Your plan is now active.</Alert>
      )}
      {checkout === "canceled" && (
        <Alert variant="warning">Checkout canceled. You have not been charged.</Alert>
      )}
      {error && <Alert variant="error">{error}</Alert>}

      {!data.stripeConfigured && (
        <Alert variant="info">
          Billing isn&apos;t configured on this environment yet. Add your Stripe keys to enable
          checkout.
        </Alert>
      )}

      {/* Current plan */}
      <div className="card flex items-center justify-between p-6">
        <div>
          <div className="text-sm text-ink-muted">Current plan</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-lg font-bold text-ink">{isPremium ? "Premium" : "Free"}</span>
            <Badge variant={isPremium ? "premium" : "neutral"}>
              {isPremium ? "Active" : "Free tier"}
            </Badge>
          </div>
          {data.subscription && isPremium && (
            <div className="mt-1 text-xs text-ink-muted">
              {data.subscription.cancelAtPeriodEnd
                ? `Cancels on ${formatDate(data.subscription.currentPeriodEnd)}`
                : data.subscription.currentPeriodEnd
                  ? `Renews on ${formatDate(data.subscription.currentPeriodEnd)}`
                  : null}
            </div>
          )}
        </div>
        {isPremium && (
          <Button variant="secondary" onClick={manage} loading={pending} disabled={!data.stripeConfigured}>
            Manage subscription
          </Button>
        )}
      </div>

      {/* Upgrade card (free users) */}
      {!isPremium && (
        <div className="rounded-card border-2 border-premium-600 bg-white p-7 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-premium-600" aria-hidden />
              <h2 className="text-lg font-bold text-ink">Upgrade to Premium</h2>
            </div>
            {/* Interval toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
              {(["monthly", "yearly"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setIntervalState(opt)}
                  className={cn(
                    "rounded-md px-3 py-1.5 transition-colors",
                    interval === opt ? "bg-white text-ink shadow-sm" : "text-ink-muted",
                  )}
                >
                  {opt === "monthly" ? "Monthly" : "Yearly"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-4xl font-bold text-ink">${price}</span>
            <span className="text-sm text-ink-muted">/ {per}</span>
          </div>

          <ul className="mt-5 space-y-2.5">
            {data.premium.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-ink-secondary">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success-600" aria-hidden />
                {f}
              </li>
            ))}
          </ul>

          <Button
            className="mt-6 w-full"
            variant="premium"
            size="lg"
            onClick={subscribe}
            loading={pending}
            disabled={!data.stripeConfigured}
          >
            {data.stripeConfigured ? "Upgrade to Premium" : "Billing coming soon"}
          </Button>
          <p className="mt-2 text-center text-xs text-ink-muted">
            Secure checkout by Stripe. Cancel anytime.
          </p>
        </div>
      )}

      {/* Invoices */}
      {data.invoices.length > 0 && (
        <div className="card">
          <h2 className="border-b border-slate-100 px-5 py-4 font-semibold text-ink">
            Billing history
          </h2>
          <ul className="divide-y divide-slate-100">
            {data.invoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <div className="font-medium text-ink">
                    {inv.number ?? "Invoice"}
                  </div>
                  <div className="text-xs text-ink-muted">{formatDate(inv.issuedAt)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums text-ink-secondary">
                    {formatMoney(inv.amountCents, inv.currency)}
                  </span>
                  {(() => {
                    const link = inv.hostedInvoiceUrl ?? inv.pdfUrl;
                    return link ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
                      >
                        View <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    ) : null;
                  })()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}
