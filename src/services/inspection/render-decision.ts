import "server-only";
import * as cheerio from "cheerio";

/**
 * Pre-render decision (B.10): should this page get a headless-browser render,
 * judged from the STATIC HTML alone — before any browser is launched?
 *
 * Playwright is 200–400 MB per instance and by far the most expensive thing in
 * the pipeline. A server-rendered site (Shopify Liquid, WordPress, static
 * HTML) gains nothing from a render, so the decision must happen before the
 * cost is paid, not after.
 *
 * Scored, not a single rule: each signal contributes weighted points toward
 * "this is a client-rendered shell". Score >= threshold → render. The
 * threshold ships from the B.10.1 study (docs/RENDER-STUDY.md) and is
 * overridable via RENDER_DECISION_THRESHOLD without a deploy.
 *
 * The safety valve lives in run-audit, not here: if static extraction turns
 * out suspiciously empty (no title, no headings, near-zero words) the pipeline
 * renders regardless of this score — a false negative means a blank report,
 * which is far worse than a wasted render.
 */

/** From the B.10.1 study: shells scored >= 50, server-rendered sites <= 20. */
const DEFAULT_THRESHOLD = 40;

export function renderDecisionThreshold(): number {
  const raw = Number(process.env.RENDER_DECISION_THRESHOLD);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_THRESHOLD;
}

/** Static-HTML predictor signals, recorded for tuning and for the console. */
export type StaticSignals = {
  wordCount: number;
  textToHtmlRatio: number;
  htmlSizeBytes: number;
  scriptCount: number;
  externalScriptCount: number;
  h1Count: number;
  headingCount: number;
  emptyMountPoint: boolean;
  frameworkMarkers: string[];
};

export type RenderDecision = {
  shouldRender: boolean;
  score: number;
  threshold: number;
  /** Every signal that fired, with its weight — a skip must be explainable. */
  reasons: string[];
  signals: StaticSignals;
};

/** Markers that identify the rendering stack from raw HTML. Recorded always;
 *  only *some* of them imply a client-side shell (see scoring below). */
const MARKER_PATTERNS: Array<[string, RegExp]> = [
  ["next.js", /__NEXT_DATA__|id="__next"/],
  ["nuxt", /window\.__NUXT__|id="__nuxt"/],
  ["angular", /ng-version=/],
  ["react-root", /data-reactroot|id="root"/],
  ["vue-app", /id="app"[^>]*data-v-|data-server-rendered/],
  ["remix/hydrogen", /window\.__remixContext|__remixManifest/],
  ["gatsby", /id="___gatsby"/],
  ["sveltekit", /data-sveltekit/],
  ["shopify", /cdn\.shopify\.com|Shopify\.theme|shopify-section/],
  ["wordpress", /wp-content\/|wp-includes\/|wp-json/],
  ["csr-flag", /data-server-rendered="false"/],
];

const MOUNT_SELECTORS = ["#root", "#app", "#__next", "#___gatsby", "#__nuxt", "[data-reactroot]"];

export function computeStaticSignals(html: string): StaticSignals {
  const $ = cheerio.load(html);

  $("script, style, noscript").remove();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText ? bodyText.split(" ").length : 0;

  // Re-load to count scripts (they were just removed above)
  const $full = cheerio.load(html);
  const scripts = $full("script");
  const externalScriptCount = scripts.filter((_, el) => !!$full(el).attr("src")).length;

  const frameworkMarkers = MARKER_PATTERNS.filter(([, re]) => re.test(html)).map(([name]) => name);

  // A single mount-point element whose subtree carries almost no text is the
  // classic client-rendered shell shape.
  let emptyMountPoint = false;
  for (const selector of MOUNT_SELECTORS) {
    const el = $(selector).first();
    if (el.length && el.text().replace(/\s+/g, " ").trim().length < 120) {
      emptyMountPoint = true;
      break;
    }
  }

  return {
    wordCount,
    textToHtmlRatio: html.length > 0 ? bodyText.length / html.length : 0,
    htmlSizeBytes: Buffer.byteLength(html, "utf8"),
    scriptCount: scripts.length,
    externalScriptCount,
    h1Count: $("h1").length,
    headingCount: $("h1, h2, h3").length,
    emptyMountPoint,
    frameworkMarkers,
  };
}

/** Marker names that indicate a JS framework (vs a server-side platform). */
const JS_FRAMEWORK_MARKERS = new Set([
  "next.js", "nuxt", "angular", "react-root", "vue-app", "remix/hydrogen",
  "gatsby", "sveltekit", "csr-flag",
]);

export function decideRender(html: string): RenderDecision {
  const signals = computeStaticSignals(html);
  const threshold = renderDecisionThreshold();
  const reasons: string[] = [];
  let score = 0;

  const add = (points: number, reason: string) => {
    score += points;
    reasons.push(`${points > 0 ? "+" : ""}${points} ${reason}`);
  };

  const hasJsFramework = signals.frameworkMarkers.some((m) => JS_FRAMEWORK_MARKERS.has(m));
  const hasServerPlatform =
    signals.frameworkMarkers.includes("shopify") || signals.frameworkMarkers.includes("wordpress");

  /* ---- client-shell indicators ---- */
  // The single strongest predictor in the B.10.1 study: a near-empty static
  // body is a shell regardless of which framework produced it — this catches
  // apps whose mount-point id is not on any list (chatgpt.com, claude.ai,
  // open.spotify.com all had 0 static words but unrecognized roots).
  if (signals.wordCount < 30) {
    add(50, `near-empty static body (${signals.wordCount} words)`);
  }
  if (signals.emptyMountPoint && signals.wordCount < 200) {
    add(50, `empty mount point with only ${signals.wordCount} words of static text`);
  }
  if (hasJsFramework && signals.wordCount < 150) {
    add(30, `JS framework markers (${signals.frameworkMarkers.filter((m) => JS_FRAMEWORK_MARKERS.has(m)).join(", ")}) with only ${signals.wordCount} words`);
  }
  if (signals.frameworkMarkers.includes("csr-flag")) {
    add(30, `page declares data-server-rendered="false"`);
  }
  if (signals.wordCount < 100 && signals.externalScriptCount >= 5) {
    add(25, `${signals.wordCount} words but ${signals.externalScriptCount} external scripts`);
  }
  if (signals.textToHtmlRatio < 0.02 && signals.scriptCount >= 10) {
    add(20, `text/HTML ratio ${signals.textToHtmlRatio.toFixed(3)} with ${signals.scriptCount} scripts`);
  }
  if (signals.h1Count === 0 && signals.wordCount < 200) {
    add(20, `no <h1> and only ${signals.wordCount} words`);
  }

  /* ---- server-rendered indicators ---- */
  if (signals.wordCount >= 400 && signals.headingCount >= 3) {
    add(-30, `healthy static content (${signals.wordCount} words, ${signals.headingCount} headings)`);
  }
  if (hasServerPlatform && signals.wordCount >= 200) {
    add(-25, `server platform markers (${signals.frameworkMarkers.filter((m) => !JS_FRAMEWORK_MARKERS.has(m)).join(", ")}) with populated content`);
  }
  if (signals.textToHtmlRatio >= 0.1) {
    add(-10, `strong text/HTML ratio ${signals.textToHtmlRatio.toFixed(3)}`);
  }

  return { shouldRender: score >= threshold, score, threshold, reasons, signals };
}

/**
 * The suspiciously-empty test behind the safety valve: static extraction this
 * hollow means the decision was probably wrong, and a blank report is worse
 * than a wasted render.
 */
export function looksSuspiciouslyEmpty(input: {
  title: string | null | undefined;
  h1Count: number;
  wordCount: number;
}): boolean {
  const noTitle = !input.title || input.title.trim().length === 0;
  return (noTitle && input.h1Count === 0) || input.wordCount < 30;
}

/** What the metrics record and the console call the active browser transport. */
export function browserMode(): "remote" | "local" {
  return process.env.BROWSER_WS_ENDPOINT ? "remote" : "local";
}

/** The queryable per-audit record stored on WebsiteRawData.renderMetrics. */
export type RenderMetrics = {
  decision: {
    score: number;
    threshold: number;
    shouldRender: boolean;
    reasons: string[];
  };
  renderAttempted: boolean;
  renderSucceeded: boolean;
  renderDurationMs: number | null;
  renderBenefited: boolean;
  safetyValveFired: boolean;
  screenshotCaptured: boolean;
  staticWordCount: number;
  renderedWordCount: number | null;
  staticScriptCount: number;
  staticHtmlSizeBytes: number;
  staticTextToHtmlRatio: number;
  detectedFrameworkMarkers: string[];
  browserMode: "remote" | "local";
};
