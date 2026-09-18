import "server-only";
import { db } from "@/lib/db/client";
import { sendEmail } from "@/services/email/send";
import { unsubscribeToken } from "./capture";
import type { ExtractedData } from "@/services/inspection/types";

/**
 * Post-audit lead follow-through. Called from the tail of runAudit():
 *
 *  1. Copies the detected platform/theme/app data onto the Lead — which
 *     platforms show up is market data, and the leads admin filters by it.
 *  2. Sends the result (or failure) email the visitor asked for when they
 *     typed their address. TRANSACTIONAL — it results from an action they
 *     initiated, so it sends regardless of marketing consent, with an
 *     unsubscribe link that controls marketing mail only.
 *
 * Best-effort by contract: a notification failure must never fail an audit.
 */

function appUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}

function footer(email: string, domain: string): string {
  const unsub = appUrl(
    `/unsubscribe?e=${encodeURIComponent(email)}&d=${encodeURIComponent(domain)}&t=${unsubscribeToken(email, domain)}`,
  );
  return `
    <p style="font-size:12px;color:#94a3b8;margin-top:24px">
      You received this because you requested an audit of ${domain}.
      <a href="${unsub}" style="color:#94a3b8">Unsubscribe from marketing emails</a>
    </p>`;
}

export async function notifyLeadForReport(reportId: string): Promise<void> {
  try {
    const report = await db.report.findUnique({
      where: { id: reportId },
      include: {
        website: { select: { url: true, domain: true } },
        rawData: { select: { extracted: true } },
        user: { select: { email: true, auditEmailsEnabled: true } },
      },
    });
    if (!report) return;

    // Audits require an account, so there is never an anonymous recipient.
    if (!report.userId || !report.user?.email) return;

    /* ---- record/refresh the lead for this account + domain ----
     * Audits require an account, so this completion is the first moment we
     * know BOTH the email and the domain. The row is converted from creation
     * — signing up was the conversion — and carries the platform data the
     * leads table displays. Marketing consent is never set here; it belongs
     * to the signup checkbox alone. */
    const site = (report.rawData?.extracted as unknown as ExtractedData | null)?.site;
    const platformFields = site
      ? {
          platform: site.platform,
          themeName: site.themeName,
          appCount: site.appCount,
          plusLikelihood: site.plusLikelihood,
        }
      : {};
    await db.lead
      .upsert({
        where: {
          email_domain: {
            email: report.user.email.trim().toLowerCase(),
            domain: report.website.domain,
          },
        },
        update: { convertedUserId: report.userId, ...platformFields },
        create: {
          email: report.user.email.trim().toLowerCase(),
          websiteUrl: report.website.url,
          domain: report.website.domain,
          source: "audit",
          marketingConsent: false,
          convertedUserId: report.userId,
          convertedAt: new Date(),
          firstReportId: report.id,
          ...platformFields,
        },
      })
      .catch(() => undefined);

    // ---- from here on: the email itself ----
    // Lead bookkeeping above must not depend on email preferences.
    if (!report.user.auditEmailsEnabled) return;
    // A re-audit with a chain gets the delta email instead; sending both
    // would be two emails about one audit.
    if (report.previousReportId) return;

    const lead = { email: report.user.email, domain: report.website.domain };
    const reportUrl = appUrl(`/dashboard/reports/${report.publicId}`);
    const domain = report.website.domain;

    if (report.status === "COMPLETED" || report.status === "PARTIAL") {
      const score = report.overallScore !== null ? Math.round(report.overallScore) : null;
      await sendEmail({
        to: lead.email,
        subject: score !== null
          ? `Your Shopify store audit is ready — ${domain} scored ${score}/100`
          : `Your store audit for ${domain} is ready`,
        html: `
          <h2 style="margin:0 0 8px">Your store audit is ready</h2>
          <p>${score !== null ? `<strong>${domain}</strong> scored <strong>${score}/100</strong>${report.grade ? ` (${report.grade})` : ""}.` : `We finished auditing <strong>${domain}</strong>.`}
          ${report.failedCount > 0 ? ` We found <strong>${report.failedCount} issue${report.failedCount === 1 ? "" : "s"}</strong>${report.criticalIssueCount > 0 ? `, ${report.criticalIssueCount} critical` : ""}.` : ""}</p>
          ${site?.isShopify && site.appCount > 0 ? `<p>Detected: Shopify${site.themeName ? `, theme “${site.themeName}”` : ""}, ${site.appCount} third-party app script host${site.appCount === 1 ? "" : "s"}${site.blockingAppScripts > 0 ? ` (${site.blockingAppScripts} render-blocking)` : ""}.</p>` : ""}
          <p><a href="${reportUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">View your report</a></p>
          ${footer(lead.email, lead.domain)}`,
        text: `Your store audit for ${domain} is ready${score !== null ? ` — score ${score}/100` : ""}. View it: ${reportUrl}`,
      });
    } else if (report.status === "FAILED") {
      await sendEmail({
        to: lead.email,
        subject: `We couldn't finish your audit of ${domain}`,
        html: `
          <h2 style="margin:0 0 8px">Sorry — your audit didn't complete</h2>
          <p>${report.errorMessage ?? "Something went wrong while auditing your site."}</p>
          <p>No audit credit was wasted. You can retry any time:</p>
          <p><a href="${appUrl("/")}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Retry the audit</a></p>
          ${footer(lead.email, lead.domain)}`,
        text: `Sorry — we couldn't finish auditing ${domain}. ${report.errorMessage ?? ""} Retry: ${appUrl("/")}`,
      });
    }
  } catch (err) {
    console.error("[leads] notify failed (audit unaffected):", err);
  }
}
