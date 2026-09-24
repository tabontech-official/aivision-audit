import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/notifications/live
 * Real-time endpoint returning active background audits and unread notifications for the user.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Fetch any active in-progress audits for the user
    const activeReports = await db.report.findMany({
      where: {
        userId,
        status: { in: ["QUEUED", "PROCESSING"] },
        deletedAt: null,
      },
      include: {
        website: { select: { domain: true, url: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const activeAudits = activeReports.map((r) => ({
      id: r.id,
      publicId: r.publicId,
      domain: r.website?.domain || "website",
      url: r.website?.url || "",
      status: r.status,
      currentStage: r.currentStage,
      progressPercent: r.progressPercent,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    // 2. Fetch notifications (recent 15)
    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 15,
    });

    const unreadCount = notifications.filter((n) => !n.readAt).length;

    return NextResponse.json({
      ok: true,
      activeAudits,
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        linkUrl: n.linkUrl,
        readAt: n.readAt ? n.readAt.toISOString() : null,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    });
  } catch (err: unknown) {
    console.error("GET /api/notifications/live error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to fetch live notifications" },
      { status: 500 },
    );
  }
}
