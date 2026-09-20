/**
 * Mangools API Client Service
 * Official Documentation: https://apidocs.mangools.com/
 * Base URL: https://api.mangools.com/v3
 */

import {
  MangoolsSiteProfilerOverviewResponse,
  MangoolsSiteProfilerBacklinkProfileResponse,
  MangoolsSiteProfilerTopContentResponse,
  MangoolsLinkMinerResponse,
  MangoolsLinkMinerLinkItem,
  MangoolsFetchProgressCallback,
  NormalizedBacklinkDataset,
  NormalizedBacklinkOverview,
  NormalizedBacklinkRecord,
  NormalizedReferringDomain,
  NormalizedAnchorItem,
  NormalizedTopPage,
} from "./types";

const MANGOOLS_BASE_URL = "https://api.mangools.com/v3";

/**
 * Validate and sanitize input domain or URL to prevent SSRF and injection
 */
export function sanitizeDomain(rawDomain: string): string {
  if (!rawDomain || typeof rawDomain !== "string") {
    throw new Error("Invalid domain provided");
  }

  let domain = rawDomain.trim().toLowerCase();

  // Strip protocol if provided
  if (domain.startsWith("http://")) {
    domain = domain.slice(7);
  } else if (domain.startsWith("https://")) {
    domain = domain.slice(8);
  }

  // Strip path and query if present
  domain = (domain.split("/")[0] || "").split("?")[0] || "";
  domain = domain.split("#")[0] || "";

  // Strip port if present
  domain = domain.split(":")[0] || "";

  // Prevent SSRF / internal addresses
  const forbiddenPatterns = [
    /^localhost$/,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^0\./,
    /\.local$/,
    /\.internal$/,
    /\.lan$/,
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(domain)) {
      throw new Error(`Invalid or disallowed target domain: ${domain}`);
    }
  }

  // Ensure domain has valid structure (e.g. example.com)
  if (!domain.includes(".") || domain.length < 4 || domain.endsWith(".")) {
    throw new Error(`Malformed target domain: ${domain}`);
  }

  return domain;
}

/**
 * Make an authenticated GET request to Mangools API v3 with automatic retries
 */
export async function callMangoolsEndpoint<T>(
  endpoint: string,
  params: Record<string, string | number | boolean> = {},
  retries = 2,
  timeoutMs = 15000
): Promise<T> {
  const apiKey = process.env.MANGOOLS_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      "MANGOOLS_API_KEY is not configured in environment variables. Please add your Mangools API key to .env."
    );
  }

  const url = new URL(`${MANGOOLS_BASE_URL}/${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-access-token": apiKey.trim(),
        "Accept": "application/json",
        "User-Agent": "AiVision-Audit/1.0",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status} ${response.statusText}`;
      try {
        const errorJson = await response.json();
        errorMsg = errorJson.message || errorJson.error || errorMsg;
      } catch {
        // use fallback text
      }

      // Handle specific status codes
      if (response.status >= 500 && retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (3 - retries)));
        return callMangoolsEndpoint<T>(endpoint, params, retries - 1, timeoutMs);
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          `Mangools authentication failed (${errorMsg}). Please verify your MANGOOLS_API_KEY in .env.`
        );
      }

      if (response.status === 402 || response.status === 429) {
        throw new Error(
          `Mangools API quota or rate limit exceeded (${errorMsg}). Please check your Mangools account plan or credits.`
        );
      }

      if (response.status === 404) {
        throw new Error(`Domain not found or no data available in Mangools index for /${endpoint}`);
      }

      throw new Error(`Mangools API Error (${response.status}): ${errorMsg}`);
    }

    const data = await response.json();
    if (!data || typeof data !== "object") {
      throw new Error(`Invalid response format received from Mangools endpoint /${endpoint}`);
    }

    return data as T;
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof Error && err.name === "AbortError") {
      if (retries > 0) {
        return callMangoolsEndpoint<T>(endpoint, params, retries - 1, timeoutMs);
      }
      throw new Error(`Mangools request timed out after ${timeoutMs}ms for /${endpoint}`);
    }

    if (err instanceof Error) {
      if (err.message.includes("ECONNRESET") || err.message.includes("fetch failed")) {
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (3 - retries)));
          return callMangoolsEndpoint<T>(endpoint, params, retries - 1, timeoutMs);
        }
      }
      throw err;
    }

    throw new Error(`Mangools network error: ${String(err)}`);
  }
}

/**
 * Safe numeric parsers to prevent string/float coercion issues with Prisma Int fields
 */
function toInt(val: unknown, fallback: number = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "number") return isNaN(val) ? fallback : Math.round(val);
  if (typeof val === "string") {
    const parsed = parseInt(val.replace(/,/g, "").trim(), 10);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

function toNullableInt(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") return isNaN(val) ? null : Math.round(val);
  if (typeof val === "string") {
    const parsed = parseInt(val.replace(/,/g, "").trim(), 10);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

function toFloat(val: unknown, fallback: number = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "number") return isNaN(val) ? fallback : val;
  if (typeof val === "string") {
    const parsed = parseFloat(val.replace(/,/g, "").trim());
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

/**
 * Fetch and normalize complete backlink dataset from Mangools API v3 across all available pages
 */
export async function fetchBacklinkDataFromMangools(
  rawDomain: string,
  onProgress?: MangoolsFetchProgressCallback,
  options?: {
    startPage?: number;
    existingLinks?: MangoolsLinkMinerLinkItem[];
    maxPages?: number;
  }
): Promise<NormalizedBacklinkDataset> {
  const domain = sanitizeDomain(rawDomain);
  let apiCallsCount = 0;

  // 1. SiteProfiler Overview (initializes/unlocks domain lookups)
  let overviewRes: MangoolsSiteProfilerOverviewResponse = {};
  try {
    overviewRes = await callMangoolsEndpoint<MangoolsSiteProfilerOverviewResponse>(
      "siteprofiler/overview",
      { url: domain }
    );
    apiCallsCount++;
  } catch (err) {
    console.warn(`[Mangools] siteprofiler/overview warning for ${domain}:`, err);
  }

  // 2. Fetch Backlink Profile and Top Content concurrently
  const [backlinkProfileResult, topContentResult] = await Promise.allSettled([
    callMangoolsEndpoint<MangoolsSiteProfilerBacklinkProfileResponse>(
      "siteprofiler/backlink-profile",
      { url: domain }
    ),
    callMangoolsEndpoint<MangoolsSiteProfilerTopContentResponse>(
      "siteprofiler/top-content",
      { url: domain }
    ),
  ]);

  if (backlinkProfileResult.status === "fulfilled") apiCallsCount++;
  if (topContentResult.status === "fulfilled") apiCallsCount++;

  const backlinkProfileRes: MangoolsSiteProfilerBacklinkProfileResponse =
    backlinkProfileResult.status === "fulfilled" ? backlinkProfileResult.value : {};

  const topContentRes: MangoolsSiteProfilerTopContentResponse =
    topContentResult.status === "fulfilled" ? topContentResult.value : {};

  // Log warnings if any profile request failed
  if (backlinkProfileResult.status === "rejected") {
    console.warn(`[Mangools] backlink-profile warning:`, backlinkProfileResult.reason);
  }
  if (topContentResult.status === "rejected") {
    console.warn(`[Mangools] top-content warning:`, topContentResult.reason);
  }

  // -------------------------------------------------------------
  // 3. Multi-Page Paginated Fetch for LinkMiner Backlinks
  // -------------------------------------------------------------
  const allRawLinks: MangoolsLinkMinerLinkItem[] = options?.existingLinks ? [...options.existingLinks] : [];
  const seenLinkKeys = new Set<string>();

  // Seed deduplication set with existing links if resuming
  for (const l of allRawLinks) {
    seenLinkKeys.add(`${l.source}|${l.target}|${l.anchor || ""}`);
  }

  let currentPage = options?.startPage ?? 0;
  let totalAvailableLinks = 0;
  let totalPages = 1;
  let auditStatus: "completed" | "partially_completed" = "completed";
  let pagesFetchedCount = 0;
  let hasMorePages = true;

  const maxPagesThisRun = options?.maxPages ?? 4; // Fetch up to 4 pages (2,000 links) per run
  let pagesFetchedThisRun = 0;

  while (hasMorePages) {
    try {
      const linkMinerRes = await callMangoolsEndpoint<MangoolsLinkMinerResponse>(
        "linkminer/links",
        {
          url: domain,
          source: 0, // 0 = all links
          page: currentPage,
          links_per_domain: 0,
        }
      );
      apiCallsCount++;
      pagesFetchedCount++;
      pagesFetchedThisRun++;

      // Read available_links from API meta or root
      if (currentPage === (options?.startPage ?? 0) || totalAvailableLinks === 0) {
        totalAvailableLinks = toInt(
          linkMinerRes.meta?.available_links ?? linkMinerRes.available_links ?? linkMinerRes.total,
          0
        );
        totalPages = totalAvailableLinks > 0 ? Math.ceil(totalAvailableLinks / 500) : 1;
      }

      const pageLinks = Array.isArray(linkMinerRes.links) ? linkMinerRes.links : [];

      // Deduplicate and collect
      for (const item of pageLinks) {
        const key = `${item.source}|${item.target}|${item.anchor || ""}`;
        if (!seenLinkKeys.has(key)) {
          seenLinkKeys.add(key);
          allRawLinks.push(item);
        }
      }

      // Notify progress callback
      if (onProgress) {
        onProgress({
          fetchedRows: allRawLinks.length,
          totalAvailable: totalAvailableLinks > 0 ? totalAvailableLinks : allRawLinks.length,
          currentPage: currentPage + 1,
          totalPages,
        });
      }

      // Check termination conditions
      if (
        pageLinks.length === 0 ||
        currentPage + 1 >= totalPages ||
        (totalAvailableLinks > 0 && allRawLinks.length >= totalAvailableLinks)
      ) {
        hasMorePages = false;
        auditStatus = "completed";
      } else if (pagesFetchedThisRun >= maxPagesThisRun) {
        // Paused for this batch, ready to resume next pages
        hasMorePages = false;
        auditStatus = "partially_completed";
      } else {
        currentPage++;
        // Throttle sequential requests by 200ms to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (err) {
      console.error(`[Mangools] Error fetching LinkMiner page ${currentPage}:`, err);
      // Mark as partially completed, stop fetching further pages but preserve what we got
      auditStatus = "partially_completed";
      hasMorePages = false;
    }
  }

  // -------------------------------------------------------------
  // 4. Normalization: Backlinks List (LinkMiner)
  // -------------------------------------------------------------
  let brokenCount = 0;
  let suspiciousCount = 0;

  const backlinks: NormalizedBacklinkRecord[] = allRawLinks.map((item) => {
    const isDofollow = item.no_follow !== "true" && item.no_follow !== "1";
    const isDeleted = item.deleted === "true" || item.deleted === "1";
    const isRedirect = item.redirect === "true" || item.redirect === "1";
    const httpStatus = isDeleted ? 404 : isRedirect ? 301 : 200;

    if (isDeleted) {
      brokenCount++;
    }

    // Link Strength (ls) is 0-100; low LS with suspicious loss reason can indicate low quality
    const linkStrength = toInt(item.ls ?? item.source_tf, 0);
    const isSuspicious = linkStrength < 5 && (!item.anchor || item.anchor.trim() === "");
    if (isSuspicious) {
      suspiciousCount++;
    }

    const firstSeenDate = item.first_seen ? new Date(item.first_seen) : null;
    const lastSeenDate = item.last_seen ? new Date(item.last_seen) : null;
    const lastCrawlDate = item.last_crawl ? new Date(item.last_crawl) : null;

    // Check if new (discovered in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const isNew = firstSeenDate ? firstSeenDate >= thirtyDaysAgo : false;

    return {
      sourceDomain: item.domainId || extractHostname(item.source),
      sourceUrl: item.source,
      targetUrl: item.target,
      anchor: item.anchor && item.anchor.trim() !== "" ? item.anchor : null,
      isDofollow,
      domainRank: linkStrength,
      pageRank: toInt(item.source_cf, 0),
      httpStatus,
      linkType: item.type || (isRedirect ? "redirect" : "text"),
      isNew,
      isLost: isDeleted,
      isBroken: isDeleted,
      isSuspicious,
      lossReason: item.reason_lost || (isDeleted ? "Target URL 404 or Link removed" : null),
      crawledAt: lastCrawlDate && !isNaN(lastCrawlDate.getTime()) ? lastCrawlDate : new Date(),
      firstSeen: firstSeenDate && !isNaN(firstSeenDate.getTime()) ? firstSeenDate : null,
      lastSeen: lastSeenDate && !isNaN(lastSeenDate.getTime()) ? lastSeenDate : null,
    };
  });

  // -------------------------------------------------------------
  // 5. Normalization: Referring Domains (Backlink Profile)
  // -------------------------------------------------------------
  const rawRefDomains = Array.isArray(backlinkProfileRes.majesticRefDomains)
    ? backlinkProfileRes.majesticRefDomains
    : [];

  const referringDomains: NormalizedReferringDomain[] = rawRefDomains.map((item) => {
    const matched = toInt(item.matchedLinks, 0);
    return {
      domain: item.domain,
      backlinksCount: matched,
      dofollowCount: matched, // per domain breakdown is not split by Mangools
      nofollowCount: 0,
      domainRank: toInt(item.trustFlow ?? item.topRank, 0),
      ip: item.ip || null,
      country: null,
    };
  });

  // -------------------------------------------------------------
  // 6. Normalization: Anchor Texts (Backlink Profile)
  // -------------------------------------------------------------
  const rawAnchors = Array.isArray(backlinkProfileRes.majesticAnchors)
    ? backlinkProfileRes.majesticAnchors
    : [];

  const totalAnchorLinks = rawAnchors.reduce((acc, curr) => acc + toInt(curr.totalLinks, 0), 0);

  const anchors: NormalizedAnchorItem[] = rawAnchors.map((item) => {
    const count = toInt(item.totalLinks, 0);
    const pct = totalAnchorLinks > 0 ? (count / totalAnchorLinks) * 100 : 0;
    return {
      anchor: item.anchorText || "(empty anchor text)",
      backlinksCount: count,
      referringDomainsCount: toInt(item.refDomains, 0),
      percentage: Math.round(pct * 10) / 10,
    };
  });

  // -------------------------------------------------------------
  // 7. Normalization: Top Pages (SiteProfiler Top Content)
  // -------------------------------------------------------------
  const rawTopContent = Array.isArray(topContentRes.topContent) ? topContentRes.topContent : [];

  const topPages: NormalizedTopPage[] = rawTopContent.map((item) => {
    const extBL = toInt(item.extBackLinks, 0);
    return {
      targetUrl: item.url,
      backlinksCount: extBL,
      referringDomainsCount: toInt(item.refDomains, 0),
      dofollowCount: extBL,
      nofollowCount: 0,
      brokenCount: 0,
      httpStatus: 200,
    };
  });

  // -------------------------------------------------------------
  // 8. Normalization: New & Lost Link Counts (Calendar & Profile)
  const calendar = Array.isArray(backlinkProfileRes.majesticBackLinkCalendar)
    ? backlinkProfileRes.majesticBackLinkCalendar
    : [];

  let finalNewBacklinks: number | null = null;
  let finalLostBacklinks: number | null = null;

  if (backlinks.length > 0) {
    finalNewBacklinks = backlinks.filter((b) => b.isNew).length;
    finalLostBacklinks = backlinks.filter((b) => b.isLost || b.isBroken).length;
  } else if (calendar.length > 0) {
    let calculatedNewLinks = 0;
    let calculatedLostLinks = 0;
    for (const day of calendar) {
      calculatedNewLinks += toInt(day.NewLinks, 0);
      calculatedLostLinks += toInt(day.LostLinks, 0);
    }
    finalNewBacklinks = calculatedNewLinks;
    finalLostBacklinks = calculatedLostLinks;
  } else if (backlinkProfileRes.majestic?.NonUniqueLinkTypeDeleted !== undefined) {
    finalLostBacklinks = toNullableInt(backlinkProfileRes.majestic.NonUniqueLinkTypeDeleted);
  }

  // -------------------------------------------------------------
  // 9. Normalization: Overview Totals
  // -------------------------------------------------------------
  const aggregateIndexedCount = toInt(
    backlinkProfileRes.majestic?.TotalNonUniqueLinks ??
      overviewRes.majestic?.ExtBackLinks ??
      totalAvailableLinks ??
      backlinks.length,
    0
  );

  // Primary customer-facing total backlinks equals the available detailed records
  const totalBacklinks = backlinks.length > 0 ? backlinks.length : aggregateIndexedCount;

  const referringDomainsCount = toInt(
    backlinkProfileRes.majestic?.RefDomains ??
      overviewRes.majestic?.RefDomains ??
      referringDomains.length,
    0
  );

  // Calculate Dofollow & Nofollow strictly from the detailed dataset for internal consistency
  let dofollowCount: number | null = null;
  let nofollowCount: number | null = null;

  if (backlinks.length > 0) {
    dofollowCount = backlinks.filter((b) => b.isDofollow).length;
    nofollowCount = backlinks.filter((b) => !b.isDofollow).length;
  } else if (backlinkProfileRes.majestic?.NonUniqueLinkTypeNoFollow !== undefined) {
    nofollowCount = toNullableInt(backlinkProfileRes.majestic.NonUniqueLinkTypeNoFollow);
    dofollowCount = nofollowCount !== null ? Math.max(0, totalBacklinks - nofollowCount) : null;
  }

  let domainRank: number | null = null;
  if (overviewRes.moz?.pda !== undefined) {
    domainRank = toNullableInt(overviewRes.moz.pda);
  } else if (overviewRes.topRank !== undefined) {
    domainRank = toNullableInt(overviewRes.topRank);
  } else if (referringDomains.length > 0) {
    domainRank = Math.round(
      referringDomains.reduce((sum, d) => sum + d.domainRank, 0) /
        referringDomains.length
    );
  }

  let referringIps: number | null = null;
  if (backlinkProfileRes.majestic?.RefIPs !== undefined) {
    referringIps = toNullableInt(backlinkProfileRes.majestic.RefIPs);
  } else if (overviewRes.majestic?.RefIPs !== undefined) {
    referringIps = toNullableInt(overviewRes.majestic.RefIPs);
  }

  let referringSubnets: number | null = null;
  if (backlinkProfileRes.majestic?.RefSubNets !== undefined) {
    referringSubnets = toNullableInt(backlinkProfileRes.majestic.RefSubNets);
  } else if (overviewRes.majestic?.RefSubNets !== undefined) {
    referringSubnets = toNullableInt(overviewRes.majestic.RefSubNets);
  }

  const overview: NormalizedBacklinkOverview = {
    domain,
    totalBacklinks,
    providerIndexedBacklinks: aggregateIndexedCount,
    totalIndexedBacklinks: aggregateIndexedCount,
    detailedBacklinksAvailable: totalAvailableLinks > 0 ? totalAvailableLinks : backlinks.length,
    detailedBacklinksFetched: backlinks.length,
    referringDomains: referringDomainsCount,
    domainRank: domainRank !== null ? Math.min(100, Math.max(0, domainRank)) : null,
    dofollowCount,
    nofollowCount,
    newBacklinks: backlinks.length > 0 ? backlinks.filter((b) => b.isNew).length : finalNewBacklinks,
    lostBacklinks: backlinks.length > 0 ? backlinks.filter((b) => b.isLost).length : finalLostBacklinks,
    referringIps,
    referringSubnets,
    brokenBacklinks: brokenCount,
    suspiciousBacklinks: suspiciousCount,
    provider: "mangools",
    status: auditStatus,
    availableRowRecords: totalAvailableLinks > 0 ? totalAvailableLinks : backlinks.length,
    fetchedRowsCount: backlinks.length,
    lastFetchedPage: currentPage,
    costMetrics: {
      apiCallsCount,
      pagesFetched: pagesFetchedCount,
      creditsConsumed: allRawLinks.length + 1,
    },
    creditsUsed: 1,
    fetchedAt: new Date(),
  };

  return {
    overview,
    backlinks,
    referringDomains,
    anchors,
    topPages,
  };
}

function extractHostname(urlStr: string): string {
  try {
    const url = new URL(urlStr.startsWith("http") ? urlStr : `https://${urlStr}`);
    return url.hostname;
  } catch {
    return urlStr;
  }
}
