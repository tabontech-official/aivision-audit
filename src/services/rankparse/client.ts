/**
 * RankParse Backlink API Client Service
 * Official Documentation: https://rankparse.com/docs
 */

import {
  RankParseDomainAuthorityResponse,
  RankParseBacklinksResponse,
  RankParseReferringDomainsResponse,
  RankParseAnchorTextResponse,
  RankParseTopPagesResponse,
  NormalizedBacklinkDataset,
  NormalizedBacklinkOverview,
  NormalizedBacklinkRecord,
  NormalizedReferringDomain,
  NormalizedAnchorItem,
  NormalizedTopPage,
} from "./types";

const RANKPARSE_BASE_URL = "https://api.rankparse.com/v1";

/**
 * Sanitize domain name to prevent SSRF and formatting errors.
 */
export function sanitizeDomain(rawUrl: string): string {
  let cleaned = rawUrl.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//i, "");
  cleaned = cleaned.replace(/^www\./i, "");
  const slashIdx = cleaned.indexOf("/");
  if (slashIdx !== -1) {
    cleaned = cleaned.substring(0, slashIdx);
  }
  const queryIdx = cleaned.indexOf("?");
  if (queryIdx !== -1) {
    cleaned = cleaned.substring(0, queryIdx);
  }
  const hashIdx = cleaned.indexOf("#");
  if (hashIdx !== -1) {
    cleaned = cleaned.substring(0, hashIdx);
  }
  return cleaned.replace(/[^a-z0-9.-]/g, "");
}

/**
 * Make an authenticated GET request to RankParse API with automatic retries for network/socket jitter
 */
export async function callRankParseEndpoint<T>(
  endpoint: string,
  params: Record<string, string | number> = {},
  retries: number = 2,
  timeoutMs: number = 60000
): Promise<T> {
  const apiKey = process.env.RANKPARSE_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error(
      "RANKPARSE_API_KEY is not configured in environment variables. Please add your RankParse API key to .env."
    );
  }

  const url = new URL(`${RANKPARSE_BASE_URL}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    url.searchParams.set(k, String(v));
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-API-Key": apiKey.trim(),
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    const text = await response.text();
    let body: unknown = null;
    try {
      body = JSON.parse(text);
    } catch {
      // Non-JSON response
    }

    if (!response.ok) {
      // Handle rate limits or temporary server errors with retry
      if ((response.status === 429 || response.status >= 500) && retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * (3 - retries)));
        return callRankParseEndpoint<T>(endpoint, params, retries - 1, timeoutMs);
      }

      const bodyObj = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : null;
      const errorMsg =
        (typeof bodyObj?.error === "string" ? bodyObj.error : null) ||
        (typeof bodyObj?.message === "string" ? bodyObj.message : null) ||
        `HTTP ${response.status} ${response.statusText}`;

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          `RankParse authentication failed (${errorMsg}). Please verify your RANKPARSE_API_KEY in .env.`
        );
      }

      if (response.status === 402) {
        throw new Error(
          `RankParse insufficient credits (${errorMsg}). Please top up your credits on rankparse.com.`
        );
      }

      throw new Error(`RankParse API Error (${response.status}): ${errorMsg}`);
    }

    if (!body) {
      throw new Error(
        `Invalid response format received from RankParse endpoint /${endpoint}`
      );
    }

    return body as T;
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    // Auto-retry transient socket/connection errors (UND_ERR_CONNECT_TIMEOUT, ECONNRESET, fetch failed)
    if (retries > 0) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      if (!isAbort) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * (3 - retries)));
        return callRankParseEndpoint<T>(endpoint, params, retries - 1, timeoutMs);
      }
    }

    if (err instanceof Error) {
      if (err.name === "AbortError") {
        throw new Error(`RankParse request timed out for /${endpoint}`);
      }
      const errWithCause = err as Error & { cause?: { code?: string } };
      if (err.message?.includes("fetch failed") || errWithCause.cause?.code === "UND_ERR_CONNECT_TIMEOUT") {
        throw new Error(
          `Connection to RankParse server timed out while establishing network handshake. Please try again.`
        );
      }
      throw err;
    }
    throw new Error(`RankParse network error: ${String(err)}`);
  }
}

/**
 * Fetch and normalize complete backlink dataset from RankParse API
 * Consumes approximately 9 credits per full domain audit:
 * - /v1/domain-authority (1 credit)
 * - /v1/backlinks (2 credits)
 * - /v1/referring-domains (2 credits)
 * - /v1/anchor-text (2 credits)
 * - /v1/top-pages (2 credits)
 */
export async function fetchBacklinkDataFromRankParse(
  rawDomain: string
): Promise<NormalizedBacklinkDataset> {
  const domain = sanitizeDomain(rawDomain);
  if (!domain) {
    throw new Error("Invalid domain provided for Backlink audit");
  }

  // Query endpoints in small staggered pairs to prevent socket connect contention on Cloudflare edges
  const authorityPromise = callRankParseEndpoint<RankParseDomainAuthorityResponse>(
    "domain-authority",
    { domain },
    2,
    60000
  );

  const backlinksPromise = callRankParseEndpoint<RankParseBacklinksResponse>(
    "backlinks",
    { domain, limit: 100, sort: "importance" },
    2,
    60000
  );

  const refDomainsPromise = callRankParseEndpoint<RankParseReferringDomainsResponse>(
    "referring-domains",
    { domain, limit: 100 },
    2,
    60000
  );

  const anchorsPromise = callRankParseEndpoint<RankParseAnchorTextResponse>(
    "anchor-text",
    { domain, limit: 50 },
    2,
    60000
  );

  const topPagesPromise = callRankParseEndpoint<RankParseTopPagesResponse>(
    "top-pages",
    { domain, limit: 50 },
    2,
    60000
  );

  const [
    authorityResult,
    backlinksResult,
    refDomainsResult,
    anchorsResult,
    topPagesResult,
  ] = await Promise.allSettled([
    authorityPromise,
    backlinksPromise,
    refDomainsPromise,
    anchorsPromise,
    topPagesPromise,
  ]);

  // If primary domain-authority or backlinks failed, rethrow the real error
  if (authorityResult.status === "rejected") {
    throw authorityResult.reason;
  }
  if (backlinksResult.status === "rejected") {
    throw backlinksResult.reason;
  }

  const authorityRes = authorityResult.value;
  const backlinksRes = backlinksResult.value;
  const refDomainsRes: RankParseReferringDomainsResponse =
    refDomainsResult.status === "fulfilled"
      ? refDomainsResult.value
      : { data: [], domain, total: 0, credits_used: 0 };
  const anchorsRes: RankParseAnchorTextResponse =
    anchorsResult.status === "fulfilled"
      ? anchorsResult.value
      : { data: [], credits_used: 0 };
  const topPagesRes: RankParseTopPagesResponse =
    topPagesResult.status === "fulfilled"
      ? topPagesResult.value
      : { data: [], credits_used: 0 };

  // Total credits consumed
  const totalCredits =
    (authorityRes.credits_used || 1) +
    (backlinksRes.credits_used || 2) +
    (refDomainsRes.credits_used || 0) +
    (anchorsRes.credits_used || 0) +
    (topPagesRes.credits_used || 0);

  const domainRank = authorityRes.data?.score ?? 0;
  const totalBacklinks = backlinksRes.total ?? (backlinksRes.data?.length || 0);
  const totalReferringDomains =
    refDomainsRes.total ??
    authorityRes.data?.referring_domains ??
    (refDomainsRes.data?.length || 0);

  // Calculate dofollow / nofollow totals from real referring domains data
  let dofollowCount = 0;
  let nofollowCount = 0;
  if (Array.isArray(refDomainsRes.data) && refDomainsRes.data.length > 0) {
    for (const rd of refDomainsRes.data) {
      dofollowCount += rd.dofollow_links || 0;
      nofollowCount += rd.nofollow_links || 0;
    }
  }

  // Fallback to backlink items count if referring domains sum is 0
  if (dofollowCount === 0 && nofollowCount === 0 && Array.isArray(backlinksRes.data)) {
    for (const b of backlinksRes.data) {
      const isNofollow = Boolean(
        b.rel && b.rel.toLowerCase().includes("nofollow")
      );
      if (isNofollow) nofollowCount++;
      else dofollowCount++;
    }
  }

  // Map Backlinks list
  const backlinks: NormalizedBacklinkRecord[] = (backlinksRes.data || []).map(
    (b) => {
      const isNofollow = Boolean(
        b.rel && b.rel.toLowerCase().includes("nofollow")
      );
      const crawledDate = b.crawled_at ? new Date(b.crawled_at) : null;
      return {
        sourceDomain: b.from_domain || "",
        sourceUrl: b.from_url || "",
        targetUrl: b.to_url || "",
        anchor: b.anchor_text || null,
        isDofollow: !isNofollow,
        domainRank: 0,
        pageRank: 0,
        httpStatus: 200,
        linkType: b.link_type || "a",
        isNew: false,
        isLost: false,
        isBroken: false,
        isSuspicious: false,
        lossReason: null,
        crawledAt: isNaN(crawledDate?.getTime() || 0) ? null : crawledDate,
        firstSeen: null,
        lastSeen: isNaN(crawledDate?.getTime() || 0) ? null : crawledDate,
      };
    }
  );

  // Map Referring Domains
  const referringDomains: NormalizedReferringDomain[] = (
    refDomainsRes.data || []
  ).map((rd) => ({
    domain: rd.from_domain || "",
    backlinksCount: rd.total_links || 0,
    dofollowCount: rd.dofollow_links || 0,
    nofollowCount: rd.nofollow_links || 0,
    domainRank: 0,
    ip: null,
    country: null,
  }));

  // Map Anchor Text
  const totalAnchorLinks =
    (anchorsRes.data || []).reduce((acc, a) => acc + (a.link_count || 0), 0) ||
    totalBacklinks ||
    1;

  const anchors: NormalizedAnchorItem[] = (anchorsRes.data || []).map((a) => ({
    anchor: a.anchor_text || "(empty anchor)",
    backlinksCount: a.link_count || 0,
    referringDomainsCount: a.domain_count || 0,
    percentage: parseFloat(
      (((a.link_count || 0) / totalAnchorLinks) * 100).toFixed(1)
    ),
  }));

  // Map Top Pages
  const topPages: NormalizedTopPage[] = (topPagesRes.data || []).map((tp) => ({
    targetUrl: tp.url || "",
    backlinksCount: tp.inbound_links || 0,
    referringDomainsCount: tp.referring_domains || 0,
    dofollowCount: 0,
    nofollowCount: 0,
    brokenCount: tp.status_code === 404 ? tp.inbound_links || 0 : 0,
    httpStatus: tp.status_code || 200,
  }));

  const overview: NormalizedBacklinkOverview = {
    domain,
    totalBacklinks,
    referringDomains: totalReferringDomains,
    domainRank,
    dofollowCount,
    nofollowCount,
    newBacklinks: null,
    lostBacklinks: null,
    referringIps: null,
    referringSubnets: null,
    brokenBacklinks: topPages.reduce((acc, p) => acc + p.brokenCount, 0),
    suspiciousBacklinks: 0,
    provider: "rankparse",
    creditsUsed: totalCredits,
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
