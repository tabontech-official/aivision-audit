import "server-only";
import * as cheerio from "cheerio";
import type {
  ExtractedData,
  HeadingInfo,
  ImageIssue,
  LinkInfo,
  FormInfo,
} from "./types";
import type { FetchedPage } from "./fetcher";

/**
 * Parse fetched HTML into the structured ExtractedData shape.
 * Pure and deterministic: same HTML in, same data out — this is what makes
 * stored snapshots re-evaluable when the admin edits criteria.
 */

const CTA_PATTERNS =
  /\b(get started|sign ?up|start (free|now|trial)|try (it |now|free)|buy now|add to cart|subscribe|request (a )?(demo|quote)|contact (us|sales)|book (now|a call|a demo)|download|join (now|free)|learn more|shop now|order now|get (a )?quote|free trial|start today|apply now|register|donate)\b/i;

const SOCIAL_HOSTS =
  /(facebook\.com|twitter\.com|x\.com|instagram\.com|linkedin\.com|youtube\.com|tiktok\.com|pinterest\.com)\//i;

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// Conservative phone matcher: intl or grouped formats, 9+ digits total
const PHONE_RE = /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?)?\d{3,4}[\s.-]\d{3,4}(?:[\s.-]\d{2,4})?/g;

function cap<T>(arr: T[], n: number): T[] {
  return arr.length > n ? arr.slice(0, n) : arr;
}

function textSignals($: cheerio.CheerioAPI, patterns: RegExp): boolean {
  const bodyText = $("body").text().toLowerCase();
  return patterns.test(bodyText);
}

export function extractFromHtml(page: FetchedPage): ExtractedData {
  const $ = cheerio.load(page.html);
  const baseUrl = page.finalUrl;
  let baseHost = "";
  try {
    baseHost = new URL(baseUrl).hostname.replace(/^www\./, "");
  } catch {
    /* keep empty */
  }

  /* ---------------- page basics ---------------- */
  const title = $("head title").first().text().trim() || null;
  const metaDescription =
    $('head meta[name="description" i]').attr("content")?.trim() || null;
  const metaRobots = $('head meta[name="robots" i]').attr("content")?.trim() || null;
  const canonicalUrl = $('head link[rel="canonical" i]').attr("href")?.trim() || null;
  const language = $("html").attr("lang")?.trim() || null;
  const charset =
    $("head meta[charset]").attr("charset") ??
    $('head meta[http-equiv="Content-Type" i]')
      .attr("content")
      ?.match(/charset=([\w-]+)/i)?.[1] ??
    null;
  const viewport = $('head meta[name="viewport" i]').attr("content")?.trim() || null;

  let faviconUrl: string | null = null;
  const iconHref =
    $('head link[rel~="icon" i]').first().attr("href") ??
    $('head link[rel="shortcut icon" i]').first().attr("href");
  if (iconHref) {
    try {
      faviconUrl = new URL(iconHref, baseUrl).toString();
    } catch {
      faviconUrl = null;
    }
  }

  /* ---------------- headings ---------------- */
  const all: HeadingInfo[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const tag = el.tagName.toLowerCase() as HeadingInfo["tag"];
    const text = $(el).text().trim().replace(/\s+/g, " ").slice(0, 200);
    all.push({ tag, text });
  });
  const h1 = all.filter((h) => h.tag === "h1").map((h) => h.text);
  const h2 = all.filter((h) => h.tag === "h2").map((h) => h.text);
  const h3 = all.filter((h) => h.tag === "h3").map((h) => h.text);

  let hierarchyValid = true;
  let prevLevel = 0;
  for (const h of all) {
    const level = Number(h.tag[1]);
    if (prevLevel > 0 && level > prevLevel + 1) {
      hierarchyValid = false;
      break;
    }
    prevLevel = level;
  }

  /* ---------------- images ---------------- */
  const imgIssues: ImageIssue[] = [];
  let imgCount = 0;
  let missingAltCount = 0;
  let emptyAltCount = 0;
  // Optimisation signals (E.4). A Shopify CDN image without ?width= is served
  // full-resolution regardless of viewport — a top cause of poor mobile LCP.
  let shopifyCdnCount = 0;
  let withWidthParamCount = 0;
  let lazyLoadedCount = 0;
  let eagerAboveFoldCount = 0;
  let withDimensionsCount = 0;
  let srcsetEntryTotal = 0;
  $("img").each((_, el) => {
    imgCount++;
    const src = ($(el).attr("src") ?? $(el).attr("data-src") ?? "").slice(0, 300);
    const alt = $(el).attr("alt");
    if (alt === undefined) {
      missingAltCount++;
      imgIssues.push({ src, reason: "missing-alt" });
    } else if (alt.trim() === "") {
      // empty alt is valid for decorative images; tracked separately, not a failure
      emptyAltCount++;
    }

    if (/cdn\.shopify\.com|\/cdn\/shop\//i.test(src)) shopifyCdnCount++;
    if (/[?&]width=/i.test(src)) withWidthParamCount++;
    const loading = ($(el).attr("loading") ?? "").toLowerCase();
    if (loading === "lazy") lazyLoadedCount++;
    if (imgCount <= 3 && loading !== "lazy") eagerAboveFoldCount++;
    if ($(el).attr("width") && $(el).attr("height")) withDimensionsCount++;
    const srcset = $(el).attr("srcset") ?? "";
    if (srcset.trim()) srcsetEntryTotal += srcset.split(",").filter((s) => s.trim()).length;
  });

  /* ---------------- links ---------------- */
  const internal: LinkInfo[] = [];
  const external: LinkInfo[] = [];
  let nofollowCount = 0;
  $("a[href]").each((_, el) => {
    const hrefRaw = $(el).attr("href")?.trim() ?? "";
    if (!hrefRaw || hrefRaw.startsWith("#") || /^(mailto|tel|javascript):/i.test(hrefRaw)) {
      return;
    }
    let abs: URL;
    try {
      abs = new URL(hrefRaw, baseUrl);
    } catch {
      return;
    }
    if (abs.protocol !== "http:" && abs.protocol !== "https:") return;

    const rel = $(el).attr("rel") ?? null;
    if (rel?.includes("nofollow")) nofollowCount++;
    const info: LinkInfo = {
      href: abs.toString().slice(0, 500),
      text: $(el).text().trim().replace(/\s+/g, " ").slice(0, 120),
      rel,
    };
    const linkHost = abs.hostname.replace(/^www\./, "");
    if (baseHost && (linkHost === baseHost || linkHost.endsWith(`.${baseHost}`))) {
      internal.push(info);
    } else {
      external.push(info);
    }
  });

  /* ---------------- social ---------------- */
  const openGraph: Record<string, string> = {};
  $('head meta[property^="og:" i]').each((_, el) => {
    const prop = $(el).attr("property")?.toLowerCase();
    const content = $(el).attr("content");
    if (prop && content) openGraph[prop] = content.slice(0, 300);
  });
  const twitterCard: Record<string, string> = {};
  $('head meta[name^="twitter:" i]').each((_, el) => {
    const name = $(el).attr("name")?.toLowerCase();
    const content = $(el).attr("content");
    if (name && content) twitterCard[name] = content.slice(0, 300);
  });
  const socialProfileLinks = cap(
    [...new Set(external.filter((l) => SOCIAL_HOSTS.test(l.href)).map((l) => l.href))],
    10,
  );

  /* ---------------- structured data ---------------- */
  const schemaTypes = new Set<string>();
  let jsonLdBlocks = 0;
  $('script[type="application/ld+json"]').each((_, el) => {
    jsonLdBlocks++;
    try {
      const parsed: unknown = JSON.parse($(el).text());
      const collect = (node: unknown): void => {
        if (Array.isArray(node)) return node.forEach(collect);
        if (node && typeof node === "object") {
          const t = (node as Record<string, unknown>)["@type"];
          if (typeof t === "string") schemaTypes.add(t);
          if (Array.isArray(t)) t.forEach((x) => typeof x === "string" && schemaTypes.add(x));
          const graph = (node as Record<string, unknown>)["@graph"];
          if (graph) collect(graph);
        }
      };
      collect(parsed);
    } catch {
      /* invalid JSON-LD still counts as a block */
    }
  });
  // Microdata itemtype support
  $("[itemtype]").each((_, el) => {
    const t = $(el).attr("itemtype");
    const m = t?.match(/schema\.org\/(\w+)/);
    if (m?.[1]) schemaTypes.add(m[1]);
  });

  /* ---------------- resource hints (E.3) ---------------- */
  const preconnectHosts: string[] = [];
  const dnsPrefetchHosts: string[] = [];
  const hintHost = (href: string | undefined): string | null => {
    if (!href) return null;
    try {
      return new URL(href.startsWith("//") ? `https:${href}` : href).hostname;
    } catch {
      return null;
    }
  };
  $('link[rel="preconnect" i]').each((_, el) => {
    const host = hintHost($(el).attr("href"));
    if (host && !preconnectHosts.includes(host)) preconnectHosts.push(host);
  });
  $('link[rel="dns-prefetch" i]').each((_, el) => {
    const host = hintHost($(el).attr("href"));
    if (host && !dnsPrefetchHosts.includes(host)) dnsPrefetchHosts.push(host);
  });
  const preloadCount = $('link[rel="preload" i]').length;
  const hasShopifyCdnHint = [...preconnectHosts, ...dnsPrefetchHosts].some((h) =>
    /(^|\.)cdn\.shopify\.com$/i.test(h),
  );

  /* ---------------- Shopify URL structure (E.6) ---------------- */
  let hasCollectionScopedProductLinks = false;
  let variantParamLinkCount = 0;
  let filterParamLinkCount = 0;
  let paginationLinkCount = 0;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (/\/collections\/[^/?#]+\/products\//i.test(href)) hasCollectionScopedProductLinks = true;
    if (/[?&]variant=/i.test(href)) variantParamLinkCount++;
    if (/[?&]filter\./i.test(href)) filterParamLinkCount++;
    if (/[?&]page=\d/i.test(href)) paginationLinkCount++;
  });

  /* ---------------- product-page signals (E.5) ----------------
   * Populated ONLY when the audited page carries Product JSON-LD. On a
   * homepage the keys stay absent, and a check reading an absent path
   * resolves NOT_APPLICABLE — `false` here would be a false failure. */
  let productSignals: NonNullable<ExtractedData["shopify"]>["product"] | undefined;
  const productNodes: Array<Record<string, unknown>> = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed: unknown = JSON.parse($(el).text());
      const walk = (node: unknown): void => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (node && typeof node === "object") {
          const record = node as Record<string, unknown>;
          const t = record["@type"];
          const types = Array.isArray(t) ? t : [t];
          // ProductGroup is the schema.org type for a product WITH VARIANTS —
          // very common on Shopify (Allbirds and friends). Treating it as a
          // product is required, not optional.
          if (
            types.some(
              (x) =>
                typeof x === "string" &&
                ["product", "productgroup"].includes(x.toLowerCase()),
            )
          ) {
            productNodes.push(record);
          }
          if (record["@graph"]) walk(record["@graph"]);
        }
      };
      walk(parsed);
    } catch {
      /* invalid JSON-LD — ignored here, counted above */
    }
  });

  // Shopify product URLs are deterministic. Knowing the page IS a product page
  // is what makes "no product schema here" a real FAIL instead of silence.
  let isProductPage = false;
  try {
    isProductPage = /\/products\/[^/]+/.test(new URL(page.finalUrl).pathname);
  } catch {
    /* unparsable URL — treat as not a product page */
  }

  if (isProductPage && productNodes.length === 0) {
    // A product page with NO product schema: the single most valuable
    // product-readiness finding. Sub-signals stay unknowable, but the page
    // type and the absence are both facts.
    productSignals = {
      isProductPage: true,
      hasProductSchema: false,
      schemaHasOffers: false,
      schemaHasPrice: false,
      schemaHasAvailability: false,
      schemaHasCurrency: false,
      hasAggregateRating: false,
      imageCount: $("img").length,
      hasSizeGuide: /size (guide|chart)/i.test($("body").text().toLowerCase()),
      hasShippingInfo: /shipping|delivery/i.test($("body").text().toLowerCase()),
      hasReturnsInfo: /returns?|refund/i.test($("body").text().toLowerCase()),
    };
  } else if (productNodes.length > 0) {
    const product = productNodes[0]!;
    // ProductGroup carries its offers on variant nodes (`hasVariant`), so
    // look there when the group itself has none.
    const variants = product.hasVariant;
    const firstVariant = (Array.isArray(variants) ? variants[0] : variants) as
      | Record<string, unknown>
      | undefined;
    const offersRaw = product.offers ?? firstVariant?.offers;
    const offers = (Array.isArray(offersRaw) ? offersRaw[0] : offersRaw) as
      | Record<string, unknown>
      | undefined;
    const offerHas = (key: string): boolean =>
      offers !== undefined && offers !== null && typeof offers === "object" &&
      offers[key] !== undefined && offers[key] !== null && offers[key] !== "";
    const imagesRaw = product.image ?? firstVariant?.image;
    const bodyTextLower = $("body").text().toLowerCase();

    productSignals = {
      isProductPage,
      hasProductSchema: true,
      schemaHasOffers: offers !== undefined && offers !== null,
      schemaHasPrice: offerHas("price") || offerHas("priceSpecification"),
      schemaHasAvailability: offerHas("availability"),
      schemaHasCurrency: offerHas("priceCurrency"),
      hasAggregateRating:
        (product.aggregateRating ?? firstVariant?.aggregateRating) !== undefined &&
        (product.aggregateRating ?? firstVariant?.aggregateRating) !== null,
      imageCount: Array.isArray(imagesRaw) ? imagesRaw.length : imagesRaw ? 1 : 0,
      hasSizeGuide: /size (guide|chart)/i.test(bodyTextLower),
      hasShippingInfo: /shipping|delivery/i.test(bodyTextLower),
      hasReturnsInfo: /returns?|refund/i.test(bodyTextLower),
    };
  }

  /* ---------------- content metrics ---------------- */
  const clone = $.root().clone();
  clone.find("script, style, noscript, svg, template").remove();
  const bodyText = clone.find("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText ? bodyText.split(" ").filter((w) => w.length > 0).length : 0;
  const textToHtmlRatio =
    page.htmlSizeBytes > 0
      ? Math.min(1, Buffer.byteLength(bodyText, "utf-8") / page.htmlSizeBytes)
      : 0;

  /* ---------------- conversion elements ---------------- */
  const forms: FormInfo[] = [];
  $("form").each((_, el) => {
    const $form = $(el);
    forms.push({
      action: $form.attr("action")?.slice(0, 300) ?? null,
      method: ($form.attr("method") ?? "get").toLowerCase(),
      fieldCount: $form.find("input, textarea, select").length,
      hasEmailField:
        $form.find('input[type="email"], input[name*="email" i]').length > 0,
      hasSubmit:
        $form.find('button[type="submit"], input[type="submit"], button:not([type])')
          .length > 0,
    });
  });

  const buttonCount = $('button, input[type="button"], input[type="submit"], [role="button"]').length;

  const ctaTexts = new Set<string>();
  $('a, button, input[type="submit"], input[type="button"], [role="button"]').each(
    (_, el) => {
      const text = ($(el).text() || $(el).attr("value") || "")
        .trim()
        .replace(/\s+/g, " ");
      if (text && text.length <= 60 && CTA_PATTERNS.test(text)) {
        ctaTexts.add(text);
      }
    },
  );

  /* ---------------- contact info ---------------- */
  const htmlForContact = page.html.slice(0, 500_000);
  const emails = cap(
    [...new Set((htmlForContact.match(EMAIL_RE) ?? []).filter(
      (e) => !/\.(png|jpg|jpeg|gif|webp|svg|css|js)$/i.test(e) && !e.includes("example."),
    ))],
    5,
  );
  const telHrefs: string[] = [];
  $('a[href^="tel:"]').each((_, el) => {
    const t = $(el).attr("href")?.replace(/^tel:/, "").trim();
    if (t) telHrefs.push(t);
  });
  const textPhones = (bodyText.match(PHONE_RE) ?? []).filter(
    (p) => p.replace(/\D/g, "").length >= 9,
  );
  const phones = cap([...new Set([...telHrefs, ...textPhones])], 5);

  /* ---------------- trust signals ---------------- */
  const linkTexts = [...internal, ...external]
    .map((l) => `${l.text} ${l.href}`)
    .join(" ")
    .toLowerCase();
  const hasPrivacyPolicyLink = /privacy/.test(linkTexts);
  const hasTermsLink = /terms|conditions/.test(linkTexts);
  const hasCookieNotice =
    /cookie/.test(linkTexts) ||
    $('[class*="cookie" i], [id*="cookie" i]').length > 0;

  /* ---------------- resources ---------------- */
  const scriptEls = $("script");
  const externalScriptCount = scriptEls.filter((_, el) => !!$(el).attr("src")).length;

  /* ---------------- assemble ---------------- */
  return {
    page: {
      title,
      titleLength: title?.length ?? 0,
      metaDescription,
      metaDescriptionLength: metaDescription?.length ?? 0,
      metaRobots,
      canonicalUrl,
      language,
      charset,
      faviconUrl,
      viewport,
      hasViewport: viewport !== null,
    },
    headings: {
      h1: cap(h1, 20),
      h2: cap(h2, 40),
      h3: cap(h3, 40),
      h1Count: h1.length,
      h2Count: h2.length,
      h3Count: h3.length,
      all: cap(all, 120),
      hierarchyValid,
    },
    images: {
      count: imgCount,
      missingAltCount,
      emptyAltCount,
      issues: cap(imgIssues, 25),
      shopifyCdnCount,
      withWidthParamCount,
      lazyLoadedCount,
      eagerAboveFoldCount,
      withDimensionsCount,
      avgSrcsetEntries:
        imgCount > 0 ? Math.round((srcsetEntryTotal / imgCount) * 10) / 10 : 0,
    },
    links: {
      internalCount: internal.length,
      externalCount: external.length,
      internal: cap(internal, 100),
      external: cap(external, 50),
      nofollowCount,
    },
    social: {
      openGraph,
      twitterCard,
      hasOgTitle: "og:title" in openGraph,
      hasOgImage: "og:image" in openGraph,
      hasTwitterCard: "twitter:card" in twitterCard,
      socialProfileLinks,
    },
    structuredData: {
      jsonLdBlocks,
      schemaTypes: [...schemaTypes].slice(0, 30),
      hasStructuredData: jsonLdBlocks > 0 || schemaTypes.size > 0,
    },
    content: {
      wordCount,
      textToHtmlRatio: Number(textToHtmlRatio.toFixed(4)),
      paragraphCount: $("p").length,
    },
    conversion: {
      formCount: forms.length,
      forms: cap(forms, 10),
      buttonCount,
      ctaCount: ctaTexts.size,
      ctaExamples: cap([...ctaTexts], 10),
    },
    contact: {
      hasEmail: emails.length > 0,
      hasPhone: phones.length > 0,
      emails,
      phones,
    },
    trust: {
      hasPrivacyPolicyLink,
      hasTermsLink,
      hasCookieNotice,
      hasTestimonialSignals: textSignals($, /\b(testimonial|what our (customers|clients) say|reviews?)\b/i),
      hasGuaranteeSignals: textSignals($, /\b(money[- ]back|satisfaction guarantee|guaranteed?)\b/i),
      hasPricingSignals: textSignals($, /\b(pricing|price|\$\d+|€\d+|£\d+)\b/i),
      hasShippingSignals: textSignals($, /\b(shipping|delivery|free shipping)\b/i),
      hasReturnPolicySignals: textSignals($, /\b(returns?|refund policy|return policy)\b/i),
    },
    resources: {
      scriptCount: scriptEls.length,
      externalScriptCount,
      inlineScriptCount: scriptEls.length - externalScriptCount,
      stylesheetCount: $('link[rel="stylesheet" i]').length,
      inlineStyleCount: $("style").length,
      fontLinkCount: $('link[href*="fonts." i], link[rel="preload"][as="font"]').length,
      iframeCount: $("iframe").length,
      preconnectHosts: cap(preconnectHosts, 20),
      dnsPrefetchHosts: cap(dnsPrefetchHosts, 20),
      preloadCount,
      hasShopifyCdnHint,
    },
    shopify: {
      urls: {
        hasCollectionScopedProductLinks,
        variantParamLinkCount,
        filterParamLinkCount,
        paginationLinkCount,
      },
      ...(productSignals ? { product: productSignals } : {}),
    },
    network: {
      httpStatus: page.httpStatus,
      finalUrl: page.finalUrl,
      redirectCount: page.redirectChain.length,
      redirectChain: page.redirectChain,
      usedHttps: page.usedHttps,
      htmlSizeBytes: page.htmlSizeBytes,
      responseHeaders: page.responseHeaders,
      hasCompression: /gzip|br|deflate|zstd/.test(page.responseHeaders["content-encoding"] ?? ""),
      hasCacheHeaders:
        "cache-control" in page.responseHeaders || "etag" in page.responseHeaders,
      securityHeaders: {
        strictTransportSecurity: page.responseHeaders["strict-transport-security"] ?? null,
        contentSecurityPolicy: page.responseHeaders["content-security-policy"] ?? null,
        xContentTypeOptions: page.responseHeaders["x-content-type-options"] ?? null,
        xFrameOptions: page.responseHeaders["x-frame-options"] ?? null,
        referrerPolicy: page.responseHeaders["referrer-policy"] ?? null,
        permissionsPolicy: page.responseHeaders["permissions-policy"] ?? null,
      },
    },
    // Filled by aux checks in the job pipeline:
    robots: { exists: false, content: null, referencesSitemap: false, disallowsAll: false },
    sitemap: { exists: false, url: null, urlCount: null, childSitemaps: [], childSitemapUrls: [] },
    brokenLinks: { checkedCount: 0, brokenCount: 0, broken: [] },
  };
}
