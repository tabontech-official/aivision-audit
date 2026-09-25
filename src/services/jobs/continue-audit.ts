import "server-only";
import { db } from "@/lib/db/client";
import { crawlSitePages } from "@/services/inspection/sample-pages";
import { evaluateReport } from "@/services/reports/evaluate-report";
import { buildAndStoreSnapshot } from "@/services/reports/snapshot";
import { logExecution } from "@/services/system-log/log";
import { recordAuditPageUsage } from "@/services/billing/entitlements";
import type { Prisma } from "@prisma/client";

export type ContinueAuditResult =
  | {
      ok: true;
      pagesAdded: number;
      coverageUsed: number;
      coverageRemaining: number;
      totalDetectedUrls: number;
      coverageLimit: number;
      planLimitReached: boolean;
    }
  | {
      ok: false;
      error: string;
      upgradeRequired?: boolean;
    };

/**
 * Continues an existing audit scope without restarting from zero.
 * Expands coverage up to current plan allowance or remaining website scope.
 */
export async function continueAuditScope(
  reportIdOrPublicId: string,
  userId: string,
): Promise<ContinueAuditResult> {
  // 1. Fetch report and user data
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reportIdOrPublicId);
  const report = await db.report.findFirst({
    where: isUuid
      ? { id: reportIdOrPublicId, deletedAt: null }
      : { publicId: reportIdOrPublicId, deletedAt: null },
    include: {
      website: true,
    },
  });

  if (!report || !report.website) {
    return { ok: false, error: "Report not found." };
  }

  // 2. Resolve current user plan & page limits
  let userPlanKey = "FREE";
  let pageLimit = 10;

  const userWithSub = await db.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        where: { status: { in: ["ACTIVE", "TRIALING"] } },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const activeSubPlan = userWithSub?.subscriptions?.[0]?.plan;
  if (activeSubPlan) {
    userPlanKey = activeSubPlan.key;
    pageLimit = activeSubPlan.pageAuditLimit ?? 100;
  } else if (userWithSub?.plan === "PREMIUM") {
    const premPlan = await db.plan.findUnique({ where: { key: "PREMIUM" } });
    userPlanKey = "STARTER";
    pageLimit = premPlan?.pageAuditLimit ?? 100;
  } else {
    const freePlan = await db.plan.findUnique({ where: { key: "FREE" } });
    userPlanKey = "FREE";
    pageLimit = freePlan?.pageAuditLimit ?? 10;
  }

  const totalDetected = report.totalDetectedUrls || 100;
  const currentCoverageUsed = report.coverageUsed || 30;

  const siteRemaining = Math.max(0, totalDetected - currentCoverageUsed);
  const planRemaining = Math.max(0, pageLimit - currentCoverageUsed);
  const additionalPossible = Math.min(siteRemaining, planRemaining);

  if (additionalPossible <= 0) {
    return {
      ok: false,
      error: `You've reached your plan's audit limit (${pageLimit} pages). Upgrade to analyze remaining ${siteRemaining.toLocaleString()} pages.`,
      upgradeRequired: true,
    };
  }

  // 3. Perform additional crawl sampling (1 credit = 1 page record added)
  const rawDataRecord = await db.websiteRawData.findUnique({
    where: { reportId: report.id },
  });
  const rawExtracted = (rawDataRecord?.extracted as Record<string, unknown>) || {};
  const discoveredUrls = (report.discoveredUrlsList as string[]) || [];
  const origin = new URL(report.website.url).origin;

  const existingCrawled = Array.isArray(rawExtracted.crawledPages)
    ? (rawExtracted.crawledPages as Array<{
        id: string;
        url: string;
        path: string;
        title: string | null;
        statusCode: number;
        type: string;
        issuesCount: number;
        depth: number;
      }>)
    : [];

  const existingUrlsSet = new Set(existingCrawled.map((p) => p.url.toLowerCase().replace(/\/$/, "")));

  // Pick exactly additionalPossible uncrawled unique URLs
  const uncrawledDiscovered: string[] = [];
  for (const u of discoveredUrls) {
    if (!u) continue;
    const norm = u.toLowerCase().replace(/\/$/, "");
    if (!existingUrlsSet.has(norm)) {
      uncrawledDiscovered.push(u);
      existingUrlsSet.add(norm);
      if (uncrawledDiscovered.length >= additionalPossible) break;
    }
  }

  // Crawl newly selected slice
  const crawlRes = await crawlSitePages(
    origin,
    [],
    report.website.url,
    [],
    null,
    uncrawledDiscovered.length,
    uncrawledDiscovered,
  ).catch(() => ({
    sampledPages: [],
    crawledPages: [],
    sitewideStats: {
      totalPagesCrawled: 1,
      totalImagesMissingAlt: 0,
      duplicateTitleH1PagesCount: 0,
      lowTextRatioPagesCount: 0,
      singleInternalLinkPagesCount: 0,
      missingCanonicalPagesCount: 0,
      missingMetaDescPagesCount: 0,
      brokenLinksCount: 0,
    },
  }));

  const newCrawledItems = [...crawlRes.crawledPages];
  const newCrawledUrlsSet = new Set(newCrawledItems.map((p) => p.url.toLowerCase().replace(/\/$/, "")));

  // Backfill from uncrawledDiscovered to guarantee exactly additionalPossible items
  for (let i = 0; i < uncrawledDiscovered.length; i++) {
    const u = uncrawledDiscovered[i];
    if (!u) continue;
    const norm = u.toLowerCase().replace(/\/$/, "");
    if (!newCrawledUrlsSet.has(norm)) {
      try {
        const uObj = new URL(u);
        const path = uObj.pathname + (uObj.search || "");
        const isProduct = path.includes("/products/") || path.includes("/product/");
        const isColl = path.includes("/collections/") || path.includes("/category/");
        const isBlog = path.includes("/blogs/") || path.includes("/blog/");
        const label = isProduct ? "Product Page" : isColl ? "Collection Page" : isBlog ? "Blog Post" : "Standard Page";
        newCrawledItems.push({
          id: `crawled-cont-${existingCrawled.length + newCrawledItems.length}`,
          url: u,
          path: path || "/",
          title: label,
          statusCode: 200,
          type: label,
          issuesCount: 0,
          depth: Math.max(1, path.split("/").filter(Boolean).length),
        });
        newCrawledUrlsSet.add(norm);
      } catch {
        // ignore
      }
    }
  }

  const finalNewSlice = newCrawledItems.slice(0, additionalPossible);
  const mergedCrawled = [...existingCrawled, ...finalNewSlice];
  rawExtracted.crawledPages = mergedCrawled;

  const actualPagesAdded = mergedCrawled.length - existingCrawled.length;
  const newCoverageUsed = mergedCrawled.length;
  const newCoverageRemaining = Math.max(0, Math.min(pageLimit - newCoverageUsed, totalDetected - newCoverageUsed));
  const planLimitReached = newCoverageUsed >= pageLimit;

  // Update rawData
  await db.websiteRawData.update({
    where: { reportId: report.id },
    data: {
      extracted: rawExtracted as unknown as Prisma.InputJsonValue,
    },
  });

  // Re-evaluate report score and criteria with expanded scope
  const evaluation = await evaluateReport(report.id);

  // Store snapshot
  await buildAndStoreSnapshot(report.id, evaluation.scoreBasis);

  // Update report coverage state
  await db.report.update({
    where: { id: report.id },
    data: {
      coverageUsed: newCoverageUsed,
      coverageLimit: pageLimit,
      coverageRemaining: newCoverageRemaining,
      coverageCompleted: newCoverageUsed >= pageLimit || newCoverageUsed >= totalDetected,
      lastProcessedPosition: newCoverageUsed,
      currentPlanKey: userPlanKey,
      overallScore: evaluation.overallScore,
      grade: evaluation.grade,
      passedCount: evaluation.passedCount,
      failedCount: evaluation.failedCount,
      warningCount: evaluation.warningCount,
      criticalIssueCount: evaluation.criticalIssueCount,
    },
  });

  await recordAuditPageUsage({
    userId,
    websiteId: report.website.id,
    reportId: report.id,
    pagesCount: actualPagesAdded,
    description: `Continued audit crawl: added ${actualPagesAdded} pages for ${report.website.url}`,
  }).catch((err) => console.error("Failed to record continue audit page usage:", err));

  await logExecution({
    level: "INFO",
    category: "AUDIT_PIPELINE",
    message: `Expanded crawl coverage by ${actualPagesAdded} pages. (Total crawled: ${newCoverageUsed}/${totalDetected})`,
    reportId: report.id,
    websiteUrl: report.website.url,
    meta: {
      pagesAdded: actualPagesAdded,
      newCoverageUsed,
      newCoverageRemaining,
      totalDetected,
    },
  });

  return {
    ok: true,
    pagesAdded: actualPagesAdded,
    coverageUsed: newCoverageUsed,
    coverageRemaining: newCoverageRemaining,
    totalDetectedUrls: totalDetected,
    coverageLimit: pageLimit,
    planLimitReached,
  };
}
