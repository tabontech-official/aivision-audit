import { Metadata } from "next";
import { requireUser } from "@/lib/auth/rbac";
import { db } from "@/lib/db/client";
import { KeywordDashboard } from "@/components/keywords/keyword-dashboard";

export const metadata: Metadata = {
  title: "Keyword Research & SERP Intelligence · The Rank Writers",
  description: "Discover search volume, keyword difficulty, intent, 12-month trends, and live Google SERP competitor rankings.",
};

interface KeywordPageProps {
  searchParams: Promise<{
    project?: string;
  }>;
}

export default async function KeywordPage({ searchParams }: KeywordPageProps) {
  const user = await requireUser();
  const resolvedParams = await searchParams;
  const projectDomain = resolvedParams.project;

  let activeWebsite = null;
  let auditedKeywords: string[] = [];

  try {
    if (projectDomain) {
      activeWebsite = await db.website.findFirst({
        where: {
          userId: user.id,
          deletedAt: null,
          OR: [
            { domain: { contains: projectDomain, mode: "insensitive" } },
            { url: { contains: projectDomain, mode: "insensitive" } },
          ],
        },
        include: {
          reports: {
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { rawData: true },
          },
        },
      });
    }

    if (!activeWebsite) {
      activeWebsite = await db.website.findFirst({
        where: {
          userId: user.id,
          deletedAt: null,
        },
        orderBy: { updatedAt: "desc" },
        include: {
          reports: {
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { rawData: true },
          },
        },
      });
    }

    if (activeWebsite) {
      const latestReport = activeWebsite.reports[0];
      const rawExtracted = (latestReport?.rawData?.extracted as Record<string, unknown>) || {};
      const pageData = (rawExtracted.page as Record<string, unknown>) || {};
      const headingsData = (rawExtracted.headings as Record<string, unknown>) || {};
      const contentData = (rawExtracted.content as Record<string, unknown>) || {};

      const candidateTerms: string[] = [];

      // 1. Raw extracted keywords if any
      if (Array.isArray(rawExtracted.keywords)) {
        rawExtracted.keywords.forEach((k: unknown) => {
          if (typeof k === "string") candidateTerms.push(k);
        });
      }

      // 2. Title parts
      if (typeof pageData.title === "string" && pageData.title.trim()) {
        const parts = pageData.title.split(/[-|–•:,]/).map((s) => s.trim()).filter((s) => s.length > 3 && s.length < 35);
        candidateTerms.push(...parts);
      }

      // 3. H1 headings
      if (Array.isArray(headingsData.h1)) {
        headingsData.h1.forEach((h: unknown) => {
          if (typeof h === "string" && h.trim().length > 3 && h.trim().length < 50) {
            candidateTerms.push(h.trim());
          }
        });
      }

      // 4. H2 headings
      if (Array.isArray(headingsData.h2)) {
        headingsData.h2.forEach((h: unknown) => {
          if (typeof h === "string" && h.trim().length > 3 && h.trim().length < 50) {
            candidateTerms.push(h.trim());
          }
        });
      }

      // 5. H3 headings
      if (Array.isArray(headingsData.h3)) {
        headingsData.h3.forEach((h: unknown) => {
          if (typeof h === "string" && h.trim().length > 3 && h.trim().length < 50) {
            candidateTerms.push(h.trim());
          }
        });
      }

      // 6. Anchor texts from Backlink Audit if available
      try {
        const anchors = await db.anchorRecord.findMany({
          where: { audit: { websiteId: activeWebsite.id } },
          orderBy: { backlinksCount: "desc" },
          take: 15,
          select: { anchor: true },
        });
        anchors.forEach((a) => {
          if (a.anchor && a.anchor.length > 2 && a.anchor.toLowerCase() !== "no anchor" && !a.anchor.startsWith("http")) {
            candidateTerms.push(a.anchor.trim());
          }
        });
      } catch {
        // ignore
      }

      // 7. Domain-derived core terms
      if (activeWebsite.domain) {
        const cleanDomain = activeWebsite.domain.replace(/^www\./, "").replace(/\.[a-z.]+$/, "");
        const spaced = cleanDomain.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ");
        candidateTerms.push(`${spaced} services`, `${spaced} agency`, `best ${spaced}`, `${spaced} solutions`, `${spaced} optimization`);
      }

      auditedKeywords = Array.from(new Set(candidateTerms.filter((c) => c && c.length > 2))).slice(0, 50);
    }
  } catch (err) {
    console.error("Failed to load keyword page context:", err);
  }

  return (
    <div className="w-full">
      <KeywordDashboard
        websiteId={activeWebsite?.id}
        domainName={activeWebsite?.domain}
        initialAuditedKeywords={auditedKeywords}
      />
    </div>
  );
}
