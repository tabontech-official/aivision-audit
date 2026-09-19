import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/rbac";
import { db } from "@/lib/db/client";
import { getExistingBacklinkAudit, sanitizeDomain } from "@/services/backlinks/engine";
import { BacklinksClientView } from "./backlinks-client";

export const metadata: Metadata = {
  title: "Backlinks Audit | The Rank Writers",
  description: "Comprehensive backlink analysis, domain authority, referring domains, anchor distribution, and link quality tracking.",
};

export const dynamic = "force-dynamic";

export default async function BacklinksPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; tab?: string }>;
}) {
  const user = await requireUser();
  const { project = "", tab = "overview" } = await searchParams;

  // 1. Find user websites to determine active project domain
  const userWebsites = await db.website.findMany({
    where: {
      userId: user.id,
      deletedAt: null,
    },
    orderBy: { updatedAt: "desc" },
    select: { domain: true, id: true },
  });

  let activeDomain = "";
  if (project) {
    activeDomain = sanitizeDomain(project);
  } else if (userWebsites.length > 0 && userWebsites[0]?.domain) {
    activeDomain = userWebsites[0].domain;
  }

  let auditData = null;

  if (activeDomain) {
    try {
      auditData = await getExistingBacklinkAudit(activeDomain, user.id);
    } catch (err) {
      console.error("[BacklinksPage] Error loading existing backlink audit:", err);
    }
  }

  return (
    <BacklinksClientView
      initialAudit={auditData}
      initialDomain={activeDomain}
      initialTab={tab}
      allProjects={userWebsites.map((w) => w.domain)}
      isCached={Boolean(auditData)}
    />
  );
}
