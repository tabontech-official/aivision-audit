import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db/client";
import { createAudit } from "@/services/audits/create";
import { getAllowance } from "@/services/audits/allowance";
import { logExecution } from "@/services/system-log/log";
import type { UserPlan } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * GET/POST /api/cron/schedule — scheduled re-audits (§2.9), meant to run
 * hourly. Protected by CRON_SECRET exactly like /api/cron/reap.
 *
 * Rules:
 *  - FREE may schedule MONTHLY at most; PREMIUM up to WEEKLY. A downgrade
 *    that leaves a WEEKLY schedule on a FREE plan is reduced to MONTHLY and
 *    the user notified — a plan-exceeding schedule never keeps running.
 *  - Scheduled audits consume the monthly allowance through the SAME intake
 *    path as user-initiated audits (createAudit → enqueueAuditJob). When the
 *    allowance is exhausted the run is skipped and the user notified ONCE
 *    (scheduleSkipNotifiedAt) — never silently dropped, never spammed.
 */
const WEEKLY_MS = 7 * 24 * 60 * 60 * 1000;
const MONTHLY_MS = 30 * 24 * 60 * 60 * 1000;
const INTERVAL_MS: Record<string, number> = { WEEKLY: WEEKLY_MS, MONTHLY: MONTHLY_MS };

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : header;
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function handle(req: Request): Promise<NextResponse> {
  if (!process.env.CRON_SECRET?.trim()) {
    return NextResponse.json({ error: "Scheduler not configured (CRON_SECRET unset)." }, { status: 503 });
  }
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const websites = await db.website.findMany({
    where: {
      auditSchedule: { not: "NONE" },
      userId: { not: null },
      deletedAt: null,
      user: { deletedAt: null },
    },
    include: { user: { select: { id: true, plan: true } } },
    take: 100,
  });

  let started = 0;
  let skippedAllowance = 0;
  let downgraded = 0;
  let notDue = 0;

  for (const website of websites) {
    const user = website.user!;

    // Downgrade rule: never leave a plan-exceeding schedule running.
    let schedule = website.auditSchedule;
    if (schedule === "WEEKLY" && user.plan !== "PREMIUM") {
      schedule = "MONTHLY";
      await db.website.update({ where: { id: website.id }, data: { auditSchedule: "MONTHLY" } });
      await db.notification.create({
        data: {
          userId: user.id,
          type: "PLAN_DOWNGRADED",
          title: `${website.domain}: weekly audits reduced to monthly`,
          body: "Weekly scheduled audits require Premium. Your schedule was adjusted to monthly.",
          linkUrl: `/dashboard/websites/${website.id}`,
        },
      }).catch(() => undefined);
      downgraded++;
    }

    const interval = INTERVAL_MS[schedule];
    if (!interval) continue;
    const last = website.lastAuditedAt?.getTime() ?? 0;
    if (Date.now() - last < interval) {
      notDue++;
      continue;
    }

    // Allowance: skip + notify once, never silently drop.
    const allowance = await getAllowance(user.id, user.plan as UserPlan);
    if (allowance.remaining <= 0) {
      const alreadyNotifiedThisPeriod =
        website.scheduleSkipNotifiedAt &&
        website.scheduleSkipNotifiedAt.getTime() > Date.now() - MONTHLY_MS;
      if (!alreadyNotifiedThisPeriod) {
        await db.notification.create({
          data: {
            userId: user.id,
            type: "SYSTEM",
            title: `Scheduled audit for ${website.domain} skipped`,
            body: `Your monthly audit allowance is used up (${allowance.limit}/${allowance.limit}). The schedule resumes when it resets.`,
            linkUrl: `/dashboard/websites/${website.id}`,
          },
        }).catch(() => undefined);
        await db.website.update({
          where: { id: website.id },
          data: { scheduleSkipNotifiedAt: new Date() },
        });
      }
      skippedAllowance++;
      continue;
    }

    // Same path as a user-initiated audit — no special casing (G.1.2). A 409
    // (already in flight) just waits for the next cron pass.
    const result = await createAudit(website.url, {
      kind: "user",
      userId: user.id,
      plan: user.plan as UserPlan,
    });
    if (result.ok) {
      started++;
      if (website.scheduleSkipNotifiedAt) {
        await db.website.update({
          where: { id: website.id },
          data: { scheduleSkipNotifiedAt: null },
        });
      }
    }
  }

  if (websites.length > 0) {
    await logExecution({
      level: "INFO",
      category: "AUDIT_PIPELINE",
      message: `Scheduled-audit sweep: ${started} started, ${skippedAllowance} skipped (allowance), ${downgraded} downgraded to monthly, ${notDue} not due`,
      meta: { scheduler: true, started, skippedAllowance, downgraded, notDue },
    });
  }

  return NextResponse.json({ ok: true, started, skippedAllowance, downgraded, notDue });
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}
