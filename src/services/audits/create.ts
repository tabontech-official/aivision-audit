import "server-only";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { db } from "@/lib/db/client";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { ANON_COOKIE_NAME } from "@/lib/auth/claim";
import { validateAndNormalizeUrl } from "@/lib/security/url";
import { assertPublicHost } from "@/lib/security/ssrf";
import { getSetting } from "@/services/settings/get";
import { enqueueAuditJob } from "@/services/jobs/enqueue";
import type { UserPlan } from "@prisma/client";

export type CreateAuditResult =
  | { ok: true; reportPublicId: string }
  | { ok: false; error: string; status: number };

type Requester =
  | { kind: "anonymous"; ip: string; userAgent: string | null }
  | { kind: "user"; userId: string; plan: UserPlan };

/**
 * Create an audit: validate URL → SSRF pre-check → resolve requester context
 * (anonymous session cookie or authenticated user + allowance) → create
 * website + report rows against the published default template → enqueue job.
 */
export async function createAudit(
  rawUrl: string,
  requester: Requester,
): Promise<CreateAuditResult> {
  // Maintenance gate
  if (await getSetting("maintenance_mode")) {
    return {
      ok: false,
      status: 503,
      error: "Audits are temporarily paused for maintenance. Please try again soon.",
    };
  }

  // 1. Validate + normalize
  const validated = validateAndNormalizeUrl(rawUrl);
  if (!validated.ok) return { ok: false, status: 400, error: validated.error };
  const { url, hostname, domain } = validated.value;

  // 2. SSRF pre-check (fast fail before any rows are written)
  const ssrf = await assertPublicHost(hostname);
  if (!ssrf.ok) return { ok: false, status: 400, error: ssrf.error };

  // 3. Active published template version
  const templateVersion = await db.templateVersion.findFirst({
    where: { status: "PUBLISHED", template: { isDefault: true, deletedAt: null } },
    orderBy: { versionNumber: "desc" },
    select: { id: true },
  });
  if (!templateVersion) {
    return {
      ok: false,
      status: 500,
      error: "No audit template is configured. Please contact support.",
    };
  }

  // 4. Requester context
  let anonymousSessionId: string | null = null;
  let userId: string | null = null;
  let plan: UserPlan = "FREE";
  let reportExpiresAt: Date | null = null;

  if (requester.kind === "user") {
    userId = requester.userId;
    plan = requester.plan;

    // Monthly allowance
    const limit =
      plan === "PREMIUM"
        ? await getSetting("premium_audit_limit")
        : await getSetting("free_audit_limit");
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const used = await db.report.count({
      where: { userId, createdAt: { gte: monthStart }, deletedAt: null },
    });
    if (used >= limit) {
      return {
        ok: false,
        status: 429,
        error:
          plan === "PREMIUM"
            ? `You've reached your monthly limit of ${limit} audits.`
            : `You've used all ${limit} free audits this month. Upgrade to Premium for more.`,
      };
    }

    // One concurrent audit per user
    const running = await db.report.count({
      where: { userId, status: { in: ["QUEUED", "PROCESSING"] } },
    });
    if (running > 0) {
      return {
        ok: false,
        status: 409,
        error: "You already have an audit in progress. Wait for it to finish first.",
      };
    }
  } else {
    // Anonymous: reuse a valid session cookie or mint a new one
    const cookieStore = await cookies();
    const existingRaw = cookieStore.get(ANON_COOKIE_NAME)?.value;
    const expirationDays = await getSetting("anonymous_report_expiration_days");
    const sessionExpiry = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000);

    if (existingRaw) {
      const found = await db.anonymousSession.findUnique({
        where: { tokenHash: hashToken(existingRaw) },
      });
      if (found && !found.claimedAt && found.expiresAt > new Date()) {
        anonymousSessionId = found.id;
      }
    }

    if (!anonymousSessionId) {
      const rawToken = generateToken();
      const session = await db.anonymousSession.create({
        data: {
          tokenHash: hashToken(rawToken),
          ipAddress: requester.ip,
          userAgent: requester.userAgent,
          expiresAt: sessionExpiry,
        },
      });
      anonymousSessionId = session.id;
      cookieStore.set(ANON_COOKIE_NAME, rawToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: expirationDays * 24 * 60 * 60,
      });
    }

    reportExpiresAt = sessionExpiry;

    // One concurrent audit per anonymous session
    const running = await db.report.count({
      where: { anonymousSessionId, status: { in: ["QUEUED", "PROCESSING"] } },
    });
    if (running > 0) {
      return {
        ok: false,
        status: 409,
        error: "An audit is already in progress. Wait for it to finish first.",
      };
    }
  }

  // 5. Website row (per-owner dedupe; anonymous audits share ownerless rows per URL)
  let website = await db.website.findFirst({
    where: { url, userId, deletedAt: null },
  });
  if (!website) {
    website = await db.website.create({
      data: { url, domain, userId },
    });
  }

  // 6. Report row
  const report = await db.report.create({
    data: {
      publicId: nanoid(21),
      websiteId: website.id,
      userId,
      anonymousSessionId,
      templateVersionId: templateVersion.id,
      status: "QUEUED",
      currentStage: "CONNECTING",
      planAtGeneration: plan,
      expiresAt: reportExpiresAt,
    },
  });

  // 7. Enqueue background job (QStash in prod; inline dev runner until Phase 4)
  await enqueueAuditJob(report.id);

  return { ok: true, reportPublicId: report.publicId };
}
