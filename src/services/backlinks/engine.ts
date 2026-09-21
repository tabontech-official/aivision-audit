import { db as prisma } from "@/lib/db/client";
import {
  fetchBacklinkDataFromMangools,
  sanitizeDomain,
} from "@/services/mangools/client";
import { NormalizedBacklinkDataset } from "@/services/mangools/types";
import { AnchorType, Prisma } from "@prisma/client";
import { generateBacklinkRecommendations } from "./recommendations/engine";
import { RecommendationContext } from "./recommendations/types";

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
  dofollow: number | null
): { status: "Good" | "Needs Attention" | "Critical"; issues: string[] } {
  const issues: string[] = [];

  if (totalBacklinks === 0) {
    return { status: "Needs Attention", issues: ["No backlinks detected yet for this domain."] };
  }

  const brokenRatio = totalBacklinks > 0 ? brokenBacklinks / totalBacklinks : 0;
  const suspiciousRatio = totalBacklinks > 0 ? suspiciousBacklinks / totalBacklinks : 0;
  const dofollowRatio = dofollow !== null && totalBacklinks > 0 ? dofollow / totalBacklinks : null;
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
  if (dofollowRatio !== null && dofollowRatio > 0 && dofollowRatio < 0.35) {
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
 * Evaluate and persist deterministic backlink recommendations
 */
export async function generateAndPersistRecommendations(auditId: string) {
  const audit = await prisma.backlinkAudit.findUnique({
    where: { id: auditId },
    include: {
      backlinks: true,
      referringDomainsList: true,
      anchors: true,
      topPages: true,
    },
  });

  if (!audit) return [];

  const ctx: RecommendationContext = {
    domain: audit.domain,
    totalBacklinks: audit.totalBacklinks,
    referringDomains: audit.referringDomains,
    domainRank: audit.domainRank,
    referringIps: audit.referringIps,
    referringSubnets: audit.referringSubnets,
    dofollowCount: audit.dofollowBacklinks ?? audit.backlinks.filter((b) => b.isDofollow).length,
    nofollowCount: audit.nofollowBacklinks ?? audit.backlinks.filter((b) => !b.isDofollow).length,
    brokenCount: audit.brokenBacklinks,
    suspiciousCount: audit.suspiciousBacklinks,
    newBacklinksCount: audit.backlinks.filter((b) => b.isNew).length,
    lostBacklinksCount: audit.backlinks.filter((b) => b.isLost || b.isBroken).length,
    backlinks: audit.backlinks.map((b) => ({
      id: b.id,
      sourceDomain: b.referringDomain,
      sourceUrl: b.referringUrl,
      targetUrl: b.targetUrl,
      anchor: b.anchor,
      isDofollow: b.isDofollow,
      domainRank: b.domainRank,
      httpStatus: b.httpStatus ?? 200,
      linkType: b.httpStatus === 301 ? "redirect" : "text",
      isNew: b.isNew,
      isLost: b.isLost,
      isBroken: b.isBroken,
      isSuspicious: b.isSuspicious,
      lossReason: b.lossReason,
    })),
    referringDomainsList: audit.referringDomainsList.map((rd) => ({
      domain: rd.domain,
      backlinksCount: rd.backlinksCount,
      dofollowCount: rd.dofollowCount,
      nofollowCount: rd.nofollowCount,
      domainRank: rd.domainRank,
    })),
    anchors: audit.anchors.map((a) => ({
      anchor: a.anchor,
      backlinksCount: a.backlinksCount,
      referringDomainsCount: a.referringDomainsCount,
      percentage: a.percentage,
      classification: a.classification,
    })),
    topPages: audit.topPages.map((tp) => ({
      targetUrl: tp.targetUrl,
      backlinksCount: tp.backlinksCount,
      referringDomainsCount: tp.referringDomainsCount,
      brokenCount: tp.brokenCount,
    })),
  };

  const recs = generateBacklinkRecommendations(ctx);

  // Clear existing and persist new recommendations in transaction
  await prisma.$transaction([
    prisma.backlinkRecommendation.deleteMany({ where: { auditId } }),
    prisma.backlinkRecommendation.createMany({
      data: recs.map((r) => ({
        auditId,
        ruleKey: r.ruleKey,
        title: r.title,
        severity: r.severity,
        priorityScore: r.priorityScore,
        confidence: r.confidence,
        status: "active",
        whatWeFound: r.whatWeFound,
        whyItMatters: r.whyItMatters,
        howToImprove: r.howToImprove,
        targetTab: r.targetTab,
        filterParamsJson: r.filterParams ? (r.filterParams as Prisma.InputJsonValue) : Prisma.JsonNull,
        evidenceJson: r.evidence as unknown as Prisma.InputJsonValue,
        actionsJson: r.actions as unknown as Prisma.InputJsonValue,
      })),
    }),
  ]);

  return prisma.backlinkRecommendation.findMany({
    where: { auditId },
    orderBy: { priorityScore: "desc" },
  });
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

  let audit = await prisma.backlinkAudit.findFirst({
    where: {
      OR: [
        ...(website ? [{ websiteId: website.id }] : []),
        { domain },
      ],
    },
    include: {
      backlinks: {
        take: 1000,
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
      recommendations: {
        orderBy: { priorityScore: "desc" },
      },
    },
    orderBy: { fetchedAt: "desc" },
  });

  if (!audit) return null;

  if (audit.fetchedRowsCount && audit.fetchedRowsCount > 0 && audit.totalBacklinks !== audit.fetchedRowsCount) {
    audit.totalBacklinks = audit.fetchedRowsCount;
  }

  // If recommendations not generated yet for this existing audit, generate on demand
  if (!audit.recommendations || audit.recommendations.length === 0) {
    const recs = await generateAndPersistRecommendations(audit.id);
    audit = {
      ...audit,
      recommendations: recs,
    };
  }

  return audit;
}

/**
 * Retrieve cached backlink audit or fetch fresh data from Mangools API
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
    let cachedAudit = await prisma.backlinkAudit.findFirst({
      where: {
        websiteId: website.id,
        expiresAt: { gt: now },
      },
      include: {
        backlinks: {
          take: 1000,
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
        recommendations: {
          orderBy: { priorityScore: "desc" },
        },
      },
      orderBy: { fetchedAt: "desc" },
    });

    if (cachedAudit) {
      if (cachedAudit.fetchedRowsCount && cachedAudit.fetchedRowsCount > 0 && cachedAudit.totalBacklinks !== cachedAudit.fetchedRowsCount) {
        cachedAudit.totalBacklinks = cachedAudit.fetchedRowsCount;
      }

      if (!cachedAudit.recommendations || cachedAudit.recommendations.length === 0) {
        const recs = await generateAndPersistRecommendations(cachedAudit.id);
        cachedAudit = {
          ...cachedAudit,
          recommendations: recs,
        };
      }

      return {
        audit: cachedAudit,
        isCached: true,
      };
    }
  }

  // 3. Fetch fresh dataset from Mangools API
  const dataset: NormalizedBacklinkDataset = await fetchBacklinkDataFromMangools(domain);

  const totalBL = dataset.overview.totalBacklinks;
  const health = calculateBacklinkHealth(
    totalBL,
    dataset.overview.referringDomains,
    dataset.overview.brokenBacklinks,
    dataset.overview.suspiciousBacklinks,
    dataset.overview.dofollowCount
  );

  const expiresAt = new Date(Date.now() + BACKLINK_TTL_HOURS * 60 * 60 * 1000);

  // Helper to preserve null in database for missing metrics
  const toNullableDbInt = (val: number | null | undefined): number | null => {
    if (val === null || val === undefined) return null;
    const num = Number(val);
    return isNaN(num) ? null : Math.round(num);
  };

  // 4. Save to Database in transaction
  const newAudit = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      // Create master audit record
    const audit = await tx.backlinkAudit.create({
      data: {
        websiteId: website.id,
        domain,
        totalBacklinks: Math.round(Number(dataset.overview.totalBacklinks) || 0),
        referringDomains: Math.round(Number(dataset.overview.referringDomains) || 0),
        referringPages: Math.round(Number(dataset.overview.totalBacklinks) || 0),
        dofollowBacklinks: toNullableDbInt(dataset.overview.dofollowCount),
        nofollowBacklinks: toNullableDbInt(dataset.overview.nofollowCount),
        newBacklinks: toNullableDbInt(dataset.overview.newBacklinks),
        lostBacklinks: toNullableDbInt(dataset.overview.lostBacklinks),
        referringIps: toNullableDbInt(dataset.overview.referringIps),
        referringSubnets: toNullableDbInt(dataset.overview.referringSubnets),
        domainRank: toNullableDbInt(dataset.overview.domainRank),
        brokenBacklinks: Math.round(Number(dataset.overview.brokenBacklinks) || 0),
        suspiciousBacklinks: Math.round(Number(dataset.overview.suspiciousBacklinks) || 0),
        healthStatus: health.status,
        status: dataset.overview.status || "completed",
        fetchedRowsCount: dataset.backlinks.length,
        lastFetchedPage: dataset.overview.lastFetchedPage || 0,
        progressMessage: `Fetched ${dataset.backlinks.length} / ${dataset.overview.availableRowRecords || dataset.overview.totalBacklinks} backlinks`,
        metricsJson: {
          provider: "mangools",
          totalIndexedBacklinks: Math.round(Number(dataset.overview.totalIndexedBacklinks || dataset.overview.totalBacklinks) || 0),
          detailedBacklinksAvailable: dataset.overview.detailedBacklinksAvailable || dataset.overview.availableRowRecords || dataset.backlinks.length,
          detailedBacklinksFetched: dataset.backlinks.length,
          creditsUsed: Math.round(Number(dataset.overview.creditsUsed) || 1),
          costMetrics: dataset.overview.costMetrics || {
            apiCallsCount: 3,
            pagesFetched: 1,
            creditsConsumed: dataset.backlinks.length + 1,
          },
          availableRowRecords: dataset.overview.detailedBacklinksAvailable || dataset.overview.availableRowRecords || dataset.backlinks.length,
          healthIssues: health.issues,
        },
        fetchedAt: now,
        expiresAt,
      },
    });

    // Create Backlinks records in chunks of 500
    if (dataset.backlinks.length > 0) {
      const CHUNK_SIZE = 500;
      for (let i = 0; i < dataset.backlinks.length; i += CHUNK_SIZE) {
        const chunk = dataset.backlinks.slice(i, i + CHUNK_SIZE);
        await tx.backlinkRecord.createMany({
          data: chunk.map((bl) => ({
            auditId: audit.id,
            referringDomain: bl.sourceDomain,
            referringUrl: bl.sourceUrl,
            targetUrl: bl.targetUrl,
            anchor: bl.anchor,
            isDofollow: Boolean(bl.isDofollow),
            domainRank: Math.round(Number(bl.domainRank) || 0),
            pageRank: Math.round(Number(bl.pageRank) || 0),
            httpStatus: Math.round(Number(bl.httpStatus) || 200),
            isNew: Boolean(bl.isNew),
            isLost: Boolean(bl.isLost),
            isBroken: Boolean(bl.isBroken),
            isSuspicious: Boolean(bl.isSuspicious),
            lossReason: bl.lossReason,
            firstSeen: bl.firstSeen,
            lastSeen: bl.lastSeen,
          })),
        });
      }
    }

    // Create Referring Domains records
    if (dataset.referringDomains.length > 0) {
      await tx.referringDomainItem.createMany({
        data: dataset.referringDomains.map((rd) => ({
          auditId: audit.id,
          domain: rd.domain,
          backlinksCount: Math.round(Number(rd.backlinksCount) || 0),
          dofollowCount: Math.round(Number(rd.dofollowCount) || 0),
          nofollowCount: Math.round(Number(rd.nofollowCount) || 0),
          domainRank: Math.round(Number(rd.domainRank) || 0),
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
            backlinksCount: Math.round(Number(a.backlinksCount) || 0),
            referringDomainsCount: Math.round(Number(a.referringDomainsCount) || 0),
            percentage: Number(a.percentage) || 0,
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
          backlinksCount: Math.round(Number(tp.backlinksCount) || 0),
          referringDomainsCount: Math.round(Number(tp.referringDomainsCount) || 0),
          dofollowCount: Math.round(Number(tp.dofollowCount) || 0),
          nofollowCount: Math.round(Number(tp.nofollowCount) || 0),
          brokenCount: Math.round(Number(tp.brokenCount) || 0),
          httpStatus: Math.round(Number(tp.httpStatus) || 200),
        })),
      });
    }

      return audit;
    },
    {
      maxWait: 15000,
      timeout: 45000,
    }
  );

  // Generate and persist recommendations for fresh audit
  await generateAndPersistRecommendations(newAudit.id);

  // Re-fetch complete saved audit with relations
  const completeAudit = await prisma.backlinkAudit.findUnique({
    where: { id: newAudit.id },
    include: {
      backlinks: {
        take: 1000,
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
      recommendations: {
        orderBy: { priorityScore: "desc" },
      },
    },
  });

  return {
    audit: completeAudit!,
    isCached: false,
  };
}

/**
 * Resume an interrupted backlink audit from the last successfully fetched page
 */
export async function resumeBacklinkAudit(rawDomain: string, userId?: string) {
  const domain = sanitizeDomain(rawDomain);
  if (!domain) throw new Error("Valid domain is required");

  const latestAudit = await prisma.backlinkAudit.findFirst({
    where: { domain },
    orderBy: { fetchedAt: "desc" },
    include: {
      backlinks: true,
    },
  });

  if (!latestAudit) {
    return getOrFetchBacklinkAudit(domain, userId, true);
  }

  const startPage = (latestAudit.lastFetchedPage || 0) + 1;

  // Fetch remaining pages from Mangools
  const dataset = await fetchBacklinkDataFromMangools(domain, undefined, {
    startPage,
  });

  // Insert newly retrieved links
  if (dataset.backlinks.length > 0) {
    const CHUNK_SIZE = 500;
    for (let i = 0; i < dataset.backlinks.length; i += CHUNK_SIZE) {
      const chunk = dataset.backlinks.slice(i, i + CHUNK_SIZE);
      await prisma.backlinkRecord.createMany({
        data: chunk.map((bl) => ({
          auditId: latestAudit.id,
          referringDomain: bl.sourceDomain,
          referringUrl: bl.sourceUrl,
          targetUrl: bl.targetUrl,
          anchor: bl.anchor,
          isDofollow: Boolean(bl.isDofollow),
          domainRank: Math.round(Number(bl.domainRank) || 0),
          pageRank: Math.round(Number(bl.pageRank) || 0),
          httpStatus: Math.round(Number(bl.httpStatus) || 200),
          isNew: Boolean(bl.isNew),
          isLost: Boolean(bl.isLost),
          isBroken: Boolean(bl.isBroken),
          isSuspicious: Boolean(bl.isSuspicious),
          lossReason: bl.lossReason,
          firstSeen: bl.firstSeen,
          lastSeen: bl.lastSeen,
        })),
      });
    }
  }

  const allAuditBacklinks = await prisma.backlinkRecord.findMany({
    where: { auditId: latestAudit.id },
  });

  const updatedCount = allAuditBacklinks.length;
  const dofollowCount = allAuditBacklinks.filter((b) => b.isDofollow).length;
  const nofollowCount = allAuditBacklinks.filter((b) => !b.isDofollow).length;
  const newCount = allAuditBacklinks.filter((b) => b.isNew).length;
  const lostCount = allAuditBacklinks.filter((b) => b.isLost || b.isBroken).length;
  const brokenCount = allAuditBacklinks.filter((b) => b.isBroken).length;

  const health = calculateBacklinkHealth(
    updatedCount,
    latestAudit.referringDomains,
    brokenCount,
    latestAudit.suspiciousBacklinks,
    dofollowCount
  );

  await prisma.backlinkAudit.update({
    where: { id: latestAudit.id },
    data: {
      totalBacklinks: updatedCount,
      referringPages: updatedCount,
      dofollowBacklinks: dofollowCount,
      nofollowBacklinks: nofollowCount,
      newBacklinks: newCount,
      lostBacklinks: lostCount,
      brokenBacklinks: brokenCount,
      healthStatus: health.status,
      status: dataset.overview.status || "completed",
      fetchedRowsCount: updatedCount,
      lastFetchedPage: dataset.overview.lastFetchedPage || startPage,
      progressMessage: `Fetched ${updatedCount} / ${dataset.overview.availableRowRecords || dataset.overview.totalBacklinks} backlinks`,
    },
  });

  // Regenerate recommendations with the expanded dataset
  await generateAndPersistRecommendations(latestAudit.id);

  const updatedAudit = await prisma.backlinkAudit.findUnique({
    where: { id: latestAudit.id },
    include: {
      backlinks: {
        take: 1000,
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
      recommendations: {
        orderBy: { priorityScore: "desc" },
      },
    },
  });

  return {
    audit: updatedAudit!,
    isCached: false,
  };
}
