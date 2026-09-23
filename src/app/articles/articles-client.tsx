"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Clock,
  ArrowRight,
  BookOpen,
  ChevronRight,
  Eye,
} from "lucide-react";

export interface PublicArticle {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  coverImage: string | null;
  authorName: string;
  authorTitle: string | null;
  authorAvatar: string | null;
  category: string;
  tags: string[];
  readTimeMinutes: number;
  isFeatured: boolean;
  viewCount: number;
  publishedAt: Date | string | null;
  createdAt: Date | string;
}

// Fallback high quality imagery if coverImage is not supplied
const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
];

export function ArticlesHubClient({
  initialArticles,
  categories,
}: {
  initialArticles: PublicArticle[];
  categories: { name: string; count: number }[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredArticles = useMemo(() => {
    return initialArticles.filter((article) => {
      if (
        selectedCategory !== "All" &&
        article.category.toLowerCase() !== selectedCategory.toLowerCase()
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = article.title.toLowerCase().includes(q);
        const matchDesc = article.description?.toLowerCase().includes(q) || false;
        const matchTags = article.tags.some((t) => t.toLowerCase().includes(q));
        const matchCategory = article.category.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchTags && !matchCategory) return false;
      }
      return true;
    });
  }, [initialArticles, selectedCategory, searchQuery]);

  return (
    <div className="space-y-10 font-lazzer">
      {/* Category Pills & Search */}
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between border-b border-slate-200/80 pb-6">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory("All")}
            className={`rounded-full px-4 py-2 text-xs font-bold transition font-lazzer ${
              selectedCategory === "All"
                ? "bg-[#181818] text-white shadow-xs"
                : "bg-[#dff2ed] text-slate-900 hover:bg-[#cbeae3]"
            }`}
          >
            All Articles ({initialArticles.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => setSelectedCategory(cat.name)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition font-lazzer ${
                selectedCategory.toLowerCase() === cat.name.toLowerCase()
                  ? "bg-[#181818] text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[260px] md:max-w-xs">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides & articles..."
            className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none shadow-2xs font-lazzer"
          />
        </div>
      </div>

      {/* Grid of Articles matching landing page visual style */}
      {filteredArticles.length === 0 ? (
        <div className="rounded-sm border border-slate-200/80 bg-white p-12 text-center shadow-xs">
          <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 font-display text-lg font-bold text-slate-900 font-lazzer">
            No articles found
          </h3>
          <p className="mt-1 text-xs text-slate-500 font-lazzer">
            {searchQuery
              ? `No articles matched "${searchQuery}". Try searching for another keyword or clearing the filter.`
              : "No articles are available in this category yet."}
          </p>
          {(searchQuery || selectedCategory !== "All") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#181818] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-black font-lazzer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {filteredArticles.map((article, idx) => {
            const articleImage =
              article.coverImage || DEFAULT_IMAGES[idx % DEFAULT_IMAGES.length];
            const displayDate = article.publishedAt
              ? new Date(article.publishedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Recent";

            return (
              <article
                key={article.id}
                className="flex flex-col rounded-sm border border-slate-200/80 bg-white overflow-hidden shadow-xs hover:shadow-sm transition-all duration-200 group font-lazzer"
              >
                {/* Image Top */}
                <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={articleImage}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {article.isFeatured && (
                    <span className="absolute top-3 left-3 rounded-full bg-[#181818] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                      Featured
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-5 sm:p-6">
                  {/* Category & Date */}
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-3 font-lazzer">
                    <span className="text-[#2563eb] font-bold uppercase">
                      {article.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {article.readTimeMinutes} min read &bull; {displayDate}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-lg font-bold text-slate-900 group-hover:text-black transition-colors line-clamp-2 leading-snug font-lazzer">
                    <Link href={`/articles/${article.slug}`} prefetch={true}>
                      {article.title}
                    </Link>
                  </h3>

                  {/* Excerpt */}
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed flex-1 font-lazzer">
                    {article.description ||
                      article.content.slice(0, 150).replace(/[#*`]/g, "") + "..."}
                  </p>

                  {/* Author & Footer */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-[#dff2ed]">
                        {article.authorName.charAt(0)}
                      </div>
                      <span className="text-xs font-medium text-slate-700">
                        {article.authorName}
                      </span>
                    </div>

                    <Link
                      href={`/articles/${article.slug}`}
                      prefetch={true}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 group-hover:text-black transition-colors"
                    >
                      Read article <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
