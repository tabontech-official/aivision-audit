import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db/client";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/validation/auth";
import { authConfig } from "./config";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/**
 * Full Auth.js instance (Node runtime).
 * Credentials flow with:
 *  - constant-shape error (never reveals which part failed)
 *  - account lockout after repeated failures
 *  - a Session row per login for revocation ("log out everywhere")
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    // Node-runtime jwt callback: extends the edge-safe one with a DB re-read
    // on the `update` trigger, so plan/verification changes (e.g. after a
    // Stripe upgrade) refresh the token authoritatively — never from client input.
    async jwt(params) {
      const token = await authConfig.callbacks.jwt(params);
      if (params.trigger === "update" && token.id) {
        const fresh = await db.user.findUnique({
          where: { id: token.id as string },
          select: { plan: true, role: true, emailVerifiedAt: true },
        });
        if (fresh) {
          token.plan = fresh.plan;
          token.role = fresh.role;
          token.isEmailVerified = fresh.emailVerifiedAt !== null;
        }
      }
      return token;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        rememberMe: {},
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse({
          email: credentials?.email,
          password: credentials?.password,
          rememberMe: credentials?.rememberMe === "true",
        });
        if (!parsed.success) return null;

        const { email, password, rememberMe } = parsed.data;

        const user = await db.user.findUnique({
          where: { email },
        });

        // Constant-time-ish behavior: always run a hash verification
        if (!user || !user.passwordHash || user.deletedAt) {
          // Verify against a dummy hash to equalize response time
          await verifyPassword(
            "$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            password,
          );
          return null;
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          return null;
        }

        const valid = await verifyPassword(user.passwordHash, password);

        if (!valid) {
          const attempts = user.failedLoginAttempts + 1;
          await db.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: attempts,
              lockedUntil:
                attempts >= MAX_FAILED_ATTEMPTS
                  ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
                  : null,
            },
          });
          return null;
        }

        const sessionMaxAgeMs = rememberMe
          ? 30 * 24 * 60 * 60 * 1000
          : 7 * 24 * 60 * 60 * 1000;

        const [, sessionRow] = await db.$transaction([
          db.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lockedUntil: null,
              lastLoginAt: new Date(),
            },
          }),
          db.session.create({
            data: {
              userId: user.id,
              expiresAt: new Date(Date.now() + sessionMaxAgeMs),
              rememberMe,
            },
          }),
        ]);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          plan: user.plan,
          sessionId: sessionRow.id,
          isEmailVerified: user.emailVerifiedAt !== null,
        };
      },
    }),
  ],
});

/**
 * Server-side helper: current session user or null.
 * For sensitive operations, also call assertSessionActive() to honor revocation.
 */
export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** Throws if the JWT's backing session row was revoked or expired. */
export async function assertSessionActive(sessionId: string): Promise<void> {
  const row = await db.session.findUnique({ where: { id: sessionId } });
  if (!row || row.revokedAt || row.expiresAt < new Date()) {
    throw new Error("SESSION_REVOKED");
  }
}
