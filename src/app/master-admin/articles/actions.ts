"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createArticle,
  updateArticle,
  deleteArticle,
  togglePublishArticle,
} from "@/services/articles/articles";

function parseTags(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function createArticleAction(formData: FormData) {
  const title = (formData.get("title") as string) || "";
  const slug = (formData.get("slug") as string) || "";
  const description = (formData.get("description") as string) || "";
  const content = (formData.get("content") as string) || "";
  const coverImage = (formData.get("coverImage") as string) || "";
  const authorName = (formData.get("authorName") as string) || "Editorial Team";
  const authorTitle = (formData.get("authorTitle") as string) || "";
  const authorAvatar = (formData.get("authorAvatar") as string) || "";
  const category = (formData.get("category") as string) || "Technical SEO";
  const tagsRaw = (formData.get("tags") as string) || "";
  const readTimeRaw = formData.get("readTimeMinutes") as string;
  const readTimeMinutes = readTimeRaw ? parseInt(readTimeRaw, 10) : undefined;
  const isPublished = formData.get("isPublished") === "true" || formData.get("isPublished") === "on";
  const isFeatured = formData.get("isFeatured") === "true" || formData.get("isFeatured") === "on";

  if (!title.trim()) {
    throw new Error("Title is required");
  }

  if (!content.trim()) {
    throw new Error("Content is required");
  }

  const created = await createArticle({
    title,
    slug: slug || undefined,
    description: description || undefined,
    content,
    coverImage: coverImage || undefined,
    authorName,
    authorTitle: authorTitle || undefined,
    authorAvatar: authorAvatar || undefined,
    category,
    tags: parseTags(tagsRaw),
    readTimeMinutes,
    isPublished,
    isFeatured,
  });

  revalidatePath("/master-admin/articles");
  revalidatePath("/articles");
  revalidatePath(`/articles/${created.slug}`);
  redirect("/master-admin/articles");
}

export async function updateArticleAction(id: string, formData: FormData) {
  const title = (formData.get("title") as string) || "";
  const slug = (formData.get("slug") as string) || "";
  const description = (formData.get("description") as string) || "";
  const content = (formData.get("content") as string) || "";
  const coverImage = (formData.get("coverImage") as string) || "";
  const authorName = (formData.get("authorName") as string) || "Editorial Team";
  const authorTitle = (formData.get("authorTitle") as string) || "";
  const authorAvatar = (formData.get("authorAvatar") as string) || "";
  const category = (formData.get("category") as string) || "Technical SEO";
  const tagsRaw = (formData.get("tags") as string) || "";
  const readTimeRaw = formData.get("readTimeMinutes") as string;
  const readTimeMinutes = readTimeRaw ? parseInt(readTimeRaw, 10) : undefined;
  const isPublished = formData.get("isPublished") === "true" || formData.get("isPublished") === "on";
  const isFeatured = formData.get("isFeatured") === "true" || formData.get("isFeatured") === "on";

  if (!title.trim()) {
    throw new Error("Title is required");
  }

  const updated = await updateArticle(id, {
    title,
    slug: slug || undefined,
    description,
    content,
    coverImage,
    authorName,
    authorTitle,
    authorAvatar,
    category,
    tags: parseTags(tagsRaw),
    readTimeMinutes,
    isPublished,
    isFeatured,
  });

  revalidatePath("/master-admin/articles");
  revalidatePath("/articles");
  revalidatePath(`/articles/${updated.slug}`);
  redirect("/master-admin/articles");
}

export async function deleteArticleAction(id: string) {
  await deleteArticle(id);
  revalidatePath("/master-admin/articles");
  revalidatePath("/articles");
}

export async function togglePublishArticleAction(id: string) {
  const updated = await togglePublishArticle(id);
  revalidatePath("/master-admin/articles");
  revalidatePath("/articles");
  revalidatePath(`/articles/${updated.slug}`);
}
