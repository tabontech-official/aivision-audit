import "server-only";
import { db } from "@/lib/db/client";

/**
 * Typed system-settings reader with per-request memoization and safe defaults,
 * so the app works before/without seeded settings and during DB hiccups.
 */

const DEFAULTS = {
  product_name: "AuditFlow",
  support_email: "support@example.com",
  free_audit_limit: 3,
  premium_audit_limit: 50,
  anonymous_report_expiration_days: 7,
  anonymous_audits_per_hour_ip: 3,
  maintenance_mode: false,
  score_ranges: [
    { min: 90, max: 100, grade: "Excellent", color: "#16a34a" },
    { min: 75, max: 89, grade: "Good", color: "#22c55e" },
    { min: 50, max: 74, grade: "Needs Improvement", color: "#f59e0b" },
    { min: 0, max: 49, grade: "Poor", color: "#ef4444" },
  ],
} as const;

export type SettingKey = keyof typeof DEFAULTS;

export async function getSetting<K extends SettingKey>(
  key: K,
): Promise<(typeof DEFAULTS)[K]> {
  try {
    const row = await db.systemSetting.findUnique({ where: { key } });
    if (row?.value === null || row?.value === undefined) return DEFAULTS[key];
    return row.value as (typeof DEFAULTS)[K];
  } catch {
    return DEFAULTS[key];
  }
}
