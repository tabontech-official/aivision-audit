import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton — prevents connection exhaustion during
 * Next.js dev hot-reload, and reuses one client per serverless instance.
 */
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getDb(): PrismaClient {
  if (
    !globalForPrisma.prisma ||
    (process.env.NODE_ENV !== "production" && !(globalForPrisma.prisma as any).article)
  ) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getDb();
    const value = (client as any)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

/**
 * A dropped-connection error rather than a real query failure.
 *
 * Neon suspends an idle compute and terminates its connections; Prisma keeps
 * the now-dead sockets in its pool and the next query fails with
 * `kind: Closed` or SQLSTATE 57P01 ("terminating connection due to
 * administrator command"). Those are the ones worth retrying.
 */
export function isTransientDbError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    /kind:\s*Closed/i.test(message) ||
    /57P01/.test(message) ||
    /terminating connection/i.test(message) ||
    /Connection reset by peer/i.test(message) ||
    /Server has closed the connection/i.test(message) ||
    /Can't reach database server/i.test(message) ||
    /\bP1001\b|\bP1002\b|\bP1017\b/.test(message)
  );
}

/**
 * Wake the database and flush dead pooled connections before doing real work.
 *
 * Call this ahead of a multi-step write: it burns the connection failures on a
 * throwaway `SELECT 1` so the actual mutation runs against a live socket.
 * Deliberately *not* a wrapper around the write itself — retrying a write that
 * may already have committed is not safe here.
 */
export async function ensureDbConnection(attempts = 3): Promise<void> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      await db.$queryRaw`SELECT 1`;
      return;
    } catch (err) {
      lastError = err;
      if (!isTransientDbError(err)) throw err;
      // Neon takes a moment to resume a suspended compute.
      await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** i));
    }
  }
  throw lastError;
}
