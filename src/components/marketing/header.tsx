"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { AuthGateModal } from "@/components/marketing/auth-gate-modal";

const NAV_LINKS = [
  { href: "#product", label: "Product", dropdown: true },
  { href: "#changelog", label: "Changelog" },
  { href: "#customers", label: "Customers" },
  { href: "#pricing", label: "Pricing", dropdown: true },
];

export function MarketingHeader({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white py-4">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-xl border border-slate-200 bg-white px-5 shadow-sm">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-black text-sm font-bold text-white">
            K
          </div>

          <span className="text-[15px] font-semibold tracking-tight text-slate-900">
            Kinship
          </span>
        </Link>


        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex items-center gap-1 text-sm font-medium text-slate-600 transition hover:text-black"
            >
              {link.label}

              {link.dropdown && (
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              )}
            </a>
          ))}
        </nav>


        {/* Actions */}
        <div className="hidden items-center gap-5 md:flex">

          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Dashboard
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setGateOpen(true)}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Log in / Sign up
            </button>
          )}

        </div>


        {/* Mobile Button */}
        <button
          onClick={() => setOpen(!open)}
          className="rounded-md p-2 md:hidden"
        >
          {open ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>

      </div>


      {/* Mobile Menu */}
      {open && (
        <div className="mx-4 mt-2 rounded-xl border border-slate-200 bg-white p-4 md:hidden">

          <nav className="flex flex-col gap-3">

            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-700"
              >
                {link.label}
              </a>
            ))}

          </nav>


          <div className="mt-4 border-t pt-4 flex flex-col gap-3">

            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-black px-4 py-2 text-center text-sm font-medium text-white"
              >
                Dashboard
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setGateOpen(true);
                }}
                className="rounded-lg bg-black px-4 py-2 text-center text-sm font-medium text-white"
              >
                Log in / Sign up
              </button>
            )}

          </div>

        </div>
      )}

      {/* The same single sign-in/sign-up module the audit gate uses. */}
      <AuthGateModal
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        onAuthenticated={(redirectTo) => {
          setGateOpen(false);
          router.push(redirectTo);
          router.refresh();
        }}
      />

    </header>
  );
}