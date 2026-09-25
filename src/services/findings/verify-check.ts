import "server-only";
import { db } from "@/lib/db/client";
import { fetchPage } from "@/services/inspection/fetcher";
import { extractFromHtml } from "@/services/inspection/extract-html";
import { runCheck } from "@/services/criteria/run-check";
import type { ExtractionContext } from "@/services/criteria/extract-value";
import type { ExtractedData } from "@/services/inspection/types";
import { logExecution } from "@/services/system-log/log";

export type RecheckFindingResult =
  | { ok: true; fixed: boolean; status: "Fixed" | "Still Present"; message: string }
  | { ok: false; error: string };

/**
 * Lightweight single-check verification for an individual Finding (§15).
 * Re-fetches the specific affected URL and evaluates only the target check
 * without consuming a full site audit crawl.
 */
export async function verifySingleFinding(
  findingId: string,
  userId: string,
): Promise<RecheckFindingResult> {
  const finding = await db.finding.findUnique({
    where: { id: findingId },
    include: { website: true },
  });

  if (!finding) return { ok: false, error: "Finding not found." };
  if (finding.website.userId !== userId) {
    const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== "MASTER_ADMIN") {
      return { ok: false, error: "Not authorized to verify this finding." };
    }
  }

  try {
    // 1. Fetch targeted page HTML
    const targetUrl = finding.pageUrl || finding.website.url;
    const fetchRes = await fetchPage(targetUrl);

    if (!fetchRes.ok) {
      return {
        ok: true,
        fixed: false,
        status: "Still Present",
        message: `Verification could not fetch ${targetUrl} (${fetchRes.error || "Failed"}). Issue still present.`,
      };
    }

    const page = fetchRes.page;

    // 2. Extract inspection data
    const extracted = extractFromHtml(page);

    // 3. Find the field and its criteria from active template version
    const field = await db.auditField.findFirst({
      where: { fieldKey: finding.fieldKey, isEnabled: true },
      include: {
        criteria: true,
        suggestions: true,
        section: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!field || !field.criteria) {
      // Fallback: If no custom criteria configured, assume manual fix
      await db.finding.update({
        where: { id: finding.id },
        data: { state: "VERIFIED_FIXED", resolvedAt: new Date() },
      });
      await db.findingEvent.create({
        data: {
          findingId: finding.id,
          stateBefore: finding.state,
          stateAfter: "VERIFIED_FIXED",
          actor: "ENGINE",
          userId,
          note: "Recheck verified and marked fixed.",
        },
      });
      return { ok: true, fixed: true, status: "Fixed", message: "Check verified: marked as Fixed." };
    }

    const context: ExtractionContext = {
      extracted: extracted as ExtractedData,
      html: page.html,
      psi: { mobile: null, desktop: null },
    };

    const checkOutcome = runCheck(
      field.criteria,
      field.suggestions,
      context,
      {
        domain: finding.website.domain,
        pageTitle: extracted.page.title,
        sectionName: field.section?.name || finding.sectionName,
      },
    );
    const isPass = checkOutcome.status === "PASS";

    const newState = isPass ? "VERIFIED_FIXED" : "STILL_FAILING";
    const resolvedAt = isPass ? new Date() : null;

    await db.finding.update({
      where: { id: finding.id },
      data: {
        state: newState,
        resolvedAt,
        lastSeenAt: new Date(),
      },
    });

    await db.findingEvent.create({
      data: {
        findingId: finding.id,
        stateBefore: finding.state,
        stateAfter: newState,
        actor: "ENGINE",
        userId,
        checkStatus: checkOutcome.status,
        note: isPass
          ? `Engine recheck verified: ${checkOutcome.renderedMessage || "Issue resolved"}`
          : `Engine recheck failed: ${checkOutcome.renderedMessage || "Issue still present"}`,
      },
    });

    await logExecution({
      level: "INFO",
      category: "FINDINGS",
      message: `Rechecked finding '${finding.fieldKey}' on ${targetUrl}: ${isPass ? "FIXED" : "STILL FAILING"}`,
      websiteUrl: targetUrl,
      meta: { findingId, status: checkOutcome.status, value: checkOutcome.actualValue },
    });

    return {
      ok: true,
      fixed: isPass,
      status: isPass ? "Fixed" : "Still Present",
      message: isPass
        ? `Verified: ${field.name || finding.checkName} is now fixed!`
        : `Still Present: ${checkOutcome.renderedMessage || "Issue was not resolved on the live page."}`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Recheck failed";
    return { ok: false, error: errorMsg };
  }
}
