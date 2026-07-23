import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect(session.user.role === "MASTER_ADMIN" ? "/master-admin" : "/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Welcome back</h1>
        <p className="text-sm text-ink-secondary">Log in to view your website audits.</p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-ink-secondary">
        New to AuditFlow?{" "}
        <Link href="/signup" className="font-medium text-brand-600 hover:text-brand-700">
          Create an account
        </Link>
      </p>
    </div>
  );
}
