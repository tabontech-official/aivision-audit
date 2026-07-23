import "server-only";
import { db } from "@/lib/db/client";
import { validateAndNormalizeUrl } from "@/lib/security/url";
import { assertPublicHost } from "@/lib/security/ssrf";
import { fetchPage } from "@/services/inspection/fetcher";
import { extractFromHtml } from "@/services/inspection/extract-html";
import {
  checkRobotsTxt,
  checkSitemap,
  checkBrokenLinks,
} from "@/services/inspection/aux-checks";
import { renderPage } from "@/services/inspection/renderer";
import { storeScreenshot } from "@/services/inspection/screenshot-store";
import { fetchPsiBoth, type PsiMetrics } from "@/services/pagespeed/client";
import { evaluateReport } from "@/services/reports/evaluate-report";
import { buildAndStoreSnapshot } from "@/services/reports/snapshot";
import type { AuditStage, Prisma } from "@prisma/client";

/**
 * The audit pipeline. Called by the QStash worker route (prod) or inline
 * after intake (dev). Idempotent per report: re-invocation of a COMPLETED/
 * FAILED report is a no-op; a PROCESSING report continues from raw data
 * already persisted (QStash retry safety).
 *
 * Phase 4 scope: collect and persist everything (raw data, PSI, screenshot)
 * and finish with a provisional PSI-based score. Phase 6 adds the criteria
 * evaluation engine that turns raw data into per-check results and the real
 * weighted score.
 */

async function setStage(
  reportId: string,
  stage: AuditStage,
  progress: number,
): Promise<void> {
  await db.report.update({
    where: { id: reportId },
    data: { currentStage: stage, progressPercent: progress },
  });
}

async function fail(reportId: string, userMessage: string, detail?: string): Promise<void> {
  console.error(`[audit:${reportId}] FAILED: ${userMessage}${detail ? ` (${detail})` : ""}`);
  await db.report.update({
    where: { id: reportId },
    data: { status: "FAILED", errorMessage: userMessage, completedAt: new Date() },
  });
}

export async function runAudit(reportId: string): Promise<void> {
  const report = await db.report.findUnique({
    where: { id: reportId },
    include: { website: true },
  });

  if (!report) {
    console.error(`[audit:${reportId}] report not found`);
    return;
  }
  // Idempotency: terminal states are never re-run
  if (report.status === "COMPLETED" || report.status === "FAILED" || report.status === "PARTIAL") {
    return;
  }

  await db.report.update({
    where: { id: reportId },
    data: { status: "PROCESSING", startedAt: report.startedAt ?? new Date() },
  });

  try {
    /* ---- Stage 1: validate + connect + fetch ---- */
    await setStage(reportId, "CONNECTING", 5);

    const validated = validateAndNormalizeUrl(report.website.url);
    if (!validated.ok) {
      return fail(reportId, "This website address is not valid.", validated.error);
    }
    const ssrf = await assertPublicHost(validated.value.hostname);
    if (!ssrf.ok) {
      return fail(reportId, "This address cannot be audited.");
    }

    await setStage(reportId, "FETCHING_HTML", 12);
    const fetched = await fetchPage(validated.value.url);
    if (!fetched.ok) {
      return fail(reportId, fetched.userMessage, fetched.error);
    }
    const page = fetched.page;

    /* ---- Stage 2: optional JS rendering + screenshot ---- */
    await setStage(reportId, "RENDERING", 22);
    const rendered = await renderPage(page.finalUrl);

    let screenshotUrl: string | null = null;
    if (rendered?.screenshotJpegBase64) {
      screenshotUrl = await storeScreenshot(reportId, rendered.screenshotJpegBase64);
    }

    /* ---- Stage 3: extraction (rendered DOM when richer, else static) ---- */
    await setStage(reportId, "INSPECTING_METADATA", 32);

    // Prefer rendered HTML when it is substantially larger (SPA hydration);
    // network truth (status/headers) always comes from the raw fetch.
    const useRendered =
      rendered !== null && rendered.html.length > page.html.length * 1.2;
    const extracted = extractFromHtml(
      useRendered ? { ...page, html: rendered.html } : page,
    );

    /* ---- Stage 4: robots / sitemap / broken links ---- */
    await setStage(reportId, "CHECKING_SEO", 42);
    const origin = new URL(page.finalUrl).origin;
    extracted.robots = await checkRobotsTxt(origin);
    extracted.sitemap = await checkSitemap(origin, extracted.robots.content);
    extracted.brokenLinks = await checkBrokenLinks(
      extracted.links.internal,
      page.finalUrl,
    );

    /* ---- Persist raw data checkpoint ---- */
    // Store the HTML the extraction ran against (rendered when used) so
    // criteria can be re-evaluated — including selector checks — without
    // re-crawling. Capped at 2MB to bound row size.
    const htmlForStorage = (useRendered ? rendered!.html : page.html).slice(0, 2 * 1024 * 1024);
    const rawDataPayload = {
      httpStatus: page.httpStatus,
      finalUrl: page.finalUrl,
      redirectChain: page.redirectChain,
      responseHeaders: page.responseHeaders as unknown as Prisma.InputJsonValue,
      extracted: extracted as unknown as Prisma.InputJsonValue,
      html: htmlForStorage,
      robotsTxt: extracted.robots.content,
      sitemapInfo: extracted.sitemap as unknown as Prisma.InputJsonValue,
      brokenLinks: extracted.brokenLinks.broken as unknown as Prisma.InputJsonValue,
      htmlSizeBytes: page.htmlSizeBytes,
      fetchDurationMs: page.fetchDurationMs,
      renderedWithBrowser: rendered !== null,
    };
    await db.websiteRawData.upsert({
      where: { reportId },
      update: rawDataPayload,
      create: { reportId, ...rawDataPayload },
    });

    // Update website metadata (favicon, audit timestamps)
    await db.website.update({
      where: { id: report.websiteId },
      data: {
        faviconUrl: extracted.page.faviconUrl,
        firstAuditedAt: report.website.firstAuditedAt ?? new Date(),
        lastAuditedAt: new Date(),
      },
    });

    /* ---- Stage 5: PageSpeed Insights ---- */
    await setStage(reportId, "CHECKING_SPEED", 55);
    const psi = await fetchPsiBoth(page.finalUrl, reportId);

    const storePsi = async (metrics: PsiMetrics | null) => {
      if (!metrics) return;
      const data = {
        performanceScore: metrics.performanceScore,
        accessibilityScore: metrics.accessibilityScore,
        bestPracticesScore: metrics.bestPracticesScore,
        seoScore: metrics.seoScore,
        fcpMs: metrics.fcpMs,
        lcpMs: metrics.lcpMs,
        tbtMs: metrics.tbtMs,
        cls: metrics.cls,
        speedIndexMs: metrics.speedIndexMs,
        ttiMs: metrics.ttiMs,
        inpMs: metrics.inpMs,
        serverResponseMs: metrics.serverResponseMs,
        opportunities: metrics.opportunities as unknown as Prisma.InputJsonValue,
        diagnostics: metrics.diagnostics as unknown as Prisma.InputJsonValue,
        passedAudits: metrics.passedAudits as unknown as Prisma.InputJsonValue,
        rawResponse: metrics.rawResponse as unknown as Prisma.InputJsonValue,
        fetchedAt: new Date(),
      };
      await db.pageSpeedResult.upsert({
        where: { reportId_strategy: { reportId, strategy: metrics.strategy } },
        update: data,
        create: { reportId, strategy: metrics.strategy, ...data },
      });
    };
    await Promise.all([storePsi(psi.mobile), storePsi(psi.desktop)]);

    /* ---- Stages 6-9: cosmetic progress through remaining stages ---- */
    await setStage(reportId, "REVIEWING_ACCESSIBILITY", 68);
    await setStage(reportId, "ANALYZING_MOBILE", 76);
    await setStage(reportId, "CHECKING_CONVERSION", 82);
    await setStage(reportId, "PREPARING_RECOMMENDATIONS", 90);

    /* ---- Stage 10: evaluate all criteria, score, snapshot, finalize ---- */
    await setStage(reportId, "GENERATING_REPORT", 96);

    const summary = await evaluateReport(reportId);
    await buildAndStoreSnapshot(reportId);

    const psiFailed = !psi.mobile && !psi.desktop;

    await db.report.update({
      where: { id: reportId },
      data: {
        status: psiFailed ? "PARTIAL" : "COMPLETED",
        progressPercent: 100,
        completedAt: new Date(),
        screenshotUrl,
        mobileScore: psi.mobile?.performanceScore ?? null,
        desktopScore: psi.desktop?.performanceScore ?? null,
        overallScore: summary.overallScore,
        grade: summary.grade,
        passedCount: summary.passedCount,
        failedCount: summary.failedCount,
        warningCount: summary.warningCount,
        criticalIssueCount: summary.criticalIssueCount,
        errorMessage: psiFailed
          ? "Speed metrics were unavailable for this run; other checks completed."
          : null,
      },
    });

    console.log(
      `[audit:${reportId}] done (${page.finalUrl}) score=${summary.overallScore} grade=${summary.grade} ` +
        `pass=${summary.passedCount} fail=${summary.failedCount} warn=${summary.warningCount} psi=${!psiFailed}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await fail(
      reportId,
      "Something went wrong while auditing this website. Please try again.",
      message.slice(0, 300),
    );
  }
}
