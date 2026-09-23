import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { safeReturnPath } from "@/lib/auth/return-path";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const returnTo = safeReturnPath(next);

  const session = await auth();
  if (session?.user) {
    redirect(
      returnTo ??
        (session.user.role === "MASTER_ADMIN" ? "/master-admin" : "/dashboard"),
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Welcome back</h1>
        <p className="text-sm text-ink-secondary">
          {returnTo ? "Log in to view your report." : "Log in to view your website audits."}
        </p>
      </div>
      <LoginForm returnTo={returnTo} />
      <p className="text-center text-sm text-ink-secondary">
        New to AI Vision Audit?{" "}
        <Link
          href={returnTo ? `/signup?next=${encodeURIComponent(returnTo)}` : "/signup"}
          className="font-medium text-emerald-600 hover:text-emerald-700"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
