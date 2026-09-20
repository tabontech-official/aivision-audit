"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db/client";
import { auth } from "@/lib/auth/auth";
import { getOrFetchBacklinkAudit, sanitizeDomain } from "@/services/backlinks/engine";

export interface BacklinkFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: "all" | "dofollow" | "nofollow" | "new" | "lost" | "broken" | "suspicious";
  minRank?: number;
  maxRank?: number;
  sortBy?: "domainRank" | "pageRank" | "firstSeen" | "lastSeen";
  sortOrder?: "asc" | "desc";
}

/**
 * Fetch full backlink audit dataset for a domain (cached or freshly audited)
 */
export async function getBacklinkDataAction(domain: string, forceRefresh: boolean = false) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const clean = sanitizeDomain(domain);
    if (!clean) {
      return { ok: false as const, error: "Please enter a valid website domain." };
    }

    const result = await getOrFetchBacklinkAudit(clean, userId, forceRefresh);
    return { ok: true as const, data: result.audit, isCached: result.isCached };
  } catch (err: unknown) {
    console.error("[getBacklinkDataAction] Error:", err);
    return { ok: false as const, error: err instanceof Error ? err.message : "Failed to load backlink data." };
  }
}

/**
 * Filtered & paginated Backlinks table query
 */
export async function getFilteredBacklinksAction(domain: string, params: BacklinkFilterParams) {
  try {
    const clean = sanitizeDomain(domain);
    if (!clean) {
      return { ok: false as const, error: "Invalid domain." };
    }

    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(10, params.pageSize || 20));
    const skip = (page - 1) * pageSize;

    // Find the latest audit for this domain
    const latestAudit = await db.backlinkAudit.findFirst({
      where: { domain: clean },
      orderBy: { fetchedAt: "desc" },
      select: { id: true },
    });

    if (!latestAudit) {
      return { ok: false as const, error: "No backlink audit found for this domain. Please run an audit first." };
    }

    const whereClause: Prisma.BacklinkRecordWhereInput = {
      auditId: latestAudit.id,
    };

    // Filter by type
    if (params.type === "dofollow") {
      whereClause.isDofollow = true;
    } else if (params.type === "nofollow") {
      whereClause.isDofollow = false;
    } else if (params.type === "new") {
      whereClause.isNew = true;
    } else if (params.type === "lost") {
      whereClause.isLost = true;
    } else if (params.type === "broken") {
      whereClause.isBroken = true;
    } else if (params.type === "suspicious") {
      whereClause.isSuspicious = true;
    }

    // Filter by domain rank
    if (params.minRank !== undefined || params.maxRank !== undefined) {
      whereClause.domainRank = {};
      if (params.minRank !== undefined) whereClause.domainRank.gte = params.minRank;
      if (params.maxRank !== undefined) whereClause.domainRank.lte = params.maxRank;
    }

    // Search query across domain, referring URL, target URL, and anchor
    if (params.search && params.search.trim().length > 0) {
      const q = params.search.trim();
      whereClause.OR = [
        { referringDomain: { contains: q, mode: "insensitive" } },
        { referringUrl: { contains: q, mode: "insensitive" } },
        { targetUrl: { contains: q, mode: "insensitive" } },
        { anchor: { contains: q, mode: "insensitive" } },
      ];
    }

    const sortField = params.sortBy || "domainRank";
    const sortDirection = params.sortOrder || "desc";

    const [items, totalCount] = await Promise.all([
      db.backlinkRecord.findMany({
        where: whereClause,
        skip,
        take: pageSize,
        orderBy: { [sortField]: sortDirection },
      }),
      db.backlinkRecord.count({ where: whereClause }),
    ]);

    return {
      ok: true as const,
      items,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  } catch (err: unknown) {
    console.error("[getFilteredBacklinksAction] Error:", err);
    return { ok: false as const, error: err instanceof Error ? err.message : "Failed to query backlinks." };
  }
}

/**
 * Force refresh backlinks audit
 */
export async function refreshBacklinkDataAction(domain: string) {
  try {
    const session = await auth();
    const clean = sanitizeDomain(domain);
    if (!clean) {
      return { ok: false as const, error: "Invalid domain." };
    }

    const result = await getOrFetchBacklinkAudit(clean, session?.user?.id, true);
    revalidatePath("/dashboard/backlinks");
    return { ok: true as const, data: result.audit };
  } catch (err: unknown) {
    console.error("[refreshBacklinkDataAction] Error:", err);
    return { ok: false as const, error: err instanceof Error ? err.message : "Failed to refresh backlinks." };
  }
}

/**
 * Resume partially completed backlink audit
 */
export async function resumeBacklinkAuditAction(domain: string) {
  try {
    const session = await auth();
    const clean = sanitizeDomain(domain);
    if (!clean) {
      return { ok: false as const, error: "Invalid domain." };
    }

    const { resumeBacklinkAudit } = await import("@/services/backlinks/engine");
    const result = await resumeBacklinkAudit(clean, session?.user?.id);
    revalidatePath("/dashboard/backlinks");
    return { ok: true as const, data: result.audit };
  } catch (err: unknown) {
    console.error("[resumeBacklinkAuditAction] Error:", err);
    return { ok: false as const, error: err instanceof Error ? err.message : "Failed to resume backlink audit." };
  }
}
