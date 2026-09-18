"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auth } from "@/lib/auth/auth";
import { rateLimit } from "@/lib/security/rate-limit";
import { logAdminActivity } from "@/services/audit-log/log";
import { applyUserAction, type UserAction } from "@/services/findings/transitions";
import type { AuditSchedule } from "@prisma/client";

export type FixListResult =
  | { ok: true; message?: string; updated?: number }
  | { ok: false; error: string };

const actionSchema = z.object({
  findingIds: z.array(z.string().uuid()).min(1).max(100),
  action: z.enum(["acknowledge", "start_work", "mark_fixed", "wont_fix", "false_positive", "reopen"]),
  note: z.string().trim().max(1000).optional(),
});

/**
 * Finding state actions (§2.6). Ownership verified server-side on EVERY
 * mutation: a user may only act on findings for websites they own; a master
 * admin may act for support and the action is written to AdminActivityLog.
 * Bulk mutations are rate-limited (~200/hour/user).
 */
export async function findingActionAction(input: unknown): Promise<FixListResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not signed in." };

  const parsed = actionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { findingIds, action, note } = parsed.data;

  const rl = await rateLimit(`findings:mutate:${session.user.id}`, 200, 60 * 60 * 1000);
  if (!rl.allowed) return { ok: false, error: "Too many changes this hour. Try again later." };

  const isAdmin = session.user.role === "MASTER_ADMIN";
  const findings = await db.finding.findMany({
    where: { id: { in: findingIds } },
    include: { website: { select: { id: true, userId: true } } },
  });
  if (findings.length !== findingIds.length) {
    return { ok: false, error: "Some findings no longer exist." };
  }
  const foreign = findings.filter((f) => f.website.userId !== session.user.id);
  if (foreign.length > 0 && !isAdmin) {
    return { ok: false, error: "You can only update findings on websites you own." };
  }

  // FALSE_POSITIVE requires a reason — it feeds the check-tuning aggregate.
  if (action === "false_positive" && !note?.trim()) {
    return { ok: false, error: "Tell us why this is a false positive — it helps us fix the check." };
  }

  let updated = 0;
  const skipped: string[] = [];
  for (const finding of findings) {
    const move = applyUserAction(action as UserAction, finding.state);
    if (!move.ok) {
      skipped.push(finding.checkName);
      continue;
    }
    await db.finding.update({
      where: { id: finding.id },
      data: {
        state: move.state,
        userNote: note?.trim() || finding.userNote,
        resolvedAt: move.state === "VERIFIED_FIXED" ? finding.resolvedAt : null,
        // Reopening a stale suppressed/fixed finding keeps its staleness —
        // reconciliation clears it on the next observation.
      },
    });
    await db.findingEvent.create({
      data: {
        findingId: finding.id,
        reportId: null, // user actions between audits carry no report
        stateBefore: finding.state,
        stateAfter: move.state,
        actor: "USER",
        userId: session.user.id,
        note: note?.trim() || null,
      },
    });
    updated++;
  }

  if (isAdmin && foreign.length > 0) {
    await logAdminActivity({
      actorId: session.user.id,
      action: `finding.${action}`,
      entityType: "finding",
      after: { findingIds: foreign.map((f) => f.id), onBehalf: true },
    });
  }

  const websiteIds = [...new Set(findings.map((f) => f.website.id))];
  for (const id of websiteIds) revalidatePath(`/dashboard/websites/${id}`);

  return {
    ok: true,
    updated,
    message:
      skipped.length > 0
        ? `${updated} updated; ${skipped.length} skipped (not allowed from their current state).`
        : `${updated} finding${updated === 1 ? "" : "s"} updated.`,
  };
}

/** Audit schedule (§2.9): FREE → monthly at most; PREMIUM → up to weekly. */
export async function setAuditScheduleAction(
  websiteId: string,
  schedule: AuditSchedule,
): Promise<FixListResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not signed in." };

  const website = await db.website.findUnique({
    where: { id: websiteId },
    select: { id: true, userId: true },
  });
  if (!website || (website.userId !== session.user.id && session.user.role !== "MASTER_ADMIN")) {
    return { ok: false, error: "Website not found." };
  }

  if (schedule === "WEEKLY" && session.user.plan !== "PREMIUM") {
    return { ok: false, error: "Weekly scheduled audits require Premium. Monthly is available on your plan." };
  }

  await db.website.update({
    where: { id: websiteId },
    data: { auditSchedule: schedule, scheduleSkipNotifiedAt: null },
  });
  revalidatePath(`/dashboard/websites/${websiteId}`);
  return { ok: true, message: schedule === "NONE" ? "Scheduled audits turned off." : `Audits scheduled ${schedule.toLowerCase()}.` };
}
