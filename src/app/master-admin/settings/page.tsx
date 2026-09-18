import type { Metadata } from "next";
import { db } from "@/lib/db/client";
import { requireMasterAdmin } from "@/lib/auth/rbac";
import { getSecretStatus } from "@/services/settings/secret";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireMasterAdmin();

  const rows = await db.systemSetting.findMany();
  const map = new Map(rows.map((r) => [r.key, r]));

  const get = <T,>(key: string, fallback: T): T => {
    const row = map.get(key);
    return row?.value === null || row?.value === undefined ? fallback : (row.value as T);
  };

  return (
    <SettingsForm
      initial={{
        product_name: get("product_name", "AuditFlow"),
        support_email: get("support_email", "support@example.com"),
        free_audit_limit: get("free_audit_limit", 3),
        premium_audit_limit: get("premium_audit_limit", 50),
        anonymous_report_expiration_days: get("anonymous_report_expiration_days", 7),
        anonymous_audits_per_hour_ip: get("anonymous_audits_per_hour_ip", 3),
        maintenance_mode: get("maintenance_mode", false),
        terms_url: get("terms_url", "/terms"),
        privacy_url: get("privacy_url", "/privacy"),
        cookie_policy_url: get("cookie_policy_url", "/cookies"),
        score_ranges_json: JSON.stringify(
          get("score_ranges", [
            { min: 90, max: 100, grade: "Excellent", color: "#16a34a" },
            { min: 75, max: 89, grade: "Good", color: "#22c55e" },
            { min: 50, max: 74, grade: "Needs Improvement", color: "#f59e0b" },
            { min: 0, max: 49, grade: "Poor", color: "#ef4444" },
          ]),
          null,
          2,
        ),
      }}
      pagespeedKey={await getSecretStatus("pagespeed_api_key", process.env.PAGESPEED_API_KEY)}
    />
  );
}
