import "server-only";
import { lookup as dnsLookup } from "node:dns";
import { brotliDecompressSync, gunzipSync, inflateSync } from "node:zlib";
import { Agent, request } from "undici";
import { isBlockedIp } from "@/lib/security/ssrf";
import { validateAndNormalizeUrl } from "@/lib/security/url";

/**
 * SSRF-hardened HTTP fetcher for audit targets.
 *
 * Protections:
 *  - Custom DNS lookup validates EVERY resolved IP before undici connects,
 *    and the connection uses that same resolution (defeats DNS rebinding —
 *    there is no separate "check then fetch" race).
 *  - Redirects are followed manually (max 5); each hop re-runs URL syntax
 *    validation and connects through the same validating agent.
 *  - Response body capped at 10 MB; total time capped at 15 s.
 *  - Only http/https; standard ports enforced by url.ts on every hop.
 */

const MAX_REDIRECTS = 5;
const MAX_BODY_BYTES = 10 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 15_000;

export const AUDIT_USER_AGENT =
  "Mozilla/5.0 (compatible; AIVisionAuditBot/1.0; +https://aivisionaudit.com/bot)";

/**
 * undici Agent whose DNS lookup rejects non-public IPs at connect time.
 * Honors Node's dns.lookup contract: when the caller passes options.all,
 * the callback must receive the address ARRAY; otherwise a single address.
 */
function makeGuardedAgent(): Agent {
  const guardedLookup: typeof dnsLookup = ((
    hostname: string,
    optionsOrCb: unknown,
    maybeCb?: unknown,
  ) => {
    const options =
      typeof optionsOrCb === "object" && optionsOrCb !== null
        ? (optionsOrCb as { all?: boolean; family?: number })
        : {};
    const callback = (
      typeof optionsOrCb === "function" ? optionsOrCb : maybeCb
    ) as (err: NodeJS.ErrnoException | null, address?: unknown, family?: number) => void;

    dnsLookup(hostname, { family: options.family ?? 0, all: true }, (err, addresses) => {
      if (err) return callback(err);
      const list = Array.isArray(addresses)
        ? addresses
        : [{ address: addresses as unknown as string, family: 4 }];

      if (list.length === 0) {
        return callback(
          Object.assign(new Error(`ENOTFOUND ${hostname}`), { code: "ENOTFOUND" }),
        );
      }
      for (const a of list) {
        if (isBlockedIp(a.address)) {
          return callback(
            Object.assign(new Error("BLOCKED_IP"), { code: "EBLOCKED" }),
          );
        }
      }
      if (options.all) {
        callback(null, list);
      } else {
        const first = list[0]!;
        callback(null, first.address, first.family);
      }
    });
  }) as typeof dnsLookup;

  return new Agent({
    connect: {
      timeout: 10_000,
      lookup: guardedLookup,
    },
  });
}

export type FetchedPage = {
  finalUrl: string;
  httpStatus: number;
  redirectChain: string[];
  responseHeaders: Record<string, string>;
  html: string;
  htmlSizeBytes: number;
  fetchDurationMs: number;
  usedHttps: boolean;
};

export type FetchResult =
  | { ok: true; page: FetchedPage }
  | { ok: false; error: string; userMessage: string };

function headersToRecord(raw: Record<string, string | string[] | undefined>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === undefined) continue;
    out[k.toLowerCase()] = Array.isArray(v) ? v.join(", ") : v;
  }
  return out;
}

/**
 * Read a (possibly compressed) response body with a size cap, then decompress
 * according to Content-Encoding. undici does NOT auto-decompress, so this is
 * mandatory — without it, gzip/brotli sites would yield binary garbage.
 * The cap applies to the compressed stream; decompressed output is separately
 * capped at 4× the limit to bound decompression bombs.
 */
function decompressBody(buf: Buffer, contentEncoding: string | undefined): Buffer {
  const encodings = (contentEncoding ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .reverse(); // decode outermost first

  let out = buf;
  for (const enc of encodings) {
    try {
      if (enc === "gzip" || enc === "x-gzip") out = gunzipSync(out);
      else if (enc === "br") out = brotliDecompressSync(out);
      else if (enc === "deflate") out = inflateSync(out);
      else if (enc === "identity") continue;
      else return out; // unknown encoding — return as-is
    } catch {
      return out; // truncated/corrupt stream — best effort with what we have
    }
  }
  return out;
}

async function readBodyCapped(
  body: AsyncIterable<Buffer>,
  cap: number,
  contentEncoding?: string,
): Promise<{ text: string; bytes: number }> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of body) {
    total += chunk.length;
    if (total > cap) {
      // Stop reading; keep what we have (partial HTML is still auditable)
      chunks.push(chunk.subarray(0, chunk.length - (total - cap)));
      total = cap;
      break;
    }
    chunks.push(chunk);
  }
  let combined: Buffer = Buffer.concat(chunks);
  combined = decompressBody(combined, contentEncoding);
  const maxDecompressed = cap * 4;
  if (combined.length > maxDecompressed) {
    combined = combined.subarray(0, maxDecompressed);
  }
  return { text: combined.toString("utf-8"), bytes: combined.length };
}

/**
 * Fetch a page with full SSRF guarding. Tries the normalized https URL;
 * if the TLS/connection fails at the first hop, falls back to http (recorded
 * via usedHttps so the SSL check can fail accordingly).
 */
export async function fetchPage(startUrl: string): Promise<FetchResult> {
  const agent = makeGuardedAgent();
  const startedAt = Date.now();
  const deadline = startedAt + FETCH_TIMEOUT_MS;

  const attempt = async (initialUrl: string): Promise<FetchResult> => {
    let currentUrl = initialUrl;
    const redirectChain: string[] = [];

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        return {
          ok: false,
          error: "TIMEOUT",
          userMessage: "The website took too long to respond.",
        };
      }

      let res;
      try {
        // undici does not follow redirects by default — we follow manually
        res = await request(currentUrl, {
          method: "GET",
          dispatcher: agent,
          headersTimeout: Math.min(remaining, 10_000),
          bodyTimeout: Math.min(remaining, 10_000),
          headers: {
            "user-agent": AUDIT_USER_AGENT,
            accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "accept-language": "en-US,en;q=0.9",
            "accept-encoding": "gzip, deflate, br",
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("BLOCKED_IP") || (err as { code?: string })?.code === "EBLOCKED") {
          return {
            ok: false,
            error: "SSRF_BLOCKED",
            userMessage: "This address cannot be audited.",
          };
        }
        return {
          ok: false,
          error: `CONNECT_FAILED:${msg.slice(0, 120)}`,
          userMessage: "We couldn't connect to this website.",
        };
      }

      const status = res.statusCode;
      const headers = headersToRecord(res.headers as Record<string, string | string[] | undefined>);

      // Redirect?
      if (status >= 300 && status < 400 && headers.location) {
        // Drain the body so the connection can be reused
        await res.body.dump().catch(() => undefined);

        if (hop === MAX_REDIRECTS) {
          return {
            ok: false,
            error: "TOO_MANY_REDIRECTS",
            userMessage: "The website redirected too many times.",
          };
        }

        let nextUrl: string;
        try {
          nextUrl = new URL(headers.location, currentUrl).toString();
        } catch {
          return {
            ok: false,
            error: "BAD_REDIRECT",
            userMessage: "The website returned an invalid redirect.",
          };
        }

        // Re-validate the redirect target's syntax/hostname rules.
        // Preserve the actual scheme the site redirected to (http allowed here;
        // the guarded agent still blocks private IPs at connect time).
        const validated = validateAndNormalizeUrl(nextUrl);
        if (!validated.ok) {
          return {
            ok: false,
            error: "REDIRECT_BLOCKED",
            userMessage: "The website redirected to an address that cannot be audited.",
          };
        }
        const parsedNext = new URL(nextUrl);
        redirectChain.push(currentUrl);
        currentUrl =
          parsedNext.protocol === "http:"
            ? validated.value.url.replace(/^https:/, "http:")
            : validated.value.url;
        continue;
      }

      // Terminal response — read body (HTML or not; extractors handle both)
      const { text, bytes } = await readBodyCapped(
        res.body as AsyncIterable<Buffer>,
        MAX_BODY_BYTES,
        headers["content-encoding"],
      );

      return {
        ok: true,
        page: {
          finalUrl: currentUrl,
          httpStatus: status,
          redirectChain,
          responseHeaders: headers,
          html: text,
          htmlSizeBytes: bytes,
          fetchDurationMs: Date.now() - startedAt,
          usedHttps: currentUrl.startsWith("https:"),
        },
      };
    }

    return {
      ok: false,
      error: "TOO_MANY_REDIRECTS",
      userMessage: "The website redirected too many times.",
    };
  };

  // Primary https attempt; single http fallback if the very first connection fails
  const primary = await attempt(startUrl);
  if (
    !primary.ok &&
    primary.error.startsWith("CONNECT_FAILED") &&
    startUrl.startsWith("https:")
  ) {
    const httpUrl = startUrl.replace(/^https:/, "http:");
    const fallback = await attempt(httpUrl);
    if (fallback.ok) return fallback;
  }
  return primary;
}

/**
 * Lightweight guarded fetch for aux resources (robots.txt, sitemap, link checks).
 * Follows up to 3 redirects, caps body at 1 MB, 8 s timeout.
 */
export async function fetchResource(
  url: string,
  opts: { method?: "GET" | "HEAD"; maxBytes?: number; timeoutMs?: number } = {},
): Promise<{ status: number | null; body: string | null; headers: Record<string, string> }> {
  const { method = "GET", maxBytes = 1024 * 1024, timeoutMs = 8_000 } = opts;
  const agent = makeGuardedAgent();
  let currentUrl = url;

  try {
    for (let hop = 0; hop < 4; hop++) {
      const res = await request(currentUrl, {
        method,
        dispatcher: agent,
        headersTimeout: timeoutMs,
        bodyTimeout: timeoutMs,
        headers: { "user-agent": AUDIT_USER_AGENT },
      });
      const headers = headersToRecord(res.headers as Record<string, string | string[] | undefined>);

      if (res.statusCode >= 300 && res.statusCode < 400 && headers.location && hop < 3) {
        await res.body.dump().catch(() => undefined);
        const next = new URL(headers.location, currentUrl).toString();
        const validated = validateAndNormalizeUrl(next);
        if (!validated.ok) return { status: null, body: null, headers: {} };
        const parsedNext = new URL(next);
        currentUrl =
          parsedNext.protocol === "http:"
            ? validated.value.url.replace(/^https:/, "http:")
            : validated.value.url;
        continue;
      }

      if (method === "HEAD") {
        await res.body.dump().catch(() => undefined);
        return { status: res.statusCode, body: null, headers };
      }
      const { text } = await readBodyCapped(
        res.body as AsyncIterable<Buffer>,
        maxBytes,
        headers["content-encoding"],
      );
      return { status: res.statusCode, body: text, headers };
    }
  } catch {
    return { status: null, body: null, headers: {} };
  }
  return { status: null, body: null, headers: {} };
}
