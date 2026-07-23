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
