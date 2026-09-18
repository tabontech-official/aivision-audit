import "server-only";
import * as cheerio from "cheerio";
import type { ExtractedData } from "./types";

/**
 * Platform detection (Shopify pivot, Part A.1).
 *
 * Identifies what the audited site is built on, using ONLY data the pipeline
 * already fetched — response headers, static HTML, robots.txt content and
 * sitemap children. No extra requests, no browser.
 *
 * Runs after the robots/sitemap aux checks and writes `extracted.site`, which
 * the criteria engine reads via `site.*` data paths and `appliesWhen` gates
 * read to skip inapplicable checks (NOT_APPLICABLE, never FAIL).
 *
 * Deliberately cheap and non-fatal: any internal error yields UNKNOWN and the
 * audit continues — an audit must never fail over platform detection.
 *
 * Shopify Plus honesty: there is NO reliable external signal for Plus. It is
 * modelled as plusLikelihood "unknown" | "possible" and must never be asserted
 * in customer-facing copy.
 */

export type SiteInfo = NonNullable<ExtractedData["site"]>;

type DetectInput = {
  html: string;
  responseHeaders: Record<string, string>;
  robotsContent: string | null;
  sitemapChildren: string[];
};

/* ------------------------------------------------------------------ */
/* Known Shopify apps by script hostname                               */
/* ------------------------------------------------------------------ */

/**
 * App-script hostname → display name. App bloat is the single biggest Shopify
 * performance problem, and matching the injectors by hostname is how we name
 * names. Unmatched third-party hosts are still counted and stored.
 */
const KNOWN_APP_HOSTS: Array<[RegExp, string]> = [
  [/judge\.me/i, "Judge.me"],
  [/yotpo\.com/i, "Yotpo"],
  [/klaviyo\.com/i, "Klaviyo"],
  [/gorgias\.(chat|io)/i, "Gorgias"],
  [/loox\.(io|app)/i, "Loox"],
  [/rebuyengine\.com/i, "Rebuy"],
  [/privy\.com/i, "Privy"],
  [/smile\.io/i, "Smile.io"],
  [/rechargecdn\.com|rechargeapps\.com/i, "Recharge"],
  [/okendo\.io/i, "Okendo"],
  [/tidio\.(co|com)/i, "Tidio"],
  [/stamped\.io/i, "Stamped"],
  [/aftership\.com/i, "AfterShip"],
  [/hulkapps\.com/i, "HulkApps"],
  [/pagefly\.io/i, "PageFly"],
  [/getshogun\.com|shogun\.com/i, "Shogun"],
  [/gempages\.net/i, "GemPages"],
  [/vitals\.co|v\.vitals\.app/i, "Vitals"],
  [/trustpilot\.com/i, "Trustpilot"],
  [/bazaarvoice\.com/i, "Bazaarvoice"],
  [/omnisend\.com/i, "Omnisend"],
  [/postscript\.io/i, "Postscript"],
  [/attn\.tv|attentivemobile\.com/i, "Attentive"],
  [/refersion\.com/i, "Refersion"],
  [/boldapps\.net|boldcommerce\.com/i, "Bold"],
  [/backinstock\.org/i, "Back in Stock"],
  [/hextom\.com/i, "Hextom"],
  [/nosto\.com/i, "Nosto"],
  [/searchanise\.com/i, "Searchanise"],
  [/algolia(net)?\.com/i, "Algolia"],
  [/wisepops\.com/i, "Wisepops"],
  [/justuno\.com/i, "Justuno"],
  [/zendesk\.com|zdassets\.com/i, "Zendesk"],
  [/intercom(cdn)?\.io|intercom\.com/i, "Intercom"],
  [/onesignal\.com/i, "OneSignal"],
  [/pushowl\.com/i, "PushOwl"],
  [/globo\.io/i, "Globo"],
  [/weglot\.com/i, "Weglot"],
  [/langify/i, "Langify"],
  [/tryon\.kiwisizing\.com|kiwisizing\.com/i, "Kiwi Sizing"],
  [/shoppay|shop\.app/i, "Shop App"],
];

/** Hosts that are infrastructure, not apps — never counted as app scripts. */
const INFRA_HOSTS =
  /shopify\.com|shopifycdn\.com|shopifycloud\.com|shopifysvc\.com|googletagmanager\.com|google-analytics\.com|googleapis\.com|gstatic\.com|facebook\.net|fbcdn\.net|cloudflare(insights)?\.com|jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com|newrelic\.com|nr-data\.net|sentry(-cdn)?\.io/i;

/** Official Shopify theme names (free themes from the official library). */
const OFFICIAL_THEMES = new Set([
  "dawn", "debut", "brooklyn", "minimal", "narrative", "supply", "venture",
  "boundless", "simple", "express", "colorblock", "craft", "crave", "origin",
  "publisher", "refresh", "ride", "sense", "spotlight", "studio", "taste",
  "trade",
]);

/** Popular third-party themes we recognise by name. */
const RECOGNISED_THIRD_PARTY = new Set([
  "impulse", "prestige", "turbo", "motion", "warehouse", "empire", "streamline",
  "expanse", "broadcast", "flex", "symmetry", "pipeline", "district", "showtime",
]);

/* ------------------------------------------------------------------ */
/* Detection                                                           */
/* ------------------------------------------------------------------ */

const UNKNOWN_SITE: SiteInfo = {
  platform: "UNKNOWN",
  platformConfidence: 0,
  isShopify: false,
  plusLikelihood: "unknown",
  themeName: null,
  themeId: null,
  isOfficialTheme: false,
  appCount: 0,
  appNames: [],
  appScriptHosts: [],
  blockingAppScripts: 0,
};

export function detectPlatform(input: DetectInput): SiteInfo {
  try {
    return detect(input);
  } catch (err) {
    // Detection must never fail an audit.
    console.warn(
      "[detect-platform] failed, continuing as UNKNOWN:",
      err instanceof Error ? err.message : err,
    );
    return { ...UNKNOWN_SITE };
  }
}

function detect(input: DetectInput): SiteInfo {
  const { html, sitemapChildren } = input;
  const headers = lowercaseKeys(input.responseHeaders);
  const $ = cheerio.load(html);

  /* ---- signal collection per platform (weighted) ---- */
  const scores = new Map<SiteInfo["platform"], number>();
  const bump = (platform: SiteInfo["platform"], weight: number) =>
    scores.set(platform, (scores.get(platform) ?? 0) + weight);

  // Shopify
  if (headers["x-shopid"] || headers["x-shopify-stage"]) bump("SHOPIFY", 3);
  if (/cdn\.shopify\.com|\/cdn\/shop\//i.test(html)) bump("SHOPIFY", 3);
  if (/window\.Shopify|Shopify\.shop\s*=/.test(html)) bump("SHOPIFY", 3);
  if ($('meta[name="shopify-checkout-api-token"]').length > 0) bump("SHOPIFY", 3);
  const shopifySitemapChildren = sitemapChildren.filter((c) =>
    /^sitemap_(products|collections|pages|blogs)_\d+\.xml$/i.test(c),
  );
  if (shopifySitemapChildren.length > 0) bump("SHOPIFY", 2);

  // Hydrogen = Shopify backend + Remix front-end (or Oxygen hosting headers)
  const hasRemix = /window\.__remixContext|__remixManifest/.test(html);
  const hasOxygen = Object.keys(headers).some((h) => h.startsWith("oxygen-"));
  const shopifyScore = scores.get("SHOPIFY") ?? 0;
  if ((hasRemix || hasOxygen) && shopifyScore >= 2) bump("HYDROGEN", shopifyScore + 2);

  // WordPress / WooCommerce
  const wpGenerator = /<meta[^>]+name=["']generator["'][^>]+WordPress/i.test(html);
  if (/\/wp-content\/|\/wp-includes\//i.test(html)) bump("WORDPRESS", 3);
  if (wpGenerator) bump("WORDPRESS", 3);
  if (sitemapChildren.some((c) => /^wp-sitemap/i.test(c)) || /wp-sitemap\.xml/i.test(input.robotsContent ?? "")) {
    bump("WORDPRESS", 2);
  }
  if (/yoast|rank\s?math|rankmath/i.test(html)) bump("WORDPRESS", 1);
  // WooCommerce needs a STRUCTURAL signal (body class, plugin asset path,
  // AJAX endpoint) — the bare word "woocommerce" appears in article text on
  // news sites and would false-positive.
  const wpScore = scores.get("WORDPRESS") ?? 0;
  const wooStructural =
    /\bwoocommerce\b/i.test($("body").attr("class") ?? "") ||
    /\/wc-ajax\/|wp-content\/plugins\/woocommerce\//i.test(html);
  if (wpScore > 0 && wooStructural) {
    bump("WOOCOMMERCE", wpScore + 1);
  }

  // Webflow / Wix / Squarespace
  if (
    /<meta[^>]+generator[^>]+Webflow/i.test(html) ||
    /assets(-global)?\.website-files\.com|uploads-ssl\.webflow\.com|data-wf-(page|site)=/i.test(html)
  ) {
    bump("WEBFLOW", 4);
  }
  if (/<meta[^>]+generator[^>]+Wix\.com/i.test(html) || /static\.wixstatic\.com/i.test(html)) bump("WIX", 4);
  if (/Static\.SQUARESPACE_CONTEXT/.test(html) || /squarespace-cdn\.com/i.test(html)) bump("SQUARESPACE", 4);

  // Next.js only counts when it is NOT a Shopify storefront.
  // Pages Router: __NEXT_DATA__ / #__next. App Router: self.__next_f flight data.
  if (/__NEXT_DATA__|id="__next"|self\.__next_f/.test(html) && shopifyScore === 0) bump("NEXTJS", 3);

  /* ---- pick the winner ---- */
  let platform: SiteInfo["platform"] = "UNKNOWN";
  let best = 0;
  for (const [candidate, score] of scores) {
    if (score > best) {
      best = score;
      platform = candidate;
    }
  }
  // Specialisations beat their generic parents on ties.
  if (platform === "SHOPIFY" && (scores.get("HYDROGEN") ?? 0) >= best) platform = "HYDROGEN";
  if (platform === "WORDPRESS" && (scores.get("WOOCOMMERCE") ?? 0) >= best) platform = "WOOCOMMERCE";

  // Confidence: 3+ independent signal points ≈ certain; scale below that.
  const platformConfidence = best === 0 ? 0 : Math.min(1, Math.round((best / 6) * 100) / 100 + 0.4);
  const isShopify = platform === "SHOPIFY" || platform === "HYDROGEN";

  /* ---- theme (Shopify.theme global) ---- */
  let themeName: string | null = null;
  let themeId: string | null = null;
  if (isShopify) {
    const themeMatch =
      html.match(/Shopify\.theme\s*=\s*({[^}]+})/) ??
      html.match(/"theme":\s*({\s*"name"[^}]+})/);
    if (themeMatch) {
      const blob = themeMatch[1]!;
      themeName = blob.match(/["']?name["']?\s*:\s*["']([^"']+)["']/)?.[1] ?? null;
      themeId = blob.match(/["']?id["']?\s*:\s*["']?(\d+)/)?.[1] ?? null;
    }
  }
  const themeBase = themeName?.toLowerCase().split(/[\s|/–—-]/)[0] ?? "";
  const isOfficialTheme = OFFICIAL_THEMES.has(themeBase);
  if (themeName && !isOfficialTheme && RECOGNISED_THIRD_PARTY.has(themeBase)) {
    // recognised third-party — kept as-is; the flag below stays false
  }

  /* ---- app scripts (Shopify's real performance story) ---- */
  const appHosts = new Map<string, { blocking: number }>();
  const appNames = new Set<string>();
  let blockingAppScripts = 0;

  if (isShopify) {
    $("script[src]").each((_, el) => {
      const src = $(el).attr("src") ?? "";
      let host: string;
      try {
        host = new URL(src, "https://placeholder.invalid").hostname;
      } catch {
        return;
      }
      if (!host || host === "placeholder.invalid") return; // relative = first-party/theme
      if (INFRA_HOSTS.test(host)) return;

      const isBlocking = !$(el).attr("async") && !$(el).attr("defer") && $(el).attr("type") !== "module";
      const entry = appHosts.get(host) ?? { blocking: 0 };
      if (isBlocking) {
        entry.blocking += 1;
        blockingAppScripts += 1;
      }
      appHosts.set(host, entry);

      for (const [pattern, name] of KNOWN_APP_HOSTS) {
        if (pattern.test(host)) {
          appNames.add(name);
          break;
        }
      }
    });
  }

  /* ---- Plus: never asserted, only "possible" on weak artefacts ---- */
  const plusLikelihood: SiteInfo["plusLikelihood"] =
    isShopify && /checkout\.liquid|Shopify\.Checkout/i.test(html) ? "possible" : "unknown";

  return {
    platform,
    platformConfidence,
    isShopify,
    plusLikelihood,
    themeName,
    themeId,
    isOfficialTheme,
    appCount: appHosts.size,
    appNames: [...appNames].sort(),
    appScriptHosts: [...appHosts.keys()].slice(0, 40),
    blockingAppScripts,
  };
}

function lowercaseKeys(record: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(record ?? {})) out[k.toLowerCase()] = v;
  return out;
}
