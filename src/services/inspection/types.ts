/**
 * The structured extraction produced by the inspection engine and stored in
 * website_raw_data.extracted. The Phase 6 criteria engine reads these paths
 * (e.g. dataSource=HTML + a well-known key, or RULES_EVALUATOR `var` paths).
 *
 * Keep this type additive — removing/renaming keys breaks re-evaluation of
 * stored snapshots.
 */

export type HeadingInfo = { tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"; text: string };

export type ShopifyPolicyPage = {
  exists: boolean;
  httpStatus: number | null;
  title: string | null;
  h1: string | null;
  wordCount: number | null;
};

export type LinkInfo = { href: string; text: string; rel: string | null };

export type ImageIssue = { src: string; reason: "missing-alt" | "empty-alt" };

export type FormInfo = {
  action: string | null;
  method: string;
  fieldCount: number;
  hasEmailField: boolean;
  hasSubmit: boolean;
};

export type ExtractedData = {
  page: {
    title: string | null;
    titleLength: number;
    metaDescription: string | null;
    metaDescriptionLength: number;
    metaRobots: string | null;
    canonicalUrl: string | null;
    language: string | null;
    charset: string | null;
    faviconUrl: string | null;
    viewport: string | null;
    hasViewport: boolean;
  };
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
    h1Count: number;
    h2Count: number;
    h3Count: number;
    all: HeadingInfo[];
    /** true when no heading level is skipped going down the document */
    hierarchyValid: boolean;
  };
  images: {
    count: number;
    missingAltCount: number;
    emptyAltCount: number;
    issues: ImageIssue[]; // capped at 25 for evidence
    /* Image-optimisation signals (E.4) — Shopify CDN images without a ?width=
     * param are served full-resolution regardless of viewport, one of the most
     * common causes of poor mobile LCP on Shopify. */
    shopifyCdnCount: number;
    withWidthParamCount: number;
    lazyLoadedCount: number;
    eagerAboveFoldCount: number; // loading="eager" or absent, first 3 images
    withDimensionsCount: number; // width AND height attributes (CLS)
    avgSrcsetEntries: number; // mean srcset entries, 0 when absent
  };
  links: {
    internalCount: number;
    externalCount: number;
    internal: LinkInfo[]; // capped at 100
    external: LinkInfo[]; // capped at 50
    nofollowCount: number;
  };
  social: {
    openGraph: Record<string, string>;
    twitterCard: Record<string, string>;
    hasOgTitle: boolean;
    hasOgImage: boolean;
    hasTwitterCard: boolean;
    socialProfileLinks: string[]; // facebook/x/instagram/linkedin/youtube/tiktok profile URLs found
  };
  structuredData: {
    jsonLdBlocks: number;
    schemaTypes: string[];
    hasStructuredData: boolean;
  };
  content: {
    wordCount: number;
    textToHtmlRatio: number; // 0..1
    paragraphCount: number;
  };
  conversion: {
    formCount: number;
    forms: FormInfo[]; // capped at 10
    buttonCount: number;
    ctaCount: number; // buttons/links with action-oriented text
    ctaExamples: string[]; // capped at 10
  };
  contact: {
    hasEmail: boolean;
    hasPhone: boolean;
    emails: string[]; // capped at 5
    phones: string[]; // capped at 5
  };
  trust: {
    hasPrivacyPolicyLink: boolean;
    hasTermsLink: boolean;
    hasCookieNotice: boolean;
    hasTestimonialSignals: boolean;
    hasGuaranteeSignals: boolean;
    hasPricingSignals: boolean;
    hasShippingSignals: boolean;
    hasReturnPolicySignals: boolean;
  };
  resources: {
    scriptCount: number;
    externalScriptCount: number;
    inlineScriptCount: number;
    stylesheetCount: number;
    inlineStyleCount: number;
    fontLinkCount: number;
    iframeCount: number;
    /* Resource-hint targets (E.3) — parsed from static HTML, no requests. */
    preconnectHosts: string[];
    dnsPrefetchHosts: string[];
    preloadCount: number;
    hasShopifyCdnHint: boolean; // preconnect/dns-prefetch to cdn.shopify.com
  };
  network: {
    httpStatus: number | null;
    finalUrl: string | null;
    redirectCount: number;
    redirectChain: string[];
    usedHttps: boolean;
    htmlSizeBytes: number;
    responseHeaders: Record<string, string>;
    hasCompression: boolean;
    hasCacheHeaders: boolean;
    securityHeaders: {
      strictTransportSecurity: string | null;
      contentSecurityPolicy: string | null;
      xContentTypeOptions: string | null;
      xFrameOptions: string | null;
      referrerPolicy: string | null;
      permissionsPolicy: string | null;
    };
  };
  robots: {
    exists: boolean;
    content: string | null; // capped at 5 KB
    referencesSitemap: boolean;
    disallowsAll: boolean;
  };
  /** /llms.txt (E.2) — the AI-answer-engines discoverability file. Fetched
   *  alongside robots.txt on every platform; optional on old snapshots. */
  llms?: {
    exists: boolean;
    content: string | null; // first 5 KB
    sizeBytes: number;
  };
  sitemap: {
    exists: boolean;
    url: string | null;
    urlCount: number | null;
    /** File names of children when the sitemap is an index (capped at 20) —
     *  Shopify's sitemap_products_1.xml / sitemap_collections_1.xml pattern
     *  is a platform-detection signal. */
    childSitemaps: string[];
    /** The children's FULL URLs, query string intact. Shopify's product and
     *  collection sitemaps 400 without their ?from=&to= params, so anything
     *  that actually fetches a child (multi-page sampling) must use these,
     *  not the bare file names. */
    childSitemapUrls?: string[];
  };
  brokenLinks: {
    checkedCount: number;
    brokenCount: number;
    broken: Array<{ url: string; status: number | null }>;
  };
  crawledPages?: Array<{
    id: string;
    url: string;
    path: string;
    title: string | null;
    statusCode: number;
    type: string;
    issuesCount: number;
    depth: number;
  }>;
  /**
   * Shopify-specific extraction (Part E). `urls` comes from static HTML on
   * every audit; `policies` is fetched only when the site is Shopify;
   * `product` exists ONLY when the audited page carries Product JSON-LD — a
   * homepage simply lacks the keys, and a check reading an absent path
   * resolves NOT_APPLICABLE (never a false failure).
   */
  shopify?: {
    urls: {
      hasCollectionScopedProductLinks: boolean; // /collections/x/products/y — the classic duplicate-content shape
      variantParamLinkCount: number;
      filterParamLinkCount: number;
      paginationLinkCount: number;
    };
    sitemapChildren?: string[];
    policies?: {
      refund: ShopifyPolicyPage;
      privacy: ShopifyPolicyPage;
      terms: ShopifyPolicyPage;
      shipping: ShopifyPolicyPage;
      legalNotice: ShopifyPolicyPage;
      presentCount: number; // 0–5
      thinCount: number; // present but under ~100 words
      duplicateTitleH1Count: number; // title === h1 — the Shopify default failure
    };
    /**
     * Present ONLY when the audited page is a Shopify product page (URL path
     * contains /products/). That distinction is what lets "this product page
     * has no product schema" FAIL honestly, while a homepage stays
     * NOT_APPLICABLE. Absent on every non-product page.
     */
    product?: {
      /** Always true when the block exists — the gate for product-page checks. */
      isProductPage: boolean;
      hasProductSchema: boolean;
      schemaHasOffers: boolean;
      schemaHasPrice: boolean;
      schemaHasAvailability: boolean;
      schemaHasCurrency: boolean;
      hasAggregateRating: boolean;
      imageCount: number;
      hasSizeGuide: boolean;
      hasShippingInfo: boolean;
      hasReturnsInfo: boolean;
    };
  };
  /** Platform detection (A.1) — written by detect-platform.ts after the
   *  robots/sitemap checks (optional: absent on snapshots stored before it
   *  existed; criteria paths then resolve to null → "not this platform"). */
  site?: {
    platform:
      | "SHOPIFY"
      | "HYDROGEN"
      | "WORDPRESS"
      | "WOOCOMMERCE"
      | "WEBFLOW"
      | "WIX"
      | "SQUARESPACE"
      | "NEXTJS"
      | "UNKNOWN";
    platformConfidence: number; // 0..1
    isShopify: boolean; // SHOPIFY or HYDROGEN
    /** No reliable external signal for Plus exists — never asserted, only "possible". */
    plusLikelihood: "unknown" | "possible";
    themeName: string | null;
    themeId: string | null;
    isOfficialTheme: boolean;
    appCount: number;
    appNames: string[];
    appScriptHosts: string[];
    blockingAppScripts: number;
  };
};
