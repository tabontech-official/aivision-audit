/**
 * One-time (idempotent) migration: encrypt any `isSecret` SystemSetting rows
 * still stored as plaintext strings.
 *
 * `decryptSetting()` passes plain strings through, so the app keeps working
 * before, during and after this runs — the script just closes the
 * at-rest-plaintext window for rows written before encryption existed.
 *
 * Run:  npx tsx --conditions=react-server scripts/encrypt-secret-settings.ts
 * Requires SETTINGS_ENCRYPTION_KEY (32-byte hex) in the environment.
 */
import { db } from "../src/lib/db/client";
import {
  encryptSetting,
  isEncryptedEnvelope,
  isEncryptionConfigured,
} from "../src/lib/security/secrets";
import type { Prisma } from "@prisma/client";

async function main() {
  if (!isEncryptionConfigured()) {
    console.error(
      "SETTINGS_ENCRYPTION_KEY is not set (or not 32-byte hex). Generate one with:\n" +
        "  openssl rand -hex 32\n" +
        "and add it to .env before running this script.",
    );
    process.exit(1);
  }

  const rows = await db.systemSetting.findMany({ where: { isSecret: true } });
  let encrypted = 0;
  let alreadyDone = 0;
  let skipped = 0;

  for (const row of rows) {
    if (isEncryptedEnvelope(row.value)) {
      alreadyDone++;
      continue;
    }
    if (typeof row.value !== "string" || row.value.length === 0) {
      skipped++;
      continue;
    }
    const envelope = encryptSetting(row.value) as unknown as Prisma.InputJsonValue;
    await db.systemSetting.update({ where: { id: row.id }, data: { value: envelope } });
    encrypted++;
    console.log(`encrypted: ${row.key}`);
  }

  console.log(
    `Done — ${encrypted} encrypted, ${alreadyDone} already encrypted, ${skipped} empty/non-string skipped (${rows.length} secret rows total).`,
  );
  await db.$disconnect();
}

main().catch(async (err) => {
  console.error("FAILED:", err);
  await db.$disconnect();
  process.exit(1);
});
