/**
 * Validate a post-authentication return path.
 *
 * Only same-origin, single-slash absolute paths are allowed. Anything else —
 * an absolute URL, a protocol-relative `//evil.com`, a backslash trick — is
 * discarded, because a `?next=` that accepts arbitrary destinations is an
 * open redirect and a ready-made phishing vector on a login page.
 */
const ALLOWED_PREFIXES = ["/report/", "/analyze/", "/dashboard"];

export function safeReturnPath(next: string | undefined | null): string | null {
  if (!next) return null;
  const value = next.trim();

  // Must be a root-relative path, and must not be protocol-relative.
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return null;
  }
  if (value.includes("\\") || value.includes("://")) return null;

  // Whitelist the destinations this flow actually needs.
  if (!ALLOWED_PREFIXES.some((prefix) => value.startsWith(prefix))) return null;

  return value;
}
