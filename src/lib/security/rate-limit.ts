import "server-only";

/**
 * Sliding-window rate limiter.
 * Uses Upstash Redis REST when UPSTASH_REDIS_REST_URL is configured;
 * falls back to an in-process Map for local development (single instance only —
 * fine for dev, and production always configures Redis).
 */

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  /** epoch ms when the window resets */
  resetAt: number;
};

const memoryStore = new Map<string, number[]>();

function memoryLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = (memoryStore.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= limit) {
    memoryStore.set(key, timestamps);
    return {
      allowed: false,
      remaining: 0,
      resetAt: (timestamps[0] ?? now) + windowMs,
    };
  }

  timestamps.push(now);
  memoryStore.set(key, timestamps);

  // Opportunistic cleanup to bound memory
  if (memoryStore.size > 10_000) {
    for (const [k, v] of memoryStore) {
      if (v.every((t) => t <= windowStart)) memoryStore.delete(k);
    }
  }

  return { allowed: true, remaining: limit - timestamps.length, resetAt: now + windowMs };
}

async function redisLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const now = Date.now();
  const windowStart = now - windowMs;
  const redisKey = `rl:${key}`;

  // Pipeline: prune old entries, add current, count, set TTL
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["ZREMRANGEBYSCORE", redisKey, "0", String(windowStart)],
      ["ZADD", redisKey, String(now), `${now}:${Math.random().toString(36).slice(2, 8)}`],
      ["ZCARD", redisKey],
      ["PEXPIRE", redisKey, String(windowMs)],
    ]),
    cache: "no-store",
  });

  if (!res.ok) {
    // Redis unavailable — fail open but log; blocking all traffic is worse
    console.error(`[rate-limit] Redis error ${res.status}`);
    return { allowed: true, remaining: 1, resetAt: now + windowMs };
  }

  const data = (await res.json()) as Array<{ result: number }>;
  const count = data[2]?.result ?? 1;

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt: now + windowMs,
  };
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return redisLimit(key, limit, windowMs);
  }
  return memoryLimit(key, limit, windowMs);
}

/** Extract the client IP from a header bag behind Vercel/proxies. */
export function getIpFromHeaders(h: Headers): string {
  const fwd = h.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip") ?? "unknown";
}

/** Extract the client IP from a Request behind Vercel/proxies. */
export function getClientIp(req: Request): string {
  return getIpFromHeaders(req.headers);
}
