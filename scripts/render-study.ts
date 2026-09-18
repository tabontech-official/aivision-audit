/**
 * B.10.1 — render-cost study.
 *
 * Fetches a mixed sample of real sites, runs the pre-render decision in
 * SHADOW mode (recorded, not acted on), then renders every page anyway and
 * measures whether the rendered DOM was actually richer (the pipeline's
 * existing >20% HTML-length rule). No Report/Website rows are created; this
 * exercises fetchPage → decideRender → renderPage → extractFromHtml exactly
 * as the pipeline does.
 *
 * Output: JSONL of per-site rows + a threshold sweep, printed and written to
 * docs/RENDER-STUDY.md. The winning threshold becomes RENDER_DECISION_THRESHOLD's
 * default in src/services/inspection/render-decision.ts.
 *
 * Run: npx tsx --conditions=react-server scripts/render-study.ts
 */
import { writeFileSync } from "node:fs";
import { fetchPage } from "../src/services/inspection/fetcher";
import { renderPage } from "../src/services/inspection/renderer";
import { extractFromHtml } from "../src/services/inspection/extract-html";
import { decideRender, computeStaticSignals } from "../src/services/inspection/render-decision";

// Mixed sample: Shopify Liquid, WordPress, SSR frameworks, client-rendered
// SPAs, Hydrogen/Remix storefronts, and classic static sites.
const SITES: Array<{ url: string; expected: string }> = [
  // Shopify Liquid storefronts
  { url: "https://www.allbirds.com", expected: "shopify" },
  { url: "https://bombas.com", expected: "shopify" },
  { url: "https://www.brooklinen.com", expected: "shopify" },
  { url: "https://ruggable.com", expected: "shopify" },
  { url: "https://mejuri.com", expected: "shopify" },
  { url: "https://colourpop.com", expected: "shopify" },
  { url: "https://www.fashionnova.com", expected: "shopify" },
  { url: "https://www.deathwishcoffee.com", expected: "shopify" },
  { url: "https://chubbiesshorts.com", expected: "shopify" },
  { url: "https://kyliecosmetics.com", expected: "shopify" },
  // WordPress
  { url: "https://techcrunch.com", expected: "wordpress" },
  { url: "https://wordpress.org", expected: "wordpress" },
  { url: "https://css-tricks.com", expected: "wordpress" },
  { url: "https://variety.com", expected: "wordpress" },
  { url: "https://www.rollingstone.com", expected: "wordpress" },
  { url: "https://www.tmz.com", expected: "wordpress" },
  { url: "https://time.com", expected: "wordpress" },
  { url: "https://wptavern.com", expected: "wordpress" },
  { url: "https://www.smashingmagazine.com", expected: "static-ish" },
  { url: "https://kinsta.com", expected: "wordpress" },
  // SSR frameworks (server-rendered React/Vue — should NOT need a render)
  { url: "https://nextjs.org", expected: "ssr-framework" },
  { url: "https://vercel.com", expected: "ssr-framework" },
  { url: "https://react.dev", expected: "ssr-framework" },
  { url: "https://tailwindcss.com", expected: "ssr-framework" },
  { url: "https://stripe.com", expected: "ssr-framework" },
  { url: "https://www.netlify.com", expected: "ssr-framework" },
  { url: "https://astro.build", expected: "ssr-framework" },
  { url: "https://remix.run", expected: "ssr-framework" },
  { url: "https://nuxt.com", expected: "ssr-framework" },
  { url: "https://svelte.dev", expected: "ssr-framework" },
  // Client-rendered SPAs (SHOULD need a render)
  { url: "https://linear.app", expected: "spa" },
  { url: "https://www.figma.com", expected: "spa" },
  { url: "https://www.notion.so", expected: "spa" },
  { url: "https://open.spotify.com", expected: "spa" },
  { url: "https://www.twitch.tv", expected: "spa" },
  { url: "https://discord.com", expected: "spa" },
  { url: "https://www.canva.com", expected: "spa" },
  { url: "https://miro.com", expected: "spa" },
  { url: "https://claude.ai", expected: "spa" },
  { url: "https://chatgpt.com", expected: "spa" },
  // Hydrogen / Remix storefronts
  { url: "https://hydrogen.shop", expected: "hydrogen" },
  { url: "https://www.gymshark.com", expected: "hydrogen" },
  { url: "https://skims.com", expected: "hydrogen" },
  // Classic static / server-rendered
  { url: "https://example.com", expected: "static" },
  { url: "https://en.wikipedia.org/wiki/Web_browser", expected: "static" },
  { url: "https://news.ycombinator.com", expected: "static" },
  { url: "https://sqlite.org", expected: "static" },
  { url: "https://www.gnu.org", expected: "static" },
  { url: "https://www.kernel.org", expected: "static" },
  { url: "https://htmx.org", expected: "static" },
  { url: "https://developer.mozilla.org", expected: "static" },
  { url: "https://www.php.net", expected: "static" },
  { url: "https://www.postgresql.org", expected: "static" },
  { url: "https://caniuse.com", expected: "static" },
  { url: "https://lite.duckduckgo.com/lite", expected: "static" },
];

type Row = {
  url: string;
  expected: string;
  fetchOk: boolean;
  httpStatus: number | null;
  decisionScore: number | null;
  wouldRender: boolean | null;
  reasons: string[];
  staticWordCount: number | null;
  renderedWordCount: number | null;
  staticHtmlBytes: number | null;
  renderedHtmlBytes: number | null;
  staticScriptCount: number | null;
  staticExternalScriptCount: number | null;
  staticTextToHtmlRatio: number | null;
  markers: string[];
  renderAttempted: boolean;
  renderSucceeded: boolean;
  renderDurationMs: number | null;
  renderBenefited: boolean | null;
  error: string | null;
};

async function studyOne(site: { url: string; expected: string }): Promise<Row> {
  const row: Row = {
    url: site.url, expected: site.expected, fetchOk: false, httpStatus: null,
    decisionScore: null, wouldRender: null, reasons: [], staticWordCount: null,
    renderedWordCount: null, staticHtmlBytes: null, renderedHtmlBytes: null,
    staticScriptCount: null, staticExternalScriptCount: null,
    staticTextToHtmlRatio: null, markers: [], renderAttempted: false,
    renderSucceeded: false, renderDurationMs: null, renderBenefited: null, error: null,
  };

  try {
    const fetched = await fetchPage(site.url);
    if (!fetched.ok) {
      row.error = `fetch: ${fetched.error}`;
      return row;
    }
    row.fetchOk = true;
    row.httpStatus = fetched.page.httpStatus;

    const decision = decideRender(fetched.page.html);
    row.decisionScore = decision.score;
    row.wouldRender = decision.shouldRender;
    row.reasons = decision.reasons;
    row.staticWordCount = decision.signals.wordCount;
    row.staticHtmlBytes = decision.signals.htmlSizeBytes;
    row.staticScriptCount = decision.signals.scriptCount;
    row.staticExternalScriptCount = decision.signals.externalScriptCount;
    row.staticTextToHtmlRatio = Math.round(decision.signals.textToHtmlRatio * 1000) / 1000;
    row.markers = decision.signals.frameworkMarkers;

    // Render unconditionally — that is the point of the study.
    row.renderAttempted = true;
    const t0 = Date.now();
    const rendered = await renderPage(fetched.page.finalUrl);
    row.renderDurationMs = Date.now() - t0;
    row.renderSucceeded = rendered !== null;

    if (rendered) {
      row.renderedHtmlBytes = Buffer.byteLength(rendered.html, "utf8");
      row.renderedWordCount = computeStaticSignals(rendered.html).wordCount;
      // The pipeline's existing selection rule, unchanged:
      row.renderBenefited = rendered.html.length > fetched.page.html.length * 1.2;
      // Sanity: run the real extractor over both to keep the path honest.
      extractFromHtml(fetched.page);
      extractFromHtml({ ...fetched.page, html: rendered.html });
    }
  } catch (err) {
    row.error = err instanceof Error ? err.message.slice(0, 200) : String(err);
  }
  return row;
}

function pct(n: number, d: number): string {
  return d > 0 ? `${Math.round((n / d) * 100)}%` : "n/a";
}

function p95(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]!;
}

async function main() {
  const rows: Row[] = [];
  const queue = [...SITES];
  const CONCURRENCY = 4;

  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (;;) {
        const site = queue.shift();
        if (!site) return;
        const row = await studyOne(site);
        rows.push(row);
        console.log(
          `${row.url.padEnd(46)} ${String(row.decisionScore ?? "-").padStart(4)} ` +
          `wouldRender=${String(row.wouldRender ?? "-").padEnd(5)} benefited=${String(row.renderBenefited ?? "-").padEnd(5)} ` +
          `${row.renderDurationMs ?? "-"}ms ${row.error ? "ERR " + row.error : ""}`,
        );
      }
    }),
  );

  const ok = rows.filter((r) => r.fetchOk);
  const rendered = ok.filter((r) => r.renderSucceeded);
  const benefited = rendered.filter((r) => r.renderBenefited);
  const durations = rendered.map((r) => r.renderDurationMs!).filter((d) => d != null);
  const mean = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  /* Threshold sweep over the shadow scores. */
  const sweep = [20, 30, 40, 50, 60].map((threshold) => {
    const skipped = rendered.filter((r) => (r.decisionScore ?? 0) < threshold);
    const renderedByRule = rendered.filter((r) => (r.decisionScore ?? 0) >= threshold);
    const falseNegatives = skipped.filter((r) => r.renderBenefited); // benefited but would have been skipped
    const falsePositives = renderedByRule.filter((r) => !r.renderBenefited); // rendered for nothing
    return {
      threshold,
      skipRate: pct(skipped.length, rendered.length),
      falseNegatives: falseNegatives.map((r) => r.url),
      falsePositives: falsePositives.length,
    };
  });

  const summary = [
    `# Render-cost study (B.10.1)`,
    ``,
    `> Generated by \`scripts/render-study.ts\` on ${new Date().toISOString().slice(0, 10)} — ${SITES.length} sites sampled`,
    `> across Shopify Liquid, WordPress, SSR frameworks, client-rendered SPAs, Hydrogen/Remix and classic static.`,
    ``,
    `## Headline numbers (current behaviour: render everything)`,
    ``,
    `| Metric | Value |`,
    `|---|---|`,
    `| Sites fetched OK | ${ok.length} / ${rows.length} |`,
    `| Renders attempted | ${ok.length} (100% — unconditional today) |`,
    `| Renders succeeded | ${rendered.length} (${pct(rendered.length, ok.length)}) |`,
    `| Renders that BENEFITED (>20% richer DOM) | ${benefited.length} (${pct(benefited.length, rendered.length)} of successful renders) |`,
    `| Mean render duration | ${mean} ms |`,
    `| p95 render duration | ${p95(durations)} ms |`,
    ``,
    `**${pct(rendered.length - benefited.length, rendered.length)} of successful renders were pure waste** — the browser`,
    `launched, waited, and its output was thrown away by the existing >20% rule.`,
    ``,
    `## Threshold sweep (shadow decision vs actual benefit)`,
    ``,
    `| Threshold | Skip rate | Wasted renders remaining | Benefited-but-skipped (false negatives) |`,
    `|---|---|---|---|`,
    ...sweep.map((s) =>
      `| ${s.threshold} | ${s.skipRate} | ${s.falsePositives} | ${s.falseNegatives.length ? s.falseNegatives.join(", ") : "none"} |`,
    ),
    ``,
    `## Per-site data`,
    ``,
    `| Site | Expected | Score | Would render | Benefited | Static words | Rendered words | Render ms | Markers |`,
    `|---|---|---|---|---|---|---|---|---|`,
    ...rows.map((r) =>
      `| ${r.url.replace("https://", "")} | ${r.expected} | ${r.decisionScore ?? "—"} | ${r.wouldRender ?? "—"} | ${r.renderBenefited ?? "—"} | ${r.staticWordCount ?? "—"} | ${r.renderedWordCount ?? "—"} | ${r.renderDurationMs ?? "—"} | ${r.markers.join(", ") || "—"}${r.error ? ` (ERR: ${r.error.slice(0, 60)})` : ""} |`,
    ),
    ``,
  ].join("\n");

  writeFileSync("docs/RENDER-STUDY.md", summary + "\n");
  writeFileSync("docs/render-study-rows.jsonl", rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
  console.log("\n" + summary.split("## Per-site data")[0]);
  console.log("Written: docs/RENDER-STUDY.md (+ raw rows in docs/render-study-rows.jsonl)");
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
