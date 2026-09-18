import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db/client";
import type { ExtractedData } from "@/services/inspection/types";

/**
 * Lead records.
 *
 * Audits require an account, so a `Lead` is only ever created alongside a
 * `User` at signup — there is no path that produces a lead without one. One
 * row per email+domain pair.
 *
 * Consent handling (these visitors are largely EU/UK, so none of this is
 * optional): the marketing checkbox defaults unticked, consent is stored with
 * a timestamp and a SHA-256 of the IP (proof without retaining the address),
 * and transactional mail (audit results) is a separate concern from marketing
 * mail (tips), each with its own control.
 */

/** Tie the lead to the audit that was run for it. */
export async function linkLeadToReport(
  leadId: string,
  anonymousSessionId: string | null,
  reportId: string,
): Promise<void> {
  const lead = await db.lead.findUnique({ where: { id: leadId }, select: { firstReportId: true } });
  await db.lead.update({
    where: { id: leadId },
    data: {
      anonymousSessionId,
      ...(lead?.firstReportId ? {} : { firstReportId: reportId }),
    },
  });
}

/**
 * On signup: link every lead carrying this email to the account and copy an
 * existing marketing consent onto the user (marketing sends check the User).
 */
export async function convertLeadsForUser(userId: string, email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const leads = await db.lead.findMany({
    where: { email: normalized, convertedUserId: null },
    select: { id: true, marketingConsent: true, consentAt: true, unsubscribedAt: true },
  });
  if (leads.length === 0) return;

  await db.lead.updateMany({
    where: { id: { in: leads.map((l) => l.id) } },
    data: { convertedUserId: userId, convertedAt: new Date() },
  });

  const consented = leads.find((l) => l.marketingConsent && !l.unsubscribedAt);
  if (consented) {
    await db.user.update({
      where: { id: userId },
      data: {
        marketingConsent: true,
        marketingConsentAt: consented.consentAt ?? new Date(),
      },
    });
  }
}

/**
 * Signup is the ONLY capture point: `User` and `Lead` are created together
 * and the lead is converted from the moment it exists, because signing up IS
 * the conversion. Nothing creates an unconverted lead.
 *
 * This still runs because a visitor may have audited under an anonymous
 * session in an earlier build; it links any such reports and copies their
 * detected platform data onto the lead, which `/master-admin/leads` displays.
 * With the auth-first flow there are usually no such reports and this is a
 * no-op.
 *
 * Returns whether this signup is where the email FIRST arrived, which drives
 * the `email_captured_signup` counter.
 */
export async function captureLeadsAtSignup(
  userId: string,
  email: string,
  marketingConsent = false,
  ip?: string,
): Promise<boolean> {
  const normalized = email.trim().toLowerCase();

  const reports = await db.report.findMany({
    where: { userId, anonymousSessionId: { not: null }, deletedAt: null },
    select: {
      id: true,
      anonymousSessionId: true,
      website: { select: { url: true, domain: true } },
      rawData: { select: { extracted: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  if (reports.length === 0) return false;

  const emailWasKnown = (await db.lead.count({ where: { email: normalized } })) > 0;

  const consentFields = marketingConsent
    ? {
        marketingConsent: true,
        consentAt: new Date(),
        ...(ip ? { consentIpHash: createHash("sha256").update(ip).digest("hex") } : {}),
      }
    : {};

  const seenDomains = new Set<string>();
  for (const report of reports) {
    if (seenDomains.has(report.website.domain)) continue;
    seenDomains.add(report.website.domain);

    const site = (report.rawData?.extracted as unknown as ExtractedData | null)?.site ?? null;
    const platformFields = site
      ? {
          platform: site.platform,
          themeName: site.themeName,
          appCount: site.appCount,
          plusLikelihood: site.plusLikelihood,
        }
      : {};

    const lead = await db.lead.upsert({
      where: { email_domain: { email: normalized, domain: report.website.domain } },
      update: {
        convertedUserId: userId,
        convertedAt: new Date(),
        ...platformFields,
        ...consentFields,
      },
      create: {
        email: normalized,
        websiteUrl: report.website.url,
        domain: report.website.domain,
        marketingConsent,
        source: "teaser",
        // Converted at creation: signing up IS the conversion.
        convertedUserId: userId,
        convertedAt: new Date(),
        ...platformFields,
        ...consentFields,
      },
    });
    await linkLeadToReport(lead.id, report.anonymousSessionId, report.id);
  }

  return !emailWasKnown;
}

/* ------------------------------------------------------------------ */
/* Unsubscribe tokens — one-click, no login required                   */
/* ------------------------------------------------------------------ */

function unsubscribeSecret(): string {
  // AUTH_SECRET is always configured (auth cannot run without it).
  return process.env.AUTH_SECRET ?? "auditflow-unsubscribe";
}

export function unsubscribeToken(email: string, domain: string): string {
  return createHmac("sha256", unsubscribeSecret())
    .update(`${email.trim().toLowerCase()}|${domain}`)
    .digest("hex")
    .slice(0, 32);
}

export function verifyUnsubscribeToken(email: string, domain: string, token: string): boolean {
  const expected = Buffer.from(unsubscribeToken(email, domain));
  const provided = Buffer.from(token);
  return expected.length === provided.length && timingSafeEqual(expected, provided);
}

/** Write the unsubscribe through to the lead(s) AND any account. */
export async function unsubscribeEmail(email: string): Promise<number> {
  const normalized = email.trim().toLowerCase();
  const result = await db.lead.updateMany({
    where: { email: normalized, unsubscribedAt: null },
    data: { unsubscribedAt: new Date(), marketingConsent: false },
  });
  await db.user.updateMany({
    where: { email: normalized },
    data: { marketingConsent: false },
  });
  return result.count;
}
