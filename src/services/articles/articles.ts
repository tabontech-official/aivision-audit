import { db } from "@/lib/db/client";

export interface ArticleInput {
  title: string;
  slug?: string;
  description?: string;
  content: string;
  coverImage?: string;
  authorName?: string;
  authorTitle?: string;
  authorAvatar?: string;
  category?: string;
  tags?: string[];
  readTimeMinutes?: number;
  isPublished?: boolean;
  isFeatured?: boolean;
}

export interface ArticleRecord {
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
  isPublished: boolean;
  isFeatured: boolean;
  viewCount: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

// Built-in seed articles in case the database is empty initially
export const SEED_ARTICLES: ArticleInput[] = [
  {
    title: "Mastering AI Search Optimization: A Complete Guide for 2026",
    slug: "mastering-ai-search-optimization-guide-2026",
    description: "Learn how generative engines, ChatGPT Search, Perplexity, and Google Gemini cite websites and how to optimize your brand's AI search visibility.",
    category: "AI Search & GEO",
    authorName: "AuditFlow Research",
    authorTitle: "Search Intelligence Team",
    authorAvatar: "/images/authors/team.jpg",
    tags: ["GEO", "AI Search", "Perplexity", "ChatGPT Search", "LLM Citations"],
    isPublished: true,
    isFeatured: true,
    readTimeMinutes: 7,
    content: `
## The Shift from Traditional Search to Generative Engines

Search has fundamentally evolved. For over two decades, search engines indexed web pages and returned 10 blue links ranked by PageRank and keyword relevance. Today, large language models (LLMs) synthesize answers directly from multiple web sources, presenting structured citations and direct answers to users.

To survive and thrive in this landscape, digital brands must embrace **Generative Engine Optimization (GEO)**.

### Why GEO Matters More Than Keyword Density

In generative search environments like Perplexity, ChatGPT Search, and Google Gemini:
1. **Direct Answer Extraction**: LLMs look for high-information-density paragraphs that answer specific user questions directly.
2. **Entity Authority**: Search models match concepts against a trusted knowledge graph. Brand mentions in reputable citations matter as much as direct backlinks.
3. **Structured Data Completeness**: Rich JSON-LD schema (FAQ, HowTo, Article, Organization) helps LLMs parse context with zero ambiguity.

\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Mastering AI Search Optimization: A Complete Guide for 2026",
  "author": {
    "@type": "Organization",
    "name": "AuditFlow Research"
  }
}
\`\`\`

### 4 Pillars of Generative Optimization

1. **Clear Semantic Hierarchy**: Use single-purpose H2 and H3 headings. LLM parsers chunk content by headings; unclear headings lead to misattributed facts.
2. **Data-Dense Tables & Statistics**: LLMs disproportionately quote verified numbers, benchmark results, and structured tables.
3. **Canonical Consensus**: Ensure your technical specifications and documentation align with industry definitions so your domain is treated as a consensus source.
4. **Fast, Unblocked Bot Crawling**: Verify that your \`robots.txt\` permits major retrieval bots like \`GPTBot\`, \`ClaudeBot\`, and \`PerplexityBot\` where desired.

### Conclusion

Optimizing for generative search does not mean abandoning traditional technical SEO. Rather, it builds directly on solid fundamentals: clean semantics, schema markup, and authoritative knowledge architecture.
`,
  },
  {
    title: "Technical SEO Checklist for Next.js and Modern Web Apps",
    slug: "technical-seo-checklist-nextjs-modern-web-apps",
    description: "A comprehensive developer-focused checklist for ensuring zero crawl budget waste, perfect Core Web Vitals, and optimal indexing in React & Next.js applications.",
    category: "Technical SEO",
    authorName: "Sarah Chen",
    authorTitle: "Lead Performance Engineer",
    tags: ["Next.js", "React", "Server Components", "Core Web Vitals", "SSR"],
    isPublished: true,
    isFeatured: false,
    readTimeMinutes: 6,
    content: `
## Building Fast, Crawlable Next.js Applications

Modern JavaScript frameworks provide incredible developer ergonomics, but without careful technical architecture, client-heavy apps can suffer from indexing delays and poor Core Web Vitals.

### 1. Server-Side Rendering (SSR) & Server Components

Relying purely on client-side rendering (CSR) means search engine bots must execute JavaScript in a secondary rendering pass. By leveraging Next.js React Server Components (RSC):
- HTML is streamed immediately on the initial response.
- Bots index full content on the first crawl without waiting for JS execution.
- Hydration overhead is dramatically decreased.

### 2. Automated Metadata and Open Graph Generation

Next.js provides native metadata export capabilities:

\`\`\`typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const article = await getArticle(params.slug);
  return {
    title: article.title,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      images: [article.coverImage],
    },
  };
}
\`\`\`

### 3. Image Optimization and Cumulative Layout Shift (CLS)

Always use \`next/image\` with explicit \`width\` and \`height\` or \`fill\` with appropriate aspect ratio wrappers to prevent layout shifts.

- Use \`priority\` on LCP (Largest Contentful Paint) hero images.
- Provide modern WebP / AVIF formats automatically.
`,
  },
  {
    title: "Core Web Vitals in 2026: INP, LCP, and Real-World Optimization",
    slug: "core-web-vitals-inp-lcp-optimization-guide",
    description: "Interaction to Next Paint (INP) is now a core ranking metric. Explore real code examples and actionable strategies to maximize responsiveness.",
    category: "Core Web Vitals",
    authorName: "Marcus Vance",
    authorTitle: "Web Vitals Specialist",
    tags: ["INP", "LCP", "Performance", "Speed", "UX"],
    isPublished: true,
    isFeatured: false,
    readTimeMinutes: 5,
    content: `
## Why Interaction to Next Paint (INP) Matters

INP measures responsiveness across the entire page lifecycle, assessing the latency of every click, tap, and keyboard interaction.

### Diagnosing Long Tasks

Any JavaScript task that exceeds 50ms is classified as a Long Task and blocks the main browser thread. Common culprits include:
- Heavy event listeners performing synchronous calculations.
- Excessive component re-rendering in React.
- Unoptimized third-party analytics tags and tracking scripts.

### How to Yield to the Main Thread

\`\`\`javascript
async function yieldToMain() {
  if (globalThis.scheduler?.yield) {
    return scheduler.yield();
  }
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}
\`\`\`

By yielding to the main thread during heavy computations, the browser can quickly paint user interactions and maintain sub-200ms INP scores.
`,
  },
  {
    title: "Schema Markup & JSON-LD: The Ultimate Entity Architecture",
    slug: "schema-markup-json-ld-entity-architecture",
    description: "How to connect your brand, products, FAQ, and organizational data into a coherent knowledge graph that search engines understand instantly.",
    category: "Schema & Architecture",
    authorName: "Elena Rostova",
    authorTitle: "Structured Data Architect",
    tags: ["JSON-LD", "Schema.org", "Knowledge Graph", "Rich Snippets"],
    isPublished: true,
    isFeatured: false,
    readTimeMinutes: 8,
    content: `
## Moving from Web Pages to Web Entities

Search engines no longer just read strings; they build interconnected entities. Structured data written in JSON-LD formats is the most reliable bridge between raw HTML and entity recognition.

### Key Schemas Every Site Needs

1. **Organization & WebSite**: Define the brand publisher, social profiles (\`sameAs\`), and site search endpoints.
2. **BreadcrumbList**: Enables rich breadcrumb trails in search SERPs.
3. **FAQPage & HowTo**: Delivers expandable question modules directly in search results.
4. **SoftwareApplication / Product**: Exposes pricing, aggregate ratings, and operating system requirements.

### Best Practices

- Always validate with the Schema.org validator and Google Rich Results test.
- Keep JSON-LD content in 100% parity with visible page text to prevent algorithmic penalties.
`,
  },
];

let isSeededChecked = false;

export async function ensureSeedArticles(): Promise<void> {
  if (isSeededChecked) return;
  try {
    const count = await db.article.count();
    if (count === 0) {
      for (const item of SEED_ARTICLES) {
        await db.article.create({
          data: {
            title: item.title,
            slug: item.slug || slugify(item.title),
            description: item.description,
            content: item.content,
            coverImage: item.coverImage,
            authorName: item.authorName || "Editorial Team",
            authorTitle: item.authorTitle || "Search Intelligence",
            authorAvatar: item.authorAvatar,
            category: item.category || "Technical SEO",
            tags: item.tags || [],
            readTimeMinutes: item.readTimeMinutes || calculateReadingTime(item.content),
            isPublished: true,
            isFeatured: item.isFeatured ?? false,
            publishedAt: new Date(),
          },
        });
      }
    }
    isSeededChecked = true;
  } catch (err) {
    console.warn("Could not seed articles:", err);
  }
}

export async function getPublishedArticles(options?: {
  category?: string;
  search?: string;
  tag?: string;
  limit?: number;
  offset?: number;
  excludeSlug?: string;
}) {
  const { category, search, tag, limit = 20, offset = 0, excludeSlug } = options || {};

  try {
    await ensureSeedArticles();

    const where: any = {
      isPublished: true,
    };

    if (category && category !== "All") {
      where.category = { equals: category, mode: "insensitive" };
    }

    if (excludeSlug) {
      where.slug = { not: excludeSlug };
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
      ];
    }

    const [articles, totalCount] = await Promise.all([
      db.article.findMany({
        where,
        orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
        take: limit,
        skip: offset,
      }),
      db.article.count({ where }),
    ]);

    return { articles, totalCount };
  } catch (err) {
    console.error("Failed to query published articles from DB, using seed fallback:", err);
    // Return seed fallback
    let filtered = SEED_ARTICLES.filter((a) => a.isPublished);
    if (category && category !== "All") {
      filtered = filtered.filter((a) => a.category?.toLowerCase() === category.toLowerCase());
    }
    if (excludeSlug) {
      filtered = filtered.filter((a) => a.slug !== excludeSlug);
    }
    const mapped = filtered.map((a, i) => ({
      id: `seed-${i + 1}`,
      slug: a.slug || slugify(a.title),
      title: a.title,
      description: a.description || null,
      content: a.content,
      coverImage: a.coverImage || null,
      authorName: a.authorName || "Editorial Team",
      authorTitle: a.authorTitle || "Search Intelligence",
      authorAvatar: a.authorAvatar || null,
      category: a.category || "Technical SEO",
      tags: a.tags || [],
      readTimeMinutes: a.readTimeMinutes || 5,
      isPublished: true,
      isFeatured: a.isFeatured ?? false,
      viewCount: 142 + i * 27,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    return { articles: mapped as ArticleRecord[], totalCount: mapped.length };
  }
}

export async function getArticleBySlug(slug: string, incrementView = false): Promise<ArticleRecord | null> {
  try {
    await ensureSeedArticles();

    const article = await db.article.findUnique({
      where: { slug },
    });

    if (article) {
      if (incrementView) {
        try {
          await db.article.update({
            where: { slug },
            data: { viewCount: { increment: 1 } },
          });
        } catch {
          // Non-blocking view count increment
        }
      }
      return article as ArticleRecord;
    }
  } catch (err) {
    console.error("Failed to fetch article by slug from DB:", err);
  }

  // Fallback to seed articles
  const seed = SEED_ARTICLES.find((a) => a.slug === slug);
  if (!seed) return null;

  return {
    id: `seed-${slug}`,
    slug: seed.slug || slugify(seed.title),
    title: seed.title,
    description: seed.description || null,
    content: seed.content,
    coverImage: seed.coverImage || null,
    authorName: seed.authorName || "Editorial Team",
    authorTitle: seed.authorTitle || "Search Intelligence",
    authorAvatar: seed.authorAvatar || null,
    category: seed.category || "Technical SEO",
    tags: seed.tags || [],
    readTimeMinutes: seed.readTimeMinutes || 5,
    isPublished: true,
    isFeatured: seed.isFeatured ?? false,
    viewCount: 284,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function getAllCategories() {
  try {
    await ensureSeedArticles();
    const articles = await db.article.findMany({
      where: { isPublished: true },
      select: { category: true },
    });

    const categoryMap = new Map<string, number>();
    for (const a of articles) {
      const cat = a.category || "General";
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    }

    return Array.from(categoryMap.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  } catch (err) {
    console.error("Failed to query categories from DB:", err);
    return [
      { name: "Technical SEO", count: 1 },
      { name: "AI Search & GEO", count: 1 },
      { name: "Core Web Vitals", count: 1 },
      { name: "Schema & Architecture", count: 1 },
    ];
  }
}

// Master Admin queries & mutations
export async function getAdminArticles(options?: {
  search?: string;
  category?: string;
  status?: "all" | "published" | "draft";
}) {
  const { search, category, status } = options || {};

  try {
    await ensureSeedArticles();

    const where: any = {};

    if (category && category !== "All") {
      where.category = { equals: category, mode: "insensitive" };
    }

    if (status === "published") {
      where.isPublished = true;
    } else if (status === "draft") {
      where.isPublished = false;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
        { authorName: { contains: q, mode: "insensitive" } },
      ];
    }

    return await db.article.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });
  } catch (err) {
    console.error("Failed to query admin articles from DB:", err);
    return SEED_ARTICLES.map((a, i) => ({
      id: `seed-${i + 1}`,
      slug: a.slug || slugify(a.title),
      title: a.title,
      description: a.description || null,
      content: a.content,
      coverImage: a.coverImage || null,
      authorName: a.authorName || "Editorial Team",
      authorTitle: a.authorTitle || "Search Intelligence",
      authorAvatar: a.authorAvatar || null,
      category: a.category || "Technical SEO",
      tags: a.tags || [],
      readTimeMinutes: a.readTimeMinutes || 5,
      isPublished: true,
      isFeatured: a.isFeatured ?? false,
      viewCount: 142 + i * 27,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as any;
  }
}

export async function getAdminArticleById(id: string) {
  try {
    return await db.article.findUnique({
      where: { id },
    });
  } catch (err) {
    console.error("Failed to get article by id from DB:", err);
    return null;
  }
}

export async function createArticle(input: ArticleInput) {
  let targetSlug = input.slug ? slugify(input.slug) : slugify(input.title);
  if (!targetSlug) targetSlug = `article-${Date.now()}`;

  // Check unique slug
  let finalSlug = targetSlug;
  let counter = 1;
  while (await db.article.findUnique({ where: { slug: finalSlug } })) {
    finalSlug = `${targetSlug}-${counter}`;
    counter++;
  }

  const readingTime = input.readTimeMinutes || calculateReadingTime(input.content);

  return db.article.create({
    data: {
      title: input.title.trim(),
      slug: finalSlug,
      description: input.description?.trim() || null,
      content: input.content,
      coverImage: input.coverImage?.trim() || null,
      authorName: input.authorName?.trim() || "Editorial Team",
      authorTitle: input.authorTitle?.trim() || null,
      authorAvatar: input.authorAvatar?.trim() || null,
      category: input.category?.trim() || "Technical SEO",
      tags: input.tags || [],
      readTimeMinutes: readingTime,
      isPublished: Boolean(input.isPublished),
      isFeatured: Boolean(input.isFeatured),
      publishedAt: input.isPublished ? new Date() : null,
    },
  });
}

export async function updateArticle(id: string, input: Partial<ArticleInput>) {
  const existing = await db.article.findUnique({ where: { id } });
  if (!existing) throw new Error("Article not found");

  let finalSlug = existing.slug;
  if (input.slug && slugify(input.slug) !== existing.slug) {
    const targetSlug = slugify(input.slug);
    let checkSlug = targetSlug;
    let counter = 1;
    while (true) {
      const match = await db.article.findUnique({ where: { slug: checkSlug } });
      if (!match || match.id === id) {
        finalSlug = checkSlug;
        break;
      }
      checkSlug = `${targetSlug}-${counter}`;
      counter++;
    }
  }

  const readingTime =
    input.readTimeMinutes ||
    (input.content ? calculateReadingTime(input.content) : existing.readTimeMinutes);

  const isPublishingNow = input.isPublished === true && !existing.isPublished;
  const publishedAt = isPublishingNow
    ? new Date()
    : input.isPublished === false
    ? null
    : existing.publishedAt;

  return db.article.update({
    where: { id },
    data: {
      title: input.title !== undefined ? input.title.trim() : undefined,
      slug: finalSlug,
      description: input.description !== undefined ? input.description?.trim() || null : undefined,
      content: input.content !== undefined ? input.content : undefined,
      coverImage: input.coverImage !== undefined ? input.coverImage?.trim() || null : undefined,
      authorName: input.authorName !== undefined ? input.authorName?.trim() || "Editorial Team" : undefined,
      authorTitle: input.authorTitle !== undefined ? input.authorTitle?.trim() || null : undefined,
      authorAvatar: input.authorAvatar !== undefined ? input.authorAvatar?.trim() || null : undefined,
      category: input.category !== undefined ? input.category?.trim() || "Technical SEO" : undefined,
      tags: input.tags !== undefined ? input.tags : undefined,
      readTimeMinutes: readingTime,
      isPublished: input.isPublished !== undefined ? Boolean(input.isPublished) : undefined,
      isFeatured: input.isFeatured !== undefined ? Boolean(input.isFeatured) : undefined,
      publishedAt,
    },
  });
}

export async function deleteArticle(id: string) {
  return db.article.delete({
    where: { id },
  });
}

export async function togglePublishArticle(id: string) {
  const existing = await db.article.findUnique({ where: { id } });
  if (!existing) throw new Error("Article not found");

  const nextPublished = !existing.isPublished;
  return db.article.update({
    where: { id },
    data: {
      isPublished: nextPublished,
      publishedAt: nextPublished ? (existing.publishedAt || new Date()) : null,
    },
  });
}
