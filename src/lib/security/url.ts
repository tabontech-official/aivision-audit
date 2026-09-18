import { z } from "zod";

/**
 * URL validation and normalization for audit targets.
 * Accepts user-friendly input ("example.com", "www.example.com/page") and
 * produces a normalized https URL, rejecting unsafe schemes and shapes early.
 * Network-level SSRF checks (DNS/IP) live in ssrf.ts.
 */

const MAX_URL_LENGTH = 2048;

/** Hostname patterns that are never auditable, checked before DNS. */
const BLOCKED_HOSTNAME_PATTERNS: RegExp[] = [
  /^localhost$/i,
  /\.localhost$/i,
  /^localhost\./i,
  /\.local$/i,
  /\.internal$/i,
  /\.corp$/i,
  /\.home$/i,
  /\.lan$/i,
  /^metadata\.google\.internal$/i,
  /^instance-data$/i,
];

export type NormalizedUrl = {
  /** Full normalized URL, e.g. "https://example.com/page" */
  url: string;
  /** Hostname, e.g. "example.com" */
  hostname: string;
  /** Registrable-ish display domain (hostname minus leading www.) */
  domain: string;
};

export type UrlValidationResult =
  | { ok: true; value: NormalizedUrl }
  | { ok: false; error: string };

export const auditUrlInputSchema = z.object({
  url: z.string().trim().min(3, "Enter a website URL").max(MAX_URL_LENGTH, "URL is too long"),
});

/**
 * Validate + normalize a user-supplied URL string.
 * - Adds https:// when no scheme is present
 * - Only http/https allowed; http is upgraded to https for the primary attempt
 *   (the fetcher may fall back to http if https fails — still SSRF-checked)
 * - Rejects credentials, blocked hostnames, raw private-looking metadata names
 * - Strips fragments; preserves path and query
 */
export function validateAndNormalizeUrl(input: string): UrlValidationResult {
  let raw = input.trim();
  if (raw.length === 0) return { ok: false, error: "Enter a website URL." };
  if (raw.length > MAX_URL_LENGTH) return { ok: false, error: "URL is too long." };

  // Reject whitespace inside the URL (catches "javascript: alert" tricks too)
  if (/\s/.test(raw)) return { ok: false, error: "URL must not contain spaces." };

  // Explicitly reject dangerous schemes before URL parsing normalizes them
  if (/^(javascript|data|file|ftp|blob|vbscript|about|chrome|ws|wss):/i.test(raw)) {
    return { ok: false, error: "Only http and https websites can be audited." };
  }

  if (!/^https?:\/\//i.test(raw)) {
    raw = `https://${raw}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, error: "That doesn't look like a valid URL." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Only http and https websites can be audited." };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, error: "URLs with embedded credentials are not allowed." };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Bare hostnames must contain a dot (rejects "intranet", "router", etc.)
  // IP literals are allowed through here; ssrf.ts decides if the IP is public.
  const isIpV4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
  const isIpV6 = hostname.startsWith("[") || hostname.includes(":");
  if (!isIpV4 && !isIpV6 && !hostname.includes(".")) {
    return { ok: false, error: "Enter a full domain name, like example.com." };
  }

  for (const pattern of BLOCKED_HOSTNAME_PATTERNS) {
    if (pattern.test(hostname)) {
      return { ok: false, error: "This address cannot be audited." };
    }
  }

  // Port restrictions: standard web ports only
  if (parsed.port && !["80", "443", "8080", "8443"].includes(parsed.port)) {
    return { ok: false, error: "Only standard web ports (80, 443, 8080, 8443) are supported." };
  }

  // Normalize: https primary, drop fragment, collapse default port
  parsed.protocol = "https:";
  parsed.hash = "";
  if (parsed.port === "443") parsed.port = "";

  const domain = hostname.replace(/^www\./, "");

  return {
    ok: true,
    value: {
      url: parsed.toString(),
      hostname,
      domain,
    },
  };
}

/**
 * Canonical page-URL normalization for FINDING IDENTITY (Fix Loop §2.2):
 * lowercase host, https, no fragment, no trailing slash, path and meaningful
 * query preserved. This is the ONE shared helper — if identity normalization
 * ever diverged from intake normalization, findings would fragment across
 * audits and the tracker would silently break.
 *
 * Built on validateAndNormalizeUrl so the two can never drift; input that
 * fails validation falls back to a best-effort lowercase trim (identity must
 * always be computable for a URL that already produced a report).
 */
export function normalizePageUrlForIdentity(input: string): string {
  const validated = validateAndNormalizeUrl(input);
  const url = validated.ok ? validated.value.url : input.trim().toLowerCase();
  // Strip exactly one trailing slash on the path (never the "//" of the origin)
  return url.replace(/(?<=[^/])\/$/, "").replace(/^(https?:\/\/[^/]+)\/$/, "$1");
}
