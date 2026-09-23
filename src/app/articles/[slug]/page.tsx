import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import {
  getArticleBySlug,
  getPublishedArticles,
} from "@/services/articles/articles";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter, FinalCta } from "@/components/marketing/sections";
import { AuthModalProvider } from "@/components/marketing/auth-modal-context";
import { FormattedArticleBody, ArticleShareBar } from "./article-content";
import {
  Clock,
  ChevronRight,
  ArrowRight,
  Tag,
} from "lucide-react";

export const revalidate = 60;

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=800&q=80",
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article Not Found · AI Vision Audit",
    };
  }

  return {
    title: `${article.title} · AI Vision Audit`,
    description: article.description || `Read ${article.title} on AI Vision Audit.`,
    openGraph: {
      title: article.title,
      description: article.description || `Read ${article.title} on AI Vision Audit.`,
      type: "article",
      publishedTime: article.publishedAt?.toISOString() || article.createdAt.toISOString(),
      authors: [article.authorName],
      tags: article.tags,
      images: article.coverImage ? [article.coverImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description || undefined,
      images: article.coverImage ? [article.coverImage] : undefined,
    },
  };
}

export default async function SingleArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  const article = await getArticleBySlug(slug, true);

  if (!article || !article.isPublished) {
    notFound();
  }

  // Fetch related articles (same category or others)
  const { articles: relatedArticles } = await getPublishedArticles({
    category: article.category,
    excludeSlug: article.slug,
    limit: 3,
  });

  // Fallback if not enough in same category
  let displayedRelated = relatedArticles;
  if (displayedRelated.length < 3) {
    const { articles: fallbackArticles } = await getPublishedArticles({
      excludeSlug: article.slug,
      limit: 3 - displayedRelated.length,
    });
    displayedRelated = [...displayedRelated, ...fallbackArticles];
  }

  // JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    image: article.coverImage || undefined,
    datePublished: article.publishedAt?.toISOString() || article.createdAt.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: {
      "@type": "Person",
      name: article.authorName,
      jobTitle: article.authorTitle || "Technical Specialist",
    },
    publisher: {
      "@type": "Organization",
      name: "AI Vision Audit",
      url: "https://aivisionaudit.com",
    },
    keywords: article.tags.join(", "),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://aivisionaudit.com/articles/${article.slug}`,
    },
  };

  const displayDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recent";

  return (
    <AuthModalProvider>
      <div className="min-h-screen bg-white text-slate-900 font-lazzer selection:bg-[#dff2ed] selection:text-black">
        <MarketingHeader isLoggedIn={Boolean(session?.user)} />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <main className="w-full">
          {/* Top Article Hero Banner with mint background matching landing page header */}
          <section className="bg-[#dff2ed] pt-8 pb-14 px-4 sm:px-8 lg:px-12 border-b border-slate-200/60 font-lazzer">
            <div className="max-w-4xl mx-auto">
              {/* Breadcrumb Navigation */}
              <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-2 text-xs font-medium text-slate-600 mb-6 font-lazzer"
              >
                <Link href="/" prefetch={true} className="hover:text-black">
                  Home
                </Link>
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <Link href="/articles" prefetch={true} className="hover:text-black">
                  Articles
                </Link>
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <span className="text-[#2563eb] font-bold uppercase">
                  {article.category}
                </span>
              </nav>

              {/* Category & Read Time */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[#2563eb] font-bold uppercase text-xs">
                  {article.category}
                </span>
                <span className="text-slate-400">&bull;</span>
                <span className="flex items-center gap-1 text-xs font-medium text-slate-600">
                  <Clock className="h-3.5 w-3.5" />
                  {article.readTimeMinutes} min read
                </span>
                <span className="text-slate-400">&bull;</span>
                <span className="text-xs font-medium text-slate-600">{displayDate}</span>
              </div>

              {/* Title */}
              <h1 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#111827] tracking-tight leading-tight font-lazzer">
                {article.title}
              </h1>

              {article.description && (
                <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed font-lazzer">
                  {article.description}
                </p>
              )}

              {/* Author Bar & Share */}
              <div className="mt-6 pt-5 border-t border-slate-300/60 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-[#dff2ed]">
                    {article.authorName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {article.authorName}
                    </div>
                    <div className="text-xs text-slate-600">
                      {article.authorTitle || "Search Intelligence Team"}
                    </div>
                  </div>
                </div>

                <ArticleShareBar title={article.title} slug={article.slug} />
              </div>
            </div>
          </section>

          {/* Article Main Body */}
          <article className="py-12 sm:py-16 px-4 sm:px-8 lg:px-12 max-w-4xl mx-auto font-lazzer">
            {article.coverImage && (
              <div className="mb-10 overflow-hidden rounded-sm border border-slate-200/80 bg-slate-100 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full h-auto object-cover max-h-[460px]"
                />
              </div>
            )}

            {/* Formatted Content */}
            <div className="bg-white p-6 sm:p-10 rounded-sm border border-slate-200/80 shadow-xs">
              <FormattedArticleBody content={article.content} />
            </div>

            {/* Tags footer */}
            {article.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-slate-200/80 pt-6">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <Tag className="h-3.5 w-3.5" />
                  Topics:
                </span>
                {article.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[#dff2ed] px-3 py-1 text-xs font-bold text-slate-900"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </article>

          {/* Related Articles Section matching Landing Page 3-column grid */}
          {displayedRelated.length > 0 && (
            <section className="py-14 sm:py-20 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto border-t border-slate-200/80 font-lazzer">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 font-lazzer">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-900" />
                    <span>EXPLORE MORE GUIDES</span>
                  </div>
                  <h2 className="mt-3 font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#111827] tracking-tight font-lazzer">
                    Related Insights &amp; SEO Articles
                  </h2>
                </div>
                <Link
                  href="/articles"
                  prefetch={true}
                  className="mt-4 sm:mt-0 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-black transition-colors font-lazzer"
                >
                  <span>View All Articles</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                {displayedRelated.map((rel, idx) => {
                  const relImage =
                    rel.coverImage || DEFAULT_IMAGES[idx % DEFAULT_IMAGES.length];
                  const relDate = rel.publishedAt
                    ? new Date(rel.publishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Recent";

                  return (
                    <article
                      key={rel.id}
                      className="flex flex-col rounded-sm border border-slate-200/80 bg-white overflow-hidden shadow-xs hover:shadow-sm transition-all duration-200 group font-lazzer"
                    >
                      <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={relImage}
                          alt={rel.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex flex-col flex-1 p-5 sm:p-6">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-3 font-lazzer">
                          <span className="text-[#2563eb] font-bold uppercase">
                            {rel.category}
                          </span>
                          <span>{relDate}</span>
                        </div>
                        <h3 className="font-display text-lg font-bold text-slate-900 group-hover:text-black transition-colors line-clamp-2 leading-snug font-lazzer">
                          <Link href={`/articles/${rel.slug}`} prefetch={true}>
                            {rel.title}
                          </Link>
                        </h3>
                        <p className="mt-2 text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed flex-1 font-lazzer">
                          {rel.description || rel.content.slice(0, 140) + "..."}
                        </p>
                        <div className="mt-5 pt-4 border-t border-slate-100">
                          <Link
                            href={`/articles/${rel.slug}`}
                            prefetch={true}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 group-hover:text-black transition-colors"
                          >
                            Read article <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* Bottom Conversion Banner matching Landing Page */}
          <FinalCta />
        </main>

        <MarketingFooter />
      </div>
    </AuthModalProvider>
  );
}
