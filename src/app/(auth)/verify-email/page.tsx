import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { verifyEmailAction } from "../actions";
import { Alert } from "@/components/ui/alert";
import { ResendVerification } from "./resend-button";

export const metadata: Metadata = { title: "Verify your email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const session = await auth();

  // Case 1: arrived via email link — verify the token
  if (token) {
    const result = await verifyEmailAction(token);
    return (
      <div className="space-y-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Email verification</h1>
        {result.ok ? (
          <>
            <Alert variant="success">{result.message}</Alert>
            <Link
              href={session?.user ? "/dashboard" : "/login"}
              className="inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              {session?.user ? "Go to dashboard" : "Log in to your account"}
            </Link>
          </>
        ) : (
          <>
            <Alert variant="error">{result.error}</Alert>
            {session?.user && !session.user.isEmailVerified && <ResendVerification />}
          </>
        )}
      </div>
    );
  }

  // Case 2: logged-in but unverified user landed here
  if (session?.user) {
    if (session.user.isEmailVerified) {
      return (
        <div className="space-y-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-ink">You&apos;re verified</h1>
          <Alert variant="success">Your email address is already verified.</Alert>
          <Link
            href="/dashboard"
            className="inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Go to dashboard
          </Link>
        </div>
      );
    }
    return (
      <div className="space-y-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Check your inbox</h1>
        <p className="text-sm text-ink-secondary">
          We sent a verification link to <strong>{session.user.email}</strong>. Click it to
          activate your account.
        </p>
        <ResendVerification />
      </div>
    );
  }

  // Case 3: not logged in, no token
  return (
    <div className="space-y-6 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-ink">Verify your email</h1>
      <p className="text-sm text-ink-secondary">
        Open the verification link from your inbox, or log in to resend it.
      </p>
      <Link
        href="/login"
        className="inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        Log in
      </Link>
    </div>
  );
}
