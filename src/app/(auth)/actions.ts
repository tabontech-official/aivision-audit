"use server";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { db } from "@/lib/db/client";
import { rateLimit, getIpFromHeaders } from "@/lib/security/rate-limit";
import { signIn, signOut, auth } from "@/lib/auth/auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generateToken, hashToken, expiresIn, TOKEN_TTL } from "@/lib/auth/tokens";
import { claimAnonymousReports } from "@/lib/auth/claim";
import { convertLeadsForUser, captureLeadsAtSignup } from "@/services/leads/capture";
import { recordFunnelEvent } from "@/services/leads/funnel";
import { seedFindingsForUser } from "@/services/findings/seed";
import {
  signupSchema,
  loginSchema,
  continueWithEmailSchema,
  emailSchema,
  passwordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "@/lib/validation/auth";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "@/services/email/send";

export type ActionResult =
  | { ok: true; message?: string; redirectTo?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/* ------------------------------------------------------------------ */
/* Signup                                                              */
/* ------------------------------------------------------------------ */

export async function signupAction(input: unknown): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, password, marketingConsent } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    // Do not reveal account existence beyond what signup inherently requires;
    // generic message keeps enumeration cost high.
    return { ok: false, error: "An account with this email already exists. Try logging in." };
  }

  const passwordHash = await hashPassword(password);

  const user = await db.user.create({
    data: { name, email, passwordHash },
  });

  // Email verification token
  const rawToken = generateToken();
  await db.verificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: expiresIn(TOKEN_TTL.emailVerification),
    },
  });
  await sendVerificationEmail(email, rawToken);

  // Sign the user in immediately (limited until verified), claim anon reports
  try {
    await signIn("credentials", {
      email,
      password,
      rememberMe: "false",
      redirect: false,
    });
  } catch (err) {
    if (isRedirectError(err)) throw err;
    // Signup succeeded even if auto-login failed; user can log in manually.
    return { ok: true, message: "Account created. Please log in.", redirectTo: "/login" };
  }

  const claimed = await claimAnonymousReports(user.id);

  // Fix Loop: seed findings for the just-claimed reports (one-time baseline).
  if (claimed > 0) await seedFindingsForUser(user.id).catch(() => undefined);

  // Signup is the second capture point: create leads for anonymously-audited
  // domains, link existing leads, copy consent. Best-effort — signup stands.
  try {
    const ip = getIpFromHeaders(await headers());
    const emailFirstArrivedHere = await captureLeadsAtSignup(
      user.id,
      email,
      marketingConsent,
      ip,
    );
    if (emailFirstArrivedHere) await recordFunnelEvent("email_captured_signup");
    await convertLeadsForUser(user.id, email);
  } catch {
    /* lead bookkeeping must never fail a signup */
  }
  await recordFunnelEvent("signup_completed");

  // Land them on the report they just unlocked, not a list — that report is
  // the reason they signed up.
  return {
    ok: true,
    message: "Account created. Check your inbox to verify your email.",
    redirectTo: claimed > 0 ? await claimedReportPath(user.id) : "/dashboard",
  };
}

/**
 * The most recently claimed report's page, falling back to the list when it
 * cannot be resolved (e.g. several were claimed at once).
 */
async function claimedReportPath(userId: string): Promise<string> {
  const report = await db.report
    .findFirst({
      where: { userId, deletedAt: null, status: { in: ["COMPLETED", "PARTIAL"] } },
      orderBy: { createdAt: "desc" },
      select: { publicId: true },
    })
    .catch(() => null);
  return report ? `/dashboard/reports/${report.publicId}` : "/dashboard/reports";
}

/* ------------------------------------------------------------------ */
/* Continue with email — the landing-page audit gate                   */
/* ------------------------------------------------------------------ */

export type GateResult =
  | { ok: true; created: boolean; redirectTo: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export type EmailCheckResult =
  | { ok: true; exists: boolean }
  | { ok: false; error: string };

/**
 * Step 1 of the gate: does this email already have an account?
 *
 * This is deliberately an existence oracle. It tells the visitor which of the
 * two things is about to happen, which is what stops a mistyped address from
 * silently becoming a second, empty account — the failure mode that actually
 * costs us customers. It reveals nothing that `signupAction` doesn't already
 * reveal with "an account with this email already exists", so the throttle
 * below is what bounds bulk probing.
 */
export async function checkEmailAction(input: unknown): Promise<EmailCheckResult> {
  const parsed = emailSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  }

  const ip = getIpFromHeaders(await headers());
  const rl = await rateLimit(`gate-check:${ip}`, 20, 15 * 60 * 1000);
  if (!rl.allowed) {
    return { ok: false, error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data },
    select: { deletedAt: true },
  });

  // A soft-deleted account can neither be signed into nor re-created; send it
  // down the sign-in branch so the message stays honest rather than promising
  // an account we can't make.
  return { ok: true, exists: user !== null };
}

/** "john.doe@acme.com" → "John Doe" — a friendlier default than a blank name. */
function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const words = local
    .replace(/[._\-+]+/g, " ")
    .replace(/\d+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1));
  return words.join(" ") || "There";
}

/**
 * Single-submit authentication for the landing-page gate: signs in an existing
 * account, or creates one and signs in, with no extra step for the visitor.
 *
 * Note this necessarily reveals whether an email is registered — a wrong
 * password and a fresh signup are different outcomes, and no wording hides
 * that. It's inherent to combining the two flows, so the per-IP throttle below
 * (plus the existing per-account lockout in auth.ts) is what keeps enumeration
 * expensive rather than the error copy.
 */
export async function continueWithEmailAction(input: unknown): Promise<GateResult> {
  const parsed = continueWithEmailSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password } = parsed.data;

  // This endpoint both authenticates and creates accounts, so it needs a
  // tighter guard than login alone.
  const ip = getIpFromHeaders(await headers());
  const rl = await rateLimit(`gate:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    return {
      ok: false,
      error: "Too many attempts. Please wait a few minutes and try again.",
    };
  }

  const existing = await db.user.findUnique({ where: { email } });

  // A soft-deleted account holds the email but cannot be signed into, and the
  // unique constraint blocks re-creating it. Neither branch below can succeed.
  if (existing?.deletedAt) {
    return { ok: false, error: "We couldn't sign you in. Please contact support." };
  }

  let created = false;

  if (!existing) {
    // Create-account branch — strength rules apply here and only here.
    const strong = passwordSchema.safeParse(password);
    if (!strong.success) {
      return {
        ok: false,
        error: "We'll create your account — pick a slightly stronger password.",
        fieldErrors: { password: strong.error.issues.map((i) => i.message) },
      };
    }

    const user = await db.user.create({
      data: {
        email,
        name: nameFromEmail(email),
        passwordHash: await hashPassword(password),
      },
    });
    created = true;

    // Verification is a soft gate: the audit starts now, the email confirms
    // later. A send failure must not strand an account that already exists.
    try {
      const rawToken = generateToken();
      await db.verificationToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(rawToken),
          expiresAt: expiresIn(TOKEN_TTL.emailVerification),
        },
      });
      await sendVerificationEmail(email, rawToken);
    } catch (err) {
      console.error("[gate] verification email failed:", err);
    }
  }

  try {
    await signIn("credentials", {
      email,
      password,
      rememberMe: "true",
      redirect: false,
    });
  } catch (err) {
    if (isRedirectError(err)) throw err;
    if (created) {
      // Account exists but the session didn't take — don't claim success.
      return {
        ok: false,
        error: "Your account was created, but sign-in failed. Please log in.",
      };
    }
    return { ok: false, error: "That password doesn't match this account." };
  }

  const session = await auth();
  if (session?.user?.id) {
    const claimedNow = await claimAnonymousReports(session.user.id);
    if (claimedNow > 0) await seedFindingsForUser(session.user.id).catch(() => undefined);
    if (session.user.email) {
      await convertLeadsForUser(session.user.id, session.user.email).catch(() => undefined);
    }
  }

  // Callers that opened the gate to start an audit ignore this and replay their
  // own request; callers that just wanted to sign in follow it.
  return {
    ok: true,
    created,
    redirectTo: session?.user?.role === "MASTER_ADMIN" ? "/master-admin" : "/dashboard",
  };
}

/* ------------------------------------------------------------------ */
/* Login                                                               */
/* ------------------------------------------------------------------ */

export async function loginAction(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password, rememberMe } = parsed.data;

  try {
    await signIn("credentials", {
      email,
      password,
      rememberMe: rememberMe ? "true" : "false",
      redirect: false,
    });
  } catch (err) {
    if (isRedirectError(err)) throw err;
    if (err instanceof AuthError) {
      return { ok: false, error: "Invalid email or password." };
    }
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  const session = await auth();
  let claimed = 0;
  if (session?.user?.id) {
    claimed = await claimAnonymousReports(session.user.id);
    // Signing in from the teaser transfers the report and seeds its findings,
    // exactly as signing up does.
    if (claimed > 0) await seedFindingsForUser(session.user.id).catch(() => undefined);
  }

  const isAdmin = session?.user?.role === "MASTER_ADMIN";
  return {
    ok: true,
    redirectTo: isAdmin
      ? "/master-admin"
      : claimed > 0 && session?.user?.id
        ? await claimedReportPath(session.user.id)
        : "/dashboard",
  };
}

/* ------------------------------------------------------------------ */
/* Logout                                                              */
/* ------------------------------------------------------------------ */

export async function logoutAction(): Promise<void> {
  const session = await auth();
  if (session?.user?.sessionId) {
    await db.session
      .update({
        where: { id: session.user.sessionId },
        data: { revokedAt: new Date() },
      })
      .catch(() => undefined); // session row may already be gone
  }
  await signOut({ redirectTo: "/" });
}

/* ------------------------------------------------------------------ */
/* Email verification                                                  */
/* ------------------------------------------------------------------ */

export async function verifyEmailAction(rawToken: string): Promise<ActionResult> {
  if (!rawToken || rawToken.length < 20 || rawToken.length > 200) {
    return { ok: false, error: "This verification link is invalid." };
  }

  const tokenHash = hashToken(rawToken);
  const record = await db.verificationToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { ok: false, error: "This verification link is invalid or has expired." };
  }

  await db.$transaction([
    db.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    db.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
  ]);

  return { ok: true, message: "Email verified. You're all set." };
}

export async function resendVerificationAction(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "You must be logged in." };
  if (session.user.isEmailVerified) {
    return { ok: true, message: "Your email is already verified." };
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { ok: false, error: "Account not found." };

  // Throttle: max 1 fresh token per 2 minutes
  const recent = await db.verificationToken.findFirst({
    where: {
      userId: user.id,
      createdAt: { gt: new Date(Date.now() - 2 * 60 * 1000) },
    },
  });
  if (recent) {
    return { ok: false, error: "A verification email was just sent. Check your inbox." };
  }

  const rawToken = generateToken();
  await db.verificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: expiresIn(TOKEN_TTL.emailVerification),
    },
  });
  await sendVerificationEmail(user.email, rawToken);

  return { ok: true, message: "Verification email sent." };
}

/* ------------------------------------------------------------------ */
/* Forgot / reset password                                             */
/* ------------------------------------------------------------------ */

export async function forgotPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const { email } = parsed.data;
  const user = await db.user.findUnique({ where: { email } });

  // Always return the same response — never reveal whether the account exists.
  const genericOk: ActionResult = {
    ok: true,
    message: "If an account exists for that email, a reset link is on its way.",
  };

  if (!user || user.deletedAt) return genericOk;

  // Throttle: 1 reset email per 2 minutes per account
  const recent = await db.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      createdAt: { gt: new Date(Date.now() - 2 * 60 * 1000) },
    },
  });
  if (recent) return genericOk;

  const rawToken = generateToken();
  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: expiresIn(TOKEN_TTL.passwordReset),
    },
  });
  await sendPasswordResetEmail(user.email, rawToken);

  return genericOk;
}

export async function resetPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { token, password } = parsed.data;
  const tokenHash = hashToken(token);

  const record = await db.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { ok: false, error: "This reset link is invalid or has expired. Request a new one." };
  }

  const passwordHash = await hashPassword(password);

  await db.$transaction([
    db.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    db.user.update({
      where: { id: record.userId },
      data: {
        passwordHash,
        mustChangePassword: false,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    }),
    // Security: revoke every active session on password reset
    db.session.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return {
    ok: true,
    message: "Password updated. Log in with your new password.",
    redirectTo: "/login",
  };
}

/* ------------------------------------------------------------------ */
/* Change password (logged in)                                         */
/* ------------------------------------------------------------------ */

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "You must be logged in." };

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash) return { ok: false, error: "Account not found." };

  const valid = await verifyPassword(user.passwordHash, parsed.data.currentPassword);
  if (!valid) return { ok: false, error: "Your current password is incorrect." };

  const passwordHash = await hashPassword(parsed.data.newPassword);

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { passwordHash, mustChangePassword: false },
    }),
    // Revoke all other sessions; keep the current one
    db.session.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
        NOT: { id: session.user.sessionId },
      },
      data: { revokedAt: new Date() },
    }),
  ]);

  return { ok: true, message: "Password changed successfully." };
}
