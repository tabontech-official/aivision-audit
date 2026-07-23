import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * SSRF protection: resolves the target hostname and verifies every resolved
 * address is a public unicast IP. Blocks loopback, RFC1918 private ranges,
 * link-local (incl. cloud metadata 169.254.169.254), CGNAT, ULA, multicast,
 * and IPv4-mapped IPv6 forms of all of the above.
 *
 * Used at audit intake (fast fail) and re-run inside the audit job before
 * every fetch and on every redirect hop (protects against DNS rebinding
 * between intake and fetch — the fetcher in Phase 4 pins resolved IPs).
 */

type Ipv4Range = { start: number; end: number };

function ipv4ToInt(ip: string): number {
  const parts = ip.split(".").map(Number);
  return (
    ((parts[0] ?? 0) << 24) | ((parts[1] ?? 0) << 16) | ((parts[2] ?? 0) << 8) | (parts[3] ?? 0)
  ) >>> 0;
}

function range(cidr: string): Ipv4Range {
  const [base, bitsStr] = cidr.split("/");
  const bits = Number(bitsStr);
  const start = ipv4ToInt(base ?? "0.0.0.0");
  const size = 2 ** (32 - bits);
  return { start, end: start + size - 1 };
}

/** Non-public IPv4 ranges (superset of RFC 5735 special-use). */
const BLOCKED_IPV4_RANGES: Ipv4Range[] = [
  range("0.0.0.0/8"), // "this" network
  range("10.0.0.0/8"), // private
  range("100.64.0.0/10"), // CGNAT
  range("127.0.0.0/8"), // loopback
  range("169.254.0.0/16"), // link-local + cloud metadata
  range("172.16.0.0/12"), // private
  range("192.0.0.0/24"), // IETF protocol assignments
  range("192.0.2.0/24"), // TEST-NET-1
  range("192.88.99.0/24"), // 6to4 relay
  range("192.168.0.0/16"), // private
  range("198.18.0.0/15"), // benchmarking
  range("198.51.100.0/24"), // TEST-NET-2
  range("203.0.113.0/24"), // TEST-NET-3
  range("224.0.0.0/4"), // multicast
  range("240.0.0.0/4"), // reserved + broadcast
];

export function isBlockedIpv4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  return BLOCKED_IPV4_RANGES.some((r) => n >= r.start && n <= r.end);
}

export function isBlockedIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();

  // Loopback / unspecified
  if (lower === "::1" || lower === "::") return true;

  // IPv4-mapped (::ffff:a.b.c.d) — evaluate the embedded IPv4
  const v4Mapped = lower.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (v4Mapped?.[1]) return isBlockedIpv4(v4Mapped[1]);

  // Link-local fe80::/10
  if (/^fe[89ab]/.test(lower)) return true;
  // Unique local fc00::/7
  if (/^f[cd]/.test(lower)) return true;
  // Multicast ff00::/8
  if (lower.startsWith("ff")) return true;
  // Documentation 2001:db8::/32
  if (lower.startsWith("2001:db8")) return true;
  // Discard 100::/64
  if (lower.startsWith("100:")) return true;

  return false;
}

export function isBlockedIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return isBlockedIpv4(ip);
  if (version === 6) return isBlockedIpv6(ip);
  return true; // not an IP — refuse
}

export type SsrfCheckResult =
  | { ok: true; addresses: string[] }
  | { ok: false; error: string };

/**
 * Resolve a hostname and verify ALL addresses are publicly routable.
 * Returns the resolved addresses so the caller can pin connections to them.
 */
export async function assertPublicHost(hostname: string): Promise<SsrfCheckResult> {
  // IP literal? Check directly without DNS.
  const literal = hostname.replace(/^\[|\]$/g, "");
  if (isIP(literal)) {
    return isBlockedIp(literal)
      ? { ok: false, error: "This address cannot be audited." }
      : { ok: true, addresses: [literal] };
  }

  let results: Array<{ address: string }>;
  try {
    results = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    return { ok: false, error: "We couldn't find this website. Check the address and try again." };
  }

  if (results.length === 0) {
    return { ok: false, error: "We couldn't find this website. Check the address and try again." };
  }

  for (const { address } of results) {
    if (isBlockedIp(address)) {
      return { ok: false, error: "This address cannot be audited." };
    }
  }

  return { ok: true, addresses: results.map((r) => r.address) };
}
