"use server";

import { AuthError } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { db } from "@/lib/db/client";
import { signIn, signOut, auth } from "@/lib/auth/auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { generateToken, hashToken, expiresIn, TOKEN_TTL } from "@/lib/auth/tokens";
import { claimAnonymousReports } from "@/lib/auth/claim";
import {
  signupSchema,
  loginSchema,
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

  const { name, email, password } = parsed.data;

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

  return {
    ok: true,
    message: "Account created. Check your inbox to verify your email.",
    redirectTo: claimed > 0 ? "/dashboard/reports" : "/dashboard",
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
  }

  const isAdmin = session?.user?.role === "MASTER_ADMIN";
  return {
    ok: true,
    redirectTo: isAdmin
      ? "/master-admin"
      : claimed > 0
        ? "/dashboard/reports"
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
