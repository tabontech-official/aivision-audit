import { Metadata } from "next";
import { getAdminArticles } from "@/services/articles/articles";
import { ArticlesAdminClient } from "./articles-client";

export const metadata: Metadata = {
  title: "Articles & Blog Management | Master Admin",
  description: "Manage technical SEO articles, guides, and publish dynamic blog posts.",
};

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage() {
  const articles = await getAdminArticles();

  return <ArticlesAdminClient initialArticles={articles} />;
}
