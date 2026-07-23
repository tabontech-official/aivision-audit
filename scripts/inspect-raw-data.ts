/**
 * Debug helper: print a summary of the stored raw data for a report.
 * Run: npx tsx scripts/inspect-raw-data.ts <reportPublicId>
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const publicId = process.argv[2];
  if (!publicId) {
    console.error("Usage: npx tsx scripts/inspect-raw-data.ts <reportPublicId>");
    process.exit(1);
  }

  const report = await db.report.findUnique({
    where: { publicId },
    include: { rawData: true, pageSpeedResults: true, website: true },
  });
  if (!report) {
    console.error("Report not found");
    process.exit(1);
  }

  console.log("=== REPORT ===");
  console.log({
    status: report.status,
    url: report.website.url,
    overallScore: report.overallScore,
    mobileScore: report.mobileScore,
    desktopScore: report.desktopScore,
    screenshot: report.screenshotUrl ? `${report.screenshotUrl.slice(0, 60)}… (${report.screenshotUrl.length} chars)` : null,
    error: report.errorMessage,
  });

  const raw = report.rawData;
  if (!raw) {
    console.log("No raw data stored");
    return;
  }

  console.log("\n=== NETWORK ===");
  console.log({
    httpStatus: raw.httpStatus,
    finalUrl: raw.finalUrl,
    redirects: raw.redirectChain,
    htmlSizeBytes: raw.htmlSizeBytes,
    fetchMs: raw.fetchDurationMs,
    rendered: raw.renderedWithBrowser,
  });

  const ex = raw.extracted as Record<string, Record<string, unknown>>;
  console.log("\n=== PAGE ===");
  console.log(ex.page);
  console.log("\n=== HEADINGS ===");
  console.log({
    h1: ex.headings?.h1,
    counts: `h1=${ex.headings?.h1Count} h2=${ex.headings?.h2Count} h3=${ex.headings?.h3Count}`,
    hierarchyValid: ex.headings?.hierarchyValid,
  });
  console.log("\n=== IMAGES / LINKS ===");
  console.log({
    images: ex.images?.count,
    missingAlt: ex.images?.missingAltCount,
    internalLinks: ex.links?.internalCount,
    externalLinks: ex.links?.externalCount,
  });
  console.log("\n=== CONTENT / CONVERSION / CONTACT ===");
  console.log({
    wordCount: ex.content?.wordCount,
    textToHtmlRatio: ex.content?.textToHtmlRatio,
    forms: ex.conversion?.formCount,
    buttons: ex.conversion?.buttonCount,
    ctas: ex.conversion?.ctaCount,
    hasEmail: ex.contact?.hasEmail,
    hasPhone: ex.contact?.hasPhone,
  });
  console.log("\n=== SOCIAL / STRUCTURED / TRUST ===");
  console.log({
    ogTags: Object.keys((ex.social?.openGraph as object) ?? {}).length,
    twitterTags: Object.keys((ex.social?.twitterCard as object) ?? {}).length,
    jsonLd: ex.structuredData?.jsonLdBlocks,
    schemaTypes: ex.structuredData?.schemaTypes,
    privacy: ex.trust?.hasPrivacyPolicyLink,
    terms: ex.trust?.hasTermsLink,
  });
  console.log("\n=== SECURITY HEADERS ===");
  console.log((ex.network as Record<string, unknown>)?.securityHeaders);
  console.log("\n=== ROBOTS / SITEMAP / BROKEN LINKS ===");
  console.log({
    robotsExists: ex.robots?.exists,
    robotsSitemapRef: ex.robots?.referencesSitemap,
    sitemapExists: ex.sitemap?.exists,
    sitemapUrls: ex.sitemap?.urlCount,
    brokenChecked: ex.brokenLinks?.checkedCount,
    brokenFound: ex.brokenLinks?.brokenCount,
  });

  console.log("\n=== PSI ROWS ===");
  for (const psi of report.pageSpeedResults) {
    console.log({
      strategy: psi.strategy,
      perf: psi.performanceScore,
      seo: psi.seoScore,
      a11y: psi.accessibilityScore,
      lcp: psi.lcpMs,
      cls: psi.cls,
    });
  }
  if (report.pageSpeedResults.length === 0) console.log("(none)");
}

main().finally(() => db.$disconnect());
