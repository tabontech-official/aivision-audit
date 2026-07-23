import "server-only";
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
      return { exists: true, url, urlCount };
    }
  }

  return { exists: false, url: null, urlCount: null };
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
