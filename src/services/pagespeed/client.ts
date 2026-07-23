import "server-only";
import { db } from "@/lib/db/client";

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

/** Env var takes precedence; falls back to the admin-saved setting. */
async function getPsiApiKey(): Promise<string | null> {
  if (process.env.PAGESPEED_API_KEY) return process.env.PAGESPEED_API_KEY;
  try {
    const row = await db.systemSetting.findUnique({ where: { key: "pagespeed_api_key" } });
    return typeof row?.value === "string" && row.value.length > 0 ? row.value : null;
  } catch {
    return null;
  }
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
