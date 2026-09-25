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
  checkLlmsTxt,
  checkShopifyPolicies,
} from "@/services/inspection/aux-checks";
import { detectPlatform } from "@/services/inspection/detect-platform";
import { sampleAdditionalPages, crawlSitePages, type CrawledPageItemResult } from "@/services/inspection/sample-pages";
import { discoverWebsiteScope } from "@/services/inspection/url-discovery";
import {
  renderPage,
  checkBrowserAvailability,
  type RenderedPage,
} from "@/services/inspection/renderer";
import {
  decideRender,
  computeStaticSignals,
  looksSuspiciouslyEmpty,
  browserMode,
  type RenderMetrics,
} from "@/services/inspection/render-decision";
import { storeScreenshot } from "@/services/inspection/screenshot-store";
import { fetchPsiBoth, type PsiMetrics } from "@/services/pagespeed/client";
import { recordAuditPageUsage } from "@/services/billing/entitlements";
import { evaluateReport } from "@/services/reports/evaluate-report";
import { buildAndStoreSnapshot } from "@/services/reports/snapshot";
import { logExecution } from "@/services/system-log/log";
import { notifyLeadForReport } from "@/services/leads/notify";
import { recordFunnelEvent } from "@/services/leads/funnel";
import { reconcileFindings } from "@/services/findings/reconcile";
import { sendDeltaEmailForReport } from "@/services/findings/delta-email";
import type { AuditStage, FailureCategory, Prisma } from "@prisma/client";

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
  // Who is at fault decides whether the user's monthly credit is refunded —
  // SYSTEM failures are excluded from the allowance count.
  category: FailureCategory = "TARGET_SITE",
): Promise<void> {
  const fullDetail = `${userMessage}${detail ? ` (${detail})` : ""}`;
  console.error(`[audit:${reportId}] FAILED: ${fullDetail}`);

  await db.report.update({
    where: { id: reportId },
    data: {
      status: "FAILED",
      errorMessage: userMessage,
      failureCategory: category,
      completedAt: new Date(),
    },
  });

  await logExecution({
    level: "ERROR",
    category: "AUDIT_PIPELINE",
    message: `Audit FAILED: ${userMessage}`,
    reportId,
    websiteUrl,
    meta: { detail, userMessage },
  });

  // Anonymous lead asked for this result by email — failure email included,
  // with an apology and a retry link. Best-effort, never throws.
  await notifyLeadForReport(reportId);
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
      return fail(reportId, "This website address is not valid.", validated.error, report.website.url, "USER_INPUT");
    }
    const ssrf = await assertPublicHost(validated.value.hostname);
    if (!ssrf.ok) {
      return fail(reportId, "This address cannot be audited.", ssrf.error, report.website.url, "USER_INPUT");
    }

    await setStage(reportId, "FETCHING_HTML", 12, validated.value.url);
    const fetchStart = Date.now();
    const fetched = await fetchPage(validated.value.url);
    const fetchDuration = Date.now() - fetchStart;

    if (!fetched.ok) {
      return fail(reportId, fetched.userMessage, fetched.error, validated.value.url, "TARGET_SITE");
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

    /* ---- Stage 2: render DECISION, then conditional render + screenshot ----
     *
     * The browser is the most expensive thing in this pipeline (200–400 MB
     * per instance), so the decision to launch one is made BEFORE the cost is
     * paid, from static HTML alone. The stage stays visible either way: a
     * skipped render is marked complete with a logged reason, never removed —
     * silent skips are indistinguishable from bugs.
     */
    await setStage(reportId, "RENDERING", 22, page.finalUrl);

    const decision = decideRender(page.html);
    let rendered: RenderedPage | null = null;
    let renderAttempted = false;
    let renderDuration: number | null = null;
    let safetyValveFired = false;

    const attemptRender = async (): Promise<RenderedPage | null> => {
      renderAttempted = true;
      const renderStart = Date.now();
      const result = await renderPage(page.finalUrl);
      renderDuration = Date.now() - renderStart;
      return result;
    };

    if (decision.shouldRender) {
      rendered = await attemptRender();
      if (!rendered) {
        // Loud when the browser itself is missing: this site NEEDED a render
        // (JS-heavy storefront), and a silently-skipped one produces a
        // plausible-looking report built on an empty DOM.
        const probe = await checkBrowserAvailability();
        if (!probe.available) {
          await logExecution({
            level: "ERROR",
            category: "RENDER",
            message: `NO BROWSER AVAILABLE (${probe.detail}) — this page warranted a render (score ${decision.score}) and its report is built on static HTML only`,
            reportId,
            websiteUrl: page.finalUrl,
            meta: { browserMode: probe.mode, browserAvailable: false },
          });
        }
      }
      await logExecution({
        level: rendered ? "INFO" : "WARN",
        category: "RENDER",
        message: rendered
          ? `Rendered page with headless browser (${renderDuration}ms) — decision score ${decision.score} >= ${decision.threshold}`
          : `Render was warranted (score ${decision.score}) but the browser was unavailable or timed out; proceeding with static HTML`,
        reportId,
        websiteUrl: page.finalUrl,
        durationMs: renderDuration ?? undefined,
        meta: { decision: { score: decision.score, threshold: decision.threshold, reasons: decision.reasons } },
      });
    } else {
      await logExecution({
        level: "INFO",
        category: "RENDER",
        message: `Render SKIPPED — static HTML judged sufficient (score ${decision.score} < ${decision.threshold}): ${decision.reasons.join("; ") || "no client-shell signals"}`,
        reportId,
        websiteUrl: page.finalUrl,
        meta: {
          skipped: true,
          decision: { score: decision.score, threshold: decision.threshold, reasons: decision.reasons },
        },
      });
    }

    // Screenshot: captured only when a render ran anyway. Verified from
    // source that screenshotUrl is currently displayed nowhere in the report
    // UI — it is decorative, so it never justifies launching a browser.
    let screenshotUrl: string | null = null;
    if (rendered?.screenshotJpegBase64) {
      screenshotUrl = await storeScreenshot(reportId, rendered.screenshotJpegBase64);
    }

    /* ---- Stage 3: extraction (rendered DOM when richer, else static) ---- */
    await setStage(reportId, "INSPECTING_METADATA", 32, page.finalUrl);

    const pickSource = (r: RenderedPage | null) => {
      const useRendered = r !== null && r.html.length > page.html.length * 1.2;
      return { useRendered, html: useRendered && r ? r.html : page.html };
    };

    let source = pickSource(rendered);
    let extracted = extractFromHtml(
      source.useRendered ? { ...page, html: source.html } : page,
    );

    // Safety valve: if the static-only snapshot is suspiciously hollow, the
    // skip decision was probably wrong — render after all. A false negative
    // here would mean a blank report, which is far worse than a wasted render.
    if (
      !renderAttempted &&
      looksSuspiciouslyEmpty({
        title: extracted.page.title,
        h1Count: extracted.headings.h1.length,
        wordCount: extracted.content.wordCount,
      })
    ) {
      safetyValveFired = true;
      await logExecution({
        level: "WARN",
        category: "RENDER",
        message: `Safety valve: static extraction came back nearly empty (title: ${extracted.page.title ? "yes" : "no"}, h1s: ${extracted.headings.h1.length}, words: ${extracted.content.wordCount}) — rendering despite score ${decision.score}`,
        reportId,
        websiteUrl: page.finalUrl,
        meta: { safetyValve: true, decisionScore: decision.score },
      });
      rendered = await attemptRender();
      if (rendered?.screenshotJpegBase64 && !screenshotUrl) {
        screenshotUrl = await storeScreenshot(reportId, rendered.screenshotJpegBase64);
      }
      source = pickSource(rendered);
      if (source.useRendered) {
        extracted = extractFromHtml({ ...page, html: source.html });
      }
    }

    const renderMetrics: RenderMetrics = {
      decision: {
        score: decision.score,
        threshold: decision.threshold,
        shouldRender: decision.shouldRender,
        reasons: decision.reasons,
      },
      renderAttempted,
      renderSucceeded: rendered !== null,
      renderDurationMs: renderDuration,
      renderBenefited: source.useRendered,
      safetyValveFired,
      screenshotCaptured: screenshotUrl !== null,
      staticWordCount: decision.signals.wordCount,
      renderedWordCount: rendered ? computeStaticSignals(rendered.html).wordCount : null,
      staticScriptCount: decision.signals.scriptCount,
      staticHtmlSizeBytes: decision.signals.htmlSizeBytes,
      staticTextToHtmlRatio: Math.round(decision.signals.textToHtmlRatio * 1000) / 1000,
      detectedFrameworkMarkers: decision.signals.frameworkMarkers,
      browserMode: browserMode(),
    };

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
    extracted.llms = await checkLlmsTxt(origin).catch(() => ({
      exists: false, content: null, sizeBytes: 0,
    }));
    extracted.sitemap = await checkSitemap(origin, extracted.robots.content);
    extracted.brokenLinks = await checkBrokenLinks(
      extracted.links.internal,
      page.finalUrl,
    );

    // Platform detection — headers + static/rendered HTML + robots + sitemap
    // children, no extra requests. Non-fatal by contract: UNKNOWN on failure.
    const site = detectPlatform({
      html: source.html,
      responseHeaders: page.responseHeaders,
      robotsContent: extracted.robots.content,
      sitemapChildren: extracted.sitemap.childSitemaps ?? [],
    });
    extracted.site = site;

    // Shopify-only extras (E.1): the five fixed policy pages. Sequential,
    // 5 s each, 20 s group budget, best-effort — skipped on other platforms.
    extracted.shopify = extracted.shopify ?? {
      urls: {
        hasCollectionScopedProductLinks: false,
        variantParamLinkCount: 0,
        filterParamLinkCount: 0,
        paginationLinkCount: 0,
      },
    };
    extracted.shopify.sitemapChildren = extracted.sitemap.childSitemaps ?? [];
    if (site.isShopify) {
      try {
        extracted.shopify.policies = await checkShopifyPolicies(origin);
      } catch (err) {
        await logExecution({
          level: "WARN",
          category: "AUDIT_PIPELINE",
          message: `Shopify policy-page probe failed; policy checks will be Not Applicable`,
          reportId,
          websiteUrl: page.finalUrl,
          error: err,
        });
      }
    }

    await logExecution({
      level: "INFO",
      category: "AUDIT_PIPELINE",
      message: `Platform detected: ${site.platform} (confidence ${site.platformConfidence})${site.themeName ? `, theme "${site.themeName}"` : ""}${site.isShopify ? `, ${site.appCount} app script host(s), ${site.blockingAppScripts} blocking` : ""}`,
      reportId,
      websiteUrl: page.finalUrl,
      meta: {
        platform: site.platform,
        confidence: site.platformConfidence,
        theme: site.themeName,
        appCount: site.appCount,
        appNames: site.appNames,
      },
    });

    /* ---- Persist raw data checkpoint ---- */
    const htmlForStorage = source.html.slice(0, 2 * 1024 * 1024);
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
      renderedWithBrowser: renderMetrics.renderSucceeded,
      renderMetrics: renderMetrics as unknown as Prisma.InputJsonValue,
    };
    await db.websiteRawData.upsert({
      where: { reportId },
      update: rawDataPayload,
      create: { reportId, ...rawDataPayload },
    });

    /* ---- URL Discovery: Discover full website scope and page groups ---- */
    const sampleStart = Date.now();
    const discovery = await discoverWebsiteScope(
      origin,
      page.finalUrl,
      extracted.links?.internal ?? [],
      extracted.robots?.content ?? null,
    );

    // Resolve user's plan coverage limits and initial sample size
    let userPlanKey = "FREE";
    let pageLimit = 10;
    let initialSample = 10;

    if (report.userId) {
      const userWithSub = await db.user.findUnique({
        where: { id: report.userId },
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
        initialSample = activeSubPlan.initialSampleSize ?? 30;
      } else if (userWithSub?.plan === "PREMIUM") {
        const premPlan = await db.plan.findUnique({ where: { key: "PREMIUM" } });
        userPlanKey = "STARTER";
        pageLimit = premPlan?.pageAuditLimit ?? 100;
        initialSample = premPlan?.initialSampleSize ?? 30;
      } else {
        const freePlan = await db.plan.findUnique({ where: { key: "FREE" } });
        userPlanKey = "FREE";
        pageLimit = freePlan?.pageAuditLimit ?? 10;
        initialSample = freePlan?.initialSampleSize ?? 10;
      }
    }

    const totalDetected = Math.max(discovery.totalDetectedUrls, 1);
    const initialCoverage = Math.min(totalDetected, pageLimit, initialSample);
    const coverageRemaining = Math.max(0, Math.min(pageLimit - initialCoverage, totalDetected - initialCoverage));

    /* ---- Representative multi-page crawl based on initialCoverage ---- */
    const preferredUrls = discovery.representativeUrls.map((r) => r.url);
    const crawlResult = await crawlSitePages(
      origin,
      extracted.sitemap.childSitemapUrls ?? [],
      page.finalUrl,
      extracted.links?.internal ?? [],
      extracted.robots?.content ?? null,
      initialCoverage,
      preferredUrls,
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

    // Attach full crawled pages list to extracted (1 credit = 1 page record)
    const rootCrawledItem: CrawledPageItemResult = {
      id: "crawled-root",
      url: page.finalUrl,
      path: "/",
      title: extracted.page.title || report.website.domain,
      statusCode: page.httpStatus || 200,
      type: "Root Page",
      issuesCount: 0,
      depth: 0,
    };

    const finalCrawledList: CrawledPageItemResult[] = [rootCrawledItem];
    const seenUrls = new Set<string>([page.finalUrl.toLowerCase().replace(/\/$/, "")]);

    for (const item of crawlResult.crawledPages) {
      const norm = item.url.toLowerCase().replace(/\/$/, "");
      if (!seenUrls.has(norm) && finalCrawledList.length < initialCoverage) {
        seenUrls.add(norm);
        finalCrawledList.push(item);
      }
    }

    // Backfill from discovered URLs if crawler had fewer than initialCoverage
    if (finalCrawledList.length < initialCoverage && discovery.discoveredUrls.length > 0) {
      for (const u of discovery.discoveredUrls) {
        const norm = u.toLowerCase().replace(/\/$/, "");
        if (!seenUrls.has(norm)) {
          seenUrls.add(norm);
          try {
            const uObj = new URL(u);
            const path = uObj.pathname + (uObj.search || "");
            const isProduct = path.includes("/products/") || path.includes("/product/");
            const isColl = path.includes("/collections/") || path.includes("/category/");
            const isBlog = path.includes("/blogs/") || path.includes("/blog/");
            const label = isProduct ? "Product Page" : isColl ? "Collection Page" : isBlog ? "Blog Post" : "Standard Page";
            finalCrawledList.push({
              id: `crawled-${finalCrawledList.length}`,
              url: u,
              path: path || "/",
              title: label,
              statusCode: 200,
              type: label,
              issuesCount: 0,
              depth: Math.max(1, path.split("/").filter(Boolean).length),
            });
          } catch {
            // Ignore malformed URLs
          }
        }
        if (finalCrawledList.length >= initialCoverage) break;
      }
    }

    extracted.crawledPages = finalCrawledList;
    const finalInitialCoverage = finalCrawledList.length;

    if (crawlResult.sampledPages.length > 0) {
      await db.sampledPage.deleteMany({ where: { reportId } });
      for (const sample of crawlResult.sampledPages) {
        await db.sampledPage.upsert({
          where: { reportId_pageType: { reportId, pageType: sample.pageType } },
          update: {
            url: sample.url,
            httpStatus: sample.httpStatus,
            extracted: sample.extracted as unknown as Prisma.InputJsonValue,
            html: sample.html,
          },
          create: {
            reportId,
            pageType: sample.pageType,
            url: sample.url,
            httpStatus: sample.httpStatus,
            extracted: sample.extracted as unknown as Prisma.InputJsonValue,
            html: sample.html,
          },
        });
      }
    }

    // Update rawData with enriched multi-page crawl data
    await db.websiteRawData.update({
      where: { reportId },
      data: {
        extracted: extracted as unknown as Prisma.InputJsonValue,
      },
    });

    await logExecution({
      level: "INFO",
      category: "AUDIT_PIPELINE",
      message: `Discovered ${totalDetected} URLs across website (${initialCoverage} initial pages analyzed under ${userPlanKey} plan allowance)`,
      reportId,
      websiteUrl: page.finalUrl,
      durationMs: Date.now() - sampleStart,
      meta: {
        totalDetectedUrls: totalDetected,
        initialCoverage,
        pageLimit,
        coverageRemaining,
        sampledTypes: crawlResult.sampledPages.map((s) => s.pageType),
      },
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

    // Fix Loop reconciliation (G.4): after evaluation, before the snapshot.
    // Isolated by contract — a findings failure must NEVER cost the user
    // their report. On failure findingsReconciledAt stays null and the
    // Pipeline Console can re-run it.
    try {
      await reconcileFindings(reportId, summary.overallScore);
    } catch (err) {
      await logExecution({
        level: "ERROR",
        category: "FINDINGS",
        message: `Findings reconciliation failed — the report continues without it; re-run from the Pipeline Console`,
        reportId,
        websiteUrl: page.finalUrl,
        error: err,
      });
    }

    await buildAndStoreSnapshot(reportId, summary.scoreBasis);
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
        totalDetectedUrls: totalDetected,
        coverageLimit: pageLimit,
        coverageUsed: finalInitialCoverage,
        coverageRemaining: Math.max(0, Math.min(pageLimit - finalInitialCoverage, totalDetected - finalInitialCoverage)),
        initialSampleSize: initialSample,
        coverageCompleted: finalInitialCoverage >= pageLimit || finalInitialCoverage >= totalDetected,
        currentPlanKey: userPlanKey,
        lastProcessedPosition: finalInitialCoverage,
        urlGroups: discovery.urlGroups as unknown as Prisma.InputJsonValue,
        discoveredUrlsList: discovery.discoveredUrls.slice(0, 10000) as unknown as Prisma.InputJsonValue,
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

    // Record audit page consumption in usage ledger
    if (report.userId) {
      await recordAuditPageUsage({
        userId: report.userId,
        websiteId: report.websiteId,
        reportId: report.id,
        pagesCount: finalInitialCoverage,
        description: `Initial audit crawl of ${finalInitialCoverage} pages for ${page.finalUrl}`,
      }).catch((err) => console.error("Failed to record audit page usage ledger:", err));
    }

    // In-app user notification when audit completes
    if (report.userId) {
      const targetHost = page.finalUrl ? new URL(page.finalUrl).hostname : new URL(report.website.url).hostname;
      await db.notification.create({
        data: {
          userId: report.userId,
          type: "REPORT_READY",
          title: `Audit Completed: ${targetHost}`,
          body: `Overall score: ${summary.overallScore}/100 (${summary.grade}). ${summary.passedCount} checks passed, ${summary.failedCount} issues detected.`,
          linkUrl: `/dashboard?project=${encodeURIComponent(targetHost)}`,
        },
      }).catch(() => undefined);
    }

    // Lead follow-through: platform data onto the Lead + the result email the
    // visitor asked for. Best-effort — never fails the audit.
    await recordFunnelEvent("audit_completed", reportId);
    await notifyLeadForReport(reportId);

    // Owned re-audits with a chain get the DELTA email + in-app notification
    // (first audits get the plain result email above). Best-effort.
    await sendDeltaEmailForReport(reportId).catch(() => undefined);
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
      "SYSTEM",
    );
  }
}

