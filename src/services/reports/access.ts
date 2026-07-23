import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db/client";
import { hashToken } from "@/lib/auth/tokens";
import { ANON_COOKIE_NAME } from "@/lib/auth/claim";
import { auth } from "@/lib/auth/auth";
import type { Report } from "@prisma/client";

export type ReportAccess =
  | { ok: true; report: Report; viewer: "owner-user" | "owner-anonymous" | "admin" }
  | { ok: false; status: 401 | 403 | 404 };

/**
 * Resolve a report by publicId and verify the requester may view it.
 * Access rules:
 *  - The owning user (report.userId === session user)
 *  - The anonymous session that created it (matching af_anon cookie),
 *    only while the report is unclaimed and unexpired
 *  - MASTER_ADMIN (support/debugging)
 * The unguessable publicId is NOT sufficient by itself for claimed reports.
 */
export async function getReportForViewer(publicId: string): Promise<ReportAccess> {
  if (!publicId || publicId.length > 40) return { ok: false, status: 404 };

  const report = await db.report.findUnique({ where: { publicId } });
  if (!report || report.deletedAt) return { ok: false, status: 404 };

  const session = await auth();

  if (session?.user) {
    if (session.user.role === "MASTER_ADMIN") return { ok: true, report, viewer: "admin" };
    if (report.userId === session.user.id) return { ok: true, report, viewer: "owner-user" };
  }

  // Anonymous ownership via cookie
  if (!report.userId && report.anonymousSessionId) {
    if (report.expiresAt && report.expiresAt < new Date()) {
      return { ok: false, status: 404 };
    }
    const cookieStore = await cookies();
    const raw = cookieStore.get(ANON_COOKIE_NAME)?.value;
    if (raw) {
      const anonSession = await db.anonymousSession.findUnique({
        where: { tokenHash: hashToken(raw) },
        select: { id: true },
      });
      if (anonSession?.id === report.anonymousSessionId) {
        return { ok: true, report, viewer: "owner-anonymous" };
      }
    }
  }

  return { ok: false, status: session?.user ? 403 : 401 };
}
