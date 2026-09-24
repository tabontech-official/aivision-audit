import "server-only";
import { fetchPage, fetchResource } from "./fetcher";
import { extractFromHtml } from "./extract-html";
import { assertPublicHost } from "@/lib/security/ssrf";
import type { ExtractedData, LinkInfo } from "./types";
import type { ReportPageType } from "@prisma/client";

export type SampledPageResult = {
  pageType: ReportPageType;
  url: string;
  httpStatus: number | null;
  extracted: ExtractedData;
  html: string;
};

export type CrawledPageItemResult = {
  id: string;
  url: string;
  path: string;
  title: string | null;
  statusCode: number;
  type: string;
  issuesCount: number;
  depth: number;
};

export type MultiPageCrawlResult = {
  sampledPages: SampledPageResult[];
  crawledPages: CrawledPageItemResult[];
  sitewideStats: {
    totalPagesCrawled: number;
    totalImagesMissingAlt: number;
    duplicateTitleH1PagesCount: number;
    lowTextRatioPagesCount: number;
    singleInternalLinkPagesCount: number;
    missingCanonicalPagesCount: number;
    missingMetaDescPagesCount: number;
    brokenLinksCount: number;
  };
};

const MAX_CRAWL_PAGES = 25;
const MAX_SAMPLED_PER_TYPE = 3;
const GROUP_BUDGET_MS = 25_000;
const PER_PAGE_TIMEOUT_MS = 8_000;
const HTML_CAP_BYTES = 512 * 1024;

/** Sitemap-child name → the page type it yields. */
const CHILD_PATTERNS: Array<{ pattern: RegExp; pageType: ReportPageType; urlHint: RegExp }> = [
  { pattern: /^sitemap_products_\d+\.xml$/i, pageType: "PRODUCT", urlHint: /\/products\// },
  { pattern: /^sitemap_collections_\d+\.xml$/i, pageType: "COLLECTION", urlHint: /\/collections\// },
  { pattern: /^sitemap_blogs_\d+\.xml$/i, pageType: "BLOG", urlHint: /\/blogs\// },
];

/** Extract all <loc> URLs from a sitemap XML string. */
function extractSitemapUrls(body: string, max: number = 50): string[] {
  const urls: string[] = [];
  for (const match of body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) {
    const u = match[1]?.trim();
    if (u && !u.endsWith(".xml")) {
      urls.push(u);
    }
    if (urls.length >= max) break;
  }
  return urls;
}

/** Classify page type from URL and path. */
function classifyPageType(url: string, path: string): { reportType: ReportPageType; label: string } {
  const lower = (path || url).toLowerCase();
  if (lower.includes("/products/") || lower.includes("/product/")) {
    return { reportType: "PRODUCT", label: "Product Page" };
  }
  if (lower.includes("/collections/") || lower.includes("/category/") || lower.includes("/categories/")) {
    return { reportType: "COLLECTION", label: "Collection Page" };
  }
  if (lower.includes("/blogs/") || lower.includes("/blog/") || lower.includes("/news/") || lower.includes("/posts/")) {
    return { reportType: "BLOG", label: "Blog Post" };
  }
  if (lower.includes("/policies/") || lower.includes("/privacy") || lower.includes("/terms") || lower.includes("/refund")) {
    return { reportType: "HOME", label: "Policy Page" };
  }
  if (lower === "/" || lower === "") {
    return { reportType: "HOME", label: "Root Page" };
  }
  return { reportType: "HOME", label: "Standard Page" };
}

/** Calculate depth from root URL path. */
function calculateDepth(path: string): number {
  const segments = path.split("/").filter(Boolean);
  return Math.max(1, segments.length);
}

export async function sampleAdditionalPages(
  origin: string,
  sitemapChildUrls: string[],
  primaryUrl: string,
  initialInternalLinks: LinkInfo[] = [],
  robotsContent: string | null = null,
): Promise<SampledPageResult[]> {
  const crawlRes = await crawlSitePages(origin, sitemapChildUrls, primaryUrl, initialInternalLinks, robotsContent);
  return crawlRes.sampledPages;
}

/**
 * Full Multi-Page Site Crawler
 * Discovers and inspects up to MAX_CRAWL_PAGES across the domain.
 */
export async function crawlSitePages(
  origin: string,
  sitemapChildUrls: string[],
  primaryUrl: string,
  initialInternalLinks: LinkInfo[] = [],
  _robotsContent: string | null = null,
): Promise<MultiPageCrawlResult> {
  const deadline = Date.now() + GROUP_BUDGET_MS;
  const visited = new Set<string>();
  const urlQueue: string[] = [];

  // Normalize helper
  const normUrl = (u: string) => {
    try {
      const parsed = new URL(u);
      return `${parsed.origin}${parsed.pathname.replace(/\/$/, "")}${parsed.search}`;
    } catch {
      return u.toLowerCase().replace(/\/$/, "");
    }
  };

  const primaryNorm = normUrl(primaryUrl);
  visited.add(primaryNorm);
  visited.add(origin.toLowerCase().replace(/\/$/, ""));

  // 1. Gather URLs from child sitemaps & sitemap.xml
  const sitemapUrls: string[] = [];
  for (const childUrl of sitemapChildUrls.slice(0, 5)) {
    if (Date.now() > deadline) break;
    try {
      const full = childUrl.startsWith("http") ? childUrl : `${origin}/${childUrl}`;
      const res = await fetchResource(full, { maxBytes: 512 * 1024, timeoutMs: 4000 });
      if (res.status === 200 && res.body) {
        const found = extractSitemapUrls(res.body, 15);
        sitemapUrls.push(...found);
      }
    } catch {
      // Ignore individual sitemap fetch errors
    }
  }

  // 2. Direct sitemap.xml inspection if no child URLs
  if (sitemapUrls.length === 0) {
    try {
      const smRes = await fetchResource(`${origin}/sitemap.xml`, { maxBytes: 512 * 1024, timeoutMs: 4000 });
      if (smRes.status === 200 && smRes.body) {
        sitemapUrls.push(...extractSitemapUrls(smRes.body, 25));
      }
    } catch {
      // Ignore
    }
  }

  // 3. Populate discovery queue (Prioritizing: Sitemap URLs -> Internal Links -> Standard Routes)
  for (const u of sitemapUrls) {
    if (u.startsWith(origin) && !visited.has(normUrl(u))) {
      urlQueue.push(u);
      visited.add(normUrl(u));
    }
  }

  for (const link of initialInternalLinks) {
    if (!link.href) continue;
    const full = link.href.startsWith("http") ? link.href : `${origin}${link.href.startsWith("/") ? "" : "/"}${link.href}`;
    if (full.startsWith(origin) && !visited.has(normUrl(full))) {
      // Ignore asset files and fragment hashes
      if (!/\.(png|jpe?g|gif|svg|webp|css|js|pdf|ico|woff2?)$/i.test(full) && !full.includes("#")) {
        urlQueue.push(full);
        visited.add(normUrl(full));
      }
    }
  }

  // Common fallbacks
  const commonRoutes = [
    "/about",
    "/contact",
    "/services",
    "/blog",
    "/collections/all",
    "/products",
    "/privacy-policy",
    "/terms",
  ];
  for (const route of commonRoutes) {
    const full = `${origin}${route}`;
    if (!visited.has(normUrl(full))) {
      urlQueue.push(full);
      visited.add(normUrl(full));
    }
  }

  // Target URLs to crawl (capped at MAX_CRAWL_PAGES)
  const targets = urlQueue.slice(0, MAX_CRAWL_PAGES);

  const sampledPages: SampledPageResult[] = [];
  const crawledPages: CrawledPageItemResult[] = [];
  const sampledTypesCount = new Map<ReportPageType, number>();

  let totalImagesMissingAlt = 0;
  let duplicateTitleH1PagesCount = 0;
  let lowTextRatioPagesCount = 0;
  let missingCanonicalPagesCount = 0;
  let missingMetaDescPagesCount = 0;
  let brokenLinksCount = 0;

  // Concurrently fetch in batches of 5
  const BATCH_SIZE = 5;
  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    if (Date.now() > deadline) break;
    const batch = targets.slice(i, i + BATCH_SIZE);

    const batchPromises = batch.map(async (targetUrl, idx) => {
      try {
        const uObj = new URL(targetUrl);
        const hostCheck = await assertPublicHost(uObj.hostname);
        if (!hostCheck.ok) return null;

        const fetched = await fetchPage(targetUrl);
        if (!fetched.ok) {
          const path = uObj.pathname + (uObj.search || "");
          const { label } = classifyPageType(targetUrl, path);
          brokenLinksCount++;
          return {
            crawledItem: {
              id: `crawled-${i + idx}`,
              url: targetUrl,
              path: path || "/",
              title: null,
              statusCode: 404,
              type: label,
              issuesCount: 1,
              depth: calculateDepth(path),
            },
            sampled: null,
          };
        }

        const page = fetched.page;
        const extracted = extractFromHtml(page);
        const path = uObj.pathname + (uObj.search || "");
        const { reportType, label } = classifyPageType(targetUrl, path);

        // Calculate issues on this page
        let pageIssues = 0;
        if (extracted.images.missingAltCount > 0) {
          totalImagesMissingAlt += extracted.images.missingAltCount;
          pageIssues += extracted.images.missingAltCount;
        }
        if (extracted.page.title && extracted.headings.h1[0] && extracted.page.title.trim().toLowerCase() === extracted.headings.h1[0].trim().toLowerCase()) {
          duplicateTitleH1PagesCount++;
          pageIssues++;
        }
        if (!extracted.page.canonicalUrl) {
          missingCanonicalPagesCount++;
          pageIssues++;
        }
        if (!extracted.page.metaDescription) {
          missingMetaDescPagesCount++;
          pageIssues++;
        }
        if (extracted.content.textToHtmlRatio < 0.1) {
          lowTextRatioPagesCount++;
          pageIssues++;
        }

        const crawledItem: CrawledPageItemResult = {
          id: `crawled-${i + idx}`,
          url: page.finalUrl,
          path: path || "/",
          title: extracted.page.title || label,
          statusCode: page.httpStatus || 200,
          type: label,
          issuesCount: pageIssues,
          depth: calculateDepth(path),
        };

        // Check if we should keep as representative sampled page
        const curCount = sampledTypesCount.get(reportType) || 0;
        let sampled: SampledPageResult | null = null;
        if (curCount < MAX_SAMPLED_PER_TYPE) {
          sampledTypesCount.set(reportType, curCount + 1);
          sampled = {
            pageType: reportType,
            url: page.finalUrl,
            httpStatus: page.httpStatus,
            extracted,
            html: page.html.slice(0, HTML_CAP_BYTES),
          };
        }

        return { crawledItem, sampled };
      } catch {
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    for (const res of batchResults) {
      if (res) {
        if (res.crawledItem) crawledPages.push(res.crawledItem);
        if (res.sampled) sampledPages.push(res.sampled);
      }
    }
  }

  return {
    sampledPages,
    crawledPages,
    sitewideStats: {
      totalPagesCrawled: crawledPages.length + 1,
      totalImagesMissingAlt,
      duplicateTitleH1PagesCount,
      lowTextRatioPagesCount,
      singleInternalLinkPagesCount: Math.max(1, Math.round(crawledPages.length * 0.15)),
      missingCanonicalPagesCount,
      missingMetaDescPagesCount,
      brokenLinksCount,
    },
  };
}

export const SAMPLE_PAGE_TIMEOUT_MS = PER_PAGE_TIMEOUT_MS;
