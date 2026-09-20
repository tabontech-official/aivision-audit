/**
 * Backlink Recommendations Engine
 * Evaluates real, stored backlink audit datasets against deterministic rules
 * and returns structured, actionable recommendations with evidence.
 */

import {
  GeneratedRecommendation,
  RecommendationContext,
  RecommendationSeverity,
} from "./types";
import { RECOMMENDATION_RULES_CONFIG } from "./config";

export function generateBacklinkRecommendations(
  ctx: RecommendationContext
): GeneratedRecommendation[] {
  const recommendations: GeneratedRecommendation[] = [];
  const total = ctx.totalBacklinks || ctx.backlinks.length;

  if (total === 0) {
    return [
      {
        ruleKey: "BACKLINK_NO_DATA",
        title: "No Inbound Backlinks Detected",
        severity: "Medium",
        priorityScore: 50,
        confidence: "High",
        whatWeFound: `No active external backlinks were found pointing to ${ctx.domain}.`,
        whyItMatters:
          "Backlinks from relevant, reputable websites provide essential trust and authority signals to search engines.",
        howToImprove:
          "Begin foundational link acquisition through high-authority directory citations, partner websites, digital PR, and creating linkable content assets.",
        targetTab: "backlinks",
        evidence: [
          { label: "Analyzed Backlinks", value: 0 },
          { label: "Referring Domains", value: 0 },
        ],
        actions: [
          "Claim foundational business profile citations and industry directories",
          "Publish high-quality research, calculators, or guides that naturally earn references",
          "Reach out to industry partners, suppliers, and client case studies for editorial links",
        ],
      },
    ];
  }

  // -------------------------------------------------------------
  // Rule 1: Broken Incoming Targets (404/410 Destination URLs)
  // -------------------------------------------------------------
  const brokenCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_BROKEN_TARGETS;
  if (brokenCfg?.enabled && ctx.brokenCount > 0) {
    const brokenLinks = ctx.backlinks.filter((b) => b.isBroken || b.httpStatus === 404);
    const brokenRatio = ctx.brokenCount / total;
    const isCritical = brokenRatio >= (brokenCfg.thresholds.criticalBrokenRatio || 0.10) || ctx.brokenCount >= (brokenCfg.thresholds.highBrokenCount || 5);
    const severity: RecommendationSeverity = isCritical ? "Critical" : "High";
    const priorityScore = isCritical ? 95 : 85;

    // Find unique broken target URLs
    const brokenUrlsSet = new Set(brokenLinks.map((b) => b.targetUrl));
    const sampleBrokenUrls = Array.from(brokenUrlsSet).slice(0, 3).join(", ");

    recommendations.push({
      ruleKey: "BACKLINK_BROKEN_TARGETS",
      title: "Recover Broken Backlink Equity",
      severity,
      priorityScore,
      confidence: "High",
      whatWeFound: `${ctx.brokenCount} incoming ${ctx.brokenCount === 1 ? "backlink points" : "backlinks point"} to destination pages on your website that return a 404 or broken error code.`,
      whyItMatters:
        "When an external website links to a dead URL on your domain, both user traffic and SEO ranking equity are wasted because the destination page no longer resolves.",
      howToImprove:
        "Implement 301 permanent redirects from the dead URLs to the most relevant active pages on your site, or recreate the missing pages if their content is still valuable.",
      targetTab: "backlinks",
      filterParams: { type: "broken" },
      evidence: [
        { label: "Broken Backlinks", value: ctx.brokenCount, highlight: true },
        { label: "% of Backlink Profile", value: `${(brokenRatio * 100).toFixed(1)}%` },
        { label: "Unique Broken Target URLs", value: brokenUrlsSet.size },
      ],
      actions: [
        "Review the broken destination URLs in the Backlinks table",
        "Set up 301 redirects in your server, router, or CMS to point broken URLs to relevant live pages",
        "If a high-value page was mistakenly deleted, restore the original content at that URL",
        sampleBrokenUrls ? `Check destination URL: ${sampleBrokenUrls}` : "Verify URL routing for all affected destinations",
      ],
    });
  }

  // -------------------------------------------------------------
  // Rule 2: Lost / Deleted Backlinks
  // -------------------------------------------------------------
  const lostCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_LOST_BACKLINKS;
  if (lostCfg?.enabled && ctx.lostBacklinksCount > 0 && total >= (lostCfg.minSampleSize || 5)) {
    const lostLinks = ctx.backlinks.filter((b) => b.isLost);
    const highAuthLost = lostLinks.filter((b) => b.domainRank >= (lostCfg.thresholds.highAuthorityLostThreshold || 30));
    const severity: RecommendationSeverity = highAuthLost.length > 0 ? "High" : "Medium";
    const priorityScore = highAuthLost.length > 0 ? 78 : 65;

    recommendations.push({
      ruleKey: "BACKLINK_LOST_BACKLINKS",
      title: "Investigate and Reclaim Lost Backlinks",
      severity,
      priorityScore,
      confidence: "High",
      whatWeFound: `${ctx.lostBacklinksCount} ${ctx.lostBacklinksCount === 1 ? "backlink was" : "backlinks were"} recently marked as lost or removed${highAuthLost.length > 0 ? `, including ${highAuthLost.length} from high-authority sources (DR 30+)` : ""}.`,
      whyItMatters:
        "Losing established backlinks can cause gradual declines in domain authority and keyword ranking stability if not monitored and recovered.",
      howToImprove:
        "Inspect whether the link was dropped due to source page redesigns, URL restructuring, or accidental content removal, and perform targeted outreach to restore editorial mentions.",
      targetTab: "new_lost",
      evidence: [
        { label: "Lost Backlinks", value: ctx.lostBacklinksCount, highlight: true },
        { label: "High-Authority Lost (DR 30+)", value: highAuthLost.length },
      ],
      actions: [
        "Inspect the New & Lost tab to review referring pages that removed their links",
        "Check if destination URLs on your site changed and require 301 redirects",
        "Contact referring webmasters or editors with updated content assets to request link reinstatement",
      ],
    });
  }

  // -------------------------------------------------------------
  // Rule 3: Referring Domain Diversity
  // -------------------------------------------------------------
  const divCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_LOW_DOMAIN_DIVERSITY;
  if (divCfg?.enabled && total >= (divCfg.minSampleSize || 15)) {
    const diversityRatio = ctx.referringDomains / total;
    const isCritical = diversityRatio < (divCfg.thresholds.criticalDiversityRatio || 0.05);
    const isLow = diversityRatio < (divCfg.thresholds.lowDiversityRatio || 0.12);

    if (isLow) {
      recommendations.push({
        ruleKey: "BACKLINK_LOW_DOMAIN_DIVERSITY",
        title: "Improve Referring Domain Diversity",
        severity: isCritical ? "High" : "Medium",
        priorityScore: isCritical ? 75 : 62,
        confidence: "High",
        whatWeFound: `${total.toLocaleString()} backlinks are originating from only ${ctx.referringDomains.toLocaleString()} referring domains (${(diversityRatio * 100).toFixed(1)}% diversity ratio).`,
        whyItMatters:
          "Search engines value links from a broad spectrum of distinct, reputable domains more than repeated links from a small handful of existing websites.",
        howToImprove:
          "Diversify future outreach campaigns toward new root domains in your industry rather than acquiring additional links on domains that already link to you.",
        targetTab: "referring_domains",
        evidence: [
          { label: "Total Backlinks", value: total.toLocaleString() },
          { label: "Unique Referring Domains", value: ctx.referringDomains.toLocaleString(), highlight: true },
          { label: "Diversity Ratio", value: `${(diversityRatio * 100).toFixed(1)}%` },
        ],
        actions: [
          "Focus future link building on unlinked industry publications, partner websites, and niche directories",
          "Leverage digital PR to earn coverage in trade blogs and regional business news",
          "Create original industry reports or infographics to encourage new domains to reference your data",
        ],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 4: Single Referring Domain Dominance
  // -------------------------------------------------------------
  const domConcCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_SINGLE_DOMAIN_CONCENTRATION;
  if (domConcCfg?.enabled && total >= (domConcCfg.minSampleSize || 20) && ctx.referringDomainsList.length > 0) {
    const topDomain = ctx.referringDomainsList[0];
    if (topDomain) {
      const topDomainShare = topDomain.backlinksCount / total;
      if (topDomainShare >= (domConcCfg.thresholds.maxDomainShare || 0.35)) {
        recommendations.push({
          ruleKey: "BACKLINK_SINGLE_DOMAIN_CONCENTRATION",
          title: "Reduce Single-Domain Backlink Concentration",
          severity: topDomainShare >= (domConcCfg.thresholds.criticalDomainShare || 0.60) ? "High" : "Medium",
          priorityScore: topDomainShare >= 0.60 ? 70 : 58,
          confidence: "High",
          whatWeFound: `A single referring domain (${topDomain.domain}) contributes ${topDomain.backlinksCount.toLocaleString()} backlinks, representing ${(topDomainShare * 100).toFixed(1)}% of your entire backlink profile.`,
          whyItMatters:
            "Having a high percentage of links concentrated on a single website usually indicates repeated sitewide/footer templates, which carry diminishing SEO returns compared to diverse root domains.",
          howToImprove:
            "Acquire links across additional distinct websites to balance authority distribution and build a more resilient link profile.",
          targetTab: "referring_domains",
          evidence: [
            { label: "Top Domain", value: topDomain.domain, highlight: true },
            { label: "Links from Top Domain", value: topDomain.backlinksCount.toLocaleString() },
            { label: "Profile Concentration", value: `${(topDomainShare * 100).toFixed(1)}%` },
          ],
          actions: [
            `Audit links from ${topDomain.domain} to ensure they are editorial rather than unintended sitewide duplication`,
            "Broaden outreach initiatives to earn editorial citations from other relevant industry websites",
          ],
        });
      }
    }
  }

  // -------------------------------------------------------------
  // Rule 5: Homepage-Heavy Link Distribution
  // -------------------------------------------------------------
  const homeCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_HOMEPAGE_CONCENTRATION;
  if (homeCfg?.enabled && total >= (homeCfg.minSampleSize || 15) && ctx.topPages.length >= 2) {
    // Check if top page is homepage
    const homePage = ctx.topPages.find((p) => {
      const path = p.targetUrl.replace(/^https?:\/\/[^/]+/i, "");
      return path === "" || path === "/" || path.startsWith("/?");
    }) || ctx.topPages[0];

    if (homePage) {
      const totalPagesBacklinks = ctx.topPages.reduce((sum, p) => sum + p.backlinksCount, 0) || total;
      const homeShare = Math.min(1, homePage.backlinksCount / Math.max(totalPagesBacklinks, total));
      if (homeShare >= (homeCfg.thresholds.homepageConcentrationRatio || 0.80)) {
        recommendations.push({
          ruleKey: "BACKLINK_HOMEPAGE_CONCENTRATION",
          title: "Distribute Inbound Links to Deep Content Pages",
          severity: "Opportunity",
          priorityScore: 50,
          confidence: "Medium",
          whatWeFound: `${(homeShare * 100).toFixed(1)}% of inbound backlinks point exclusively to your homepage.`,
          whyItMatters:
            "While homepage authority is valuable, earning direct links to deeper product, service, and blog content pages boosts their individual search ranking power and topical relevance.",
          howToImprove:
            "Direct future link-building outreach, resource guides, and partner references toward specific landing pages, product category hubs, or pillar articles.",
          targetTab: "top_pages",
          evidence: [
            { label: "Homepage Links", value: homePage.backlinksCount.toLocaleString(), highlight: true },
            { label: "Homepage Share", value: `${(homeShare * 100).toFixed(1)}%` },
            { label: "Deep Pages Tracked", value: ctx.topPages.length - 1 },
          ],
          actions: [
            "Review the Top Pages tab to identify key service/content pages with 0 or few backlinks",
            "Create high-value data studies, tools, or templates on deep pages to attract direct inbound references",
            "Use internal linking from the homepage to distribute equity downward to critical conversion pages",
          ],
        });
      }
    }
  }

  // -------------------------------------------------------------
  // Rule 6: Anchor Text Exact-Match Concentration
  // -------------------------------------------------------------
  const anchorCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_ANCHOR_CONCENTRATION;
  if (anchorCfg?.enabled && total >= (anchorCfg.minSampleSize || 15) && ctx.anchors.length > 0) {
    const totalAnchorCount = ctx.anchors.reduce((sum, a) => sum + a.backlinksCount, 0) || total;
    const exactMatchAnchors = ctx.anchors.filter((a) => a.classification === "EXACT_MATCH");
    const exactMatchCount = exactMatchAnchors.reduce((sum, a) => sum + a.backlinksCount, 0);
    const exactMatchRatio = exactMatchCount / totalAnchorCount;

    const dominantAnchor = ctx.anchors[0];
    const dominantShare = dominantAnchor ? dominantAnchor.backlinksCount / totalAnchorCount : 0;

    if (exactMatchRatio >= (anchorCfg.thresholds.maxExactMatchRatio || 0.25) && exactMatchAnchors.length > 0) {
      recommendations.push({
        ruleKey: "BACKLINK_ANCHOR_CONCENTRATION",
        title: "Diversify Commercial Exact-Match Anchor Text",
        severity: exactMatchRatio >= 0.40 ? "High" : "Medium",
        priorityScore: exactMatchRatio >= 0.40 ? 72 : 58,
        confidence: "Medium",
        whatWeFound: `Exact-match commercial keyword anchors account for ${(exactMatchRatio * 100).toFixed(1)}% (${exactMatchCount.toLocaleString()} links) of your analyzed backlink profile.`,
        whyItMatters:
          "A naturally acquired backlink profile generally features a healthy mix of brand names, full URLs, and conversational phrases. Excessive exact-match anchors can trigger search engine over-optimization filters.",
        howToImprove:
          "Favor branded anchors, website URLs, and natural contextual phrases in future link acquisition and partner mentions.",
        targetTab: "anchors",
        evidence: [
          { label: "Exact Match Share", value: `${(exactMatchRatio * 100).toFixed(1)}%`, highlight: true },
          { label: "Exact Match Backlinks", value: exactMatchCount.toLocaleString() },
          { label: "Top Anchor Phrase", value: `"${dominantAnchor?.anchor || "—"}"` },
        ],
        actions: [
          "Review the Anchor Text tab to inspect keyword phrase frequencies",
          "Ensure new partner links and citations use your official company brand name or clean URLs",
          "Encourage natural editorial variation when authors write about your business",
        ],
      });
    } else if (dominantShare >= (anchorCfg.thresholds.singleAnchorDominanceRatio || 0.35) && dominantAnchor && dominantAnchor.classification !== "BRANDED") {
      recommendations.push({
        ruleKey: "BACKLINK_SINGLE_ANCHOR_DOMINANCE",
        title: "Anchor Text Diversity Opportunity",
        severity: "Opportunity",
        priorityScore: 48,
        confidence: "Medium",
        whatWeFound: `The anchor phrase "${dominantAnchor.anchor}" represents ${(dominantShare * 100).toFixed(1)}% (${dominantAnchor.backlinksCount.toLocaleString()} links) of all analyzed anchor text.`,
        whyItMatters:
          "Broad anchor variation signals natural editorial interest from third-party writers across the web.",
        howToImprove:
          "Vary anchor text across brand variations, domain URLs, and relevant topic phrases in upcoming outreach campaigns.",
        targetTab: "anchors",
        evidence: [
          { label: "Dominant Anchor", value: `"${dominantAnchor.anchor}"`, highlight: true },
          { label: "Backlinks with Anchor", value: dominantAnchor.backlinksCount.toLocaleString() },
          { label: "Profile Share", value: `${(dominantShare * 100).toFixed(1)}%` },
        ],
        actions: [
          "Check the Anchor Text tab for top anchor distributions",
          "Aim for brand names and naked URLs in upcoming citations to balance text variation",
        ],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 7: Low Branded Anchor Presence
  // -------------------------------------------------------------
  const brandCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_LOW_BRANDED_ANCHORS;
  if (brandCfg?.enabled && total >= (brandCfg.minSampleSize || 15) && ctx.anchors.length > 0) {
    const totalAnchorCount = ctx.anchors.reduce((sum, a) => sum + a.backlinksCount, 0) || total;
    const brandedAnchors = ctx.anchors.filter((a) => a.classification === "BRANDED");
    const brandedCount = brandedAnchors.reduce((sum, a) => sum + a.backlinksCount, 0);
    const brandedRatio = brandedCount / totalAnchorCount;

    if (brandedRatio < (brandCfg.thresholds.minBrandedAnchorRatio || 0.15)) {
      recommendations.push({
        ruleKey: "BACKLINK_LOW_BRANDED_ANCHORS",
        title: "Strengthen Branded Anchor Presence",
        severity: "Opportunity",
        priorityScore: 45,
        confidence: "Medium",
        whatWeFound: `Branded anchor text represents only ${(brandedRatio * 100).toFixed(1)}% of your backlink anchors (${brandedCount.toLocaleString()} links).`,
        whyItMatters:
          "Strong brands typically have a significant proportion of backlinks citing their company or website brand name. A healthy branded anchor base reinforces domain credibility.",
        howToImprove:
          "Encourage journalists, event hosts, and business partners to use your official company brand name when linking to your website.",
        targetTab: "anchors",
        evidence: [
          { label: "Branded Anchor Share", value: `${(brandedRatio * 100).toFixed(1)}%`, highlight: true },
          { label: "Branded Backlinks", value: brandedCount.toLocaleString() },
          { label: "Total Anchors Tracked", value: ctx.anchors.length },
        ],
        actions: [
          "Claim brand citations on industry review platforms, directories, and trade organizations",
          "Ensure press releases and media kits provide clear guidelines for brand name usage",
        ],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 8: Follow / Nofollow Attribute Concentration
  // -------------------------------------------------------------
  const followCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_FOLLOW_ATTRIBUTE_IMBALANCE;
  if (followCfg?.enabled && total >= (followCfg.minSampleSize || 20)) {
    const dofollowRatio = ctx.dofollowCount / total;

    if (dofollowRatio > (followCfg.thresholds.skewedDofollowUpper || 0.98)) {
      recommendations.push({
        ruleKey: "BACKLINK_FOLLOW_ATTRIBUTE_IMBALANCE",
        title: "Backlink Attribute Distribution Notice",
        severity: "Low",
        priorityScore: 35,
        confidence: "Medium",
        whatWeFound: `${(dofollowRatio * 100).toFixed(0)}% of your analyzed backlinks (${ctx.dofollowCount.toLocaleString()} links) carry the dofollow attribute with few or no nofollow links.`,
        whyItMatters:
          "Your backlink profile is heavily concentrated toward one link attribute. A naturally acquired backlink profile often contains a natural mixture of follow, nofollow, and sponsored links from forums, comments, and media sites.",
        howToImprove:
          "No urgent correction is required, but normal brand mentions across forums, directories, and social platforms will naturally balance your link attributes over time.",
        targetTab: "backlinks",
        evidence: [
          { label: "Dofollow Backlinks", value: `${ctx.dofollowCount.toLocaleString()} (${(dofollowRatio * 100).toFixed(0)}%)`, highlight: true },
          { label: "Nofollow Backlinks", value: ctx.nofollowCount.toLocaleString() },
        ],
        actions: [
          "Participate in relevant community forums, industry discussion boards, and social platforms",
          "Continue prioritizing high-quality editorial content without attempting to manipulate attribute ratios",
        ],
      });
    } else if (dofollowRatio < (followCfg.thresholds.skewedNofollowLower || 0.20)) {
      recommendations.push({
        ruleKey: "BACKLINK_LOW_DOFOLLOW_RATIO",
        title: "Increase Dofollow Authority Links",
        severity: "Medium",
        priorityScore: 55,
        confidence: "Medium",
        whatWeFound: `Only ${(dofollowRatio * 100).toFixed(0)}% (${ctx.dofollowCount.toLocaleString()} links) of your backlinks pass ranking equity (dofollow), while ${ctx.nofollowCount.toLocaleString()} are marked nofollow.`,
        whyItMatters:
          "While nofollow links drive referral traffic and brand visibility, dofollow links pass direct algorithmic ranking signals to your destination pages.",
        howToImprove:
          "Focus future outreach on earned editorial placements and industry articles that provide standard equity-passing links.",
        targetTab: "backlinks",
        filterParams: { type: "dofollow" },
        evidence: [
          { label: "Dofollow Backlinks", value: `${ctx.dofollowCount.toLocaleString()} (${(dofollowRatio * 100).toFixed(0)}%)`, highlight: true },
          { label: "Nofollow Backlinks", value: ctx.nofollowCount.toLocaleString() },
        ],
        actions: [
          "Seek guest contributions on relevant industry blogs offering standard editorial citations",
          "Partner with suppliers and complementary service providers for partner page links",
        ],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 9: Suspicious Link Signals
  // -------------------------------------------------------------
  const suspCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_SUSPICIOUS_PATTERNS;
  if (suspCfg?.enabled && ctx.suspiciousCount > 0) {
    recommendations.push({
      ruleKey: "BACKLINK_SUSPICIOUS_PATTERNS",
      title: "Review Potentially Suspicious Link Signals",
      severity: ctx.suspiciousCount >= 5 ? "High" : "Medium",
      priorityScore: ctx.suspiciousCount >= 5 ? 75 : 60,
      confidence: "Low",
      whatWeFound: `${ctx.suspiciousCount} ${ctx.suspiciousCount === 1 ? "backlink was" : "backlinks were"} flagged with low link strength or unnatural pattern indicators.`,
      whyItMatters:
        "Reviewing anomalous backlink sources ensures your website maintains a clean, reputable inbound link profile.",
      howToImprove:
        "Inspect the referring domains to confirm whether they represent legitimate business directory citations or low-quality automated aggregators.",
      targetTab: "backlinks",
      filterParams: { type: "suspicious" },
      evidence: [
        { label: "Flagged Links", value: ctx.suspiciousCount, highlight: true },
        { label: "Total Profile", value: total.toLocaleString() },
      ],
      actions: [
        "Filter for suspicious records in the Backlinks table to inspect source domains",
        "If unwanted automated spam links persist, consider disavow preparation if algorithmic impact is observed",
      ],
    });
  }

  // -------------------------------------------------------------
  // Rule 10: Positive Authority Opportunities & Good Status
  // -------------------------------------------------------------
  const highAuthLinks = ctx.backlinks.filter((b) => b.domainRank >= 40);
  if (highAuthLinks.length > 0) {
    recommendations.push({
      ruleKey: "BACKLINK_HEALTHY_AUTHORITY_PROFILE",
      title: "High-Authority Backlinks Active",
      severity: "Good",
      priorityScore: 30,
      confidence: "High",
      whatWeFound: `${highAuthLinks.length} ${highAuthLinks.length === 1 ? "backlink originates" : "backlinks originate"} from strong authority domains (DR 40+).`,
      whyItMatters:
        "Established backlinks from authoritative domains provide strong foundational trust and ranking momentum.",
      howToImprove:
        "Nurture relationships with these high-authority websites and look for opportunities to collaborate on future content and editorial updates.",
      targetTab: "backlinks",
      evidence: [
        { label: "High-Authority Links (DR 40+)", value: highAuthLinks.length, highlight: true },
        { label: "Top Domain Rank Found", value: `${Math.max(...highAuthLinks.map((b) => b.domainRank))}/100` },
      ],
      actions: [
        "Review high DR backlink sources to understand what content originally earned their interest",
        "Explore additional collaboration or guest editorial opportunities with these referring publications",
      ],
    });
  } else if (ctx.brokenCount === 0 && total >= 10) {
    recommendations.push({
      ruleKey: "BACKLINK_CLEAN_TARGETS_GOOD",
      title: "Clean Inbound Target Routing",
      severity: "Good",
      priorityScore: 25,
      confidence: "High",
      whatWeFound: `All ${total.toLocaleString()} analyzed backlinks point to active, resolving destination pages with zero 404 broken targets detected.`,
      whyItMatters:
        "Preserving healthy URL routing ensures 100% of your incoming link equity reaches valid landing pages.",
      howToImprove:
        "Continue monitoring incoming URLs when performing site redesigns or page migrations to maintain clean 301 redirects.",
      targetTab: "backlinks",
      evidence: [
        { label: "Broken Target Links", value: 0, highlight: true },
        { label: "Active Links Checked", value: total.toLocaleString() },
      ],
      actions: [
        "Maintain current redirect and migration protocols during site updates",
      ],
    });
  }

  // -------------------------------------------------------------
  // Rule 11: Sitewide Repetitive Link Concentration
  // -------------------------------------------------------------
  const sitewideCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_SITEWIDE_CONCENTRATION;
  if (sitewideCfg?.enabled && total >= (sitewideCfg.minSampleSize || 25) && ctx.referringDomains > 0) {
    const avgLinksPerDomain = total / ctx.referringDomains;
    const threshold = sitewideCfg.thresholds.avgLinksPerDomainThreshold || 15;
    const criticalThreshold = sitewideCfg.thresholds.criticalLinksPerDomainThreshold || 30;

    if (avgLinksPerDomain >= threshold) {
      const isCritical = avgLinksPerDomain >= criticalThreshold;
      recommendations.push({
        ruleKey: "BACKLINK_SITEWIDE_CONCENTRATION",
        title: isCritical ? "High Sitewide Link Concentration Risk" : "Sitewide Link Footprint Detected",
        severity: isCritical ? "High" : "Medium",
        priorityScore: isCritical ? 70 : 58,
        confidence: "High",
        whatWeFound: `Your link profile averages ${avgLinksPerDomain.toFixed(1)} backlinks per referring domain (${total.toLocaleString()} total links across only ${ctx.referringDomains.toLocaleString()} domains).`,
        whyItMatters:
          "Search engines value unique root domain endorsements. Multiple repetitive links from the same domain (e.g. sitewide footers or sidebar widgets) provide diminishing SEO returns and can trigger unnatural link filters.",
        howToImprove:
          "Diversify your link building strategy to prioritize singular contextual editorial mentions across brand-new root domains rather than multi-page footer/template links.",
        targetTab: "referring_domains",
        evidence: [
          { label: "Avg Links per Domain", value: avgLinksPerDomain.toFixed(1), highlight: true },
          { label: "Total Backlinks", value: total.toLocaleString() },
          { label: "Referring Domains", value: ctx.referringDomains.toLocaleString() },
        ],
        actions: [
          "Inspect referring domains with the highest backlink counts in the Referring Domains tab",
          "If partner or directory sites use sitewide footer links, request converting them into a single in-content mention",
          "Focus future outreach on acquiring editorial links from previously unlinked industry websites",
        ],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 12: IP / Subnet Clustering Risk (PBN / Hosting Concentration)
  // -------------------------------------------------------------
  const ipCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_IP_SUBNET_CONCENTRATION;
  if (ipCfg?.enabled && ctx.referringDomains >= (ipCfg.thresholds.minRefDomains || 10) && ctx.referringIps) {
    const ipRatio = ctx.referringIps / ctx.referringDomains;
    const ipThreshold = ipCfg.thresholds.ipToDomainRatioThreshold || 0.50;

    if (ipRatio <= ipThreshold) {
      recommendations.push({
        ruleKey: "BACKLINK_IP_SUBNET_CONCENTRATION",
        title: "Referring IP & Subnet Clustering Risk",
        severity: "High",
        priorityScore: 68,
        confidence: "Medium",
        whatWeFound: `${ctx.referringDomains.toLocaleString()} referring domains are hosted across only ${ctx.referringIps.toLocaleString()} distinct IP addresses (${(ipRatio * 100).toFixed(1)}% IP diversity).`,
        whyItMatters:
          "Multiple referring domains hosted on identical IP addresses or C-Class subnets suggest network clustering or private blog network (PBN) patterns, which search engines scrutinize closely.",
        howToImprove:
          "Ensure future partner links and citations originate from independent websites hosted across diverse global hosting providers and autonomous networks.",
        targetTab: "referring_domains",
        evidence: [
          { label: "Unique IPs", value: ctx.referringIps.toLocaleString(), highlight: true },
          { label: "Referring Domains", value: ctx.referringDomains.toLocaleString() },
          { label: "IP Diversity", value: `${(ipRatio * 100).toFixed(1)}%` },
        ],
        actions: [
          "Review referring domain hosting details to ensure sources are independent",
          "Avoid bulk directory networks or private hosting rings",
        ],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 13: Generic Anchor Text Saturation
  // -------------------------------------------------------------
  const genericCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_GENERIC_ANCHOR_SATURATION;
  if (genericCfg?.enabled && total >= (genericCfg.minSampleSize || 15) && ctx.anchors.length > 0) {
    const totalAnchorsCount = ctx.anchors.reduce((sum, a) => sum + a.backlinksCount, 0) || total;
    const genericAnchors = ctx.anchors.filter((a) => {
      const clean = a.anchor.toLowerCase().trim();
      return (
        a.classification === "GENERIC" ||
        ["click here", "read more", "learn more", "website", "link", "visit website", "source", "here", "page"].includes(clean)
      );
    });
    const genericCount = genericAnchors.reduce((sum, a) => sum + a.backlinksCount, 0);
    const genericRatio = genericCount / totalAnchorsCount;

    if (genericRatio >= (genericCfg.thresholds.maxGenericRatio || 0.15) && genericCount > 0) {
      recommendations.push({
        ruleKey: "BACKLINK_GENERIC_ANCHOR_SATURATION",
        title: "Optimize Generic Anchor Phrases",
        severity: "Medium",
        priorityScore: 54,
        confidence: "Medium",
        whatWeFound: `Generic anchor text (e.g. "click here", "website") accounts for ${(genericRatio * 100).toFixed(1)}% (${genericCount.toLocaleString()} links) of your backlink profile.`,
        whyItMatters:
          "Generic anchors pass authority but provide zero descriptive context about your topical expertise, products, or brand identity to search algorithms.",
        howToImprove:
          "Encourage partners, reviewers, and publishers to use descriptive brand names or topical phrases instead of generic 'click here' labels.",
        targetTab: "anchors",
        evidence: [
          { label: "Generic Anchor Share", value: `${(genericRatio * 100).toFixed(1)}%`, highlight: true },
          { label: "Generic Backlinks", value: genericCount.toLocaleString() },
        ],
        actions: [
          "Review the Anchor Text tab to identify common generic phrases",
          "Provide suggested anchor phrasing when participating in partner features or PR interviews",
        ],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 14: Naked URL Anchor Dominance
  // -------------------------------------------------------------
  const urlCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_NAKED_URL_DOMINANCE;
  if (urlCfg?.enabled && total >= (urlCfg.minSampleSize || 15) && ctx.anchors.length > 0) {
    const totalAnchorsCount = ctx.anchors.reduce((sum, a) => sum + a.backlinksCount, 0) || total;
    const nakedAnchors = ctx.anchors.filter(
      (a) =>
        a.classification === "URL" ||
        a.anchor.startsWith("http://") ||
        a.anchor.startsWith("https://") ||
        a.anchor.startsWith("www.")
    );
    const nakedCount = nakedAnchors.reduce((sum, a) => sum + a.backlinksCount, 0);
    const nakedRatio = nakedCount / totalAnchorsCount;

    if (nakedRatio >= (urlCfg.thresholds.maxNakedUrlRatio || 0.45) && nakedCount > 0) {
      recommendations.push({
        ruleKey: "BACKLINK_NAKED_URL_DOMINANCE",
        title: "Naked URL Anchor Text Optimization",
        severity: "Opportunity",
        priorityScore: 46,
        confidence: "Medium",
        whatWeFound: `Raw naked URLs (e.g. "https://${ctx.domain}") represent ${(nakedRatio * 100).toFixed(1)}% (${nakedCount.toLocaleString()} links) of your analyzed anchors.`,
        whyItMatters:
          "While raw URLs are safe and natural, a higher ratio of descriptive brand names and topical phrases improves search query relevance.",
        howToImprove:
          "Whenever possible, encourage collaborators and authors to hyperlink your official brand name or content title rather than raw URL strings.",
        targetTab: "anchors",
        evidence: [
          { label: "Naked URL Share", value: `${(nakedRatio * 100).toFixed(1)}%`, highlight: true },
          { label: "Raw URL Backlinks", value: nakedCount.toLocaleString() },
        ],
        actions: [
          "Review the Anchor Text tab for naked URL variations",
          "Provide copy-ready hyperlinked text for press releases and partner profiles",
        ],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 15: Low Authority Backlink Concentration
  // -------------------------------------------------------------
  const lowAuthCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_LOW_AUTHORITY_CONCENTRATION;
  if (lowAuthCfg?.enabled && total >= (lowAuthCfg.minSampleSize || 20) && ctx.backlinks.length > 0) {
    const lowDRLinks = ctx.backlinks.filter((b) => b.domainRank < (lowAuthCfg.thresholds.lowDRThreshold || 15));
    const lowDRRatio = lowDRLinks.length / ctx.backlinks.length;

    if (lowDRRatio >= (lowAuthCfg.thresholds.lowDRShareThreshold || 0.65)) {
      recommendations.push({
        ruleKey: "BACKLINK_LOW_AUTHORITY_CONCENTRATION",
        title: "Elevate Backlink Authority Profile",
        severity: "Medium",
        priorityScore: 56,
        confidence: "High",
        whatWeFound: `${(lowDRRatio * 100).toFixed(1)}% of your backlinks (${lowDRLinks.length.toLocaleString()} links) originate from entry-level domains (Domain Rank < 15).`,
        whyItMatters:
          "A high volume of low-authority links contributes little ranking power. Earning fewer links from reputable, high-DR publications provides significantly greater SEO impact.",
        howToImprove:
          "Shift link-building resources from low-tier directories toward digital PR, podcasts, and recognized industry authorities with DR 40+.",
        targetTab: "backlinks",
        evidence: [
          { label: "Low DR Share (< 15)", value: `${(lowDRRatio * 100).toFixed(1)}%`, highlight: true },
          { label: "Low DR Backlinks", value: lowDRLinks.length.toLocaleString() },
        ],
        actions: [
          "Filter by Domain Rank in the Backlinks tab to evaluate low-authority sources",
          "Prioritize high-tier media outreach and thought leadership content for new link acquisition",
        ],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 16: Tier-1 Authority Expansion Opportunity
  // -------------------------------------------------------------
  const tier1Cfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_HIGH_AUTHORITY_EXPANSION;
  if (tier1Cfg?.enabled && total >= (tier1Cfg.minSampleSize || 10)) {
    const tier1Links = ctx.backlinks.filter((b) => b.domainRank >= (tier1Cfg.thresholds.tier1DRThreshold || 50));
    if (tier1Links.length === 0) {
      recommendations.push({
        ruleKey: "BACKLINK_HIGH_AUTHORITY_EXPANSION",
        title: "Acquire Tier-1 Authority Backlinks (DR 50+)",
        severity: "Opportunity",
        priorityScore: 52,
        confidence: "Medium",
        whatWeFound: `Your analyzed profile has 0 backlinks from Tier-1 authority domains (Domain Rank 50+).`,
        whyItMatters:
          "Backlinks from major publications, educational portals, and established industry authorities provide the strongest algorithmic trust signals.",
        howToImprove:
          "Publish original data studies, industry surveys, or unique calculator tools that naturally attract citations from mainstream tech and news publications.",
        targetTab: "referring_domains",
        evidence: [
          { label: "Tier-1 Backlinks (DR 50+)", value: 0, highlight: true },
          { label: "Highest DR Source Found", value: `${Math.max(0, ...ctx.backlinks.map((b) => b.domainRank))}/100` },
        ],
        actions: [
          "Brainstorm original industry data or benchmark reports for journalist outreach",
          "Identify top publications covering your niche and pitch expert commentary",
        ],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 17: Inbound 301 Redirect Target Audit
  // -------------------------------------------------------------
  const redirCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_REDIRECT_TARGETS;
  if (redirCfg?.enabled && total >= (redirCfg.minSampleSize || 10)) {
    const redirectLinks = ctx.backlinks.filter((b) => b.httpStatus === 301 || b.linkType === "redirect");
    const redirectRatio = redirectLinks.length / total;

    if (redirectLinks.length >= (redirCfg.thresholds.minRedirectCount || 3) && redirectRatio >= (redirCfg.thresholds.redirectRatioThreshold || 0.05)) {
      recommendations.push({
        ruleKey: "BACKLINK_REDIRECT_TARGETS",
        title: "Optimize Inbound 301 Redirect Links",
        severity: "Low",
        priorityScore: 38,
        confidence: "Medium",
        whatWeFound: `${redirectLinks.length.toLocaleString()} external backlinks point to destination URLs that pass through 301 redirects (${(redirectRatio * 100).toFixed(1)}% of links).`,
        whyItMatters:
          "While 301 redirects pass page equity, direct canonical links ensure maximum crawl speed and prevent potential redirect hops or latency.",
        howToImprove:
          "Where high-value links exist on friendly partner sites, request updating destination URLs directly to the final canonical landing page.",
        targetTab: "backlinks",
        evidence: [
          { label: "Redirecting Inbound Links", value: redirectLinks.length, highlight: true },
          { label: "Redirect Share", value: `${(redirectRatio * 100).toFixed(1)}%` },
        ],
        actions: [
          "Check the Backlinks tab to review incoming redirect URLs",
          "Ensure internal and partner redirect rules are 1-hop only without redirect loops",
        ],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 18: Deep Content Equity Concentration
  // -------------------------------------------------------------
  const deepContentCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_CONTENT_EQUITY_IMBALANCE;
  if (deepContentCfg?.enabled && ctx.topPages.length >= (deepContentCfg.thresholds.minTrackedPages || 3)) {
    const totalPageLinks = ctx.topPages.reduce((sum, p) => sum + p.backlinksCount, 0);
    if (totalPageLinks >= 20) {
      const top2 = ctx.topPages.slice(0, 2);
      const top2Count = top2.reduce((sum, p) => sum + p.backlinksCount, 0);
      const top2Share = top2Count / totalPageLinks;

      if (top2Share >= (deepContentCfg.thresholds.topTwoShareThreshold || 0.90)) {
        recommendations.push({
          ruleKey: "BACKLINK_CONTENT_EQUITY_IMBALANCE",
          title: "Balance Backlink Equity Across Content Pages",
          severity: "Opportunity",
          priorityScore: 48,
          confidence: "Medium",
          whatWeFound: `Your top 2 destination pages hold ${(top2Share * 100).toFixed(1)}% (${top2Count.toLocaleString()} links) of all page-level backlink equity.`,
          whyItMatters:
            "Concentrating nearly all inbound equity into only 2 URLs leaves your other product and service pages without the ranking authority needed for high search visibility.",
          howToImprove:
            "Distribute future link acquisition toward secondary product hubs, service landing pages, and long-tail informational guides.",
          targetTab: "top_pages",
          evidence: [
            { label: "Top 2 Pages Share", value: `${(top2Share * 100).toFixed(1)}%`, highlight: true },
            { label: "Total Tracked Pages", value: ctx.topPages.length },
          ],
          actions: [
            "Review the Top Pages tab to find high-potential conversion pages with low backlink counts",
            "Build internal links from high-authority pages to pass equity downward to emerging content",
          ],
        });
      }
    }
  }

  // -------------------------------------------------------------
  // Rule 19: Image & Visual Asset Link Distribution
  // -------------------------------------------------------------
  const imageCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_IMAGE_LINK_OPPORTUNITY;
  if (imageCfg?.enabled && total >= (imageCfg.minSampleSize || 25)) {
    const imageLinks = ctx.backlinks.filter((b) => b.linkType === "image" || b.linkType === "img");
    const imageShare = imageLinks.length / total;

    if (imageShare < (imageCfg.thresholds.maxImageShare || 0.02)) {
      recommendations.push({
        ruleKey: "BACKLINK_IMAGE_LINK_OPPORTUNITY",
        title: "Expand Visual Asset & Infographic Link Acquisition",
        severity: "Opportunity",
        priorityScore: 40,
        confidence: "Low",
        whatWeFound: `Image-based backlinks account for only ${(imageShare * 100).toFixed(1)}% (${imageLinks.length} links) of your analyzed backlink profile.`,
        whyItMatters:
          "Visual assets such as infographics, comparison charts, and branded badges are effective magnets for earning natural, high-authority editorial references.",
        howToImprove:
          "Create embeddable infographics, benchmark charts, or industry award badges with pre-formatted embed code to encourage image attribution links.",
        targetTab: "backlinks",
        evidence: [
          { label: "Image Backlinks", value: imageLinks.length, highlight: true },
          { label: "Image Link Share", value: `${(imageShare * 100).toFixed(1)}%` },
        ],
        actions: [
          "Design informative graphics or flowcharts for top-performing blog posts",
          "Include image embed code with direct canonical attribution links",
        ],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 20: Positive Link Acquisition Velocity
  // -------------------------------------------------------------
  const velocityCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_HIGH_VELOCITY_GROWTH;
  if (velocityCfg?.enabled && total >= (velocityCfg.minSampleSize || 15) && ctx.newBacklinksCount > 0) {
    const newRatio = ctx.newBacklinksCount / total;
    if (newRatio >= (velocityCfg.thresholds.velocityRatioThreshold || 0.08) && ctx.lostBacklinksCount <= ctx.newBacklinksCount * 0.25) {
      recommendations.push({
        ruleKey: "BACKLINK_HIGH_VELOCITY_GROWTH",
        title: "Positive Link Acquisition Velocity",
        severity: "Good",
        priorityScore: 28,
        confidence: "High",
        whatWeFound: `Discovered ${ctx.newBacklinksCount.toLocaleString()} new backlinks in the recent 30-day window (${(newRatio * 100).toFixed(1)}% profile growth).`,
        whyItMatters:
          "Consistent positive link velocity signals fresh relevance and growing market authority to search engines.",
        howToImprove:
          "Maintain current PR outreach, partner collaborations, and content publishing cadence to sustain positive link momentum.",
        targetTab: "new_lost",
        evidence: [
          { label: "New Backlinks (30d)", value: ctx.newBacklinksCount, highlight: true },
          { label: "Velocity Ratio", value: `${(newRatio * 100).toFixed(1)}%` },
        ],
        actions: [
          "Check the New & Lost tab to inspect newly referring domain quality",
          "Identify which recent content pieces or PR announcements drove the latest link influx",
        ],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 22: .EDU & .GOV Institutional Authority Opportunity
  // -------------------------------------------------------------
  const eduGovCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_EDU_GOV_OPPORTUNITY;
  if (eduGovCfg?.enabled && total >= (eduGovCfg.minSampleSize || 20)) {
    const institutionalDomains = ctx.referringDomainsList.filter(
      (d) => d.domain.endsWith(".edu") || d.domain.endsWith(".gov") || d.domain.endsWith(".ac.uk")
    );
    if (institutionalDomains.length === 0) {
      recommendations.push({
        ruleKey: "BACKLINK_EDU_GOV_OPPORTUNITY",
        title: "Acquire High-Trust .EDU or .GOV Citations",
        severity: "Opportunity",
        priorityScore: 44,
        confidence: "Low",
        whatWeFound: `Your backlink profile has 0 citations from academic (.edu) or governmental (.gov) institutions.`,
        whyItMatters:
          "Institutional domains (.edu / .gov) possess exceptional algorithmic trust authority and domain longevity in search rankings.",
        howToImprove:
          "Offer student scholarship programs, host university guest workshops, or contribute research data to academic resource libraries.",
        targetTab: "referring_domains",
        evidence: [
          { label: "Institutional Links (.edu/.gov)", value: 0, highlight: true },
          { label: "Total Referring Domains", value: ctx.referringDomains.toLocaleString() },
        ],
        actions: [
          "Create a dedicated student scholarship or educational resource page",
          "Reach out to university department portals and local government commerce directories",
        ],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 23: Active .EDU or .GOV Institutional Endorsement (Good)
  // -------------------------------------------------------------
  const eduGovActiveCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_EDU_GOV_ACTIVE;
  if (eduGovActiveCfg?.enabled) {
    const institutionalDomains = ctx.referringDomainsList.filter(
      (d) => d.domain.endsWith(".edu") || d.domain.endsWith(".gov") || d.domain.endsWith(".ac.uk")
    );
    if (institutionalDomains.length > 0) {
      recommendations.push({
        ruleKey: "BACKLINK_EDU_GOV_ACTIVE",
        title: "Institutional Authority Backlinks Active",
        severity: "Good",
        priorityScore: 32,
        confidence: "High",
        whatWeFound: `Earned backlinks from ${institutionalDomains.length} academic (.edu) or governmental (.gov) institutional sources (${institutionalDomains.map((d) => d.domain).slice(0, 2).join(", ")}).`,
        whyItMatters:
          "Institutional endorsements provide unmatched domain trust and algorithmic credibility.",
        howToImprove:
          "Maintain active relationships with academic partners and explore additional collaborative studies.",
        targetTab: "referring_domains",
        evidence: [
          { label: "Institutional Domains", value: institutionalDomains.length, highlight: true },
          { label: "Example Domain", value: institutionalDomains[0]?.domain || "—" },
        ],
        actions: ["Continue nurturing institutional relationships and student resource contributions"],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 24: Spam / High-Risk TLD Footprint
  // -------------------------------------------------------------
  const spamTldCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_SPAM_TLD_RISK;
  if (spamTldCfg?.enabled && total >= (spamTldCfg.minSampleSize || 20)) {
    const spamTlds = [".xyz", ".top", ".buzz", ".click", ".cam", ".work", ".rest", ".fit", ".surf", ".gq", ".ml", ".cf"];
    const spamLinks = ctx.backlinks.filter((b) => spamTlds.some((tld) => b.sourceDomain.endsWith(tld)));
    const spamShare = spamLinks.length / total;

    if (spamShare >= (spamTldCfg.thresholds.maxSpamTldShare || 0.08)) {
      recommendations.push({
        ruleKey: "BACKLINK_SPAM_TLD_RISK",
        title: "High-Risk Spam TLD Inbound Concentration",
        severity: "High",
        priorityScore: 64,
        confidence: "Medium",
        whatWeFound: `${(spamShare * 100).toFixed(1)}% of your backlinks (${spamLinks.length.toLocaleString()} links) originate from high-risk or automated spam TLD extensions (.xyz, .top, .buzz, etc.).`,
        whyItMatters:
          "Low-cost, spam-heavy domain extensions frequently host automated scraping networks and link farms that can degrade domain trust.",
        howToImprove:
          "Audit referring domains with suspicious TLDs and disavow scrapers if algorithmic volatility or negative ranking trends appear.",
        targetTab: "referring_domains",
        evidence: [
          { label: "Spam TLD Share", value: `${(spamShare * 100).toFixed(1)}%`, highlight: true },
          { label: "Spam TLD Backlinks", value: spamLinks.length.toLocaleString() },
        ],
        actions: [
          "Filter referring domains in the Referring Domains tab by suspicious extensions",
          "Document low-quality automated aggregator domains for monitoring",
        ],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 25: International ccTLD Diversity Opportunity
  // -------------------------------------------------------------
  const ccTldCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_INTERNATIONAL_TLD_DIVERSITY;
  if (ccTldCfg?.enabled && total >= (ccTldCfg.minSampleSize || 30)) {
    const countryTlds = new Set(
      ctx.referringDomainsList
        .map((d) => d.domain.split(".").pop())
        .filter((tld) => tld && ["uk", "de", "ca", "fr", "au", "es", "in", "jp", "it", "nl"].includes(tld))
    );
    if (countryTlds.size < (ccTldCfg.thresholds.minDistinctCcTlds || 2)) {
      recommendations.push({
        ruleKey: "BACKLINK_INTERNATIONAL_TLD_DIVERSITY",
        title: "Expand Global & Regional ccTLD Diversity",
        severity: "Opportunity",
        priorityScore: 42,
        confidence: "Low",
        whatWeFound: `Your backlink profile has minimal international ccTLD presence (${countryTlds.size} distinct country extensions found).`,
        whyItMatters:
          "Earning backlinks from diverse international country code domains (.co.uk, .ca, .de, .au) establishes global brand authority and expands international organic reach.",
        howToImprove:
          "Participate in international industry summits, regional digital PR, and localized trade publication interviews.",
        targetTab: "referring_domains",
        evidence: [
          { label: "Country TLDs Tracked", value: countryTlds.size, highlight: true },
          { label: "Total Referring Domains", value: ctx.referringDomains.toLocaleString() },
        ],
        actions: ["Engage in regional trade associations and localized digital PR campaigns"],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 26: Non-Profit (.ORG) Authority Endorsements (Good)
  // -------------------------------------------------------------
  const orgCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_ORGANIZATION_TRUST_SIGNAL;
  if (orgCfg?.enabled && total >= (orgCfg.minSampleSize || 10)) {
    const orgDomains = ctx.referringDomainsList.filter((d) => d.domain.endsWith(".org"));
    if (orgDomains.length >= (orgCfg.thresholds.minOrgCount || 2)) {
      recommendations.push({
        ruleKey: "BACKLINK_ORGANIZATION_TRUST_SIGNAL",
        title: "Non-Profit (.ORG) Authority Presence",
        severity: "Good",
        priorityScore: 26,
        confidence: "High",
        whatWeFound: `Earned backlinks from ${orgDomains.length} recognized non-profit or industry association (.org) domains.`,
        whyItMatters:
          "Non-profit organization references signal legitimate industry community standing and trust.",
        howToImprove:
          "Continue supporting community non-profits, open source initiatives, or civic sponsorship programs.",
        targetTab: "referring_domains",
        evidence: [
          { label: ".ORG Referring Domains", value: orgDomains.length, highlight: true },
          { label: "Sample Domain", value: orgDomains[0]?.domain || "—" },
        ],
        actions: ["Maintain active community and non-profit sponsorships"],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 27: Single-Word Keyword Anchor Saturation
  // -------------------------------------------------------------
  const shortAnchorCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_SHORT_ANCHOR_SATURATION;
  if (shortAnchorCfg?.enabled && total >= (shortAnchorCfg.minSampleSize || 15) && ctx.anchors.length > 0) {
    const totalAnchors = ctx.anchors.reduce((sum, a) => sum + a.backlinksCount, 0) || total;
    const singleWordAnchors = ctx.anchors.filter((a) => {
      const words = a.anchor.trim().split(/\s+/);
      return words.length === 1 && a.classification !== "BRANDED" && a.classification !== "URL";
    });
    const singleWordCount = singleWordAnchors.reduce((sum, a) => sum + a.backlinksCount, 0);
    const singleWordShare = singleWordCount / totalAnchors;

    if (singleWordShare >= (shortAnchorCfg.thresholds.maxSingleWordShare || 0.40)) {
      recommendations.push({
        ruleKey: "BACKLINK_SHORT_ANCHOR_SATURATION",
        title: "Diversify Isolated Single-Word Anchors",
        severity: "Medium",
        priorityScore: 54,
        confidence: "Medium",
        whatWeFound: `Single-word keyword anchors account for ${(singleWordShare * 100).toFixed(1)}% (${singleWordCount.toLocaleString()} links) of your backlink anchor text.`,
        whyItMatters:
          "Over-relying on isolated 1-word keywords looks unnatural to search engine algorithms compared to natural sentence-level phrases.",
        howToImprove:
          "Encourage natural editorial variation by having writers use natural multi-word phrases and sentence context when linking to your content.",
        targetTab: "anchors",
        evidence: [
          { label: "Single-Word Anchor Share", value: `${(singleWordShare * 100).toFixed(1)}%`, highlight: true },
          { label: "Single-Word Links", value: singleWordCount.toLocaleString() },
        ],
        actions: [
          "Review the Anchor Text tab to inspect single-word phrase clusters",
          "Aim for contextual phrasing in future partner link placements",
        ],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 28: Long-Tail Contextual Phrase Anchor Opportunity
  // -------------------------------------------------------------
  const longtailCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_LONGTAIL_ANCHOR_OPPORTUNITY;
  if (longtailCfg?.enabled && total >= (longtailCfg.minSampleSize || 20) && ctx.anchors.length > 0) {
    const totalAnchors = ctx.anchors.reduce((sum, a) => sum + a.backlinksCount, 0) || total;
    const longtailAnchors = ctx.anchors.filter((a) => a.anchor.trim().split(/\s+/).length >= 4);
    const longtailCount = longtailAnchors.reduce((sum, a) => sum + a.backlinksCount, 0);
    const longtailShare = longtailCount / totalAnchors;

    if (longtailShare < (longtailCfg.thresholds.minLongtailShare || 0.10)) {
      recommendations.push({
        ruleKey: "BACKLINK_LONGTAIL_ANCHOR_OPPORTUNITY",
        title: "Incorporate Long-Tail Contextual Anchors",
        severity: "Opportunity",
        priorityScore: 42,
        confidence: "Low",
        whatWeFound: `Long-tail conversational phrase anchors (4+ words) make up only ${(longtailShare * 100).toFixed(1)}% (${longtailCount} links) of your anchor profile.`,
        whyItMatters:
          "Natural in-content citations from journalists and bloggers often embed links inside descriptive 4-to-7 word phrases, signaling authentic editorial interest.",
        howToImprove:
          "Craft unique report titles, tool names, and quotable data points that encourage writers to link full descriptive statements.",
        targetTab: "anchors",
        evidence: [
          { label: "Long-Tail Share", value: `${(longtailShare * 100).toFixed(1)}%`, highlight: true },
          { label: "Long-Tail Backlinks", value: longtailCount },
        ],
        actions: ["Create quotable data points and defined framework names in your articles"],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 29: Empty / Missing Anchor Text Concentration
  // -------------------------------------------------------------
  const emptyAnchorCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_EMPTY_ANCHOR_CONCENTRATION;
  if (emptyAnchorCfg?.enabled && total >= (emptyAnchorCfg.minSampleSize || 15) && ctx.anchors.length > 0) {
    const totalAnchors = ctx.anchors.reduce((sum, a) => sum + a.backlinksCount, 0) || total;
    const emptyAnchors = ctx.anchors.filter(
      (a) => !a.anchor || a.anchor.trim() === "" || a.anchor === "(empty anchor)" || a.anchor === "(empty anchor text)"
    );
    const emptyCount = emptyAnchors.reduce((sum, a) => sum + a.backlinksCount, 0);
    const emptyShare = emptyCount / totalAnchors;

    if (emptyShare >= (emptyAnchorCfg.thresholds.maxEmptyAnchorShare || 0.15)) {
      recommendations.push({
        ruleKey: "BACKLINK_EMPTY_ANCHOR_CONCENTRATION",
        title: "Resolve Empty or Missing Anchor Text",
        severity: "Medium",
        priorityScore: 52,
        confidence: "Medium",
        whatWeFound: `${(emptyShare * 100).toFixed(1)}% of your backlinks (${emptyCount.toLocaleString()} links) have missing or empty anchor text.`,
        whyItMatters:
          "Links without anchor text pass link equity but fail to transmit topical signals to search engines. Empty anchors typically result from unlabelled image tags or blank buttons.",
        howToImprove:
          "Where image links or badges are used, ensure the HTML contains descriptive `alt` text attributes to serve as readable anchor context.",
        targetTab: "anchors",
        evidence: [
          { label: "Empty Anchor Share", value: `${(emptyShare * 100).toFixed(1)}%`, highlight: true },
          { label: "Empty Backlinks", value: emptyCount.toLocaleString() },
        ],
        actions: [
          "Check the Anchor Text tab for empty anchor records",
          "Ensure partner image badges and logos include descriptive alt text",
        ],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 30: Foreign Language Script Anchor Anomaly
  // -------------------------------------------------------------
  const foreignCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_FOREIGN_LANGUAGE_ANCHORS;
  if (foreignCfg?.enabled && total >= (foreignCfg.minSampleSize || 10) && ctx.anchors.length > 0) {
    const totalAnchors = ctx.anchors.reduce((sum, a) => sum + a.backlinksCount, 0) || total;
    const foreignRegex = /[\u0400-\u04FF\u4E00-\u9FFF\u0600-\u06FF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/;
    const foreignAnchors = ctx.anchors.filter((a) => foreignRegex.test(a.anchor));
    const foreignCount = foreignAnchors.reduce((sum, a) => sum + a.backlinksCount, 0);
    const foreignShare = foreignCount / totalAnchors;

    if (foreignShare >= (foreignCfg.thresholds.maxForeignShare || 0.05)) {
      recommendations.push({
        ruleKey: "BACKLINK_FOREIGN_LANGUAGE_ANCHORS",
        title: "Foreign Script Anchor Text Anomaly",
        severity: "High",
        priorityScore: 65,
        confidence: "High",
        whatWeFound: `${foreignCount.toLocaleString()} backlinks carry non-Latin foreign script anchors (Cyrillic, Asian, or Arabic characters) representing ${(foreignShare * 100).toFixed(1)}% of anchors.`,
        whyItMatters:
          "Unexpected foreign language anchors on a localized or English-language website frequently originate from automated scraper bots or negative SEO injection attacks.",
        howToImprove:
          "Inspect referring domains hosting foreign script anchors and disavow suspicious automated scraper domains.",
        targetTab: "anchors",
        evidence: [
          { label: "Foreign Script Share", value: `${(foreignShare * 100).toFixed(1)}%`, highlight: true },
          { label: "Foreign Backlinks", value: foreignCount.toLocaleString() },
        ],
        actions: [
          "Review foreign script phrases in the Anchor Text tab",
          "Audit and document scraper sources for disavow review",
        ],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 31: Compound Brand + Keyword Anchor Opportunity
  // -------------------------------------------------------------
  const compoundCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_COMPOUND_BRAND_OPPORTUNITY;
  if (compoundCfg?.enabled && total >= (compoundCfg.minSampleSize || 20) && ctx.anchors.length > 0) {
    const totalAnchors = ctx.anchors.reduce((sum, a) => sum + a.backlinksCount, 0) || total;
    const partialMatch = ctx.anchors.filter((a) => a.classification === "PARTIAL_MATCH");
    const partialCount = partialMatch.reduce((sum, a) => sum + a.backlinksCount, 0);
    const partialShare = partialCount / totalAnchors;

    if (partialShare < (compoundCfg.thresholds.minPartialMatchShare || 0.10)) {
      recommendations.push({
        ruleKey: "BACKLINK_COMPOUND_BRAND_OPPORTUNITY",
        title: "Build Compound Brand + Keyword Anchors",
        severity: "Opportunity",
        priorityScore: 44,
        confidence: "Medium",
        whatWeFound: `Compound brand+keyword anchors (e.g. "${ctx.domain.split(".")[0]} SEO Audit") represent only ${(partialShare * 100).toFixed(1)}% (${partialCount} links) of your profile.`,
        whyItMatters:
          "Compound anchors provide the perfect algorithmic bridge: they reinforce brand authority while associating your business with your primary service keywords.",
        howToImprove:
          "When distributing press releases or participating in co-marketing features, suggest phrasing like '[Company Name] [Core Service]'.",
        targetTab: "anchors",
        evidence: [
          { label: "Compound Anchor Share", value: `${(partialShare * 100).toFixed(1)}%`, highlight: true },
          { label: "Compound Backlinks", value: partialCount },
        ],
        actions: ["Use compound brand+topic phrasing in upcoming PR and guest appearances"],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 32: Repetitive Anchor Phrase Cluster
  // -------------------------------------------------------------
  const repAnchorCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_REPETITIVE_ANCHOR_CLUSTERS;
  if (repAnchorCfg?.enabled && total >= (repAnchorCfg.minSampleSize || 30) && ctx.anchors.length > 0) {
    const maxRepeatedAnchor = ctx.anchors.find(
      (a) => a.backlinksCount >= (repAnchorCfg.thresholds.maxSinglePhraseRepetition || 40) && a.classification !== "BRANDED"
    );
    if (maxRepeatedAnchor) {
      recommendations.push({
        ruleKey: "BACKLINK_REPETITIVE_ANCHOR_CLUSTERS",
        title: "Mitigate Highly Repetitive Anchor Phrases",
        severity: "Medium",
        priorityScore: 55,
        confidence: "High",
        whatWeFound: `The non-branded phrase "${maxRepeatedAnchor.anchor}" is repeated across ${maxRepeatedAnchor.backlinksCount.toLocaleString()} backlinks.`,
        whyItMatters:
          "Repeating the identical non-branded phrase dozens of times creates an artificial pattern that search engines may discount.",
        howToImprove:
          "Encourage natural variations, synonyms, and brand combinations in future mentions.",
        targetTab: "anchors",
        evidence: [
          { label: "Repeated Phrase", value: `"${maxRepeatedAnchor.anchor}"`, highlight: true },
          { label: "Backlink Count", value: maxRepeatedAnchor.backlinksCount.toLocaleString() },
        ],
        actions: ["Introduce semantic phrase variations in upcoming link building"],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 33: Unencrypted HTTP Inbound Links
  // -------------------------------------------------------------
  const httpCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_HTTP_UNENCRYPTED_INBOUND;
  if (httpCfg?.enabled && total >= (httpCfg.minSampleSize || 15)) {
    const httpLinks = ctx.backlinks.filter((b) => b.targetUrl.startsWith("http://"));
    const httpRatio = httpLinks.length / total;

    if (httpLinks.length >= (httpCfg.thresholds.minHttpCount || 3) && httpRatio >= (httpCfg.thresholds.httpRatioThreshold || 0.10)) {
      recommendations.push({
        ruleKey: "BACKLINK_HTTP_UNENCRYPTED_INBOUND",
        title: "Secure Inbound HTTP Protocol Links",
        severity: "Low",
        priorityScore: 36,
        confidence: "Medium",
        whatWeFound: `${httpLinks.length.toLocaleString()} external backlinks point to unencrypted "http://" URLs (${(httpRatio * 100).toFixed(1)}% of links).`,
        whyItMatters:
          "Links pointing to 'http://' require an automatic server redirect to 'https://', introducing slight latency and header overhead.",
        howToImprove:
          "Ensure your web server enforces strict HSTS and 301 redirects from HTTP to HTTPS, and update partner references to use HTTPS directly.",
        targetTab: "backlinks",
        evidence: [
          { label: "Inbound HTTP Links", value: httpLinks.length, highlight: true },
          { label: "HTTP Target Share", value: `${(httpRatio * 100).toFixed(1)}%` },
        ],
        actions: [
          "Verify HTTPS 301 redirection rules on your web server",
          "Ensure new partner links use https:// protocol explicitly",
        ],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 34: Inbound Links Pointing to Tracking Query Parameters
  // -------------------------------------------------------------
  const paramCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_URL_QUERY_PARAM_TARGETS;
  if (paramCfg?.enabled && total >= (paramCfg.minSampleSize || 15)) {
    const paramLinks = ctx.backlinks.filter((b) => b.targetUrl.includes("?utm_") || b.targetUrl.includes("?ref=") || b.targetUrl.includes("?fbclid="));
    const paramRatio = paramLinks.length / total;

    if (paramLinks.length >= (paramCfg.thresholds.minParamCount || 3) && paramRatio >= (paramCfg.thresholds.paramRatioThreshold || 0.05)) {
      recommendations.push({
        ruleKey: "BACKLINK_URL_QUERY_PARAM_TARGETS",
        title: "Consolidate Tracking Parameter Target URLs",
        severity: "Low",
        priorityScore: 34,
        confidence: "Low",
        whatWeFound: `${paramLinks.length.toLocaleString()} external backlinks point to URLs containing tracking parameters (?utm_, ?ref=, etc.).`,
        whyItMatters:
          "Tracking query parameters can fragment page authority across multiple duplicate URL strings if canonical tags are not configured.",
        howToImprove:
          "Ensure your destination pages include a self-referencing canonical tag (`<link rel='canonical'>`) pointing to the clean URL without parameters.",
        targetTab: "backlinks",
        evidence: [
          { label: "Parameter Target Links", value: paramLinks.length, highlight: true },
          { label: "Parameter Share", value: `${(paramRatio * 100).toFixed(1)}%` },
        ],
        actions: ["Verify self-referencing canonical tags on all landing pages"],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 35: Deep Leaf Page Link Deficit (Path depth >= 2)
  // -------------------------------------------------------------
  const deepLeafCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_DEEP_LEAF_PAGE_DEFICIT;
  if (deepLeafCfg?.enabled && total >= (deepLeafCfg.minSampleSize || 20)) {
    const leafPages = ctx.topPages.filter((p) => {
      const path = p.targetUrl.replace(/^https?:\/\/[^/]+/i, "");
      const segments = path.split("/").filter(Boolean);
      return segments.length >= 2;
    });
    if (leafPages.length === 0 && ctx.topPages.length >= 2) {
      recommendations.push({
        ruleKey: "BACKLINK_DEEP_LEAF_PAGE_DEFICIT",
        title: "Build Inbound Links to Deep Pillar Content",
        severity: "Opportunity",
        priorityScore: 44,
        confidence: "Medium",
        whatWeFound: `0 backlinks point to deep content articles or specific service sub-pages (URL path depth ≥ 2).`,
        whyItMatters:
          "Direct inbound links to specific articles and deep service pages dramatically improve their ability to rank for high-intent, long-tail commercial search queries.",
        howToImprove:
          "Promote individual blog guides, case studies, and specialized tool pages directly in PR outreach rather than standard homepage links.",
        targetTab: "top_pages",
        evidence: [
          { label: "Deep Content Pages Linked", value: 0, highlight: true },
          { label: "Total Tracked Pages", value: ctx.topPages.length },
        ],
        actions: ["Focus content marketing campaigns on earning direct links to deep pillar articles"],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 36: Dofollow Equity Limited to Low-Authority Domains
  // -------------------------------------------------------------
  const dofollowLowCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_DOFOLLOW_EQUITY_ON_LOW_DR;
  if (dofollowLowCfg?.enabled && total >= (dofollowLowCfg.minSampleSize || 20) && ctx.backlinks.length > 0) {
    const dofollowLinks = ctx.backlinks.filter((b) => b.isDofollow);
    if (dofollowLinks.length >= 10) {
      const lowDRDofollow = dofollowLinks.filter((b) => b.domainRank < 15);
      const lowDofollowShare = lowDRDofollow.length / dofollowLinks.length;
      const highDRDofollow = dofollowLinks.filter((b) => b.domainRank >= 30);

      if (lowDofollowShare >= (dofollowLowCfg.thresholds.minLowDRShareOfDofollow || 0.80) && highDRDofollow.length === 0) {
        recommendations.push({
          ruleKey: "BACKLINK_DOFOLLOW_EQUITY_ON_LOW_DR",
          title: "Elevate Authority of Dofollow Backlinks",
          severity: "Medium",
          priorityScore: 58,
          confidence: "High",
          whatWeFound: `${(lowDofollowShare * 100).toFixed(1)}% of your equity-passing Dofollow links (${lowDRDofollow.length} links) originate from low Domain Rank sources (DR < 15).`,
          whyItMatters:
            "Dofollow links pass search ranking equity directly. Earning Dofollow links on higher-authority domains (DR 30+) provides an immediate multiplier on organic keyword positions.",
          howToImprove:
            "Focus outreach on industry trade publications and established business blogs that offer Dofollow editorial links.",
          targetTab: "backlinks",
          evidence: [
            { label: "Low DR Dofollow Share", value: `${(lowDofollowShare * 100).toFixed(1)}%`, highlight: true },
            { label: "High DR Dofollow (30+)", value: 0 },
          ],
          actions: [
            "Target established industry blogs that provide editorial dofollow attribution",
            "Engage in joint webinar or podcast appearances with established brands",
          ],
        });
      }
    }
  }

  // -------------------------------------------------------------
  // Rule 37: Mid-Tier Authority Momentum (DR 25-49 Domains Active - Good)
  // -------------------------------------------------------------
  const tier2Cfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_TIER2_AUTHORITY_MOMENTUM;
  if (tier2Cfg?.enabled && total >= (tier2Cfg.minSampleSize || 10)) {
    const tier2Domains = ctx.referringDomainsList.filter((d) => d.domainRank >= 25 && d.domainRank < 50);
    if (tier2Domains.length >= (tier2Cfg.thresholds.minTier2DomainsCount || 3)) {
      recommendations.push({
        ruleKey: "BACKLINK_TIER2_AUTHORITY_MOMENTUM",
        title: "Growing Mid-Tier Authority Base",
        severity: "Good",
        priorityScore: 28,
        confidence: "High",
        whatWeFound: `Possesses ${tier2Domains.length} referring domains in the solid mid-tier authority range (Domain Rank 25–49).`,
        whyItMatters:
          "A solid base of mid-tier referring domains provides steady domain authority growth and organic resilience.",
        howToImprove:
          "Continue building upon these relationships to earn secondary references across their partner networks.",
        targetTab: "referring_domains",
        evidence: [
          { label: "Mid-Tier Domains (DR 25-49)", value: tier2Domains.length, highlight: true },
          { label: "Sample Domain", value: tier2Domains[0]?.domain || "—" },
        ],
        actions: ["Continue regular outreach to mid-tier trade publications"],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 38: Elite Authority Endorsement (DR 70+ Backlinks - Good)
  // -------------------------------------------------------------
  const eliteCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_ELITE_AUTHORITY_SIGNAL;
  if (eliteCfg?.enabled) {
    const eliteLinks = ctx.backlinks.filter((b) => b.domainRank >= (eliteCfg.thresholds.minEliteDR || 70));
    if (eliteLinks.length >= (eliteCfg.thresholds.minEliteCount || 1)) {
      recommendations.push({
        ruleKey: "BACKLINK_ELITE_AUTHORITY_SIGNAL",
        title: "Elite Authority Backlink Active (DR 70+)",
        severity: "Good",
        priorityScore: 35,
        confidence: "High",
        whatWeFound: `Features ${eliteLinks.length} backlink(s) from top-tier Elite websites with Domain Rank 70+ (${eliteLinks[0]?.sourceDomain || "Major Authority"}).`,
        whyItMatters:
          "Backlinks from elite authority domains provide the highest possible algorithmic trust signal in organic search.",
        howToImprove:
          "Promote content that earned this elite placement to attract secondary organic references.",
        targetTab: "backlinks",
        evidence: [
          { label: "Elite Backlinks (DR 70+)", value: eliteLinks.length, highlight: true },
          { label: "Top Domain", value: eliteLinks[0]?.sourceDomain || "—" },
        ],
        actions: ["Share and promote high-tier editorial coverage across your channels"],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 39: Accelerated Link Loss Risk (> 15% profile loss)
  // -------------------------------------------------------------
  const lossAccelCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_LINK_LOSS_ACCELERATION;
  if (lossAccelCfg?.enabled && total >= (lossAccelCfg.minSampleSize || 15) && ctx.lostBacklinksCount > 0) {
    const lossShare = ctx.lostBacklinksCount / total;
    if (lossShare >= (lossAccelCfg.thresholds.criticalLossShare || 0.15)) {
      recommendations.push({
        ruleKey: "BACKLINK_LINK_LOSS_ACCELERATION",
        title: "Critical Link Churn / Loss Acceleration",
        severity: "Critical",
        priorityScore: 82,
        confidence: "High",
        whatWeFound: `Over ${(lossShare * 100).toFixed(1)}% of your backlink profile (${ctx.lostBacklinksCount.toLocaleString()} links) has been dropped or removed.`,
        whyItMatters:
          "High link churn rates cause sharp domain authority contractions and volatility in competitive keyword rankings.",
        howToImprove:
          "Inspect the New & Lost tab to identify which referring pages dropped links, verify if your site URLs changed, and perform immediate outreach to recover editorial mentions.",
        targetTab: "new_lost",
        evidence: [
          { label: "Lost Backlinks", value: ctx.lostBacklinksCount, highlight: true },
          { label: "Loss Share", value: `${(lossShare * 100).toFixed(1)}%` },
        ],
        actions: [
          "Check the New & Lost tab for dropped link URLs",
          "Ensure 301 redirects are in place for any recently restructured website paths",
        ],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 40: Exceptional Referring Domain Diversity (Good)
  // -------------------------------------------------------------
  const divExcellenceCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_DOMAIN_DIVERSITY_EXCELLENCE;
  if (divExcellenceCfg?.enabled && total >= (divExcellenceCfg.minSampleSize || 20) && ctx.referringDomains > 0) {
    const diversityRatio = ctx.referringDomains / total;
    if (diversityRatio >= (divExcellenceCfg.thresholds.minDiversityRatio || 0.25)) {
      recommendations.push({
        ruleKey: "BACKLINK_DOMAIN_DIVERSITY_EXCELLENCE",
        title: "High Referring Domain Diversity",
        severity: "Good",
        priorityScore: 27,
        confidence: "High",
        whatWeFound: `Strong referring domain diversity of ${(diversityRatio * 100).toFixed(1)}% (${ctx.referringDomains.toLocaleString()} unique domains across ${total.toLocaleString()} links).`,
        whyItMatters:
          "High domain diversity signals authentic, broad web interest across independent publications.",
        howToImprove: "Continue maintaining outreach across new, unlinked websites.",
        targetTab: "referring_domains",
        evidence: [
          { label: "Diversity Ratio", value: `${(diversityRatio * 100).toFixed(1)}%`, highlight: true },
          { label: "Unique Domains", value: ctx.referringDomains.toLocaleString() },
        ],
        actions: ["Maintain diversified link outreach strategy"],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 41: Natural Dofollow/Nofollow Balance (Good)
  // -------------------------------------------------------------
  const naturalDofollowCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_HEALTHY_DOFOLLOW_RATIO;
  if (naturalDofollowCfg?.enabled && total >= (naturalDofollowCfg.minSampleSize || 20) && ctx.dofollowCount > 0) {
    const dofollowRatio = ctx.dofollowCount / total;
    const minRatio = naturalDofollowCfg.thresholds.minDofollowRatio || 0.60;
    const maxRatio = naturalDofollowCfg.thresholds.maxDofollowRatio || 0.88;

    if (dofollowRatio >= minRatio && dofollowRatio <= maxRatio) {
      recommendations.push({
        ruleKey: "BACKLINK_HEALTHY_DOFOLLOW_RATIO",
        title: "Natural Dofollow / Nofollow Balance",
        severity: "Good",
        priorityScore: 25,
        confidence: "High",
        whatWeFound: `Healthy, natural link attribute balance of ${(dofollowRatio * 100).toFixed(1)}% Dofollow and ${(100 - dofollowRatio * 100).toFixed(1)}% Nofollow.`,
        whyItMatters:
          "A natural mixture of follow and nofollow citations mimics organic internet link discovery.",
        howToImprove: "No adjustments required; continue natural content promotion.",
        targetTab: "backlinks",
        evidence: [
          { label: "Dofollow Share", value: `${(dofollowRatio * 100).toFixed(1)}%`, highlight: true },
          { label: "Nofollow Share", value: `${(100 - dofollowRatio * 100).toFixed(1)}%` },
        ],
        actions: ["Maintain organic distribution across earned and directory channels"],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 42: Trailing Slash URL Inconsistency
  // -------------------------------------------------------------
  const trailingSlashCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_TRAILING_SLASH_INCONSISTENCY;
  if (trailingSlashCfg?.enabled && total >= (trailingSlashCfg.minSampleSize || 20)) {
    const pathMap = new Map<string, { withSlash: number; withoutSlash: number }>();
    ctx.backlinks.forEach((b) => {
      try {
        const u = new URL(b.targetUrl);
        if (u.pathname && u.pathname !== "/" && !u.pathname.includes(".")) {
          const normalized = (u.origin + u.pathname).replace(/\/+$/, "");
          const hasSlash = u.pathname.endsWith("/");
          const cur = pathMap.get(normalized) || { withSlash: 0, withoutSlash: 0 };
          if (hasSlash) cur.withSlash++;
          else cur.withoutSlash++;
          pathMap.set(normalized, cur);
        }
      } catch {
        // ignore invalid URL
      }
    });
    let inconsistentCount = 0;
    pathMap.forEach((val) => {
      if (val.withSlash > 0 && val.withoutSlash > 0) {
        inconsistentCount += val.withSlash + val.withoutSlash;
      }
    });
    if (inconsistentCount >= (trailingSlashCfg.thresholds.minInconsistentCount || 3)) {
      recommendations.push({
        ruleKey: "BACKLINK_TRAILING_SLASH_INCONSISTENCY",
        title: "Resolve Trailing Slash URL Inconsistencies",
        severity: "Low",
        priorityScore: 35,
        confidence: "Medium",
        whatWeFound: `${inconsistentCount} inbound backlinks target conflicting trailing slash variants of the same landing page URLs.`,
        whyItMatters:
          "Mismatched trailing slash URLs cause duplicate internal redirect hops and dilute page authority if canonicalization is inconsistent.",
        howToImprove:
          "Standardize your canonical URL structure (either strictly with trailing slash or without) and verify server-level 301 redirects enforce the standard format.",
        targetTab: "backlinks",
        evidence: [
          { label: "Inconsistent Slash Links", value: inconsistentCount, highlight: true },
          { label: "Total Backlinks", value: total.toLocaleString() },
        ],
        actions: [
          "Verify server-level trailing slash rewrite rules",
          "Ensure self-referencing canonical tags match your primary URL architecture standard",
        ],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 43: Subdomain Link Equity Leak (Staging/Dev/Old)
  // -------------------------------------------------------------
  const subdomainLeakCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_SUBDOMAIN_EQUITY_LEAK;
  if (subdomainLeakCfg?.enabled && total >= (subdomainLeakCfg.minSampleSize || 15)) {
    const subLeakPatterns = ["staging.", "dev.", "test.", "beta.", "preview.", "old.", "v1.", "v2."];
    const leakedLinks = ctx.backlinks.filter((b) => {
      try {
        const host = new URL(b.targetUrl).hostname.toLowerCase();
        return subLeakPatterns.some((p) => host.startsWith(p) || host.includes(`.${p}`));
      } catch {
        return false;
      }
    });
    if (leakedLinks.length >= (subdomainLeakCfg.thresholds.minSubdomainCount || 2)) {
      recommendations.push({
        ruleKey: "BACKLINK_SUBDOMAIN_EQUITY_LEAK",
        title: "Recover Staging or Subdomain Link Equity",
        severity: "High",
        priorityScore: 68,
        confidence: "High",
        whatWeFound: `${leakedLinks.length.toLocaleString()} backlinks point to pre-production or legacy staging subdomains (${leakedLinks.map((l) => { try { return new URL(l.targetUrl).hostname; } catch { return l.targetUrl; } }).slice(0, 2).join(", ")}).`,
        whyItMatters:
          "Links pointing to dev or test subdomains leak authority away from your primary production domain and may expose staging environments to search crawlers.",
        howToImprove:
          "Implement 301 redirects from legacy staging subdomains directly to their equivalent production URLs on your main domain.",
        targetTab: "backlinks",
        evidence: [
          { label: "Subdomain Leaked Links", value: leakedLinks.length, highlight: true },
          { label: "Sample Target", value: leakedLinks[0]?.targetUrl || "—" },
        ],
        actions: [
          "Set up 301 redirects on staging/dev subdomains pointing to production URLs",
          "Audit legacy test environments and ensure strict noindex or authentication barriers",
        ],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 44: Citation vs Trust Quality Imbalance
  // -------------------------------------------------------------
  const trustImbalanceCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_TRUST_FLOW_CITATION_IMBALANCE;
  if (trustImbalanceCfg?.enabled && total >= (trustImbalanceCfg.minSampleSize || 15) && ctx.referringDomains > 0) {
    const linkToDomainRatio = total / ctx.referringDomains;
    const lowDRDomains = ctx.referringDomainsList.filter((d) => d.domainRank < 10).length;
    const lowDRRatio = lowDRDomains / ctx.referringDomains;

    if (linkToDomainRatio >= 15 && lowDRRatio >= 0.70) {
      recommendations.push({
        ruleKey: "BACKLINK_TRUST_FLOW_CITATION_IMBALANCE",
        title: "Link Volume Outpacing Domain Trust Profile",
        severity: "Medium",
        priorityScore: 52,
        confidence: "Medium",
        whatWeFound: `High link volume concentration (${linkToDomainRatio.toFixed(1)} links per domain) paired with ${(lowDRRatio * 100).toFixed(1)}% low-authority domains (DR < 10).`,
        whyItMatters:
          "High backlink volume from low-trust sources creates an unnatural quality imbalance that algorithmic filters monitor for artificial inflation.",
        howToImprove:
          "Prioritize acquiring single high-authority editorial citations over bulk automated directory submissions.",
        targetTab: "referring_domains",
        evidence: [
          { label: "Avg Links / Domain", value: linkToDomainRatio.toFixed(1), highlight: true },
          { label: "Low DR Domain Share", value: `${(lowDRRatio * 100).toFixed(1)}%` },
        ],
        actions: [
          "Focus next outreach cycle strictly on high-authority industry publications",
          "Audit automated sitewide link syndicators in the Referring Domains tab",
        ],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 45: High Trust Profile & Authority Endorsement (Good)
  // -------------------------------------------------------------
  const highTrustCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_HIGH_TRUST_FLOW_SIGNAL;
  if (highTrustCfg?.enabled && total >= (highTrustCfg.minSampleSize || 10) && ctx.domainRank !== null) {
    if (ctx.domainRank >= (highTrustCfg.thresholds.minTrustFlow || 30) && ctx.suspiciousCount === 0) {
      recommendations.push({
        ruleKey: "BACKLINK_HIGH_TRUST_FLOW_SIGNAL",
        title: "Strong Overall Domain Authority Rating",
        severity: "Good",
        priorityScore: 30,
        confidence: "High",
        whatWeFound: `Website holds an established Domain Rank of ${ctx.domainRank} with 0 detected suspicious link anomalies.`,
        whyItMatters:
          "A strong domain rating enables new content to index faster and rank higher with lower link acquisition overhead.",
        howToImprove:
          "Leverage your domain authority to publish in-depth cornerstone guides targeting competitive industry terms.",
        targetTab: "referring_domains",
        evidence: [
          { label: "Domain Rank", value: ctx.domainRank, highlight: true },
          { label: "Suspicious Links", value: 0 },
        ],
        actions: ["Target high-difficulty search terms that leverage your existing domain authority"],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 46: Dormant Recent Link Acquisition Velocity
  // -------------------------------------------------------------
  const dormantCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_DORMANT_LINK_ACQUISITION;
  if (dormantCfg?.enabled && total >= (dormantCfg.minSampleSize || 25)) {
    if (ctx.newBacklinksCount <= (dormantCfg.thresholds.maxNewInWindow || 0)) {
      recommendations.push({
        ruleKey: "BACKLINK_DORMANT_LINK_ACQUISITION",
        title: "Reactivate Inactive Link Acquisition Velocity",
        severity: "Medium",
        priorityScore: 50,
        confidence: "Medium",
        whatWeFound: `0 new backlinks detected in the recent 30-day tracking window.`,
        whyItMatters:
          "Stagnant link velocity allows competitors with active outreach to steadily outrank your core commercial search positions over time.",
        howToImprove:
          "Launch a fresh digital PR outreach campaign, release new proprietary industry data, or publish linkable free tools.",
        targetTab: "new_lost",
        evidence: [
          { label: "New Backlinks (30d)", value: 0, highlight: true },
          { label: "Total Backlinks", value: total.toLocaleString() },
        ],
        actions: [
          "Identify trending industry topics for a new link-worthy research report",
          "Reach out to unlinked brand mentions and podcast hosting opportunities",
        ],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 47: Net Positive Link Growth Momentum (Good)
  // -------------------------------------------------------------
  const growthCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_STEADY_GROWTH_MOMENTUM;
  if (growthCfg?.enabled && total >= (growthCfg.minSampleSize || 15)) {
    const netGrowth = ctx.newBacklinksCount - ctx.lostBacklinksCount;
    if (netGrowth >= (growthCfg.thresholds.minNetGrowthCount || 5) && ctx.newBacklinksCount > ctx.lostBacklinksCount) {
      recommendations.push({
        ruleKey: "BACKLINK_STEADY_GROWTH_MOMENTUM",
        title: "Net Positive Link Acquisition Growth",
        severity: "Good",
        priorityScore: 29,
        confidence: "High",
        whatWeFound: `Achieved net positive link growth of +${netGrowth} links (${ctx.newBacklinksCount} gained vs ${ctx.lostBacklinksCount} lost).`,
        whyItMatters:
          "Consistent net positive link momentum compounds domain authority and continuously signals expanding brand relevance.",
        howToImprove: "Continue maintaining current content marketing and promotional initiatives.",
        targetTab: "new_lost",
        evidence: [
          { label: "Net Link Growth", value: `+${netGrowth}`, highlight: true },
          { label: "New / Lost Ratio", value: `${ctx.newBacklinksCount} / ${ctx.lostBacklinksCount}` },
        ],
        actions: ["Track which content formats are producing the highest link conversion rate"],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 48: High-DR Referring Domain Loss Alert
  // -------------------------------------------------------------
  const highDrLossCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_HIGH_DR_LINK_LOSS_ALERT;
  if (highDrLossCfg?.enabled && ctx.lostBacklinksCount > 0) {
    const lostHighAuth = ctx.backlinks.filter(
      (b) => b.isLost && b.domainRank >= (highDrLossCfg.thresholds.minLostDR || 40)
    );
    if (lostHighAuth.length >= 1) {
      recommendations.push({
        ruleKey: "BACKLINK_HIGH_DR_LINK_LOSS_ALERT",
        title: "High-Authority Backlink Loss Alert (DR 40+)",
        severity: "High",
        priorityScore: 75,
        confidence: "High",
        whatWeFound: `Lost ${lostHighAuth.length} valuable backlink(s) from high-authority domain(s) (DR ≥ 40), including ${lostHighAuth[0]?.sourceDomain}.`,
        whyItMatters:
          "Losing citations from high-authority domains can trigger sudden ranking drops for key commercial target pages.",
        howToImprove:
          "Inspect the lost URL in the New & Lost tab, confirm why the link was removed (e.g. page redesign or broken link), and reach out to reclaim the mention.",
        targetTab: "new_lost",
        evidence: [
          { label: "Lost High DR Links", value: lostHighAuth.length, highlight: true },
          { label: "Top Lost Domain", value: lostHighAuth[0]?.sourceDomain || "—" },
        ],
        actions: [
          "Check the New & Lost tab for the exact source URL and reason for loss",
          "Contact the publisher with an updated URL or refreshed content resource",
        ],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 49: Multi-Page Equity Distribution (Good)
  // -------------------------------------------------------------
  const multiPageCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_MULTI_PAGE_EQUITY_BALANCE;
  if (multiPageCfg?.enabled && total >= (multiPageCfg.minSampleSize || 20) && ctx.topPages.length > 0) {
    const pagesWithMultipleLinks = ctx.topPages.filter((p) => p.backlinksCount >= 2);
    if (pagesWithMultipleLinks.length >= (multiPageCfg.thresholds.minPagesWithLinks || 5)) {
      recommendations.push({
        ruleKey: "BACKLINK_MULTI_PAGE_EQUITY_BALANCE",
        title: "Diversified Multi-Page Link Equity",
        severity: "Good",
        priorityScore: 26,
        confidence: "High",
        whatWeFound: `Backlink equity is evenly distributed across ${pagesWithMultipleLinks.length} distinct landing pages and content assets.`,
        whyItMatters:
          "Spreading link authority across multiple pages empowers deep content to rank independently for commercial keywords.",
        howToImprove: "Continue directing targeted outreach toward specific deep guides and product pages.",
        targetTab: "top_pages",
        evidence: [
          { label: "Multi-Linked Pages", value: pagesWithMultipleLinks.length, highlight: true },
          { label: "Total Pages Tracked", value: ctx.topPages.length },
        ],
        actions: ["Maintain deep page targeting in ongoing content marketing campaigns"],
      });
    }
  }

  // -------------------------------------------------------------
  // Rule 50: Balanced & Natural Anchor Text Profile (Good)
  // -------------------------------------------------------------
  const balancedAnchorCfg = RECOMMENDATION_RULES_CONFIG.BACKLINK_BALANCED_ANCHOR_DISTRIBUTION;
  if (balancedAnchorCfg?.enabled && total >= (balancedAnchorCfg.minSampleSize || 25) && ctx.anchors.length >= 3) {
    const totalAnchors = ctx.anchors.reduce((sum, a) => sum + a.backlinksCount, 0) || total;
    const brandedAnchors = ctx.anchors.filter((a) => a.classification === "BRANDED");
    const urlAnchors = ctx.anchors.filter((a) => a.classification === "URL");
    const exactAnchors = ctx.anchors.filter((a) => a.classification === "EXACT_MATCH");

    const brandedShare = brandedAnchors.reduce((s, a) => s + a.backlinksCount, 0) / totalAnchors;
    const urlShare = urlAnchors.reduce((s, a) => s + a.backlinksCount, 0) / totalAnchors;
    const exactShare = exactAnchors.reduce((s, a) => s + a.backlinksCount, 0) / totalAnchors;

    const minBrand = (balancedAnchorCfg.thresholds.minBrandedPct || 15) / 100;
    const maxBrand = (balancedAnchorCfg.thresholds.maxBrandedPct || 60) / 100;
    const minUrl = (balancedAnchorCfg.thresholds.minUrlPct || 10) / 100;
    const maxExact = (balancedAnchorCfg.thresholds.maxExactPct || 25) / 100;

    if (brandedShare >= minBrand && brandedShare <= maxBrand && urlShare >= minUrl && exactShare <= maxExact) {
      recommendations.push({
        ruleKey: "BACKLINK_BALANCED_ANCHOR_DISTRIBUTION",
        title: "Balanced & Natural Anchor Text Profile",
        severity: "Good",
        priorityScore: 27,
        confidence: "High",
        whatWeFound: `Anchor profile shows a healthy balance: ${(brandedShare * 100).toFixed(1)}% Branded, ${(urlShare * 100).toFixed(1)}% URL, and ${(exactShare * 100).toFixed(1)}% Exact Match.`,
        whyItMatters:
          "A balanced anchor text distribution protects against over-optimization algorithmic penalties while supporting keyword ranking relevance.",
        howToImprove: "Continue maintaining natural editorial variation in future link placements.",
        targetTab: "anchors",
        evidence: [
          { label: "Branded Anchor Share", value: `${(brandedShare * 100).toFixed(1)}%`, highlight: true },
          { label: "URL Anchor Share", value: `${(urlShare * 100).toFixed(1)}%` },
        ],
        actions: ["Continue natural anchor text variation in digital PR campaigns"],
      });
    }
  }

  // Sort recommendations by Priority Score descending (Critical/High first, then Medium, Low, Opportunity, Good)
  return recommendations.sort((a, b) => b.priorityScore - a.priorityScore);
}
