"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Thin client wrapper so descendant client components can call
 * useSession()/update() — used by the billing flow to refresh the plan
 * claim after a successful upgrade without forcing a re-login.
 */
export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
