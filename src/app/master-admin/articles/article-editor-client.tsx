"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Trash2,
  ExternalLink,
  Eye,
  FileText,
  Clock,
  User,
  Tag,
  Folder,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  createArticleAction,
  updateArticleAction,
  deleteArticleAction,
} from "./actions";
import { slugify, calculateReadingTime } from "@/services/articles/articles";

const STANDARD_CATEGORIES = [
  "Technical SEO",
  "AI Search & GEO",
  "Core Web Vitals",
  "Schema & Architecture",
  "Search Analytics",
  "Conversion & UX",
  "Product Updates",
];

export function ArticleEditorClient({
  initialArticle,
  isNew = false,
}: {
  initialArticle?: any;
  isNew?: boolean;
}) {
  const router = useRouter();

  const [title, setTitle] = useState(initialArticle?.title || "");
  const [slug, setSlug] = useState(initialArticle?.slug || "");
  const [autoSlug, setAutoSlug] = useState(isNew);
  const [description, setDescription] = useState(initialArticle?.description || "");
  const [content, setContent] = useState(initialArticle?.content || "");
  const [coverImage, setCoverImage] = useState(initialArticle?.coverImage || "");
  const [authorName, setAuthorName] = useState(initialArticle?.authorName || "Editorial Team");
  const [authorTitle, setAuthorTitle] = useState(initialArticle?.authorTitle || "Search Intelligence");
  const [authorAvatar, setAuthorAvatar] = useState(initialArticle?.authorAvatar || "");
  const [category, setCategory] = useState(initialArticle?.category || "Technical SEO");
  const [customCategory, setCustomCategory] = useState("");
  const [tags, setTags] = useState<string[]>(initialArticle?.tags || ["Technical SEO"]);
  const [newTagInput, setNewTagInput] = useState("");
  const [isPublished, setIsPublished] = useState(initialArticle?.isPublished ?? false);
  const [isFeatured, setIsFeatured] = useState(initialArticle?.isFeatured ?? false);

  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Auto update slug when title changes if autoSlug is true
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (autoSlug) {
      setSlug(slugify(val));
    }
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const estimatedReadingTime = calculateReadingTime(content);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      setStatusMessage({ type: "error", text: "Please provide an article title." });
      return;
    }
    if (!content.trim()) {
      setStatusMessage({ type: "error", text: "Article content cannot be empty." });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("slug", slug || slugify(title));
      formData.set("description", description);
      formData.set("content", content);
      formData.set("coverImage", coverImage);
      formData.set("authorName", authorName);
      formData.set("authorTitle", authorTitle);
      formData.set("authorAvatar", authorAvatar);
      formData.set("category", customCategory.trim() || category);
      formData.set("tags", tags.join(","));
      formData.set("readTimeMinutes", estimatedReadingTime.toString());
      formData.set("isPublished", isPublished ? "true" : "false");
      formData.set("isFeatured", isFeatured ? "true" : "false");

      if (isNew) {
        await createArticleAction(formData);
      } else {
        await updateArticleAction(initialArticle.id, formData);
        setStatusMessage({ type: "success", text: "Article updated successfully!" });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to save article. Please check input values.",
      });
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialArticle?.id) return;
    if (!confirm("Are you sure you want to permanently delete this article? This action cannot be undone.")) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteArticleAction(initialArticle.id);
      router.push("/master-admin/articles");
    } catch (err: any) {
      setIsDeleting(false);
      setStatusMessage({ type: "error", text: err?.message || "Failed to delete article." });
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-4">
          <Link
            href="/master-admin/articles"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isNew ? "Create New Article" : "Edit Article"}
            </h1>
            <p className="text-xs text-slate-500">
              {isNew ? "Compose and publish technical SEO blogs" : `Editing: ${initialArticle?.slug}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isNew && initialArticle?.slug && (
            <Link
              href={`/articles/${initialArticle.slug}`}
              target="_blank"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Live Preview
            </Link>
          )}

          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-[#dff2ed] transition hover:bg-slate-800 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? "Saving..." : isNew ? "Create Article" : "Save Changes"}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border p-4 text-sm ${
            statusMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Grid: Left 2 cols Content, Right 1 col Metadata & Controls */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Content Section (2 Cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Title & Slug */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Article Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Mastering AI Search Optimization: A Complete Guide for 2026"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none"
            />

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-600">
                  URL Slug
                </label>
                <button
                  type="button"
                  onClick={() => setAutoSlug(!autoSlug)}
                  className="text-[11px] font-medium text-slate-500 hover:text-slate-900"
                >
                  {autoSlug ? "Disable auto-slug" : "Sync from title"}
                </button>
              </div>
              <div className="mt-1 flex items-center rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-500 focus-within:border-slate-900 focus-within:bg-white">
                <span className="shrink-0 text-slate-400">/articles/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    setSlug(slugify(e.target.value));
                  }}
                  placeholder="mastering-ai-search-optimization"
                  className="w-full bg-transparent font-mono text-xs font-semibold text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-600">
                Short Description / Excerpt
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief 1-2 sentence summary for meta tags, search engine snippets, and post cards..."
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Body Content & Markdown Tab */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3.5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Body Content (Markdown & HTML supported)
                </span>
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("write")}
                  className={`rounded-md px-3 py-1 font-semibold transition ${
                    activeTab === "write"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`flex items-center gap-1 rounded-md px-3 py-1 font-semibold transition ${
                    activeTab === "preview"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Eye className="h-3 w-3" />
                  Preview
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === "write" ? (
                <div className="space-y-2">
                  <textarea
                    rows={20}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your article in Markdown... Use ## for headings, - for lists, ``` for code blocks."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/30 p-4 font-mono text-xs leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      {content.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      ~{estimatedReadingTime} min read
                    </span>
                  </div>
                </div>
              ) : (
                <div className="prose prose-slate max-w-none rounded-xl border border-slate-100 bg-slate-50/50 p-6 text-sm">
                  {content ? (
                    <div className="whitespace-pre-wrap font-sans leading-relaxed text-slate-800">
                      {content}
                    </div>
                  ) : (
                    <p className="text-xs italic text-slate-400">No content entered yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Metadata (1 Col) */}
        <div className="space-y-6">
          {/* Publication Status & Visibility */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Publishing Controls
            </h3>

            <div className="mt-4 space-y-3">
              <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                <div>
                  <div className="text-xs font-semibold text-slate-900">Publish Article</div>
                  <div className="text-[11px] text-slate-500">Visible to public on /articles</div>
                </div>
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
              </label>

              <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                <div>
                  <div className="text-xs font-semibold text-slate-900">Featured Article</div>
                  <div className="text-[11px] text-slate-500">Pinned hero banner on articles hub</div>
                </div>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
              </label>
            </div>
          </div>

          {/* Category & Tags */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-slate-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Category & Tags
              </h3>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Category</label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (e.target.value !== "Custom") setCustomCategory("");
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-slate-900 focus:bg-white focus:outline-none"
                >
                  {STANDARD_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="Custom">+ Custom Category</option>
                </select>

                {category === "Custom" && (
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter custom category name..."
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-slate-900 focus:outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Tags</label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-md bg-[#dff2ed] px-2.5 py-1 text-[11px] font-semibold text-slate-900"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-slate-500 hover:text-red-600"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>

                <div className="mt-2 flex gap-1.5">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add tag and press Enter"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Author Details */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Author Profile
              </h3>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600">Author Name</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Sarah Chen"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 focus:border-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600">Author Title / Role</label>
                <input
                  type="text"
                  value={authorTitle}
                  onChange={(e) => setAuthorTitle(e.target.value)}
                  placeholder="e.g. Head of Search Strategy"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 focus:border-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600">Avatar Image URL (optional)</label>
                <input
                  type="text"
                  value={authorAvatar}
                  onChange={(e) => setAuthorAvatar(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 focus:border-slate-900 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Cover Image */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-slate-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Cover Image
              </h3>
            </div>

            <div className="mt-4 space-y-2">
              <input
                type="text"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://images.unsplash.com/... or /images/..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 focus:border-slate-900 focus:bg-white focus:outline-none"
              />
              {coverImage && (
                <div className="relative mt-2 aspect-video overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImage}
                    alt="Cover preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
