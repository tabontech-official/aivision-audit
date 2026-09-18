/**
 * Gate for the master-admin developer tools (`/master-admin/dev`).
 *
 * The page traces the audit pipeline in real time and can force-fail or re-run
 * reports, so it is a development instrument, not an operator surface: it is on
 * outside production and must be switched on deliberately in production with
 * DEV_TOOLS_ENABLED=true. MASTER_ADMIN is still required either way.
 */
export function isDevToolsEnabled(): boolean {
  if (process.env.DEV_TOOLS_ENABLED === "true") return true;
  if (process.env.DEV_TOOLS_ENABLED === "false") return false;
  return process.env.NODE_ENV !== "production";
}

/** The pipeline, in the order runAudit() walks it. Used for the stage timeline. */
export const PIPELINE_STAGES = [
  { stage: "CONNECTING", percent: 5, label: "Connecting", detail: "Re-validate the URL and re-run the SSRF host check" },
  { stage: "FETCHING_HTML", percent: 12, label: "Fetching HTML", detail: "Download the page — status, headers, redirect chain, raw HTML" },
  { stage: "RENDERING", percent: 22, label: "Rendering", detail: "Render decision from static HTML → headless render + screenshot only when warranted (skips are logged with reasons; allowed to fail)" },
  { stage: "INSPECTING_METADATA", percent: 32, label: "Inspecting metadata", detail: "Extract title, meta, headings, links, images, trust signals" },
  { stage: "CHECKING_SEO", percent: 42, label: "Checking SEO", detail: "robots.txt, sitemap, broken links — then persist the raw-data checkpoint" },
  { stage: "CHECKING_SPEED", percent: 55, label: "Checking speed", detail: "PageSpeed Insights, mobile and desktop" },
  { stage: "REVIEWING_ACCESSIBILITY", percent: 68, label: "Reviewing accessibility", detail: "Progress-only stage — no work runs here" },
  { stage: "ANALYZING_MOBILE", percent: 76, label: "Analyzing mobile", detail: "Progress-only stage — no work runs here" },
  { stage: "CHECKING_CONVERSION", percent: 82, label: "Checking conversion", detail: "Progress-only stage — no work runs here" },
  { stage: "PREPARING_RECOMMENDATIONS", percent: 90, label: "Preparing recommendations", detail: "Progress-only stage — no work runs here" },
  { stage: "GENERATING_REPORT", percent: 96, label: "Generating report", detail: "Evaluate every criterion, score sections, write the snapshot" },
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number]["stage"];
