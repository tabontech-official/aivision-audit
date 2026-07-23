import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white">
          A
        </div>
        <span className="text-xl font-semibold tracking-tight text-ink">AuditFlow</span>
      </Link>
      <div className="card w-full max-w-md animate-fade-in p-8">{children}</div>
      <p className="mt-6 text-center text-xs text-ink-muted">
        By continuing you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
