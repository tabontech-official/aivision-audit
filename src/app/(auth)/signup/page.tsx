import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { safeReturnPath } from "@/lib/auth/return-path";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const returnTo = safeReturnPath(next);

  const session = await auth();
  if (session?.user) redirect(returnTo ?? "/dashboard");

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Create your account</h1>
        <p className="text-sm text-ink-secondary">
          Free forever. No credit card required.
        </p>
      </div>
      <SignupForm returnTo={returnTo} />
      <p className="text-center text-sm text-ink-secondary">
        Already have an account?{" "}
        <Link
          href={returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login"}
          className="font-medium text-brand-600 hover:text-brand-700"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
