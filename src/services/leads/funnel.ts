import "server-only";
import { db } from "@/lib/db/client";

/**
 * Funnel counters. Append-only and best-effort — a metrics failure never
 * touches the funnel it measures.
 *
 * The flow is auth-first: an account exists before any audit runs, so
 * `audit_started` counts audits by signed-in users, not visits.
 */

/**
 * RETIRED events — kept in the union so historical rows stay readable, but
 * nothing records them any more:
 *   `email_captured_progress` — the progress-screen email ask (removed with
 *      the teaser gate).
 *   `teaser_viewed` — there is no teaser; the sign-in wall precedes the audit.
 */
export type FunnelEventName =
  | "audit_started"
  | "email_captured_signup"
  | "audit_completed"
  | "teaser_viewed"
  | "signup_completed"
  // Fix Loop retention measures (G.2.4)
  | "delta_email_sent"
  | "comparison_viewed";

export async function recordFunnelEvent(
  event: FunnelEventName,
  reportId?: string | null,
): Promise<void> {
  try {
    await db.funnelEvent.create({ data: { event, reportId: reportId ?? null } });
  } catch (err) {
    console.error("[funnel] record failed:", err);
  }
}

export type FunnelSummary = {
  windowDays: number;
  auditStarted: number;
  emailSignup: number;
  auditCompleted: number;
  /** RETIRED — no longer recorded; non-zero only for historical windows. */
  teaserViewed: number;
  /** Accounts created — audits only run after one exists. */
  signupCompleted: number;
  deltaEmailsSent: number;
  comparisonsViewed: number;
  /** How many of those accounts also opted into marketing. */
  marketingConsentCount: number;
};

export async function getFunnelSummary(windowDays = 30): Promise<FunnelSummary> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const grouped = await db.funnelEvent.groupBy({
    by: ["event"],
    where: { createdAt: { gte: since } },
    _count: true,
  });
  const count = (name: FunnelEventName) =>
    grouped.find((g) => g.event === name)?._count ?? 0;

  const auditStarted = count("audit_started");
  const teaserViewed = count("teaser_viewed");
  const signupCompleted = count("signup_completed");

  const marketingConsentCount = await db.lead.count({
    where: { marketingConsent: true, unsubscribedAt: null, createdAt: { gte: since } },
  });

  return {
    windowDays,
    auditStarted,
    emailSignup: count("email_captured_signup"),
    auditCompleted: count("audit_completed"),
    teaserViewed,
    signupCompleted,
    deltaEmailsSent: count("delta_email_sent"),
    comparisonsViewed: count("comparison_viewed"),
    marketingConsentCount,
  };
}
