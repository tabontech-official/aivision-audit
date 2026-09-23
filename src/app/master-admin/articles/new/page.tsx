import { Metadata } from "next";
import { ArticleEditorClient } from "../article-editor-client";

export const metadata: Metadata = {
  title: "New Article | Master Admin",
  description: "Compose and publish a new technical SEO blog post.",
};

export default function NewArticlePage() {
  return <ArticleEditorClient isNew={true} />;
}
