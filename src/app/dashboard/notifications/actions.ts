"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/rbac";

export async function markNotificationReadAction(notificationId: string) {
  const user = await requireUser();
  await db.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { readAt: new Date() },
  });
  revalidatePath("/dashboard/notifications");
  return { ok: true };
}

export async function markAllNotificationsReadAction() {
  const user = await requireUser();
  await db.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/dashboard/notifications");
  return { ok: true };
}

export async function deleteNotificationAction(notificationId: string) {
  const user = await requireUser();
  await db.notification.deleteMany({
    where: { id: notificationId, userId: user.id },
  });
  revalidatePath("/dashboard/notifications");
  return { ok: true };
}

export async function clearAllNotificationsAction() {
  const user = await requireUser();
  await db.notification.deleteMany({
    where: { userId: user.id },
  });
  revalidatePath("/dashboard/notifications");
  return { ok: true };
}
