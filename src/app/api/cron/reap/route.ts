import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { reapStuckReports } from "@/services/jobs/reap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET/POST /api/cron/reap — the orphaned-audit watchdog, meant to be hit
 * every 5 minutes by a scheduler (Vercel Cron, QStash schedule, or any
 * external pinger). Protected by CRON_SECRET in the Authorization header:
 *
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Without CRON_SECRET configured the route refuses to run — an open reaper
 * endpoint would let anyone force-fail in-flight audits.
 */
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
    return NextResponse.json({ error: "Watchdog not configured (CRON_SECRET unset)." }, { status: 503 });
  }
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const summary = await reapStuckReports();
  return NextResponse.json({ ok: true, ...summary });
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
