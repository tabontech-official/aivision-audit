import "server-only";
import { db } from "@/lib/db/client";
import {
  decryptSetting,
  encryptSetting,
  isEncryptedEnvelope,
  maskSecret,
  isEncryptionConfigured,
  MissingEncryptionKeyError,
} from "@/lib/security/secrets";
import type { Prisma } from "@prisma/client";

/**
 * Read/write access to `isSecret` system settings.
 *
 * Deliberately separate from `getSetting()`: those are typed, defaulted,
 * non-sensitive values that pages render freely. These are credentials — they
 * decrypt on read, never carry a default, and only ever leave the server
 * masked.
 *
 * Nothing here caches. An operator who saves a key expects the very next audit
 * to use it; a process-level cache surviving the save is exactly the kind of
 * invisible failure this reads-every-time cost (one indexed lookup next to a
 * multi-second PageSpeed call) is worth avoiding.
 */

export type SecretSource = "database" | "environment" | "unset";

export type SecretStatus = {
  isSet: boolean;
  source: SecretSource;
  /** Safe to send to a browser. Null when nothing is configured. */
  maskedPreview: string | null;
  /** True when a stored value exists but could not be decrypted. */
  unreadable: boolean;
  encryptionConfigured: boolean;
};

/** The usable plaintext, preferring the admin-saved value over the env var. */
export async function getSecretSetting(
  key: string,
  envFallback?: string | undefined,
): Promise<string | null> {
  try {
    const row = await db.systemSetting.findUnique({ where: { key } });
    const stored = row ? decryptSetting(row.value) : null;
    if (stored && stored.length > 0) return stored;
  } catch {
    // Fall through to the environment — a DB hiccup must not break an audit.
  }
  const fromEnv = envFallback?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : null;
}

/**
 * Describe what is configured without revealing it.
 *
 * The database is checked first so the answer matches what
 * `getSecretSetting()` will actually use — an operator who sees
 * "Configured (database)" is looking at the key their audits run with.
 */
export async function getSecretStatus(
  key: string,
  envFallback?: string | undefined,
): Promise<SecretStatus> {
  const encryptionConfigured = isEncryptionConfigured();
  let unreadable = false;

  try {
    const row = await db.systemSetting.findUnique({ where: { key } });
    if (row && row.value !== null && row.value !== undefined) {
      const plain = decryptSetting(row.value);
      if (plain && plain.length > 0) {
        return {
          isSet: true,
          source: "database",
          maskedPreview: maskSecret(plain),
          unreadable: false,
          encryptionConfigured,
        };
      }
      // A row exists but will not decrypt — wrong or missing key.
      if (isEncryptedEnvelope(row.value)) unreadable = true;
    }
  } catch {
    // Ignore and report on the environment instead.
  }

  const fromEnv = envFallback?.trim();
  if (fromEnv && fromEnv.length > 0) {
    return {
      isSet: true,
      source: "environment",
      maskedPreview: maskSecret(fromEnv),
      unreadable,
      encryptionConfigured,
    };
  }

  return {
    isSet: false,
    source: "unset",
    maskedPreview: null,
    unreadable,
    encryptionConfigured,
  };
}

export type SecretWriteResult = { ok: true } | { ok: false; error: string };

/** Store a secret encrypted. Refuses rather than degrading to plaintext. */
export async function setSecretSetting(
  key: string,
  plaintext: string,
  updatedById: string,
): Promise<SecretWriteResult> {
  let envelope: Prisma.InputJsonValue;
  try {
    envelope = encryptSetting(plaintext) as unknown as Prisma.InputJsonValue;
  } catch (err) {
    if (err instanceof MissingEncryptionKeyError) return { ok: false, error: err.message };
    return { ok: false, error: "Could not encrypt the value." };
  }

  await db.systemSetting.upsert({
    where: { key },
    update: { value: envelope, isSecret: true, updatedById },
    create: { key, value: envelope, isSecret: true, updatedById },
  });

  return { ok: true };
}

/** Remove the stored value so the environment fallback (if any) takes over. */
export async function clearSecretSetting(key: string): Promise<void> {
  await db.systemSetting.deleteMany({ where: { key } });
}
