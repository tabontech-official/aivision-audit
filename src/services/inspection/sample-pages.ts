import "server-only";
import { fetchPage, fetchResource } from "./fetcher";
import { extractFromHtml } from "./extract-html";
import { assertPublicHost } from "@/lib/security/ssrf";
import type { ExtractedData } from "./types";
import type { ReportPageType } from "@prisma/client";

/**
 * Multi-page sampling (roadmap §8, unblocked after Phase 2).
 *
 * The audit inspects the URL the visitor pasted — almost always a homepage.
 * That means the product-readiness pillar, the most valuable Shopify-specific
 * analysis, could never fire in normal use. This samples ONE representative
 * page of each additional type so those checks have something to inspect.
 *
 * Discovery is cheap on Shopify precisely because the sitemap layout is
 * deterministic: /sitemap.xml indexes sitemap_products_*.xml,
 * sitemap_collections_*.xml and sitemap_blogs_*.xml. No crawling, no guessing.
 *
 * Hard budget: at most one page per type, MAX_PAGES total, each with a short
 * timeout and the whole group capped. Every failure is silent and partial —
 * a page we could not sample simply is not sampled, and its checks resolve
 * NOT_APPLICABLE rather than failing.
 *
 * Every fetch goes through the guarded fetcher and re-checks SSRF, because a
 * sitemap is attacker-influenced input on a site we do not control.
 */

export type SampledPageResult = {
  pageType: ReportPageType;
  url: string;
  httpStatus: number | null;
  extracted: ExtractedData;
  html: string;
};

const MAX_PAGES = 3;
const GROUP_BUDGET_MS = 25_000;
const PER_PAGE_TIMEOUT_MS = 12_000;
const HTML_CAP_BYTES = 512 * 1024;

/** Sitemap-child name → the page type it yields. */
const CHILD_PATTERNS: Array<{ pattern: RegExp; pageType: ReportPageType; urlHint: RegExp }> = [
  { pattern: /^sitemap_products_\d+\.xml$/i, pageType: "PRODUCT", urlHint: /\/products\// },
  { pattern: /^sitemap_collections_\d+\.xml$/i, pageType: "COLLECTION", urlHint: /\/collections\// },
  { pattern: /^sitemap_blogs_\d+\.xml$/i, pageType: "BLOG", urlHint: /\/blogs\// },
];

/**
 * Pick a representative URL from a child sitemap. Deliberately NOT the first
 * entry: the first product is often a gift card or a placeholder, which is a
 * poor sample of how the store treats real products.
 */
function pickRepresentative(body: string, urlHint: RegExp): string | null {
  const urls: string[] = [];
  for (const match of body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) {
    const url = match[1]!;
    if (urlHint.test(url)) urls.push(url);
    if (urls.length >= 12) break;
  }
  if (urls.length === 0) return null;
  return urls[Math.min(2, urls.length - 1)] ?? urls[0]!;
}

export async function sampleAdditionalPages(
  origin: string,
  /** FULL child-sitemap URLs, query string intact — a bare filename 400s on
   *  Shopify's product and collection sitemaps. */
  sitemapChildUrls: string[],
  primaryUrl: string,
): Promise<SampledPageResult[]> {
  const deadline = Date.now() + GROUP_BUDGET_MS;
  const results: SampledPageResult[] = [];

  const fileNameOf = (url: string): string => {
    const last = url.split("/").pop() ?? "";
    return last.split("?")[0] ?? last;
  };

  // Which types can we even try? Only those the sitemap advertises.
  const wanted = CHILD_PATTERNS.map((spec) => ({
    spec,
    child: sitemapChildUrls.find((url) => spec.pattern.test(fileNameOf(url))),
  })).filter((w): w is { spec: (typeof CHILD_PATTERNS)[number]; child: string } => !!w.child);

  for (const { spec, child } of wanted) {
    if (results.length >= MAX_PAGES || Date.now() > deadline) break;
    try {
      const childUrl = child.startsWith("http") ? child : `${origin}/${child}`;
      const index = await fetchResource(childUrl, {
        maxBytes: 512 * 1024,
        timeoutMs: 6000,
      });
      if (index.status !== 200 || !index.body) continue;

      const target = pickRepresentative(index.body, spec.urlHint);
      if (!target || target === primaryUrl) continue;

      // Sitemap contents are third-party input — re-validate the host.
      let hostname: string;
      try {
        hostname = new URL(target).hostname;
      } catch {
        continue;
      }
      const ssrf = await assertPublicHost(hostname);
      if (!ssrf.ok) continue;

      const fetched = await fetchPage(target);
      if (!fetched.ok) continue;

      results.push({
        pageType: spec.pageType,
        url: fetched.page.finalUrl,
        httpStatus: fetched.page.httpStatus,
        extracted: extractFromHtml(fetched.page),
        html: fetched.page.html.slice(0, HTML_CAP_BYTES),
      });
    } catch {
      /* one page failing must never affect the audit */
    }
  }

  return results;
}

/** Timeout applied per page fetch, exported for the pipeline log line. */
export const SAMPLE_PAGE_TIMEOUT_MS = PER_PAGE_TIMEOUT_MS;
