import "server-only";
import * as cheerio from "cheerio";
import { fetchResource } from "./fetcher";
import type { ExtractedData, LinkInfo } from "./types";

/**
 * Auxiliary inspections: robots.txt, sitemap.xml, and a capped broken-link
 * sweep. Everything goes through the guarded fetcher, so redirects and
 * private targets stay blocked.
 */

export async function checkRobotsTxt(origin: string): Promise<ExtractedData["robots"]> {
  const { status, body } = await fetchResource(`${origin}/robots.txt`, {
    maxBytes: 64 * 1024,
  });

  if (status !== 200 || body === null) {
    return { exists: false, content: null, referencesSitemap: false, disallowsAll: false };
  }

  // Some servers return HTML error pages with 200 — reject those
  if (/^\s*</.test(body)) {
    return { exists: false, content: null, referencesSitemap: false, disallowsAll: false };
  }

  const content = body.slice(0, 5 * 1024);
  const referencesSitemap = /^sitemap:/im.test(body);

  // "Disallow: /" under a wildcard agent (best-effort parse)
  let disallowsAll = false;
  let inWildcard = false;
  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim();
    const agentMatch = trimmed.match(/^user-agent:\s*(.+)$/i);
    if (agentMatch) {
      inWildcard = agentMatch[1]?.trim() === "*";
      continue;
    }
    if (inWildcard && /^disallow:\s*\/\s*$/i.test(trimmed)) {
      disallowsAll = true;
      break;
    }
  }

  return { exists: true, content, referencesSitemap, disallowsAll };
}

export async function checkSitemap(
  origin: string,
  robotsContent: string | null,
): Promise<ExtractedData["sitemap"]> {
  const candidates: string[] = [];

  // Prefer robots.txt-declared sitemaps (same-origin only)
  if (robotsContent) {
    for (const m of robotsContent.matchAll(/^sitemap:\s*(\S+)/gim)) {
      const declared = m[1];
      if (declared?.startsWith(origin)) candidates.push(declared);
      if (candidates.length >= 2) break;
    }
  }
  candidates.push(`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`);

  for (const url of [...new Set(candidates)]) {
    const { status, body } = await fetchResource(url, { maxBytes: 512 * 1024 });
    if (status === 200 && body && /<(urlset|sitemapindex)[\s>]/i.test(body)) {
      const urlCount = (body.match(/<loc>/gi) ?? []).length;
      // Child file names when this is a sitemap index — Shopify's fixed
      // sitemap_products_*/sitemap_collections_* pattern is a platform signal.
      const childSitemaps: string[] = [];
      const childSitemapUrls: string[] = [];
      if (/<sitemapindex[\s>]/i.test(body)) {
        for (const m of body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) {
          const fullUrl = m[1]!;
          const child = fullUrl.split("/").pop() ?? "";
          const clean = child.split("?")[0] ?? child;
          if (clean) {
            childSitemaps.push(clean);
            // Keep the query string: Shopify's product/collection sitemaps
            // return 400 without their ?from=&to= parameters.
            childSitemapUrls.push(fullUrl);
          }
          if (childSitemaps.length >= 20) break;
        }
      }
      return { exists: true, url, urlCount, childSitemaps, childSitemapUrls };
    }
  }

  return { exists: false, url: null, urlCount: null, childSitemaps: [], childSitemapUrls: [] };
}

/**
 * /llms.txt (E.2) — the AI-answer-engines discoverability file. Fetched
 * alongside robots.txt on every platform, same treatment and failure handling.
 */
export async function checkLlmsTxt(origin: string): Promise<NonNullable<ExtractedData["llms"]>> {
  const { status, body } = await fetchResource(`${origin}/llms.txt`, {
    maxBytes: 64 * 1024,
    timeoutMs: 5000,
  });
  // Some hosts serve an HTML 200 for any path — an angle bracket start means
  // this is a soft-404 page, not a text file.
  if (status === 200 && body && !body.trimStart().startsWith("<")) {
    return {
      exists: true,
      content: body.slice(0, 5 * 1024),
      sizeBytes: Buffer.byteLength(body, "utf8"),
    };
  }
  return { exists: false, content: null, sizeBytes: 0 };
}

/**
 * Shopify policy pages (E.1). Shopify uses FIXED paths for these — exactly why
 * a Shopify-specific tool can check them and a generic crawler cannot. Five
 * sequential probes, 5 s each, the whole group capped at 20 s; on timeout the
 * remaining pages stay unknown and the audit continues.
 *
 * `duplicateTitleH1Count` is the notable output: Shopify's default policy
 * pages ship with identical title and H1 on a large share of stores.
 */
const POLICY_PATHS = [
  ["refund", "/policies/refund-policy"],
  ["privacy", "/policies/privacy-policy"],
  ["terms", "/policies/terms-of-service"],
  ["shipping", "/policies/shipping-policy"],
  ["legalNotice", "/policies/legal-notice"],
] as const;

const POLICY_GROUP_BUDGET_MS = 20_000;
const THIN_POLICY_WORDS = 100;

type PolicyKey = (typeof POLICY_PATHS)[number][0];
type PolicyBlock = NonNullable<NonNullable<ExtractedData["shopify"]>["policies"]>;

export async function checkShopifyPolicies(origin: string): Promise<PolicyBlock> {
  const unknown = (): PolicyBlock[PolicyKey] => ({
    exists: false, httpStatus: null, title: null, h1: null, wordCount: null,
  });
  const pages: Record<PolicyKey, PolicyBlock[PolicyKey]> = {
    refund: unknown(), privacy: unknown(), terms: unknown(),
    shipping: unknown(), legalNotice: unknown(),
  };

  const deadline = Date.now() + POLICY_GROUP_BUDGET_MS;
  for (const [key, path] of POLICY_PATHS) {
    if (Date.now() > deadline) break; // group budget spent — leave the rest unknown
    try {
      const { status, body } = await fetchResource(`${origin}${path}`, {
        maxBytes: 256 * 1024,
        timeoutMs: 5000,
      });
      if (status === null) continue;
      if (status !== 200 || !body) {
        pages[key] = { exists: false, httpStatus: status, title: null, h1: null, wordCount: null };
        continue;
      }
      const $ = cheerio.load(body);
      $("script, style, noscript").remove();
      const text = $("main, body").first().text().replace(/\s+/g, " ").trim();
      pages[key] = {
        exists: true,
        httpStatus: status,
        title: ($("title").first().text().trim() || null)?.slice(0, 200) ?? null,
        h1: ($("h1").first().text().trim() || null)?.slice(0, 200) ?? null,
        wordCount: text ? text.split(" ").length : 0,
      };
    } catch {
      /* single-page failure → stays unknown; never fails the audit */
    }
  }

  const present = Object.values(pages).filter((p) => p.exists);
  return {
    ...pages,
    presentCount: present.length,
    thinCount: present.filter((p) => (p.wordCount ?? 0) < THIN_POLICY_WORDS).length,
    duplicateTitleH1Count: present.filter(
      (p) => p.title !== null && p.h1 !== null && normalize(p.title) === normalize(p.h1),
    ).length,
  };
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

const BROKEN_LINK_SAMPLE = 15;
const BROKEN_LINK_CONCURRENCY = 5;

/**
 * Check a sample of internal links for 4xx/5xx responses.
 * HEAD first; a 405/501 falls back to GET. Network failures count as broken
 * (status null) only when the DNS/connection genuinely fails.
 */
export async function checkBrokenLinks(
  internalLinks: LinkInfo[],
  pageUrl: string,
): Promise<ExtractedData["brokenLinks"]> {
  // Unique URLs, excluding the audited page itself and obvious binaries
  const seen = new Set<string>([pageUrl, `${pageUrl}/`]);
  const targets: string[] = [];
  for (const link of internalLinks) {
    const clean = link.href.split("#")[0] ?? link.href;
    if (seen.has(clean)) continue;
    if (/\.(pdf|zip|jpg|jpeg|png|gif|webp|svg|mp4|mp3|docx?|xlsx?)$/i.test(clean)) continue;
    seen.add(clean);
    targets.push(clean);
    if (targets.length >= BROKEN_LINK_SAMPLE) break;
  }

  const broken: Array<{ url: string; status: number | null }> = [];
  let index = 0;

  async function worker(): Promise<void> {
    while (index < targets.length) {
      const url = targets[index++]!;
      let { status } = await fetchResource(url, { method: "HEAD", timeoutMs: 6000 });
      if (status === 405 || status === 501) {
        ({ status } = await fetchResource(url, {
          method: "GET",
          maxBytes: 2048,
          timeoutMs: 6000,
        }));
      }
      if (status === null || status >= 400) {
        broken.push({ url, status });
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(BROKEN_LINK_CONCURRENCY, targets.length) }, worker),
  );

  return {
    checkedCount: targets.length,
    brokenCount: broken.length,
    broken: broken.slice(0, 10),
  };
}
