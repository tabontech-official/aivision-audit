import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { auditUrlInputSchema, validateAndNormalizeUrl } from "@/lib/security/url";
import { rateLimit } from "@/lib/security/rate-limit";
import { createAudit } from "@/services/audits/create";
import { recordFunnelEvent } from "@/services/leads/funnel";
import { db } from "@/lib/db/client";
import type { UserPlan } from "@prisma/client";

export const runtime = "nodejs";

/**
 * POST /api/audits — start a store audit. **Requires an account.**
 *
 * The URL is validated BEFORE the auth check on purpose: a visitor who typed
 * something unauditable is told so immediately rather than being sent through
 * a sign-up that gains them nothing. Only a valid, auditable URL reaches the
 * 401, which is what opens the sign-in gate on the client — it then replays
 * this same request so the audit they asked for is the one they get.
 *
 * The anonymous path in `createAudit()` is intentionally left intact but
 * unreachable from here; no audit is ever queued for an unauthenticated
 * visitor.
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

  const validated = validateAndNormalizeUrl(parsed.data.url);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const session = await auth();
  if (!session?.user) {
    // The client opens the sign-in gate on this status and replays the
    // request once authenticated. No audit is created or queued.
    return NextResponse.json({ error: "Sign in to start your audit." }, { status: 401 });
  }

  // Burst guard on top of the monthly allowance.
  const rl = await rateLimit(`audit:user:${session.user.id}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many audit requests. Please slow down." },
      { status: 429 },
    );
  }

  const result = await createAudit(parsed.data.url, {
    kind: "user",
    userId: session.user.id,
    plan: session.user.plan as UserPlan,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const report = await db.report.findUnique({
    where: { publicId: result.reportPublicId },
    select: { id: true },
  });
  await recordFunnelEvent("audit_started", report?.id);

  return NextResponse.json({ reportPublicId: result.reportPublicId }, { status: 201 });
}
