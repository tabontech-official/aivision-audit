import "server-only";
import { hash, verify } from "@node-rs/argon2";

/**
 * argon2id parameters per OWASP recommendation:
 * 19 MiB memory, 2 iterations, 1 degree of parallelism.
 */
const ARGON2_OPTIONS = {
  memoryCost: 19456, // KiB
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, ARGON2_OPTIONS);
}

export async function verifyPassword(
  passwordHash: string,
  plain: string,
): Promise<boolean> {
  try {
    return await verify(passwordHash, plain, ARGON2_OPTIONS);
  } catch {
    // Malformed hash or internal error — treat as non-match, never throw to caller
    return false;
  }
}
