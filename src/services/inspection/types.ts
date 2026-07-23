/**
 * The structured extraction produced by the inspection engine and stored in
 * website_raw_data.extracted. The Phase 6 criteria engine reads these paths
 * (e.g. dataSource=HTML + a well-known key, or RULES_EVALUATOR `var` paths).
 *
 * Keep this type additive — removing/renaming keys breaks re-evaluation of
 * stored snapshots.
 */

export type HeadingInfo = { tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"; text: string };

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
  sitemap: {
    exists: boolean;
    url: string | null;
    urlCount: number | null;
  };
  brokenLinks: {
    checkedCount: number;
    brokenCount: number;
    broken: Array<{ url: string; status: number | null }>;
  };
};
