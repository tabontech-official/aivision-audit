/**
 * Backlink Recommendation Engine - Configurable Rule Settings & Thresholds
 * Designed to be manageable in Master Admin configuration in future iterations.
 */

export interface BacklinkRuleConfig {
  enabled: boolean;
  minSampleSize: number;
  thresholds: Record<string, number>;
}

export const RECOMMENDATION_RULES_CONFIG: Record<string, BacklinkRuleConfig> = {
  // 1. Broken targets (404/broken destination URLs)
  BACKLINK_BROKEN_TARGETS: {
    enabled: true,
    minSampleSize: 1,
    thresholds: {
      minBrokenCount: 1,
      criticalBrokenRatio: 0.10, // >10% broken links is Critical
      highBrokenCount: 5,
    },
  },

  // 2. Lost / deleted backlinks
  BACKLINK_LOST_BACKLINKS: {
    enabled: true,
    minSampleSize: 5,
    thresholds: {
      minLostCount: 1,
      highAuthorityLostThreshold: 30, // Lost links from DR 30+
    },
  },

  // 3. Referring domain diversity
  BACKLINK_LOW_DOMAIN_DIVERSITY: {
    enabled: true,
    minSampleSize: 15,
    thresholds: {
      lowDiversityRatio: 0.12, // e.g. < 12 domains per 100 links
      criticalDiversityRatio: 0.05, // e.g. < 5 domains per 100 links
    },
  },

  // 4. Single referring domain concentration
  BACKLINK_SINGLE_DOMAIN_CONCENTRATION: {
    enabled: true,
    minSampleSize: 20,
    thresholds: {
      maxDomainShare: 0.35, // > 35% links from single domain
      criticalDomainShare: 0.60, // > 60% links from single domain
    },
  },

  // 5. Homepage vs deep page inbound distribution
  BACKLINK_HOMEPAGE_CONCENTRATION: {
    enabled: true,
    minSampleSize: 15,
    thresholds: {
      homepageConcentrationRatio: 0.80, // > 80% links point to homepage
      minDeepPagesTracked: 2,
    },
  },

  // 6. Anchor text commercial exact-match concentration
  BACKLINK_ANCHOR_CONCENTRATION: {
    enabled: true,
    minSampleSize: 15,
    thresholds: {
      maxExactMatchRatio: 0.25, // > 25% exact-match commercial anchors
      singleAnchorDominanceRatio: 0.35, // > 35% single anchor
    },
  },

  // 7. Low branded anchor presence
  BACKLINK_LOW_BRANDED_ANCHORS: {
    enabled: true,
    minSampleSize: 15,
    thresholds: {
      minBrandedAnchorRatio: 0.15, // < 15% branded anchors
    },
  },

  // 8. Follow / nofollow attribute concentration
  BACKLINK_FOLLOW_ATTRIBUTE_IMBALANCE: {
    enabled: true,
    minSampleSize: 20,
    thresholds: {
      skewedDofollowUpper: 0.98, // > 98% dofollow
      skewedNofollowLower: 0.20, // < 20% dofollow (over 80% nofollow)
    },
  },

  // 9. Referring domain quality
  BACKLINK_LOW_AUTHORITY_DOMAINS: {
    enabled: true,
    minSampleSize: 15,
    thresholds: {
      lowDomainRankThreshold: 10,
      lowRankRatio: 0.70, // > 70% links from DR < 10
    },
  },

  // 10. Suspicious link patterns
  BACKLINK_SUSPICIOUS_PATTERNS: {
    enabled: true,
    minSampleSize: 5,
    thresholds: {
      minSuspiciousCount: 1,
      suspiciousRatio: 0.05,
    },
  },

  // 11. Positive authority / healthy profile acknowledgments
  BACKLINK_HEALTHY_AUTHORITY_PROFILE: {
    enabled: true,
    minSampleSize: 10,
    thresholds: {
      minHighAuthorityDR: 40,
      minHighAuthCount: 2,
    },
  },

  // 12. Sitewide repetitive link concentration
  BACKLINK_SITEWIDE_CONCENTRATION: {
    enabled: true,
    minSampleSize: 25,
    thresholds: {
      avgLinksPerDomainThreshold: 15, // > 15 links per domain on average
      criticalLinksPerDomainThreshold: 30, // > 30 links per domain
    },
  },

  // 13. IP and C-Class subnet clustering (PBN / network risk)
  BACKLINK_IP_SUBNET_CONCENTRATION: {
    enabled: true,
    minSampleSize: 15,
    thresholds: {
      minRefDomains: 10,
      ipToDomainRatioThreshold: 0.50, // e.g. 20 domains on < 10 distinct IPs
    },
  },

  // 14. Generic anchor text saturation ("click here", "website", "link")
  BACKLINK_GENERIC_ANCHOR_SATURATION: {
    enabled: true,
    minSampleSize: 15,
    thresholds: {
      maxGenericRatio: 0.15, // > 15% generic anchors
    },
  },

  // 15. Naked URL anchor dominance (raw https:// urls)
  BACKLINK_NAKED_URL_DOMINANCE: {
    enabled: true,
    minSampleSize: 15,
    thresholds: {
      maxNakedUrlRatio: 0.45, // > 45% naked URLs
    },
  },

  // 16. Low authority backlink concentration
  BACKLINK_LOW_AUTHORITY_CONCENTRATION: {
    enabled: true,
    minSampleSize: 20,
    thresholds: {
      lowDRThreshold: 15,
      lowDRShareThreshold: 0.65, // > 65% links from DR < 15
    },
  },

  // 17. High authority Tier-1 link expansion opportunity
  BACKLINK_HIGH_AUTHORITY_EXPANSION: {
    enabled: true,
    minSampleSize: 10,
    thresholds: {
      tier1DRThreshold: 50,
      minTier1Count: 1, // 0 Tier-1 links
    },
  },

  // 18. Inbound 301 redirect targets audit
  BACKLINK_REDIRECT_TARGETS: {
    enabled: true,
    minSampleSize: 10,
    thresholds: {
      minRedirectCount: 3,
      redirectRatioThreshold: 0.05,
    },
  },

  // 19. Deep content equity imbalance
  BACKLINK_CONTENT_EQUITY_IMBALANCE: {
    enabled: true,
    minSampleSize: 20,
    thresholds: {
      minTrackedPages: 3,
      topTwoShareThreshold: 0.90, // Top 2 pages hold > 90% links
    },
  },

  // 20. Image and visual link distribution
  BACKLINK_IMAGE_LINK_OPPORTUNITY: {
    enabled: true,
    minSampleSize: 25,
    thresholds: {
      maxImageShare: 0.02, // < 2% visual/image links
    },
  },

  // 21. High velocity link acquisition momentum
  BACKLINK_HIGH_VELOCITY_GROWTH: {
    enabled: true,
    minSampleSize: 15,
    thresholds: {
      velocityRatioThreshold: 0.08, // > 8% new links in 30 days
    },
  },

  // 22. .EDU and .GOV Institutional Authority Opportunity
  BACKLINK_EDU_GOV_OPPORTUNITY: {
    enabled: true,
    minSampleSize: 20,
    thresholds: {
      minInstitutionalCount: 1,
    },
  },

  // 23. Active .EDU or .GOV Institutional Endorsement (Positive Signal)
  BACKLINK_EDU_GOV_ACTIVE: {
    enabled: true,
    minSampleSize: 5,
    thresholds: {
      minInstitutionalCount: 1,
    },
  },

  // 24. Spam / High-Risk TLD Footprint (.xyz, .top, .buzz, .click, etc.)
  BACKLINK_SPAM_TLD_RISK: {
    enabled: true,
    minSampleSize: 20,
    thresholds: {
      maxSpamTldShare: 0.08, // > 8% from spam TLDs
    },
  },

  // 25. International ccTLD Diversity Opportunity
  BACKLINK_INTERNATIONAL_TLD_DIVERSITY: {
    enabled: true,
    minSampleSize: 30,
    thresholds: {
      minDistinctCcTlds: 2,
    },
  },

  // 26. Non-Profit (.ORG) Authority Endorsements
  BACKLINK_ORGANIZATION_TRUST_SIGNAL: {
    enabled: true,
    minSampleSize: 10,
    thresholds: {
      minOrgCount: 2,
    },
  },

  // 27. Single-Word Keyword Anchor Saturation
  BACKLINK_SHORT_ANCHOR_SATURATION: {
    enabled: true,
    minSampleSize: 15,
    thresholds: {
      maxSingleWordShare: 0.40, // > 40% single-word keyword anchors
    },
  },

  // 28. Long-Tail Contextual Phrase Anchor Opportunity
  BACKLINK_LONGTAIL_ANCHOR_OPPORTUNITY: {
    enabled: true,
    minSampleSize: 20,
    thresholds: {
      minLongtailShare: 0.10, // < 10% long-tail conversational anchors
    },
  },

  // 29. Empty / Missing Anchor Text Concentration
  BACKLINK_EMPTY_ANCHOR_CONCENTRATION: {
    enabled: true,
    minSampleSize: 15,
    thresholds: {
      maxEmptyAnchorShare: 0.15, // > 15% empty anchors
    },
  },

  // 30. Foreign Language Script Anchor Anomaly
  BACKLINK_FOREIGN_LANGUAGE_ANCHORS: {
    enabled: true,
    minSampleSize: 10,
    thresholds: {
      maxForeignShare: 0.05, // > 5% non-Latin scripts
    },
  },

  // 31. Compound Brand + Keyword Anchor Opportunity
  BACKLINK_COMPOUND_BRAND_OPPORTUNITY: {
    enabled: true,
    minSampleSize: 20,
    thresholds: {
      minPartialMatchShare: 0.10, // < 10% compound brand+keyword anchors
    },
  },

  // 32. Repetitive Anchor Phrase Cluster
  BACKLINK_REPETITIVE_ANCHOR_CLUSTERS: {
    enabled: true,
    minSampleSize: 30,
    thresholds: {
      maxSinglePhraseRepetition: 40, // Repeated > 40 times
    },
  },

  // 33. Unencrypted HTTP Inbound Links (Security / Protocol)
  BACKLINK_HTTP_UNENCRYPTED_INBOUND: {
    enabled: true,
    minSampleSize: 15,
    thresholds: {
      minHttpCount: 3,
      httpRatioThreshold: 0.10, // > 10% links point to http://
    },
  },

  // 34. Inbound Links Pointing to URL Tracking Parameters (?utm_ / ?ref=)
  BACKLINK_URL_QUERY_PARAM_TARGETS: {
    enabled: true,
    minSampleSize: 15,
    thresholds: {
      minParamCount: 3,
      paramRatioThreshold: 0.05,
    },
  },

  // 35. Mixed Trailing Slash Inbound Link Targets
  BACKLINK_TRAILING_SLASH_INCONSISTENCY: {
    enabled: true,
    minSampleSize: 20,
    thresholds: {
      minInconsistentCount: 3,
    },
  },

  // 36. Legacy Subdomain Link Equity Fragmentation
  BACKLINK_SUBDOMAIN_EQUITY_LEAK: {
    enabled: true,
    minSampleSize: 15,
    thresholds: {
      minSubdomainCount: 2,
    },
  },

  // 37. Deep Leaf Page Link Deficit (URL path depth >= 2)
  BACKLINK_DEEP_LEAF_PAGE_DEFICIT: {
    enabled: true,
    minSampleSize: 20,
    thresholds: {
      minDeepLeafPages: 1,
    },
  },

  // 38. Citation Flow vs Trust Flow Disparity (CF >> TF)
  BACKLINK_TRUST_FLOW_CITATION_IMBALANCE: {
    enabled: true,
    minSampleSize: 15,
    thresholds: {
      minDisparityRatio: 2.5, // Citation Flow > 2.5x Trust Flow
    },
  },

  // 39. High Trust Flow / Clean Quality Index (Positive Signal)
  BACKLINK_HIGH_TRUST_FLOW_SIGNAL: {
    enabled: true,
    minSampleSize: 10,
    thresholds: {
      minTrustFlow: 30,
    },
  },

  // 40. Dofollow Equity Limited to Low-Authority Domains
  BACKLINK_DOFOLLOW_EQUITY_ON_LOW_DR: {
    enabled: true,
    minSampleSize: 20,
    thresholds: {
      minLowDRShareOfDofollow: 0.80, // > 80% of dofollow links are on DR < 15
    },
  },

  // 41. Mid-Tier Authority Momentum (DR 25-49 Domains Active)
  BACKLINK_TIER2_AUTHORITY_MOMENTUM: {
    enabled: true,
    minSampleSize: 10,
    thresholds: {
      minTier2DomainsCount: 3,
    },
  },

  // 42. Elite Authority Endorsement (DR 70+ Backlinks Active)
  BACKLINK_ELITE_AUTHORITY_SIGNAL: {
    enabled: true,
    minSampleSize: 5,
    thresholds: {
      minEliteDR: 70,
      minEliteCount: 1,
    },
  },

  // 43. Accelerated Link Loss Risk (> 20% profile loss)
  BACKLINK_LINK_LOSS_ACCELERATION: {
    enabled: true,
    minSampleSize: 15,
    thresholds: {
      criticalLossShare: 0.15, // > 15% of profile marked lost
    },
  },

  // 44. Dormant Link Acquisition Profile
  BACKLINK_DORMANT_LINK_ACQUISITION: {
    enabled: true,
    minSampleSize: 25,
    thresholds: {
      maxNewInWindow: 0,
    },
  },

  // 45. Sustainable Net Link Velocity Growth (Positive Signal)
  BACKLINK_STEADY_GROWTH_MOMENTUM: {
    enabled: true,
    minSampleSize: 15,
    thresholds: {
      minNetGrowthCount: 5,
    },
  },

  // 46. High-DR Referring Domain Loss Alert
  BACKLINK_HIGH_DR_LINK_LOSS_ALERT: {
    enabled: true,
    minSampleSize: 5,
    thresholds: {
      minLostDR: 40,
    },
  },

  // 47. Multi-Pillar Deep Page Link Distribution (Positive Signal)
  BACKLINK_MULTI_PAGE_EQUITY_BALANCE: {
    enabled: true,
    minSampleSize: 20,
    thresholds: {
      minPagesWithLinks: 5,
    },
  },

  // 48. Balanced Natural Anchor Distribution (Positive Signal)
  BACKLINK_BALANCED_ANCHOR_DISTRIBUTION: {
    enabled: true,
    minSampleSize: 25,
    thresholds: {
      minBrandedPct: 15,
      maxBrandedPct: 60,
      minUrlPct: 10,
      maxExactPct: 25,
    },
  },

  // 49. Exceptional Referring Domain Diversity (Positive Signal)
  BACKLINK_DOMAIN_DIVERSITY_EXCELLENCE: {
    enabled: true,
    minSampleSize: 20,
    thresholds: {
      minDiversityRatio: 0.25, // > 25% diversity ratio
    },
  },

  // 50. Natural Dofollow/Nofollow Balance (Positive Signal)
  BACKLINK_HEALTHY_DOFOLLOW_RATIO: {
    enabled: true,
    minSampleSize: 20,
    thresholds: {
      minDofollowRatio: 0.60,
      maxDofollowRatio: 0.88,
    },
  },
};
