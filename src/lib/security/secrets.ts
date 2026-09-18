import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Encryption at rest for `SystemSetting` rows flagged `isSecret`.
 *
 * The schema has always claimed these values were encrypted and
 * SETTINGS_ENCRYPTION_KEY has always been documented, but nothing read it —
 * admin-entered API keys sat in the database as plaintext. This module closes
 * that gap. AES-256-GCM, so the ciphertext is authenticated: a tampered row
 * fails to decrypt rather than yielding attacker-chosen plaintext.
 *
 * `SystemSetting.value` is a Json column, so an encrypted value is stored as a
 * self-describing envelope. `decryptSetting()` passes through a plain string
 * untouched, which keeps reads working while `scripts/encrypt-secret-settings.ts`
 * migrates existing rows — and means a half-migrated database still functions.
 */

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // 96-bit nonce, the GCM standard
const ENVELOPE_VERSION = "v1";

export type EncryptedEnvelope = {
  __enc: typeof ENVELOPE_VERSION;
  iv: string;
  tag: string;
  ct: string;
};

export class MissingEncryptionKeyError extends Error {
  constructor() {
    super(
      "SETTINGS_ENCRYPTION_KEY is not configured. Secret settings cannot be stored until it is set to a 32-byte hex value (openssl rand -hex 32).",
    );
    this.name = "MissingEncryptionKeyError";
  }
}

/** The 32-byte key, or null when unset/malformed. Never throws on read. */
function readKey(): Buffer | null {
  const raw = process.env.SETTINGS_ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  if (!/^[0-9a-fA-F]{64}$/.test(raw)) return null;
  return Buffer.from(raw, "hex");
}

export function isEncryptionConfigured(): boolean {
  return readKey() !== null;
}

export function isEncryptedEnvelope(value: unknown): value is EncryptedEnvelope {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    (value as Record<string, unknown>).__enc === ENVELOPE_VERSION &&
    typeof (value as Record<string, unknown>).iv === "string" &&
    typeof (value as Record<string, unknown>).tag === "string" &&
    typeof (value as Record<string, unknown>).ct === "string"
  );
}

/**
 * Encrypt a secret for storage.
 * Throws `MissingEncryptionKeyError` rather than silently storing plaintext —
 * a write that cannot be protected must fail loudly, not degrade.
 */
export function encryptSetting(plaintext: string): EncryptedEnvelope {
  const key = readKey();
  if (!key) throw new MissingEncryptionKeyError();

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

  return {
    __enc: ENVELOPE_VERSION,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ct: ct.toString("base64"),
  };
}

/**
 * Read a stored secret back.
 *
 * - encrypted envelope → decrypted plaintext (null if the key is missing or
 *   the ciphertext fails authentication)
 * - plain string       → returned as-is (not yet migrated)
 * - anything else      → null
 */
export function decryptSetting(value: unknown): string | null {
  if (typeof value === "string") return value.length > 0 ? value : null;
  if (!isEncryptedEnvelope(value)) return null;

  const key = readKey();
  if (!key) return null;

  try {
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(value.iv, "base64"));
    decipher.setAuthTag(Buffer.from(value.tag, "base64"));
    const plain = Buffer.concat([
      decipher.update(Buffer.from(value.ct, "base64")),
      decipher.final(),
    ]);
    return plain.toString("utf8");
  } catch {
    // Wrong key or tampered ciphertext. Never fall back to raw bytes.
    return null;
  }
}

/**
 * `AIza••••••••••••3f2` — enough for an operator to recognise which key is
 * stored, useless to anyone who intercepts it. This is the ONLY representation
 * of a secret that may ever be sent to a browser or written to a log.
 */
export function maskSecret(plaintext: string): string {
  const value = plaintext.trim();
  if (value.length <= 8) return "•".repeat(Math.max(value.length, 4));
  return `${value.slice(0, 4)}${"•".repeat(Math.min(12, value.length - 8))}${value.slice(-4)}`;
}
