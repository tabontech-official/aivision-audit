import "server-only";
import { isBlockedIp } from "@/lib/security/ssrf";
import { AUDIT_USER_AGENT } from "./fetcher";

/**
 * Headless-browser rendering via Playwright.
 *
 * Connection strategy:
 *  - BROWSER_WS_ENDPOINT set (Browserless.io or self-hosted): connect over
 *    CDP websocket — the required production path on Vercel.
 *  - Otherwise (local dev): launch a local Chromium if a full `playwright`
 *    install exists; playwright-core alone cannot launch, so rendering is
 *    skipped gracefully.
 *
 * Rendering is OPTIONAL-FAIL by design: an audit must still complete without
 * a browser (static HTML + PSI cover most checks). Callers receive null and
 * mark rendered-only data as unavailable.
 *
 * SSRF: requests are routed through route-interception; any request whose
 * hostname is a raw non-public IP is aborted. (Hostname-based private targets
 * are already excluded by the pre-fetch DNS check on the main document; the
 * interceptor is defense-in-depth for subresources.)
 */

const RENDER_TIMEOUT_MS = 25_000;

export type RenderedPage = {
  html: string;
  screenshotJpegBase64: string | null;
};

type MinimalBrowser = {
  newContext: (opts: Record<string, unknown>) => Promise<MinimalContext>;
  close: () => Promise<void>;
};
type MinimalContext = {
  newPage: () => Promise<MinimalPage>;
  route: (glob: string, handler: (route: MinimalRoute) => void) => Promise<void>;
};
type MinimalRoute = {
  request: () => { url: () => string };
  abort: () => Promise<void>;
  continue: () => Promise<void>;
};
type MinimalPage = {
  goto: (url: string, opts: Record<string, unknown>) => Promise<unknown>;
  content: () => Promise<string>;
  screenshot: (opts: Record<string, unknown>) => Promise<Buffer>;
  waitForTimeout: (ms: number) => Promise<void>;
};

async function connectBrowser(): Promise<MinimalBrowser | null> {
  const wsEndpoint = process.env.BROWSER_WS_ENDPOINT;
  try {
    if (wsEndpoint) {
      const { chromium } = await import("playwright-core");
      return (await chromium.connectOverCDP(wsEndpoint, {
        timeout: 15_000,
      })) as unknown as MinimalBrowser;
    }
    // Local dev: try full playwright (optional dependency)
    const pw = await import("playwright-core");
    // launch() requires browser binaries; probe and fail quietly if absent
    return (await pw.chromium.launch({ headless: true })) as unknown as MinimalBrowser;
  } catch (err) {
    console.warn(
      "[renderer] browser unavailable, continuing without rendering:",
      err instanceof Error ? err.message.split("\n")[0] : err,
    );
    return null;
  }
}

/**
 * Render a page and capture HTML + screenshot. Returns null when no browser
 * is available or rendering fails — the audit continues on static HTML.
 */
export async function renderPage(url: string): Promise<RenderedPage | null> {
  const browser = await connectBrowser();
  if (!browser) return null;

  try {
    const context = await browser.newContext({
      userAgent: AUDIT_USER_AGENT,
      viewport: { width: 1366, height: 900 },
      javaScriptEnabled: true,
      ignoreHTTPSErrors: false,
    });

    // Defense-in-depth: abort subresource requests to raw private IPs
    await context.route("**/*", (route) => {
      try {
        const reqUrl = new URL(route.request().url());
        const host = reqUrl.hostname.replace(/^\[|\]$/g, "");
        if (/^[\d.]+$/.test(host) || host.includes(":")) {
          if (isBlockedIp(host)) {
            void route.abort();
            return;
          }
        }
        if (reqUrl.protocol !== "http:" && reqUrl.protocol !== "https:") {
          void route.abort();
          return;
        }
      } catch {
        void route.abort();
        return;
      }
      void route.continue();
    });

    const page = await context.newPage();
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: RENDER_TIMEOUT_MS,
    });
    // Give SPAs a moment to hydrate above-the-fold content
    await page.waitForTimeout(2000);

    const html = await page.content();

    let screenshotJpegBase64: string | null = null;
    try {
      const buf = await page.screenshot({
        type: "jpeg",
        quality: 70,
        clip: { x: 0, y: 0, width: 1366, height: 900 },
      });
      screenshotJpegBase64 = buf.toString("base64");
    } catch {
      /* screenshot is nice-to-have */
    }

    return { html, screenshotJpegBase64 };
  } catch (err) {
    console.warn(
      "[renderer] render failed, continuing without rendering:",
      err instanceof Error ? err.message.split("\n")[0] : err,
    );
    return null;
  } finally {
    await browser.close().catch(() => undefined);
  }
}
