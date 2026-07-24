import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config — used by middleware. No DB, no Node-only imports.
 * The full config (with Credentials provider + Prisma) lives in auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30d ceiling; "remember me" handled via token claim
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    // Route protection is enforced in middleware.ts using this callback.
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;

      const isProtected =
        pathname.startsWith("/dashboard") || pathname.startsWith("/master-admin");

      if (isProtected) {
        if (!isLoggedIn) return false; // redirects to pages.signIn
        if (pathname.startsWith("/master-admin")) {
          // Coarse gate; every admin page/action re-checks the role server-side.
          return auth.user.role === "MASTER_ADMIN";
        }
        return true;
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.plan = user.plan;
        token.sessionId = user.sessionId;
        token.isEmailVerified = user.isEmailVerified;
      }
      // NOTE: the `update` trigger is handled in auth.ts, which re-reads the
      // plan/verification from the DB (authoritative). We intentionally do NOT
      // trust client-supplied session values here — a spoofed update() must
      // not be able to grant Premium.
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.plan = token.plan as string;
        session.user.sessionId = token.sessionId as string;
        session.user.isEmailVerified = token.isEmailVerified as boolean;
      }
      return session;
    },
  },
  providers: [], // filled in auth.ts (Credentials needs Node runtime)
} satisfies NextAuthConfig;
