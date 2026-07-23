import "server-only";
import { createHash, randomBytes } from "crypto";

/**
 * Opaque token helpers. The raw token goes to the user (email link / cookie);
 * only its SHA-256 hash is stored, so a DB leak cannot forge valid tokens.
 */

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export const TOKEN_TTL = {
  emailVerification: 24 * 60 * 60 * 1000, // 24h
  passwordReset: 60 * 60 * 1000, // 1h
  anonymousSession: 7 * 24 * 60 * 60 * 1000, // 7d default (overridable via settings)
} as const;

export function expiresIn(ms: number): Date {
  return new Date(Date.now() + ms);
}
