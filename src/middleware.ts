import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";

/**
 * Edge middleware — coarse route protection via authConfig.authorized().
 * Fine-grained checks (role re-verification, session revocation, ownership)
 * happen server-side in rbac.ts guards.
 */
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    /*
     * Protect app routes; skip static assets, images, and public API endpoints
     * that carry their own auth (webhooks, QStash jobs).
     */
    "/dashboard/:path*",
    "/master-admin/:path*",
  ],
};
