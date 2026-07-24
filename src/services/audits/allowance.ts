import "server-only";
import { db } from "@/lib/db/client";
import { getSetting } from "@/services/settings/get";
import type { UserPlan } from "@prisma/client";

/**
 * Monthly audit allowance for a user. Shared by the dashboard (display) and
 * intake (enforcement) so the number a user sees matches what is enforced.
 */
export type Allowance = {
  limit: number;
  used: number;
  remaining: number;
  plan: UserPlan;
  periodResetsAt: Date;
};

export async function getAllowance(userId: string, plan: UserPlan): Promise<Allowance> {
  const limit =
    plan === "PREMIUM"
      ? await getSetting("premium_audit_limit")
      : await getSetting("free_audit_limit");

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const used = await db.report.count({
    where: { userId, createdAt: { gte: monthStart }, deletedAt: null },
  });

  const periodResetsAt = new Date(monthStart);
  periodResetsAt.setMonth(periodResetsAt.getMonth() + 1);

  return {
    limit,
    used,
    remaining: Math.max(0, limit - used),
    plan,
    periodResetsAt,
  };
}
