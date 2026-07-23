import { NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { z } from "zod";
import { runAudit } from "@/services/jobs/run-audit";

export const runtime = "nodejs";
export const maxDuration = 300; // Vercel: allow up to 5 min for the full pipeline

const bodySchema = z.object({ reportId: z.string().uuid() });

/**
 * POST /api/jobs/run-audit — QStash callback worker.
 * Only requests carrying a valid QStash signature are accepted; anyone else
 * gets 401. runAudit() is idempotent, so QStash retries are safe.
 */
export async function POST(req: Request) {
  const currentKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextKey = process.env.QSTASH_NEXT_SIGNING_KEY;

  if (!currentKey || !nextKey) {
    // Without signing keys this endpoint must not be callable (dev runs inline).
    return NextResponse.json({ error: "Worker not configured." }, { status: 503 });
  }

  const signature = req.headers.get("upstash-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 401 });
  }

  const rawBody = await req.text();

  const receiver = new Receiver({
    currentSigningKey: currentKey,
    nextSigningKey: nextKey,
  });

  let valid = false;
  try {
    valid = await receiver.verify({ signature, body: rawBody });
  } catch {
    valid = false;
  }
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(parsedBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  await runAudit(parsed.data.reportId);

  return NextResponse.json({ ok: true });
}
