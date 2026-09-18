"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auth } from "@/lib/auth/auth";
import { logAdminActivity } from "@/services/audit-log/log";

export type UserAdminResult = { ok: true; message?: string } | { ok: false; error: string };

const updateSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["MASTER_ADMIN", "ADMIN", "USER"]).optional(),
  plan: z.enum(["FREE", "PREMIUM"]).optional(),
});

export async function updateUserAction(input: unknown): Promise<UserAdminResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "MASTER_ADMIN") {
    return { ok: false, error: "Not authorized." };
  }

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const { userId, role, plan } = parsed.data;

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target || target.deletedAt) return { ok: false, error: "User not found." };

  // Safety rails: cannot demote yourself; cannot demote the last master admin
  if (role && role !== "MASTER_ADMIN" && target.role === "MASTER_ADMIN") {
    if (target.id === session.user.id) {
      return { ok: false, error: "You cannot change your own role." };
    }
    const adminCount = await db.user.count({
      where: { role: "MASTER_ADMIN", deletedAt: null },
    });
    if (adminCount <= 1) {
      return { ok: false, error: "At least one master admin must remain." };
    }
  }

  await db.user.update({
    where: { id: userId },
    data: { ...(role ? { role } : {}), ...(plan ? { plan } : {}) },
  });

  await logAdminActivity({
    actorId: session.user.id,
    action: "user.update",
    entityType: "user",
    entityId: userId,
    before: { role: target.role, plan: target.plan },
    after: { role: role ?? target.role, plan: plan ?? target.plan },
  });
  revalidatePath("/master-admin/users");
  return { ok: true, message: "User updated." };
}

const deleteSchema = z.object({ userId: z.string().uuid() });

/**
 * Soft-deletes a user: stamps deletedAt (every query filters on it) and revokes
 * their sessions so access ends immediately rather than at token expiry.
 * The row is kept so reports, payments, and audit history stay attributable.
 */
export async function deleteUserAction(input: unknown): Promise<UserAdminResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "MASTER_ADMIN") {
    return { ok: false, error: "Not authorized." };
  }

  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input." };
  const { userId } = parsed.data;

  if (userId === session.user.id) {
    return { ok: false, error: "You cannot delete your own account." };
  }

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target || target.deletedAt) return { ok: false, error: "User not found." };

  if (target.role === "MASTER_ADMIN") {
    const adminCount = await db.user.count({
      where: { role: "MASTER_ADMIN", deletedAt: null },
    });
    if (adminCount <= 1) {
      return { ok: false, error: "At least one master admin must remain." };
    }
  }

  const now = new Date();
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { deletedAt: now } }),
    db.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now } }),
  ]);

  await logAdminActivity({
    actorId: session.user.id,
    action: "user.delete",
    entityType: "user",
    entityId: userId,
    before: { email: target.email, role: target.role, plan: target.plan, deletedAt: null },
    after: { deletedAt: now.toISOString() },
  });
  revalidatePath("/master-admin/users");
  return { ok: true, message: `${target.email} has been deleted.` };
}
