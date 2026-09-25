"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { auth } from "@/lib/auth/auth";
import { createAudit } from "@/services/audits/create";
import type { UserPlan } from "@prisma/client";

export type ReportActionResult =
  | { ok: true; message?: string; redirectTo?: string }
  | { ok: false; error: string };

const idSchema = z.string().uuid();

/** Soft-delete a report and its associated website if applicable. */
export async function deleteReportAction(reportId: string): Promise<ReportActionResult> {
  try {
    const session = await auth();
    if (!session?.user) return { ok: false, error: "Not authorized." };
    if (!idSchema.safeParse(reportId).success) return { ok: false, error: "Invalid report." };

    const report = await db.report.findUnique({ where: { id: reportId } });
    if (!report || report.deletedAt || report.userId !== session.user.id) {
      return { ok: false, error: "Report not found." };
    }

    const now = new Date();
    await db.$transaction([
      db.report.update({ where: { id: reportId }, data: { deletedAt: now } }),
      db.website.update({ where: { id: report.websiteId }, data: { deletedAt: now } }),
    ]);

    revalidatePath("/dashboard/reports");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/websites");
    return { ok: true, message: "Site audit deleted successfully." };
  } catch (err: unknown) {
    console.error("deleteReportAction error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to delete report." };
  }
}

/** Re-run an audit for the same website (subject to allowance). */
export async function rerunAuditAction(reportId: string): Promise<ReportActionResult> {
  try {
    const session = await auth();
    if (!session?.user) return { ok: false, error: "Not authorized." };
    if (!idSchema.safeParse(reportId).success) return { ok: false, error: "Invalid report." };

    const report = await db.report.findUnique({
      where: { id: reportId },
      include: { website: true },
    });
    if (!report || report.deletedAt || report.userId !== session.user.id) {
      return { ok: false, error: "Report not found." };
    }

    const targetUrl = report.website?.url || report.website?.domain;
    if (!targetUrl) {
      return { ok: false, error: "Website URL not found for this report." };
    }

    const result = await createAudit(targetUrl, {
      kind: "user",
      userId: session.user.id,
      plan: session.user.plan as UserPlan,
    });

    if (!result.ok) return { ok: false, error: result.error };
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/reports");
    return { ok: true, redirectTo: `/analyze/${result.reportPublicId}` };
  } catch (err: unknown) {
    console.error("rerunAuditAction error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to trigger re-scan." };
  }
}

/** Trigger a fresh re-scan for a website domain or URL. */
export async function rescanWebsiteAction(domainOrUrl: string): Promise<ReportActionResult> {
  try {
    const session = await auth();
    if (!session?.user) return { ok: false, error: "Not authorized." };
    if (!domainOrUrl || !domainOrUrl.trim()) return { ok: false, error: "Invalid domain or URL." };

    const formattedUrl = domainOrUrl.startsWith("http://") || domainOrUrl.startsWith("https://")
      ? domainOrUrl
      : `https://${domainOrUrl}`;

    const result = await createAudit(formattedUrl, {
      kind: "user",
      userId: session.user.id,
      plan: session.user.plan as UserPlan,
    });

    if (!result.ok) return { ok: false, error: result.error };
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/reports");
    return { ok: true, redirectTo: `/analyze/${result.reportPublicId}` };
  } catch (err: unknown) {
    console.error("rescanWebsiteAction error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to trigger website scan." };
  }
}

/** Cancel / Stop an in-progress audit by publicId or reportId. */
export async function cancelAuditAction(identifier: string): Promise<ReportActionResult> {
  try {
    const session = await auth();
    if (!session?.user) return { ok: false, error: "Not authorized." };
    if (!identifier || !identifier.trim()) return { ok: false, error: "Invalid audit identifier." };

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    const report = await db.report.findFirst({
      where: isUuid
        ? { id: identifier, userId: session.user.id, deletedAt: null }
        : { publicId: identifier, userId: session.user.id, deletedAt: null },
    });

    if (!report) return { ok: false, error: "Audit not found." };

    await db.report.update({
      where: { id: report.id },
      data: {
        status: "FAILED",
        errorMessage: "Audit cancelled by user.",
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/reports");
    revalidatePath(`/analyze/${report.publicId}`);
    return { ok: true, message: "Audit cancelled successfully.", redirectTo: "/dashboard" };
  } catch (err: unknown) {
    console.error("cancelAuditAction error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to cancel audit." };
  }
}

/** Continue an existing audit to analyze remaining pages under plan allowance. */
export async function continueAuditAction(reportPublicId: string): Promise<{
  ok: boolean;
  error?: string;
  pagesAdded?: number;
  coverageUsed?: number;
  coverageRemaining?: number;
  totalDetectedUrls?: number;
  upgradeRequired?: boolean;
}> {
  try {
    const session = await auth();
    if (!session?.user) return { ok: false, error: "Not authorized." };
    if (!reportPublicId || !reportPublicId.trim()) return { ok: false, error: "Invalid report identifier." };

    const { continueAuditScope } = await import("@/services/jobs/continue-audit");
    const res = await continueAuditScope(reportPublicId, session.user.id);

    if (!res.ok) {
      return { ok: false, error: res.error, upgradeRequired: res.upgradeRequired };
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/reports");
    revalidatePath(`/dashboard/reports/${reportPublicId}`);

    return {
      ok: true,
      pagesAdded: res.pagesAdded,
      coverageUsed: res.coverageUsed,
      coverageRemaining: res.coverageRemaining,
      totalDetectedUrls: res.totalDetectedUrls,
    };
  } catch (err: unknown) {
    console.error("continueAuditAction error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to continue audit." };
  }
}

/**
 * Claim 10 free bonus credits and run the first website audit (100% free of cost, 0 credits deducted).
 */
export async function claimWelcomeRewardAndRunAuditAction(
  targetUrl: string
): Promise<{ ok: true; domain: string; reportPublicId: string } | { ok: false; error: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Please sign in to claim your reward." };
    }

    const userId = session.user.id;

    // 1. Grant 10 bonus credits if user hasn't received them yet
    const existingWelcomeBonus = await db.bonusCredit.findFirst({
      where: {
        userId,
        reason: "WELCOME_REWARD_10",
      },
    });

    if (!existingWelcomeBonus) {
      await db.bonusCredit.create({
        data: {
          userId,
          units: 10,
          remainingUnits: 10,
          reason: "WELCOME_REWARD_10",
          expiresAt: null,
        },
      });
    }

    // 2. Validate & normalize URL
    let cleanUrl = targetUrl.trim();
    if (!cleanUrl) {
      return { ok: false, error: "Please enter a valid website URL." };
    }
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }

    // 3. Initiate the audit
    const result = await createAudit(cleanUrl, {
      kind: "user",
      userId,
      plan: (session.user.plan as UserPlan) || "FREE",
    });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    const domain = cleanUrl.replace(/^https?:\/\//i, "").split("/")[0] || "";

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/reports");
    return { ok: true, domain, reportPublicId: result.reportPublicId };
  } catch (err: unknown) {
    console.error("claimWelcomeRewardAndRunAuditAction error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to claim reward and start audit.",
    };
  }
}

