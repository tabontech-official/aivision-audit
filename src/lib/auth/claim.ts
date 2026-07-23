import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db/client";
import { hashToken } from "@/lib/auth/tokens";

export const ANON_COOKIE_NAME = "af_anon";

/**
 * After signup or login, attach any reports created under the visitor's
 * anonymous session to their user account, then retire the session.
 * Safe to call when no cookie exists. Never claims another user's reports:
 * only reports with userId = null under the matching (unclaimed, unexpired)
 * session are transferred.
 */
export async function claimAnonymousReports(userId: string): Promise<number> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(ANON_COOKIE_NAME)?.value;
  if (!rawToken) return 0;

  const tokenHash = hashToken(rawToken);

  const anonSession = await db.anonymousSession.findUnique({
    where: { tokenHash },
  });

  if (!anonSession || anonSession.claimedAt || anonSession.expiresAt < new Date()) {
    cookieStore.delete(ANON_COOKIE_NAME);
    return 0;
  }

  const [claimed] = await db.$transaction([
    db.report.updateMany({
      where: {
        anonymousSessionId: anonSession.id,
        userId: null,
        deletedAt: null,
      },
      data: {
        userId,
        expiresAt: null, // claimed reports no longer expire
      },
    }),
    // Transfer ownerless websites created by those reports
    db.website.updateMany({
      where: {
        userId: null,
        reports: { some: { anonymousSessionId: anonSession.id, userId } },
      },
      data: { userId },
    }),
    db.anonymousSession.update({
      where: { id: anonSession.id },
      data: { claimedByUserId: userId, claimedAt: new Date() },
    }),
  ]);

  cookieStore.delete(ANON_COOKIE_NAME);
  return claimed.count;
}
