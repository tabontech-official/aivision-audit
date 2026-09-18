import "server-only";
import { db } from "@/lib/db/client";
import { getSecretSetting } from "@/services/settings/secret";

/**
 * Google PageSpeed Insights v5 client.
 * Fetches mobile + desktop in parallel, extracts scores/metrics/opportunities,
 * logs api_usage, and stores the raw response for admin debugging (never
 * exposed to end users).
 */

const PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const PSI_TIMEOUT_MS = 90_000; // PSI can be slow; QStash callback budget allows it

export type PsiStrategyName = "MOBILE" | "DESKTOP";

export type PsiMetrics = {
  strategy: PsiStrategyName;
  performanceScore: number | null;
  accessibilityScore: number | null;
  bestPracticesScore: number | null;
  seoScore: number | null;
  fcpMs: number | null;
  lcpMs: number | null;
  tbtMs: number | null;
  cls: number | null;
  speedIndexMs: number | null;
  ttiMs: number | null;
  inpMs: number | null;
  serverResponseMs: number | null;
  opportunities: Array<{ id: string; title: string; savingsMs: number | null; description: string }>;
  diagnostics: Array<{ id: string; title: string; displayValue: string | null; description: string }>;
  passedAudits: Array<{ id: string; title: string }>;
  rawResponse: Record<string, unknown>;
};

type LighthouseAudit = {
  id?: string;
  title?: string;
  description?: string;
  score?: number | null;
  scoreDisplayMode?: string;
  displayValue?: string;
  numericValue?: number;
  details?: { overallSavingsMs?: number; type?: string };
};

function categoryScore(lhr: Record<string, unknown>, key: string): number | null {
  const categories = lhr.categories as
    | Record<string, { score?: number | null }>
    | undefined;
  const score = categories?.[key]?.score;
  return typeof score === "number" ? Math.round(score * 100) : null;
}

function auditNumeric(audits: Record<string, LighthouseAudit>, id: string): number | null {
  const v = audits[id]?.numericValue;
  return typeof v === "number" ? Math.round(v * 100) / 100 : null;
}

async function logUsage(
  reportId: string,
  strategy: string,
  statusCode: number | null,
  durationMs: number,
  success: boolean,
  errorMessage?: string,
): Promise<void> {
  await db.apiUsage
    .create({
      data: {
        provider: "pagespeed",
        endpoint: `runPagespeed?strategy=${strategy.toLowerCase()}`,
        reportId,
        statusCode,
        durationMs,
        success,
        errorMessage: errorMessage?.slice(0, 500),
      },
    })
    .catch(() => undefined); // usage logging must never break an audit
}

/**
 * Database first, env var second. The admin-saved key must win: an operator
 * who saves a key in Settings and sees "Saved" is entitled to have it used —
 * an env var silently overriding it is invisible and nearly undebuggable.
 * Read fresh on every call (no cache), so a save takes effect on the very
 * next audit without a redeploy.
 */
async function getPsiApiKey(): Promise<string | null> {
  return getSecretSetting("pagespeed_api_key", process.env.PAGESPEED_API_KEY);
}

export async function fetchPsi(
  url: string,
  strategy: PsiStrategyName,
  reportId: string,
): Promise<PsiMetrics | null> {
  const apiKey = await getPsiApiKey();
  const params = new URLSearchParams({
    url,
    strategy: strategy.toLowerCase(),
  });
  for (const cat of ["performance", "accessibility", "best-practices", "seo"]) {
    params.append("category", cat);
  }
  if (apiKey) params.set("key", apiKey);

  const startedAt = Date.now();
  let res: Response;
  try {
    res = await fetch(`${PSI_ENDPOINT}?${params.toString()}`, {
      signal: AbortSignal.timeout(PSI_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (err) {
    await logUsage(reportId, strategy, null, Date.now() - startedAt, false,
      err instanceof Error ? err.message : "fetch failed");
    return null;
  }

  const durationMs = Date.now() - startedAt;

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    await logUsage(reportId, strategy, res.status, durationMs, false, text.slice(0, 300));
    return null;
  }

  await logUsage(reportId, strategy, res.status, durationMs, true);

  const data = (await res.json()) as Record<string, unknown>;
  const lhr = (data.lighthouseResult ?? {}) as Record<string, unknown>;
  const audits = (lhr.audits ?? {}) as Record<string, LighthouseAudit>;

  const opportunities: PsiMetrics["opportunities"] = [];
  const diagnostics: PsiMetrics["diagnostics"] = [];
  const passedAudits: PsiMetrics["passedAudits"] = [];

  for (const audit of Object.values(audits)) {
    if (!audit.id || !audit.title) continue;
    if (audit.details?.type === "opportunity" && (audit.score ?? 1) < 1) {
      opportunities.push({
        id: audit.id,
        title: audit.title,
        savingsMs: audit.details.overallSavingsMs ?? null,
        description: (audit.description ?? "").slice(0, 400),
      });
    } else if (audit.scoreDisplayMode === "informative" && audit.displayValue) {
      diagnostics.push({
        id: audit.id,
        title: audit.title,
        displayValue: audit.displayValue ?? null,
        description: (audit.description ?? "").slice(0, 400),
      });
    } else if (audit.score === 1 && audit.scoreDisplayMode === "binary") {
      passedAudits.push({ id: audit.id, title: audit.title });
    }
  }

  opportunities.sort((a, b) => (b.savingsMs ?? 0) - (a.savingsMs ?? 0));

  return {
    strategy,
    performanceScore: categoryScore(lhr, "performance"),
    accessibilityScore: categoryScore(lhr, "accessibility"),
    bestPracticesScore: categoryScore(lhr, "best-practices"),
    seoScore: categoryScore(lhr, "seo"),
    fcpMs: auditNumeric(audits, "first-contentful-paint"),
    lcpMs: auditNumeric(audits, "largest-contentful-paint"),
    tbtMs: auditNumeric(audits, "total-blocking-time"),
    cls: auditNumeric(audits, "cumulative-layout-shift"),
    speedIndexMs: auditNumeric(audits, "speed-index"),
    ttiMs: auditNumeric(audits, "interactive"),
    inpMs: auditNumeric(audits, "interaction-to-next-paint"),
    serverResponseMs: auditNumeric(audits, "server-response-time"),
    opportunities: opportunities.slice(0, 15),
    diagnostics: diagnostics.slice(0, 15),
    passedAudits: passedAudits.slice(0, 40),
    rawResponse: data,
  };
}

export type PsiKeyTestResult = {
  verdict: "valid" | "invalid_key" | "api_disabled" | "quota_exceeded" | "network_error";
  detail: string;
};

/**
 * Validate a PSI API key without saving it. One authenticated call against a
 * known-good lightweight URL, mobile only, short timeout — enough to
 * distinguish the failure modes an operator actually hits.
 */
export async function testPsiApiKey(apiKey: string): Promise<PsiKeyTestResult> {
  const params = new URLSearchParams({
    url: "https://example.com",
    strategy: "mobile",
    category: "performance",
    key: apiKey,
  });

  let res: Response;
  try {
    res = await fetch(`${PSI_ENDPOINT}?${params.toString()}`, {
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
    });
  } catch (err) {
    return {
      verdict: "network_error",
      detail: err instanceof Error ? err.message.slice(0, 200) : "Request failed.",
    };
  }

  if (res.ok) return { verdict: "valid", detail: "The key authenticated successfully." };

  const body = (await res.json().catch(() => null)) as
    | { error?: { message?: string; status?: string; errors?: Array<{ reason?: string }> } }
    | null;
  const message = body?.error?.message ?? `HTTP ${res.status}`;
  const reason = body?.error?.errors?.[0]?.reason ?? "";
  const status = body?.error?.status ?? "";

  if (res.status === 429 || status === "RESOURCE_EXHAUSTED" || reason === "rateLimitExceeded") {
    return { verdict: "quota_exceeded", detail: message.slice(0, 300) };
  }
  // Google reports a key from a project without the API enabled as 403
  // PERMISSION_DENIED with an "API has not been used/enabled" message.
  if (res.status === 403 && /not (been )?(used|enabled)|disabled/i.test(message)) {
    return { verdict: "api_disabled", detail: message.slice(0, 300) };
  }
  if (res.status === 400 || res.status === 403) {
    return { verdict: "invalid_key", detail: message.slice(0, 300) };
  }
  return { verdict: "network_error", detail: message.slice(0, 300) };
}

/** Fetch both strategies in parallel; either may independently fail (null). */
export async function fetchPsiBoth(
  url: string,
  reportId: string,
): Promise<{ mobile: PsiMetrics | null; desktop: PsiMetrics | null }> {
  const [mobile, desktop] = await Promise.all([
    fetchPsi(url, "MOBILE", reportId),
    fetchPsi(url, "DESKTOP", reportId),
  ]);
  return { mobile, desktop };
}
