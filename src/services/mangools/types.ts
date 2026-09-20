/**
 * Mangools API v3 & Normalized Backlinks Types
 * Provider-agnostic data representation for the Backlinks module
 * Official API Docs: https://apidocs.mangools.com/
 */

// ==========================================
// Raw Mangools API v3 Response Types
// ==========================================

export interface MangoolsSiteProfilerOverviewResponse {
  moz?: {
    pda?: number; // Moz Domain Authority (0-100)
    upa?: number; // Moz Page Authority (0-100)
    links?: number;
    equity?: number;
  };
  majestic?: {
    CitationFlow?: number;
    TrustFlow?: number;
    RefIPs?: number;
    RefSubNets?: number;
    RefDomains?: number;
    ExtBackLinks?: number;
    TopicalTrustFlow?: Array<{
      Topic?: string;
      TopicalTrustFlow?: number;
    }>;
  };
  topRank?: number; // Mangools composite rank
  rankDist?: {
    da?: Record<string, number>;
  };
  domain?: string;
  ip?: string;
  country?: string;
}

export interface MangoolsBacklinkCalendarItem {
  Date: string; // "YYYY-MM-DD"
  NewLinks?: number;
  LostLinks?: number;
  NewRefDomains?: number;
  LostRefDomains?: number;
}

export interface MangoolsRefDomainItem {
  domain: string;
  topRank?: number;
  matchedLinks?: number;
  citationFlow?: number;
  trustFlow?: number;
  alexaRank?: number;
  ip?: string;
}

export interface MangoolsAnchorItem {
  anchorText: string;
  totalLinks: number;
  refDomains: number;
  deletedLinks?: number;
  noFollowLinks?: number;
  class?: string;
}

export interface MangoolsSiteProfilerBacklinkProfileResponse {
  majestic?: {
    TotalNonUniqueLinks?: number;
    NonUniqueLinkTypeNoFollow?: number;
    NonUniqueLinkTypeDeleted?: number;
    NonUniqueLinkTypeRedirect?: number;
    NonUniqueLinkTypeImageLink?: number;
    NonUniqueLinkTypeTextLink?: number;
    RefDomains?: number;
    RefIPs?: number;
    RefSubNets?: number;
  };
  majesticBackLinkCalendar?: MangoolsBacklinkCalendarItem[];
  majesticRefDomains?: MangoolsRefDomainItem[];
  majesticAnchors?: MangoolsAnchorItem[];
  topRankDist?: Record<string, number>;
}

export interface MangoolsTopContentItem {
  url: string;
  citationFlow?: number;
  trustFlow?: number;
  refDomains?: number;
  extBackLinks?: number;
  topRank?: number;
  shares?: {
    facebook?: number;
    pinterest?: number;
  };
}

export interface MangoolsSiteProfilerTopContentResponse {
  topContent?: MangoolsTopContentItem[];
}

export interface MangoolsLinkMinerLinkItem {
  source: string; // Source URL
  target: string; // Target URL
  title?: string;
  type?: string; // "a", "img", etc.
  anchor?: string;
  last_crawl?: string;
  first_seen?: string;
  last_seen?: string;
  source_tf?: number;
  source_cf?: number;
  target_tf?: number;
  target_cf?: number;
  redirect?: string; // "true" | "false"
  no_follow?: string; // "true" | "false"
  deleted?: string; // "true" | "false"
  reason_lost?: string;
  domainId?: string; // Source domain
  ls?: number; // Link Strength (0-100)
}

export interface MangoolsLinkMinerResponse {
  _id?: string;
  meta?: {
    url_type?: string;
    available_links?: number;
  };
  available_links?: number;
  total?: number;
  links?: MangoolsLinkMinerLinkItem[];
}

export type MangoolsFetchProgressCallback = (progress: {
  fetchedRows: number;
  totalAvailable: number;
  currentPage: number;
  totalPages: number;
}) => void;

// ==========================================
// Provider-Agnostic Normalized Data Models
// ==========================================

export interface NormalizedBacklinkOverview {
  domain: string;
  totalBacklinks: number; // Primary customer-facing backlink count based on detailed records
  providerIndexedBacklinks?: number; // Raw provider macro indexed count (preserved internally)
  totalIndexedBacklinks?: number; // Internal macro count
  detailedBacklinksAvailable?: number; // Number of detailed backlink records available from provider
  detailedBacklinksFetched?: number; // Actual count of detailed backlink records retrieved
  referringDomains: number;
  domainRank: number | null;
  dofollowCount: number | null;
  nofollowCount: number | null;
  newBacklinks: number | null;
  lostBacklinks: number | null;
  referringIps: number | null;
  referringSubnets: number | null;
  brokenBacklinks: number;
  suspiciousBacklinks: number;
  provider: "mangools";
  status?: "pending" | "fetching" | "completed" | "partially_completed" | "failed";
  availableRowRecords?: number;
  fetchedRowsCount?: number;
  lastFetchedPage?: number;
  costMetrics?: {
    apiCallsCount: number;
    pagesFetched: number;
    creditsConsumed: number;
  };
  creditsUsed: number;
  fetchedAt: Date;
}

export interface NormalizedBacklinkRecord {
  sourceDomain: string;
  sourceUrl: string;
  targetUrl: string;
  anchor: string | null;
  isDofollow: boolean;
  domainRank: number;
  pageRank: number;
  httpStatus: number;
  linkType: string;
  isNew: boolean;
  isLost: boolean;
  isBroken: boolean;
  isSuspicious: boolean;
  lossReason: string | null;
  crawledAt: Date | null;
  firstSeen: Date | null;
  lastSeen: Date | null;
}

export interface NormalizedReferringDomain {
  domain: string;
  backlinksCount: number;
  dofollowCount: number;
  nofollowCount: number;
  domainRank: number;
  ip: string | null;
  country: string | null;
}

export interface NormalizedAnchorItem {
  anchor: string;
  backlinksCount: number;
  referringDomainsCount: number;
  percentage: number;
}

export interface NormalizedTopPage {
  targetUrl: string;
  backlinksCount: number;
  referringDomainsCount: number;
  dofollowCount: number;
  nofollowCount: number;
  brokenCount: number;
  httpStatus: number;
}

export interface NormalizedBacklinkDataset {
  overview: NormalizedBacklinkOverview;
  backlinks: NormalizedBacklinkRecord[];
  referringDomains: NormalizedReferringDomain[];
  anchors: NormalizedAnchorItem[];
  topPages: NormalizedTopPage[];
}
