import { db as prisma } from "@/lib/db/client";
import {
  fetchBacklinkDataFromRankParse,
  sanitizeDomain,
} from "@/services/rankparse/client";
import { NormalizedBacklinkDataset } from "@/services/rankparse/types";
import { AnchorType, Prisma } from "@prisma/client";

export { sanitizeDomain };

export const BACKLINK_TTL_HOURS = 72;

/**
 * Classify anchor text into standard SEO categories
 */
export function classifyAnchorText(anchor: string, domain: string): AnchorType {
  const cleanAnchor = (anchor || "").trim().toLowerCase();
  const cleanDomain = domain.toLowerCase();
  const brandName = cleanDomain.split(".")[0] || "";

  if (!cleanAnchor || cleanAnchor === "(empty anchor)" || cleanAnchor === "image") {
    return AnchorType.OTHER;
  }

  // 1. Naked URL
  if (
    cleanAnchor.startsWith("http://") ||
    cleanAnchor.startsWith("https://") ||
    cleanAnchor.startsWith("www.") ||
    cleanAnchor.includes(".com") ||
    cleanAnchor.includes(".io") ||
    cleanAnchor.includes(".net") ||
    cleanAnchor.includes(".org") ||
    cleanAnchor === cleanDomain
  ) {
    return AnchorType.NAKED_URL;
  }

  // 2. Generic terms
  const genericTerms = [
    "click here",
    "visit website",
    "website",
    "read more",
    "learn more",
    "source",
    "link",
    "here",
    "view page",
    "official site",
    "this article",
    "this guide",
    "check here",
  ];
  if (genericTerms.some((g) => cleanAnchor === g || cleanAnchor.includes(g))) {
    return AnchorType.GENERIC;
  }

  // 3. Branded
  if (brandName.length >= 3 && cleanAnchor.includes(brandName)) {
    return AnchorType.BRANDED;
  }

  // 4. Exact / Partial match heuristics
  const words = cleanAnchor.split(/\s+/);
  if (words.length <= 3) {
    return AnchorType.EXACT_MATCH;
  } else if (words.length <= 6) {
    return AnchorType.PARTIAL_MATCH;
  }

  return AnchorType.OTHER;
}

/**
 * Calculate overall health status for backlink profile based on real metrics
 */
export function calculateBacklinkHealth(
  totalBacklinks: number,
  referringDomains: number,
  brokenBacklinks: number,
  suspiciousBacklinks: number,
  dofollow: number
): { status: "Good" | "Needs Attention" | "Critical"; issues: string[] } {
  const issues: string[] = [];

  if (totalBacklinks === 0) {
    return { status: "Needs Attention", issues: ["No backlinks detected yet for this domain."] };
  }

  const brokenRatio = totalBacklinks > 0 ? brokenBacklinks / totalBacklinks : 0;
  const suspiciousRatio = totalBacklinks > 0 ? suspiciousBacklinks / totalBacklinks : 0;
  const dofollowRatio = totalBacklinks > 0 ? dofollow / totalBacklinks : 0;
  const domainDiversity = totalBacklinks > 0 ? referringDomains / totalBacklinks : 0;

  if (brokenRatio > 0.08) {
    issues.push(`High broken backlink rate (${(brokenRatio * 100).toFixed(1)}%).`);
  }
  if (suspiciousRatio > 0.08) {
    issues.push(`Elevated spam/suspicious backlink ratio (${(suspiciousRatio * 100).toFixed(1)}%).`);
  }
  if (domainDiversity < 0.03 && totalBacklinks > 500) {
    issues.push("Low referring domain diversity - potential sitewide link concentration.");
  }
  if (dofollowRatio > 0 && dofollowRatio < 0.35) {
    issues.push("Unusually low Dofollow backlink share (< 35%).");
  }

  if (brokenRatio > 0.15 || suspiciousRatio > 0.15) {
    return { status: "Critical", issues };
  }
  if (issues.length > 0) {
    return { status: "Needs Attention", issues };
  }

  return { status: "Good", issues: ["Healthy backlink distribution and domain authority profile."] };
}

/**
 * Metric card status evaluation
 */
export function getMetricCardStatus(
  key: string,
  val: number,
  totalBacklinks: number
): { status: "Good" | "Needs Attention" | "Critical"; tooltip: string } {
  switch (key) {
    case "broken": {
      if (val === 0) return { status: "Good", tooltip: "No broken inbound backlinks detected." };
      const ratio = totalBacklinks > 0 ? val / totalBacklinks : 0;
      if (ratio > 0.08) return { status: "Critical", tooltip: "Over 8% of inbound links lead to broken (404/5xx) targets." };
      return { status: "Needs Attention", tooltip: "Some inbound links return 404 or connection errors." };
    }
    case "suspicious": {
      if (val === 0) return { status: "Good", tooltip: "Zero toxic or suspicious backlink sources identified." };
      const ratio = totalBacklinks > 0 ? val / totalBacklinks : 0;
      if (ratio > 0.08) return { status: "Critical", tooltip: "Substantial toxic link footprint detected." };
      return { status: "Needs Attention", tooltip: "Low quality referring domains detected." };
    }
    case "dofollow": {
      const ratio = totalBacklinks > 0 ? val / totalBacklinks : 1;
      if (ratio >= 0.55) return { status: "Good", tooltip: "Healthy majority of dofollow equity-passing links." };
      if (ratio >= 0.35) return { status: "Needs Attention", tooltip: "Moderate dofollow link ratio." };
      return { status: "Critical", tooltip: "Low dofollow ratio - most incoming links are nofollow." };
    }
    case "domain_rank": {
      if (val >= 60) return { status: "Good", tooltip: "High domain authority score." };
      if (val >= 30) return { status: "Good", tooltip: "Solid domain authority score." };
      return { status: "Needs Attention", tooltip: "Emerging domain authority profile." };
    }
    default:
      return { status: "Good", tooltip: "Metric is within normal operational parameters." };
  }
}

/**
 * Look up an existing backlink audit from the database without auto-fetching
 */
export async function getExistingBacklinkAudit(rawDomain: string, userId?: string) {
  const domain = sanitizeDomain(rawDomain);
  if (!domain) return null;

  const website = await prisma.website.findFirst({
    where: {
      domain,
      ...(userId ? { userId } : {}),
    },
  });

  if (!website) return null;

  const audit = await prisma.backlinkAudit.findFirst({
    where: {
      websiteId: website.id,
    },
    include: {
      backlinks: {
        take: 100,
        orderBy: { domainRank: "desc" },
      },
      referringDomainsList: {
        take: 100,
        orderBy: { backlinksCount: "desc" },
      },
      anchors: {
        take: 50,
        orderBy: { backlinksCount: "desc" },
      },
      topPages: {
        take: 50,
        orderBy: { backlinksCount: "desc" },
      },
    },
    orderBy: { fetchedAt: "desc" },
  });

  return audit;
}

/**
 * Retrieve cached backlink audit or fetch fresh data from RankParse API
 */
export async function getOrFetchBacklinkAudit(
  rawDomain: string,
  userId?: string,
  forceRefresh: boolean = false
) {
  const domain = sanitizeDomain(rawDomain);
  if (!domain) {
    throw new Error("Valid domain is required for backlink audit");
  }

  // 1. Find or create Website record
  let website = await prisma.website.findFirst({
    where: {
      domain,
      ...(userId ? { userId } : {}),
    },
  });

  if (!website) {
    website = await prisma.website.create({
      data: {
        url: `https://${domain}`,
        domain,
        userId: userId || null,
        firstAuditedAt: new Date(),
        lastAuditedAt: new Date(),
      },
    });
  }

  const now = new Date();

  // 2. Check for fresh cached audit
  if (!forceRefresh) {
    const cachedAudit = await prisma.backlinkAudit.findFirst({
      where: {
        websiteId: website.id,
        expiresAt: { gt: now },
      },
      include: {
        backlinks: {
          take: 100,
          orderBy: { domainRank: "desc" },
        },
        referringDomainsList: {
          take: 100,
          orderBy: { backlinksCount: "desc" },
        },
        anchors: {
          take: 50,
          orderBy: { backlinksCount: "desc" },
        },
        topPages: {
          take: 50,
          orderBy: { backlinksCount: "desc" },
        },
      },
      orderBy: { fetchedAt: "desc" },
    });

    if (cachedAudit) {
      return {
        audit: cachedAudit,
        isCached: true,
      };
    }
  }

  // 3. Fetch fresh dataset from RankParse API
  const dataset: NormalizedBacklinkDataset = await fetchBacklinkDataFromRankParse(domain);

  const totalBL = dataset.overview.totalBacklinks;
  const health = calculateBacklinkHealth(
    totalBL,
    dataset.overview.referringDomains,
    dataset.overview.brokenBacklinks,
    dataset.overview.suspiciousBacklinks,
    dataset.overview.dofollowCount
  );

  const expiresAt = new Date(Date.now() + BACKLINK_TTL_HOURS * 60 * 60 * 1000);

  // 4. Save to Database in transaction
  const newAudit = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Create master audit record
    const audit = await tx.backlinkAudit.create({
      data: {
        websiteId: website.id,
        domain,
        totalBacklinks: dataset.overview.totalBacklinks,
        referringDomains: dataset.overview.referringDomains,
        referringPages: dataset.overview.totalBacklinks,
        dofollowBacklinks: dataset.overview.dofollowCount,
        nofollowBacklinks: dataset.overview.nofollowCount,
        newBacklinks: 0, // RankParse does not provide historical new links (never estimate)
        lostBacklinks: 0, // RankParse does not provide historical lost links (never estimate)
        referringIps: 0,
        referringSubnets: 0,
        domainRank: dataset.overview.domainRank,
        brokenBacklinks: dataset.overview.brokenBacklinks,
        suspiciousBacklinks: dataset.overview.suspiciousBacklinks,
        healthStatus: health.status,
        metricsJson: {
          provider: "rankparse",
          creditsUsed: dataset.overview.creditsUsed,
          healthIssues: health.issues,
        },
        fetchedAt: now,
        expiresAt,
      },
    });

    // Create Backlinks records
    if (dataset.backlinks.length > 0) {
      await tx.backlinkRecord.createMany({
        data: dataset.backlinks.map((bl) => ({
          auditId: audit.id,
          referringDomain: bl.sourceDomain,
          referringUrl: bl.sourceUrl,
          targetUrl: bl.targetUrl,
          anchor: bl.anchor,
          isDofollow: bl.isDofollow,
          domainRank: bl.domainRank,
          pageRank: bl.pageRank,
          httpStatus: bl.httpStatus,
          isNew: bl.isNew,
          isLost: bl.isLost,
          isBroken: bl.isBroken,
          isSuspicious: bl.isSuspicious,
          lossReason: bl.lossReason,
          firstSeen: bl.firstSeen,
          lastSeen: bl.lastSeen,
        })),
      });
    }

    // Create Referring Domains records
    if (dataset.referringDomains.length > 0) {
      await tx.referringDomainItem.createMany({
        data: dataset.referringDomains.map((rd) => ({
          auditId: audit.id,
          domain: rd.domain,
          backlinksCount: rd.backlinksCount,
          dofollowCount: rd.dofollowCount,
          nofollowCount: rd.nofollowCount,
          domainRank: rd.domainRank,
          ip: rd.ip,
          country: rd.country,
          firstSeen: null,
          lastSeen: null,
        })),
      });
    }

    // Create Anchors records with auto-classification
    if (dataset.anchors.length > 0) {
      await tx.anchorRecord.createMany({
        data: dataset.anchors.map((a) => {
          const classification = classifyAnchorText(a.anchor, domain);
          return {
            auditId: audit.id,
            anchor: a.anchor,
            backlinksCount: a.backlinksCount,
            referringDomainsCount: a.referringDomainsCount,
            percentage: a.percentage,
            classification,
          };
        }),
      });
    }

    // Create Top Pages records
    if (dataset.topPages.length > 0) {
      await tx.topPageRecord.createMany({
        data: dataset.topPages.map((tp) => ({
          auditId: audit.id,
          targetUrl: tp.targetUrl,
          backlinksCount: tp.backlinksCount,
          referringDomainsCount: tp.referringDomainsCount,
          dofollowCount: tp.dofollowCount,
          nofollowCount: tp.nofollowCount,
          brokenCount: tp.brokenCount,
          httpStatus: tp.httpStatus,
        })),
      });
    }

    return audit;
  });

  // Re-fetch complete saved audit with relations
  const completeAudit = await prisma.backlinkAudit.findUnique({
    where: { id: newAudit.id },
    include: {
      backlinks: {
        take: 100,
        orderBy: { domainRank: "desc" },
      },
      referringDomainsList: {
        take: 100,
        orderBy: { backlinksCount: "desc" },
      },
      anchors: {
        take: 50,
        orderBy: { backlinksCount: "desc" },
      },
      topPages: {
        take: 50,
        orderBy: { backlinksCount: "desc" },
      },
    },
  });

  return {
    audit: completeAudit!,
    isCached: false,
  };
}
