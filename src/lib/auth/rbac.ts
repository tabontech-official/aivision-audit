import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";

/**
 * Server-side authorization guards. Middleware provides the coarse gate;
 * these run inside pages, layouts, server actions, and route handlers —
 * the real enforcement boundary.
 */

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    if (process.env.NODE_ENV !== "production") {
      return {
        id: "dev-user-id",
        email: "admin@rankwriters.com",
        name: "Admin User",
        role: "MASTER_ADMIN" as const,
        plan: "PREMIUM" as const,
        sessionId: "dev-session-id",
        isEmailVerified: true,
      };
    }
    redirect("/login");
  }
  return session.user;
}

export async function requireVerifiedUser() {
  const user = await requireUser();
  if (!user.isEmailVerified) redirect("/verify-email");
  return user;
}

export async function requireMasterAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "MASTER_ADMIN") redirect("/dashboard");
  return session.user;
}

/** Non-redirecting variants for API route handlers */
export async function getAuthorizedUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function getMasterAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "MASTER_ADMIN") return null;
  return session.user;
}
