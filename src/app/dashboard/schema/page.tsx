import { Metadata } from "next";
import { requireUser } from "@/lib/auth/rbac";
import { db } from "@/lib/db/client";
import { SchemaDashboard } from "@/components/schema/schema-dashboard";

export const metadata: Metadata = {
  title: "Schema Markup & Rich Results Suite · AI Vision Audit",
  description: "Audit and generate Google-compliant JSON-LD structured data and rich results snippets.",
};

interface SchemaPageProps {
  searchParams: Promise<{
    project?: string;
    url?: string;
  }>;
}

export default async function SchemaPage({ searchParams }: SchemaPageProps) {
  await requireUser();
  const resolvedParams = await searchParams;
  const projectDomain = resolvedParams.project;
  const queryUrl = resolvedParams.url;

  let initialUrl = queryUrl || "";
  let initialDomain = projectDomain || "";

  // If a project is selected but no specific URL, look up website URL from DB
  if (projectDomain && !initialUrl) {
    try {
      const website = await db.website.findFirst({
        where: { domain: projectDomain, deletedAt: null },
        select: { url: true, domain: true },
      });
      if (website?.url) {
        initialUrl = website.url;
        initialDomain = website.domain;
      }
    } catch {
      // fallback to domain
    }
  }

  return (
    <div className="w-full">
      <SchemaDashboard initialUrl={initialUrl} initialDomain={initialDomain} />
    </div>
  );
}
