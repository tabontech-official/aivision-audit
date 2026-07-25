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
import { logExecution } from "@/services/system-log/log";
import type { AuditStage, Prisma } from "@prisma/client";

async function setStage(
  reportId: string,
  stage: AuditStage,
  progress: number,
  websiteUrl?: string,
): Promise<void> {
  await db.report.update({
    where: { id: reportId },
    data: { currentStage: stage, progressPercent: progress },
  });

  await logExecution({
    level: "INFO",
    category: "AUDIT_PIPELINE",
    message: `Stage transitioned to ${stage} (${progress}%)`,
    reportId,
    websiteUrl,
    stage,
    meta: { progress },
  });
}

async function fail(
  reportId: string,
  userMessage: string,
  detail?: string,
  websiteUrl?: string,
): Promise<void> {
  const fullDetail = `${userMessage}${detail ? ` (${detail})` : ""}`;
  console.error(`[audit:${reportId}] FAILED: ${fullDetail}`);
  
  await db.report.update({
    where: { id: reportId },
    data: { status: "FAILED", errorMessage: userMessage, completedAt: new Date() },
  });

  await logExecution({
    level: "ERROR",
    category: "AUDIT_PIPELINE",
    message: `Audit FAILED: ${userMessage}`,
    reportId,
    websiteUrl,
    meta: { detail, userMessage },
  });
}

export async function runAudit(reportId: string): Promise<void> {
  const startTime = Date.now();
  const report = await db.report.findUnique({
    where: { id: reportId },
    include: { website: true },
  });

  if (!report) {
    await logExecution({
      level: "ERROR",
      category: "AUDIT_PIPELINE",
      message: `Audit failed to start: report not found in DB`,
      reportId,
    });
    return;
  }

  // Idempotency: terminal states are never re-run
  if (report.status === "COMPLETED" || report.status === "FAILED" || report.status === "PARTIAL") {
    await logExecution({
      level: "WARN",
      category: "AUDIT_PIPELINE",
      message: `Audit execution skipped: report already in terminal status (${report.status})`,
      reportId,
      websiteUrl: report.website.url,
    });
    return;
  }

  await db.report.update({
    where: { id: reportId },
    data: { status: "PROCESSING", startedAt: report.startedAt ?? new Date() },
  });

  await logExecution({
    level: "INFO",
    category: "AUDIT_PIPELINE",
    message: `Starting audit pipeline for website ${report.website.url}`,
    reportId,
    websiteUrl: report.website.url,
  });

  try {
    /* ---- Stage 1: validate + connect + fetch ---- */
    await setStage(reportId, "CONNECTING", 5, report.website.url);

    const validated = validateAndNormalizeUrl(report.website.url);
    if (!validated.ok) {
      return fail(reportId, "This website address is not valid.", validated.error, report.website.url);
    }
    const ssrf = await assertPublicHost(validated.value.hostname);
    if (!ssrf.ok) {
      return fail(reportId, "This address cannot be audited.", ssrf.error, report.website.url);
    }

    await setStage(reportId, "FETCHING_HTML", 12, validated.value.url);
    const fetchStart = Date.now();
    const fetched = await fetchPage(validated.value.url);
    const fetchDuration = Date.now() - fetchStart;

    if (!fetched.ok) {
      return fail(reportId, fetched.userMessage, fetched.error, validated.value.url);
    }
    const page = fetched.page;

    await logExecution({
      level: "INFO",
      category: "FETCH_HTML",
      message: `Successfully fetched HTML (HTTP ${page.httpStatus}, ${page.htmlSizeBytes} bytes, ${fetchDuration}ms)`,
      reportId,
      websiteUrl: page.finalUrl,
      durationMs: fetchDuration,
      meta: { httpStatus: page.httpStatus, htmlSize: page.htmlSizeBytes, finalUrl: page.finalUrl },
    });

    /* ---- Stage 2: optional JS rendering + screenshot ---- */
    await setStage(reportId, "RENDERING", 22, page.finalUrl);
    const renderStart = Date.now();
    const rendered = await renderPage(page.finalUrl);
    const renderDuration = Date.now() - renderStart;

    let screenshotUrl: string | null = null;
    if (rendered?.screenshotJpegBase64) {
      screenshotUrl = await storeScreenshot(reportId, rendered.screenshotJpegBase64);
    }

    await logExecution({
      level: rendered ? "INFO" : "WARN",
      category: "PLAYWRIGHT_RENDER",
      message: rendered
        ? `Rendered page with headless browser (${renderDuration}ms)`
        : `Headless rendering skipped or timed out; proceeding with static HTML`,
      reportId,
      websiteUrl: page.finalUrl,
      durationMs: renderDuration,
      meta: { rendered: rendered !== null, screenshotCaptured: !!screenshotUrl },
    });

    /* ---- Stage 3: extraction (rendered DOM when richer, else static) ---- */
    await setStage(reportId, "INSPECTING_METADATA", 32, page.finalUrl);

    const useRendered =
      rendered !== null && rendered.html.length > page.html.length * 1.2;
    const extracted = extractFromHtml(
      useRendered ? { ...page, html: rendered.html } : page,
    );

    await logExecution({
      level: "INFO",
      category: "AUDIT_PIPELINE",
      message: `Extracted page metadata (Title: "${extracted.page.title ?? "none"}", Links: ${extracted.links.internal.length} internal, Images: ${extracted.images.count})`,
      reportId,
      websiteUrl: page.finalUrl,
      meta: { title: extracted.page.title, h1Count: extracted.headings.h1.length },
    });

    /* ---- Stage 4: robots / sitemap / broken links ---- */
    await setStage(reportId, "CHECKING_SEO", 42, page.finalUrl);
    const origin = new URL(page.finalUrl).origin;
    extracted.robots = await checkRobotsTxt(origin);
    extracted.sitemap = await checkSitemap(origin, extracted.robots.content);
    extracted.brokenLinks = await checkBrokenLinks(
      extracted.links.internal,
      page.finalUrl,
    );

    /* ---- Persist raw data checkpoint ---- */
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

    await db.website.update({
      where: { id: report.websiteId },
      data: {
        faviconUrl: extracted.page.faviconUrl,
        firstAuditedAt: report.website.firstAuditedAt ?? new Date(),
        lastAuditedAt: new Date(),
      },
    });

    /* ---- Stage 5: PageSpeed Insights ---- */
    await setStage(reportId, "CHECKING_SPEED", 55, page.finalUrl);
    const psiStart = Date.now();
    const psi = await fetchPsiBoth(page.finalUrl, reportId);
    const psiDuration = Date.now() - psiStart;

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

    await logExecution({
      level: (psi.mobile || psi.desktop) ? "INFO" : "WARN",
      category: "PAGESPEED_API",
      message: (psi.mobile || psi.desktop)
        ? `PageSpeed Insights fetched successfully (Mobile score: ${psi.mobile?.performanceScore ?? "N/A"}, Desktop score: ${psi.desktop?.performanceScore ?? "N/A"})`
        : `PageSpeed Insights API returned no metrics or failed`,
      reportId,
      websiteUrl: page.finalUrl,
      durationMs: psiDuration,
      meta: { mobileScore: psi.mobile?.performanceScore, desktopScore: psi.desktop?.performanceScore },
    });

    /* ---- Stages 6-9: progress stages ---- */
    await setStage(reportId, "REVIEWING_ACCESSIBILITY", 68, page.finalUrl);
    await setStage(reportId, "ANALYZING_MOBILE", 76, page.finalUrl);
    await setStage(reportId, "CHECKING_CONVERSION", 82, page.finalUrl);
    await setStage(reportId, "PREPARING_RECOMMENDATIONS", 90, page.finalUrl);

    /* ---- Stage 10: evaluate all criteria, score, snapshot, finalize ---- */
    await setStage(reportId, "GENERATING_REPORT", 96, page.finalUrl);

    const evalStart = Date.now();
    const summary = await evaluateReport(reportId);
    await buildAndStoreSnapshot(reportId);
    const evalDuration = Date.now() - evalStart;

    await logExecution({
      level: "INFO",
      category: "CRITERIA_EVAL",
      message: `Criteria evaluation completed in ${evalDuration}ms (Pass: ${summary.passedCount}, Fail: ${summary.failedCount}, Warn: ${summary.warningCount})`,
      reportId,
      websiteUrl: page.finalUrl,
      durationMs: evalDuration,
      meta: { overallScore: summary.overallScore, grade: summary.grade },
    });

    const psiFailed = !psi.mobile && !psi.desktop;
    const totalDuration = Date.now() - startTime;

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

    await logExecution({
      level: "INFO",
      category: "AUDIT_PIPELINE",
      message: `Audit pipeline COMPLETED successfully in ${totalDuration}ms (Overall score: ${summary.overallScore}/100, Grade: ${summary.grade})`,
      reportId,
      websiteUrl: page.finalUrl,
      durationMs: totalDuration,
      meta: { overallScore: summary.overallScore, grade: summary.grade, status: psiFailed ? "PARTIAL" : "COMPLETED" },
    });
  } catch (err) {
    const totalDuration = Date.now() - startTime;
    await logExecution({
      level: "ERROR",
      category: "AUDIT_PIPELINE",
      message: `Audit pipeline CRASHED with uncaught error after ${totalDuration}ms`,
      reportId,
      websiteUrl: report.website.url,
      durationMs: totalDuration,
      error: err,
    });

    const message = err instanceof Error ? err.message : String(err);
    await fail(
      reportId,
      "Something went wrong while auditing this website. Please try again.",
      message.slice(0, 300),
      report.website.url,
    );
  }
}

