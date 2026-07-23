"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auth } from "@/lib/auth/auth";
import { logAdminActivity } from "@/services/audit-log/log";
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

/** PageSpeed key is a secret: stored write-only, masked on read. */
export async function savePagespeedKeyAction(key: string): Promise<SettingsResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== "MASTER_ADMIN") {
    return { ok: false, error: "Not authorized." };
  }
  const trimmed = key.trim();
  if (trimmed.length === 0 || trimmed.length > 100) {
    return { ok: false, error: "Enter a valid API key." };
  }

  // Env var takes precedence in the PSI client; the DB copy is a fallback the
  // client reads when PAGESPEED_API_KEY is unset. Stored as a secret setting.
  await db.systemSetting.upsert({
    where: { key: "pagespeed_api_key" },
    update: { value: trimmed, isSecret: true, updatedById: session.user.id },
    create: { key: "pagespeed_api_key", value: trimmed, isSecret: true, updatedById: session.user.id },
  });

  await logAdminActivity({
    actorId: session.user.id,
    action: "settings.pagespeed_key",
    entityType: "system_settings",
  });
  revalidatePath("/master-admin/settings");
  return { ok: true, message: "PageSpeed API key saved." };
}
