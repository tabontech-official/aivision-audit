import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { auditUrlInputSchema } from "@/lib/security/url";
import { rateLimit, getClientIp } from "@/lib/security/rate-limit";
import { getSetting } from "@/services/settings/get";
import { createAudit } from "@/services/audits/create";
import type { UserPlan } from "@prisma/client";

export const runtime = "nodejs";

/**
 * POST /api/audits — start a website audit.
 * Anonymous: rate-limited per IP, creates/reuses an anonymous session cookie.
 * Authenticated: monthly allowance enforced inside createAudit.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = auditUrlInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Enter a valid website URL." },
      { status: 400 },
    );
  }

  const session = await auth();
  const ip = getClientIp(req);

  // Rate limits: anonymous per-IP hourly (setting-driven); users get a
  // burst guard on top of their monthly allowance.
  if (!session?.user) {
    const hourlyLimit = await getSetting("anonymous_audits_per_hour_ip");
    const rl = await rateLimit(`audit:anon:${ip}`, hourlyLimit, 60 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error:
            "You've reached the audit limit for now. Create a free account for more audits.",
        },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
      );
    }
  } else {
    const rl = await rateLimit(`audit:user:${session.user.id}`, 10, 60 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many audit requests. Please slow down." },
        { status: 429 },
      );
    }
  }

  const result = await createAudit(
    parsed.data.url,
    session?.user
      ? { kind: "user", userId: session.user.id, plan: session.user.plan as UserPlan }
      : { kind: "anonymous", ip, userAgent: req.headers.get("user-agent") },
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ reportPublicId: result.reportPublicId }, { status: 201 });
}
