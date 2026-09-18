"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auth } from "@/lib/auth/auth";
import { logAdminActivity } from "@/services/audit-log/log";
import { rateLimit } from "@/lib/security/rate-limit";
import {
  getSecretSetting,
  getSecretStatus,
  setSecretSetting,
  clearSecretSetting,
} from "@/services/settings/secret";
import { testPsiApiKey } from "@/services/pagespeed/client";
import type { Prisma } from "@prisma/client";

export type SettingsResult = { ok: true; message?: string } | { ok: false; error: string };

const scoreRangeSchema = z
  .array(
    z.object({
      min: z.number().min(0).max(100),
      max: z.number().min(0).max(100),
      grade: z.string().trim().min(1).max(40),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    }),
  )
  .min(2)
  .max(6);

const settingsSchema = z.object({
  product_name: z.string().trim().min(1).max(60),
  support_email: z.string().trim().email().max(254),
  free_audit_limit: z.coerce.number().int().min(0).max(1000),
  premium_audit_limit: z.coerce.number().int().min(0).max(10000),
  anonymous_report_expiration_days: z.coerce.number().int().min(1).max(90),
  anonymous_audits_per_hour_ip: z.coerce.number().int().min(1).max(100),
  maintenance_mode: z.coerce.boolean(),
  terms_url: z.string().trim().max(500),
  privacy_url: z.string().trim().max(500),
  cookie_policy_url: z.string().trim().max(500),
  score_ranges_json: z.string().max(2000),
});

export async function saveSettingsAction(input: unknown): Promise<SettingsResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "MASTER_ADMIN") {
    return { ok: false, error: "Not authorized." };
  }

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid settings." };
  }

  let scoreRanges: unknown;
  try {
    scoreRanges = JSON.parse(parsed.data.score_ranges_json);
  } catch {
    return { ok: false, error: "Score ranges must be valid JSON." };
  }
  const rangesParsed = scoreRangeSchema.safeParse(scoreRanges);
  if (!rangesParsed.success) {
    return {
      ok: false,
      error: "Score ranges must be an array of { min, max, grade, color } objects.",
    };
  }

  const { score_ranges_json: _json, ...flat } = parsed.data;
  const entries: Array<[string, unknown]> = [
    ...Object.entries(flat),
    ["score_ranges", rangesParsed.data],
  ];

  for (const [key, value] of entries) {
    await db.systemSetting.upsert({
      where: { key },
      update: { value: value as Prisma.InputJsonValue, updatedById: session.user.id },
      create: { key, value: value as Prisma.InputJsonValue, updatedById: session.user.id },
    });
  }

  await logAdminActivity({
    actorId: session.user.id,
    action: "settings.update",
    entityType: "system_settings",
    after: flat,
  });
  revalidatePath("/master-admin/settings");
  return { ok: true, message: "Settings saved." };
}

/* ------------------------------------------------------------------ */
/* PageSpeed API key — secret setting                                  */
/*                                                                     */
/* Encrypted at rest (AES-256-GCM), database wins over the env var,    */
/* read fresh per audit so a save takes effect immediately. The raw    */
/* value never goes back to the browser and never appears in a log —   */
/* activity entries record only [set] / [not set].                     */
/* ------------------------------------------------------------------ */

export type PagespeedKeyStatus = {
  isSet: boolean;
  source: "database" | "environment" | "unset";
  maskedPreview: string | null;
  unreadable: boolean;
  encryptionConfigured: boolean;
};

export async function savePagespeedKeyAction(key: string): Promise<SettingsResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "MASTER_ADMIN") {
    return { ok: false, error: "Not authorized." };
  }
  const trimmed = key.trim();
  if (trimmed.length === 0 || trimmed.length > 100) {
    return { ok: false, error: "Enter a valid API key." };
  }

  const wasSet = (await getSecretStatus("pagespeed_api_key", process.env.PAGESPEED_API_KEY)).isSet;

  const stored = await setSecretSetting("pagespeed_api_key", trimmed, session.user.id);
  if (!stored.ok) return { ok: false, error: stored.error };

  await logAdminActivity({
    actorId: session.user.id,
    action: "settings.pagespeed_key.update",
    entityType: "system_settings",
    before: { pagespeed_api_key: wasSet ? "[set]" : "[not set]" },
    after: { pagespeed_api_key: "[set]" },
  });
  revalidatePath("/master-admin/settings");
  return { ok: true, message: "PageSpeed API key saved — it applies to the very next audit." };
}

/** Remove the stored key so the environment fallback (if any) takes over. */
export async function clearPagespeedKeyAction(): Promise<SettingsResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "MASTER_ADMIN") {
    return { ok: false, error: "Not authorized." };
  }

  await clearSecretSetting("pagespeed_api_key");

  await logAdminActivity({
    actorId: session.user.id,
    action: "settings.pagespeed_key.clear",
    entityType: "system_settings",
    before: { pagespeed_api_key: "[set]" },
    after: { pagespeed_api_key: "[not set]" },
  });
  revalidatePath("/master-admin/settings");
  return {
    ok: true,
    message: process.env.PAGESPEED_API_KEY
      ? "Stored key cleared — the environment variable key is now in use."
      : "Stored key cleared — no key is configured; audits will finish PARTIAL.",
  };
}

export type TestKeyResult =
  | { ok: true; verdict: "valid" | "invalid_key" | "api_disabled" | "quota_exceeded" | "network_error"; detail: string }
  | { ok: false; error: string };

/**
 * Validate a key against the real PSI endpoint without saving it.
 * When called with an empty string, tests whatever key is currently active.
 */
export async function testPagespeedKeyAction(key: string): Promise<TestKeyResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "MASTER_ADMIN") {
    return { ok: false, error: "Not authorized." };
  }

  const rl = await rateLimit(`admin:psi-test:${session.user.id}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
    return { ok: false, error: "Too many key tests. Try again in an hour." };
  }

  const candidate =
    key.trim() ||
    (await getSecretSetting("pagespeed_api_key", process.env.PAGESPEED_API_KEY)) ||
    "";
  if (!candidate) {
    return { ok: false, error: "No key to test — enter one or save one first." };
  }

  const result = await testPsiApiKey(candidate);

  await logAdminActivity({
    actorId: session.user.id,
    action: "settings.pagespeed_key.test",
    entityType: "system_settings",
    after: { verdict: result.verdict },
  });

  return { ok: true, verdict: result.verdict, detail: result.detail };
}
