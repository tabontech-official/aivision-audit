import "server-only";
import { db } from "@/lib/db/client";
import { sendEmail } from "@/services/email/send";
import { recordFunnelEvent } from "@/services/leads/funnel";
import { unsubscribeToken } from "@/services/leads/capture";
import { OPEN_FILTER_STATES } from "./transitions";

/**
 * Delta email + in-app notification (§2.8 / H.4) — the retention trigger.
 *
 * Sends ONLY when the report has a previousReportId (first audits get the
 * Part D result email instead). Transactional — it results from an audit the
 * user initiated or scheduled — but respects `User.auditEmailsEnabled`, the
 * audit-email preference distinct from marketing unsubscribe.
 *
 * The subject leads with the score movement; the body is the delta summary,
 * the three highest-severity open findings, and one CTA to the comparison
 * view. Rendered from the `audit_delta` EmailTemplate row (seeded on first
 * use so the admin can edit it later).
 */

const TEMPLATE_KEY = "audit_delta";

const DEFAULT_SUBJECT = "Your store score went {{previousScore}} → {{score}} ({{delta}})";
const DEFAULT_HTML = `
<h2 style="margin:0 0 8px">{{domain}}: {{previousScore}} → {{score}} ({{delta}})</h2>
<p>{{summaryLine}}</p>
{{topFindings}}
<p><a href="{{compareUrl}}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">See what changed</a></p>
<p style="font-size:12px;color:#94a3b8;margin-top:24px">
  You received this because an audit ran for {{domain}}.
  <a href="{{auditPrefUrl}}" style="color:#94a3b8">Turn off audit emails</a> ·
  <a href="{{unsubUrl}}" style="color:#94a3b8">Unsubscribe from marketing</a>
</p>`;

function appUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}

async function getTemplate(): Promise<{ subject: string; html: string }> {
  const row = await db.emailTemplate
    .upsert({
      where: { key: TEMPLATE_KEY },
      update: {},
      create: {
        key: TEMPLATE_KEY,
        name: "Audit delta (score movement)",
        subject: DEFAULT_SUBJECT,
        htmlBody: DEFAULT_HTML,
        availableVariables: [
          "domain", "score", "previousScore", "delta", "summaryLine",
          "topFindings", "compareUrl", "auditPrefUrl", "unsubUrl",
        ],
      },
    })
    .catch(() => null);
  if (row && row.isEnabled) return { subject: row.subject, html: row.htmlBody };
  return { subject: DEFAULT_SUBJECT, html: DEFAULT_HTML };
}

function render(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

export async function sendDeltaEmailForReport(reportId: string): Promise<void> {
  const report = await db.report.findUnique({
    where: { id: reportId },
    include: {
      website: { select: { id: true, domain: true, userId: true } },
      user: { select: { id: true, email: true, auditEmailsEnabled: true } },
    },
  });
  if (!report?.previousReportId || !report.user || !report.website.userId) return;
  if (report.status !== "COMPLETED" && report.status !== "PARTIAL") return;

  const previous = await db.report.findUnique({
    where: { id: report.previousReportId },
    select: { overallScore: true },
  });

  const score = report.overallScore !== null ? Math.round(report.overallScore) : null;
  const prevScore = previous?.overallScore != null ? Math.round(previous.overallScore) : null;
  if (score === null || prevScore === null) return;
  const deltaNum = report.scoreDelta ?? score - prevScore;
  const delta = `${deltaNum >= 0 ? "+" : ""}${Math.round(deltaNum * 10) / 10}`;

  /* ---- delta summary from this report's finding events ---- */
  const events = await db.findingEvent.findMany({
    where: { reportId },
    select: { stateBefore: true, stateAfter: true },
  });
  const fixed = events.filter((e) => e.stateAfter === "VERIFIED_FIXED" && e.stateBefore !== "VERIFIED_FIXED").length;
  const stillFailing = events.filter((e) => e.stateAfter === "STILL_FAILING" && e.stateBefore === "MARKED_FIXED").length;
  const fresh = events.filter((e) => e.stateBefore === null).length;
  const regressed = events.filter((e) => e.stateAfter === "REGRESSED" && e.stateBefore === "VERIFIED_FIXED").length;
  const parts: string[] = [];
  if (fixed) parts.push(`${fixed} fixed & verified`);
  if (fresh) parts.push(`${fresh} new issue${fresh === 1 ? "" : "s"}`);
  if (regressed) parts.push(`${regressed} regressed`);
  if (stillFailing) parts.push(`${stillFailing} marked fixed but still failing`);
  const summaryLine = parts.length ? parts.join(" · ") : "No finding changes this run.";

  /* ---- top three open findings by severity ---- */
  const severityOrder = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"] as const;
  const open = await db.finding.findMany({
    where: { websiteId: report.website.id, state: { in: OPEN_FILTER_STATES } },
    orderBy: [{ severity: "asc" }, { firstSeenAt: "asc" }],
    take: 20,
  });
  const topThree = open
    .sort(
      (a, b) =>
        severityOrder.indexOf(a.severity as (typeof severityOrder)[number]) -
        severityOrder.indexOf(b.severity as (typeof severityOrder)[number]),
    )
    .slice(0, 3);
  const topFindings = topThree.length
    ? `<ul>${topThree.map((f) => `<li><strong>${f.checkName}</strong> (${f.sectionName}, ${f.severity.toLowerCase()})</li>`).join("")}</ul>`
    : "";

  /* ---- in-app notification always; email only if the preference allows ---- */
  await db.notification
    .create({
      data: {
        userId: report.user.id,
        type: "REPORT_READY",
        title: `${report.website.domain}: ${prevScore} → ${score} (${delta})`,
        body: summaryLine,
        linkUrl: `/dashboard/reports/${report.publicId}/compare`,
      },
    })
    .catch(() => undefined);

  if (!report.user.auditEmailsEnabled || !report.user.email) return;

  const template = await getTemplate();
  const email = report.user.email;
  const vars: Record<string, string> = {
    domain: report.website.domain,
    score: String(score),
    previousScore: String(prevScore),
    delta,
    summaryLine,
    topFindings,
    compareUrl: appUrl(`/dashboard/reports/${report.publicId}/compare`),
    auditPrefUrl: appUrl(
      `/unsubscribe?type=audit&e=${encodeURIComponent(email)}&d=${encodeURIComponent(report.website.domain)}&t=${unsubscribeToken(email, report.website.domain)}`,
    ),
    unsubUrl: appUrl(
      `/unsubscribe?e=${encodeURIComponent(email)}&d=${encodeURIComponent(report.website.domain)}&t=${unsubscribeToken(email, report.website.domain)}`,
    ),
  };

  const sent = await sendEmail({
    to: email,
    subject: render(template.subject, vars),
    html: render(template.html, vars),
    text: `${report.website.domain}: ${prevScore} → ${score} (${delta}). ${summaryLine} ${vars.compareUrl}`,
  });
  if (sent.ok) await recordFunnelEvent("delta_email_sent", reportId);
}
