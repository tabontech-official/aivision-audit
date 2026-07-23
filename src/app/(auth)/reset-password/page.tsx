import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "./reset-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Invalid link</h1>
        <p className="text-sm text-ink-secondary">
          This password reset link is missing its token.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Choose a new password</h1>
        <p className="text-sm text-ink-secondary">
          Your previous sessions will be signed out for security.
        </p>
      </div>
      <ResetPasswordForm token={token} />
    </div>
  );
}
