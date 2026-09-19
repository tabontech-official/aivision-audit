/**
 * RankParse API & Normalized Backlinks Types
 * Provider-agnostic data representation for the Backlinks module
 */

// ==========================================
// Raw RankParse API Response Types
// ==========================================

export interface RankParseDomainAuthorityResponse {
  data: {
    score: number; // 0-100 authority score
    referring_domains: number;
    total_host_count: number;
  };
  domain: string;
  credits_used: number;
  credits_remaining?: number;
}

export interface RankParseBacklinkItem {
  from_domain: string;
  from_url: string;
  to_url: string;
  anchor_text: string | null;
  rel: string | null; // e.g. "nofollow", "sponsored", "ugc", or null (dofollow)
  link_type: string; // "a", "img", etc.
  domain_host_count?: number;
  crawled_at?: string; // e.g. "2026-02-10"
}

export interface RankParseBacklinksResponse {
  data: RankParseBacklinkItem[];
  domain: string;
  total: number;
  limit: number;
  offset: number;
  credits_used: number;
  credits_remaining?: number;
  crawl_release?: string;
  cached?: boolean;
}

export interface RankParseReferringDomainItem {
  from_domain: string;
  dofollow_links: number;
  nofollow_links: number;
  total_links: number;
}

export interface RankParseReferringDomainsResponse {
  data: RankParseReferringDomainItem[];
  domain: string;
  total: number;
  credits_used: number;
  credits_remaining?: number;
}

export interface RankParseAnchorItem {
  anchor_text: string;
  link_count: number;
  domain_count: number;
}

export interface RankParseAnchorTextResponse {
  data: RankParseAnchorItem[];
  credits_used: number;
}

export interface RankParseTopPageItem {
  url: string;
  inbound_links: number;
  referring_domains: number;
  status_code: number;
  mime?: string;
}

export interface RankParseTopPagesResponse {
  data: RankParseTopPageItem[];
  credits_used: number;
}

// ==========================================
// Provider-Agnostic Normalized Data Models
// ==========================================

export interface NormalizedBacklinkOverview {
  domain: string;
  totalBacklinks: number;
  referringDomains: number;
  domainRank: number;
  dofollowCount: number;
  nofollowCount: number;
  newBacklinks: number | null; // null: RankParse does not provide historical link changes
  lostBacklinks: number | null;
  referringIps: number | null; // null: not supplied by RankParse
  referringSubnets: number | null; // null: not supplied by RankParse
  brokenBacklinks: number;
  suspiciousBacklinks: number;
  provider: "rankparse";
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
