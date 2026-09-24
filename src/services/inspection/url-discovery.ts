import "server-only";
import { fetchResource } from "./fetcher";
import { assertPublicHost } from "@/lib/security/ssrf";
import type { LinkInfo } from "./types";
import type { ReportPageType } from "@prisma/client";

export type UrlGroupCounts = {
  homepage: number;
  products: number;
  collections: number;
  blogs: number;
  articles: number;
  pages: number;
  other: number;
};

export type UrlDiscoveryResult = {
  totalDetectedUrls: number;
  urlGroups: UrlGroupCounts;
  discoveredUrls: string[];
  representativeUrls: Array<{ url: string; group: string; pageType: ReportPageType }>;
};

/** Categorize a URL path into page groups. */
export function classifyUrlGroup(url: string, path: string): { group: keyof UrlGroupCounts; pageType: ReportPageType; label: string } {
  const lower = (path || url).toLowerCase();
  
  if (path === "/" || path === "" || lower === url.toLowerCase().replace(/\/$/, "")) {
    return { group: "homepage", pageType: "HOME", label: "Homepage" };
  }
  if (lower.includes("/products/") || lower.includes("/product/") || lower.includes("/item/") || lower.includes("/p/")) {
    return { group: "products", pageType: "PRODUCT", label: "Product" };
  }
  if (lower.includes("/collections/") || lower.includes("/collection/") || lower.includes("/category/") || lower.includes("/categories/") || lower.includes("/shop/")) {
    return { group: "collections", pageType: "COLLECTION", label: "Collection" };
  }
  if (lower.includes("/blogs/") || lower.includes("/blog/") || lower.includes("/news/") || lower.includes("/posts/")) {
    return { group: "blogs", pageType: "BLOG", label: "Blog" };
  }
  if (lower.includes("/articles/") || lower.includes("/article/") || lower.includes("/guides/") || lower.includes("/guide/")) {
    return { group: "articles", pageType: "BLOG", label: "Article" };
  }
  if (
    lower.includes("/pages/") ||
    lower.includes("/about") ||
    lower.includes("/contact") ||
    lower.includes("/faq") ||
    lower.includes("/help") ||
    lower.includes("/terms") ||
    lower.includes("/privacy") ||
    lower.includes("/policy") ||
    lower.includes("/shipping") ||
    lower.includes("/returns") ||
    lower.includes("/services")
  ) {
    return { group: "pages", pageType: "HOME", label: "Standard Page" };
  }

  return { group: "other", pageType: "HOME", label: "Other Page" };
}

/** Extract all <loc> URLs from a sitemap XML string. */
function extractSitemapLocs(xml: string): { urls: string[]; childSitemaps: string[] } {
  const urls: string[] = [];
  const childSitemaps: string[] = [];

  for (const match of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) {
    const loc = match[1]?.trim();
    if (!loc) continue;
    if (loc.endsWith(".xml") || loc.includes("sitemap")) {
      childSitemaps.push(loc);
    } else {
      urls.push(loc);
    }
  }

  return { urls, childSitemaps };
}

/** Extract Sitemap: lines from robots.txt content */
function extractSitemapsFromRobots(robots: string | null): string[] {
  if (!robots) return [];
  const sitemaps: string[] = [];
  const lines = robots.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^sitemap:\s*(https?:\/\/[^\s]+)/i);
    if (match && match[1]) {
      sitemaps.push(match[1].trim());
    }
  }
  return sitemaps;
}

/**
 * High performance URL Discovery engine.
 * Discovers total website scope and categorizes all URLs into page groups.
 */
export async function discoverWebsiteScope(
  origin: string,
  primaryUrl: string,
  initialInternalLinks: LinkInfo[] = [],
  robotsContent: string | null = null,
): Promise<UrlDiscoveryResult> {
  const discoveredSet = new Set<string>();
  const sitemapQueue: string[] = [];
  const visitedSitemaps = new Set<string>();

  const norm = (u: string) => {
    try {
      const parsed = new URL(u);
      return `${parsed.origin}${parsed.pathname.replace(/\/$/, "")}${parsed.search}`;
    } catch {
      return u.toLowerCase().replace(/\/$/, "");
    }
  };

  // Add primary & homepage
  discoveredSet.add(norm(primaryUrl));
  discoveredSet.add(norm(origin));

  // 1. Discover sitemaps from robots.txt
  const robotsSitemaps = extractSitemapsFromRobots(robotsContent);
  for (const sm of robotsSitemaps) {
    sitemapQueue.push(sm);
  }

  // 2. Add standard sitemap locations if none in robots
  if (sitemapQueue.length === 0) {
    sitemapQueue.push(`${origin}/sitemap.xml`);
    sitemapQueue.push(`${origin}/sitemap_index.xml`);
  }

  // 3. Process sitemaps recursively up to 15 sitemap files
  let sitemapFetches = 0;
  while (sitemapQueue.length > 0 && sitemapFetches < 15) {
    const sitemapUrl = sitemapQueue.shift()!;
    const sitemapNorm = norm(sitemapUrl);
    if (visitedSitemaps.has(sitemapNorm)) continue;
    visitedSitemaps.add(sitemapNorm);
    sitemapFetches++;

    try {
      const uObj = new URL(sitemapUrl);
      const hostCheck = await assertPublicHost(uObj.hostname);
      if (!hostCheck.ok) continue;

      const res = await fetchResource(sitemapUrl, { maxBytes: 1024 * 1024, timeoutMs: 4500 });
      if (res.status === 200 && res.body) {
        const { urls, childSitemaps } = extractSitemapLocs(res.body);

        for (const child of childSitemaps) {
          if (!visitedSitemaps.has(norm(child)) && sitemapQueue.length < 25) {
            sitemapQueue.push(child);
          }
        }

        for (const u of urls) {
          if (u.startsWith(origin)) {
            discoveredSet.add(norm(u));
          }
        }
      }
    } catch {
      // Ignore individual sitemap failures
    }
  }

  // 4. Merge initial internal links
  for (const link of initialInternalLinks) {
    if (!link.href) continue;
    const full = link.href.startsWith("http")
      ? link.href
      : `${origin}${link.href.startsWith("/") ? "" : "/"}${link.href}`;
    if (full.startsWith(origin)) {
      if (!/\.(png|jpe?g|gif|svg|webp|css|js|pdf|ico|woff2?)$/i.test(full) && !full.includes("#")) {
        discoveredSet.add(norm(full));
      }
    }
  }

  // 5. Common fallback routes if discovery was limited
  const commonRoutes = [
    "/",
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
    discoveredSet.add(norm(`${origin}${route}`));
  }

  // 6. Categorize URLs into groups
  const allDiscoveredUrls = Array.from(discoveredSet);
  const groups: UrlGroupCounts = {
    homepage: 0,
    products: 0,
    collections: 0,
    blogs: 0,
    articles: 0,
    pages: 0,
    other: 0,
  };

  const groupBuckets: Record<keyof UrlGroupCounts, Array<{ url: string; pageType: ReportPageType }>> = {
    homepage: [],
    products: [],
    collections: [],
    blogs: [],
    articles: [],
    pages: [],
    other: [],
  };

  for (const u of allDiscoveredUrls) {
    let path = "/";
    try {
      path = new URL(u).pathname;
    } catch {
      path = u.replace(origin, "") || "/";
    }

    const { group, pageType } = classifyUrlGroup(u, path);
    groups[group]++;
    groupBuckets[group].push({ url: u, pageType });
  }

  // Always ensure at least 1 homepage
  if (groups.homepage === 0) {
    groups.homepage = 1;
    groupBuckets.homepage.push({ url: primaryUrl, pageType: "HOME" });
  }

  const totalDetectedUrls = allDiscoveredUrls.length;

  // 7. Select Representative URLs for deep sampling across each group
  const representativeUrls: Array<{ url: string; group: string; pageType: ReportPageType }> = [];

  // Always include homepage
  representativeUrls.push({ url: primaryUrl, group: "homepage", pageType: "HOME" });

  // Pick samples from other groups (e.g. up to 5 per group)
  for (const [grp, items] of Object.entries(groupBuckets)) {
    if (grp === "homepage") continue;
    const sampleItems = items.slice(0, 5);
    for (const item of sampleItems) {
      if (item.url !== primaryUrl && !representativeUrls.some((r) => r.url === item.url)) {
        representativeUrls.push({ url: item.url, group: grp, pageType: item.pageType });
      }
    }
  }

  return {
    totalDetectedUrls,
    urlGroups: groups,
    discoveredUrls: allDiscoveredUrls,
    representativeUrls,
  };
}
