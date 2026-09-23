import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminArticleById } from "@/services/articles/articles";
import { ArticleEditorClient } from "../article-editor-client";

export const metadata: Metadata = {
  title: "Edit Article | Master Admin",
  description: "Edit article content, metadata, and publication settings.",
};

export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getAdminArticleById(id);

  if (!article) {
    notFound();
  }

  return <ArticleEditorClient initialArticle={article} isNew={false} />;
}
