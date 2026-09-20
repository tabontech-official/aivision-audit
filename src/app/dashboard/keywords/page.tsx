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
    q?: string;
  }>;
}

export default async function KeywordPage({ searchParams }: KeywordPageProps) {
  await requireUser();
  const resolvedParams = await searchParams;
  const projectDomain = resolvedParams.project;
  const initialQuery = resolvedParams.q || "";

  let websiteId: string | undefined = undefined;

  if (projectDomain) {
    try {
      const website = await db.website.findFirst({
        where: { domain: projectDomain, deletedAt: null },
        select: { id: true, domain: true },
      });
      if (website?.id) {
        websiteId = website.id;
      }
    } catch {
      // Fallback
    }
  }

  return (
    <div className="w-full">
      <KeywordDashboard websiteId={websiteId} initialQuery={initialQuery} />
    </div>
  );
}
