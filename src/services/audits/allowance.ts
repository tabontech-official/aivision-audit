import "server-only";
import { getUserAuditAllowance } from "@/services/billing/entitlements";
import type { UserPlan } from "@prisma/client";

/**
 * Dynamic audit allowance for a user. Shared by the dashboard (display) and
 * intake (enforcement) so the number a user sees matches what is enforced.
 */
export type Allowance = {
  limit: number;
  used: number;
  bonusCredits: number;
  remaining: number;
  isUnlimited: boolean;
  plan: UserPlan;
  planName: string;
  periodResetsAt: Date;
};

export async function getAllowance(userId: string, plan: UserPlan): Promise<Allowance> {
  const summary = await getUserAuditAllowance(userId);

  return {
    limit: summary.limit,
    used: summary.used,
    bonusCredits: summary.bonusCredits,
    remaining: summary.remaining,
    isUnlimited: summary.isUnlimited,
    plan,
    planName: summary.planName,
    periodResetsAt: summary.periodResetsAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  };
}
