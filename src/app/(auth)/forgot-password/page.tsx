import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Reset your password</h1>
        <p className="text-sm text-ink-secondary">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>
      <ForgotPasswordForm />
      <p className="text-center text-sm text-ink-secondary">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
