import type { Metadata } from "next";
import { auth } from "@/lib/auth/auth";
import { getPublishedArticles, getAllCategories } from "@/services/articles/articles";
import { ArticlesHubClient } from "./articles-client";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter, FinalCta } from "@/components/marketing/sections";
import { AuthModalProvider } from "@/components/marketing/auth-modal-context";

export const metadata: Metadata = {
  title: "SEO Insights & Technical Guides · AI Vision Audit",
  description:
    "Explore in-depth technical SEO articles, Generative Engine Optimization (GEO) guides, Core Web Vitals best practices, and entity architecture tutorials.",
  openGraph: {
    title: "SEO Insights & Technical Guides · AI Vision Audit",
    description:
      "Explore in-depth technical SEO articles, Generative Engine Optimization (GEO) guides, Core Web Vitals best practices, and entity architecture tutorials.",
    type: "website",
  },
};

export const revalidate = 60;

export default async function ArticlesPage() {
  const session = await auth();
  const [{ articles }, categories] = await Promise.all([
    getPublishedArticles({ limit: 50 }),
    getAllCategories(),
  ]);

  const serializedArticles = articles.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    description: a.description,
    content: a.content,
    coverImage: a.coverImage,
    authorName: a.authorName,
    authorTitle: a.authorTitle,
    authorAvatar: a.authorAvatar,
    category: a.category,
    tags: a.tags,
    readTimeMinutes: a.readTimeMinutes,
    isFeatured: a.isFeatured,
    viewCount: a.viewCount,
    publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <AuthModalProvider>
      <div className="min-h-screen bg-white text-slate-900 font-lazzer selection:bg-[#dff2ed] selection:text-black">
        <MarketingHeader isLoggedIn={Boolean(session?.user)} />

        <main className="w-full">
          {/* Top Hero Section */}
          <section className="bg-[#dff2ed] pt-10 pb-16 px-4 sm:px-8 lg:px-12 border-b border-slate-200/60 font-lazzer">
            <div className="max-w-7xl mx-auto">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-900" />
                <span>INSIGHTS, GUIDES &amp; RESEARCH</span>
              </div>

              <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-[#111827] tracking-tight leading-tight">
                Latest Insights &amp; SEO Articles
              </h1>

              <p className="mt-4 text-base sm:text-lg text-slate-700 max-w-2xl leading-relaxed">
                Actionable engineering tutorials, Core Web Vitals playbooks, and AI search entity optimization strategies tested on real production websites.
              </p>
            </div>
          </section>

          {/* Dynamic Articles Hub Section */}
          <section className="py-14 sm:py-20 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto">
            <ArticlesHubClient
              initialArticles={serializedArticles}
              categories={categories}
            />
          </section>

          {/* Bottom Conversion Banner matching Landing Page */}
          <FinalCta />
        </main>

        <MarketingFooter />
      </div>
    </AuthModalProvider>
  );
}
