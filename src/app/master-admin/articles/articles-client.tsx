"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  BookOpen,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  Check,
  X,
} from "lucide-react";
import { togglePublishArticleAction, deleteArticleAction } from "./actions";

export function ArticlesAdminClient({ initialArticles }: { initialArticles: any[] }) {
  const [articles, setArticles] = useState(initialArticles);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const categories = Array.from(new Set(articles.map((a) => a.category || "Technical SEO")));

  const filtered = articles.filter((article) => {
    if (selectedCategory !== "All" && article.category !== selectedCategory) return false;
    if (statusFilter === "published" && !article.isPublished) return false;
    if (statusFilter === "draft" && article.isPublished) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = article.title.toLowerCase().includes(q);
      const matchSlug = article.slug.toLowerCase().includes(q);
      const matchAuthor = article.authorName?.toLowerCase().includes(q);
      if (!matchTitle && !matchSlug && !matchAuthor) return false;
    }
    return true;
  });

  const handleTogglePublish = async (id: string) => {
    setIsUpdating(id);
    try {
      await togglePublishArticleAction(id);
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isPublished: !a.isPublished } : a)),
      );
    } catch (err) {
      console.error("Failed to toggle publish status:", err);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    setIsUpdating(id);
    try {
      await deleteArticleAction(id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to delete article:", err);
    } finally {
      setIsUpdating(null);
    }
  };

  const publishedCount = articles.filter((a) => a.isPublished).length;
  const draftCount = articles.length - publishedCount;
  const totalViews = articles.reduce((acc, a) => acc + (a.viewCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Articles & Blog</h1>
          <p className="text-sm text-slate-500">
            Publish and manage SEO guides, tutorials, and content marketing articles.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/articles"
            target="_blank"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Public Hub
          </Link>
          <Link
            href="/master-admin/articles/new"
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-[#dff2ed] transition hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Write New Article
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Articles
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{articles.length}</div>
          <div className="mt-1 text-xs text-slate-500">
            {publishedCount} published &bull; {draftCount} drafts
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Active Categories
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{categories.length}</div>
          <div className="mt-1 text-xs text-slate-500">
            Distributed across technical domains
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Article Views
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{totalViews}</div>
          <div className="mt-1 text-xs text-slate-500">Direct organic & reader impressions</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles by title, slug, or author..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-slate-900 focus:bg-white focus:outline-none"
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Status Segment */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5 text-xs">
            <button
              onClick={() => setStatusFilter("all")}
              className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                statusFilter === "all"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("published")}
              className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                statusFilter === "published"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Published
            </button>
            <button
              onClick={() => setStatusFilter("draft")}
              className={`rounded-lg px-3 py-1.5 font-semibold transition ${
                statusFilter === "draft"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Drafts
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Article</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Author</th>
                <th className="px-4 py-3.5">Views</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Updated</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <BookOpen className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-sm font-semibold text-slate-600">No articles found</p>
                    <p className="text-xs text-slate-400">
                      {search ? "Try adjusting your search criteria." : "Create your first article to get started."}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((article) => (
                  <tr key={article.id} className="transition hover:bg-slate-50/60">
                    <td className="max-w-xs px-5 py-3.5">
                      <div className="flex items-start gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 line-clamp-1">{article.title}</span>
                            {article.isFeatured && (
                              <span className="inline-flex shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-800">
                                Featured
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[11px] text-slate-400 line-clamp-1">
                            /articles/{article.slug}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="inline-flex rounded-md bg-[#dff2ed] px-2.5 py-1 text-[11px] font-semibold text-slate-900">
                        {article.category || "Technical SEO"}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-slate-700">
                      <div className="font-medium">{article.authorName || "Editorial Team"}</div>
                      <div className="text-[10px] text-slate-400">{article.authorTitle || ""}</div>
                    </td>

                    <td className="px-4 py-3.5 text-slate-600">
                      <div className="flex items-center gap-1 font-mono font-medium">
                        <Eye className="h-3 w-3 text-slate-400" />
                        {article.viewCount || 0}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(article.id)}
                        disabled={isUpdating === article.id}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                          article.isPublished
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {article.isPublished ? (
                          <>
                            <Check className="h-3 w-3" />
                            Published
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" />
                            Draft
                          </>
                        )}
                      </button>
                    </td>

                    <td className="px-4 py-3.5 text-[11px] text-slate-500">
                      {new Date(article.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/articles/${article.slug}`}
                          target="_blank"
                          title="View Live"
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-100"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                          href={`/master-admin/articles/${article.id}`}
                          title="Edit Article"
                          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-700 transition hover:bg-slate-100"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(article.id, article.title)}
                          disabled={isUpdating === article.id}
                          title="Delete Article"
                          className="rounded-lg border border-red-100 p-1.5 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
