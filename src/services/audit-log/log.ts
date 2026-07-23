import "server-only";
import { db } from "@/lib/db/client";
import type { Prisma } from "@prisma/client";

/**
 * Admin activity logging. Best-effort: a logging failure must never block
 * the admin action itself.
 */
export async function logAdminActivity(input: {
  actorId: string;
  action: string; // e.g. "section.create", "field.update", "template.publish"
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
}): Promise<void> {
  try {
    await db.adminActivityLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        before: input.before === undefined ? undefined : (input.before as Prisma.InputJsonValue),
        after: input.after === undefined ? undefined : (input.after as Prisma.InputJsonValue),
      },
    });
  } catch (err) {
    console.error("[audit-log] failed:", err);
  }
}
