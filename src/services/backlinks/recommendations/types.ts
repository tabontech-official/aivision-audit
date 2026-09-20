/**
 * Backlink Recommendation Engine Types
 */

export type RecommendationSeverity =
  | "Critical"
  | "High"
  | "Medium"
  | "Low"
  | "Opportunity"
  | "Good";

export type RecommendationConfidence = "High" | "Medium" | "Low";

export interface RecommendationEvidenceItem {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export interface GeneratedRecommendation {
  ruleKey: string;
  title: string;
  severity: RecommendationSeverity;
  priorityScore: number; // 0-100
  confidence: RecommendationConfidence;
  whatWeFound: string;
  whyItMatters: string;
  howToImprove: string;
  targetTab?: "backlinks" | "referring_domains" | "anchors" | "top_pages" | "new_lost";
  filterParams?: Record<string, unknown>;
  evidence: RecommendationEvidenceItem[];
  actions: string[];
}

export interface RecommendationContext {
  domain: string;
  totalBacklinks: number;
  referringDomains: number;
  domainRank: number | null;
  referringIps?: number | null;
  referringSubnets?: number | null;
  dofollowCount: number;
  nofollowCount: number;
  brokenCount: number;
  suspiciousCount: number;
  newBacklinksCount: number;
  lostBacklinksCount: number;
  backlinks: Array<{
    id?: string;
    sourceDomain: string;
    sourceUrl: string;
    targetUrl: string;
    anchor: string | null;
    isDofollow: boolean;
    domainRank: number;
    httpStatus: number;
    linkType?: string;
    isNew: boolean;
    isLost: boolean;
    isBroken: boolean;
    isSuspicious: boolean;
    lossReason: string | null;
  }>;
  referringDomainsList: Array<{
    domain: string;
    backlinksCount: number;
    dofollowCount: number;
    nofollowCount: number;
    domainRank: number;
  }>;
  anchors: Array<{
    anchor: string;
    backlinksCount: number;
    referringDomainsCount: number;
    percentage: number;
    classification: string;
  }>;
  topPages: Array<{
    targetUrl: string;
    backlinksCount: number;
    referringDomainsCount: number;
    brokenCount: number;
  }>;
}
