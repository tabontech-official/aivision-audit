import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db/client";
import {
  verifyUnsubscribeToken,
  unsubscribeEmail,
} from "@/services/leads/capture";

export const metadata: Metadata = { title: "Unsubscribe" };
export const dynamic = "force-dynamic";

/**
 * One-click marketing unsubscribe — no login, the HMAC token in the email link
 * is the authorization. Writes through to every Lead with the email AND any
 * account, so a marketing send can never resurrect a dead consent.
 *
 * Transactional mail (a report the visitor explicitly requested) is a separate
 * concern and is unaffected.
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; d?: string; t?: string; type?: string }>;
}) {
  const { e: email = "", d: domain = "", t: token = "", type = "" } = await searchParams;

  const valid =
    email.length > 0 && domain.length > 0 && token.length > 0 &&
    verifyUnsubscribeToken(email, domain, token);

  // type=audit turns off delta/result audit emails for the account — a
  // separate switch from the marketing unsubscribe below.
  const isAuditPref = type === "audit";
  if (valid) {
    if (isAuditPref) {
      await db.user.updateMany({
        where: { email: email.trim().toLowerCase() },
        data: { auditEmailsEnabled: false },
      });
    } else {
      await unsubscribeEmail(email);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card max-w-md p-8 text-center">
        {valid ? (
          <>
            <h1 className="text-xl font-bold text-ink">
              {isAuditPref ? "Audit emails turned off" : "You're unsubscribed"}
            </h1>
            <p className="mt-2 text-sm text-ink-secondary">
              {isAuditPref ? (
                <>
                  <strong>{email}</strong> will no longer receive audit result or score-change
                  emails. You can re-enable them from your profile.
                </>
              ) : (
                <>
                  <strong>{email}</strong> will no longer receive marketing emails from us.
                  Reports you explicitly request are still delivered.
                </>
              )}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-ink">This link isn&apos;t valid</h1>
            <p className="mt-2 text-sm text-ink-secondary">
              The unsubscribe link is incomplete or has been altered. Use the link exactly as it
              appears in the email, or contact support.
            </p>
          </>
        )}
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Back to AuditFlow
        </Link>
      </div>
    </main>
  );
}
