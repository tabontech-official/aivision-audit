import Link from "next/link";
import { BrandIcon } from "@/components/ui/brand-icon";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <BrandIcon className="w-8 h-8" />
        <span className="text-xl font-bold font-lazzer tracking-tight text-slate-900">AI Vision Audit</span>
      </Link>
      <div className="card w-full max-w-md animate-fade-in p-8">{children}</div>
      <p className="mt-6 text-center text-xs text-ink-muted">
        By continuing you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
