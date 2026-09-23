import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/rbac";
import { db } from "@/lib/db/client";
import { NotificationsClient, SerializedNotification } from "./notifications-client";

export const metadata: Metadata = {
  title: "Notifications | AI Vision Audit",
  description: "View real-time audit updates, alerts, and system notices.",
};

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser();

  // 1. Fetch user notifications from database
  const dbNotifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // 2. If no notifications exist yet in DB, generate initial notifications from recent reports
  const notifications: SerializedNotification[] = dbNotifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    linkUrl: n.linkUrl,
    readAt: n.readAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  }));

  if (notifications.length === 0) {
    const recentReports = await db.report.findMany({
      where: { userId: user.id },
      include: { website: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    if (recentReports.length > 0) {
      // Seed notifications in database for these reports so state persists
      for (const r of recentReports) {
        const hostname = r.website?.url ? new URL(r.website.url).hostname : "Website";
        const isFailed = r.status === "FAILED";
        const title = isFailed ? `Audit Failed: ${hostname}` : `Audit Completed: ${hostname}`;
        const body = isFailed
          ? (r.errorMessage ?? "Audit could not be completed.")
          : `Health score: ${r.overallScore ?? 0}/100 (${r.grade ?? "N/A"}). ${r.passedCount ?? 0} passed, ${r.failedCount ?? 0} failed.`;
        const type: "REPORT_READY" | "REPORT_FAILED" = isFailed ? "REPORT_FAILED" : "REPORT_READY";

        const created = await db.notification.create({
          data: {
            userId: user.id,
            type,
            title,
            body,
            linkUrl: `/dashboard/reports/${r.id}`,
            createdAt: r.createdAt,
          },
        }).catch(() => null);

        if (created) {
          notifications.push({
            id: created.id,
            type: created.type,
            title: created.title,
            body: created.body,
            linkUrl: created.linkUrl,
            readAt: created.readAt?.toISOString() ?? null,
            createdAt: created.createdAt.toISOString(),
          });
        }
      }
    }
  }

  return (
    <div className="mx-auto max-w-4xl py-2 sm:py-4">
      <NotificationsClient initialNotifications={notifications} />
    </div>
  );
}
