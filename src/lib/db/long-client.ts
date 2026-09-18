import "server-only";
import { PrismaClient } from "@prisma/client";

/**
 * Prisma client for LONG transactions.
 *
 * Neon's pooled endpoint (PgBouncer) recycles connections aggressively; a
 * multi-second interactive transaction can outlive its connection, which is
 * exactly the production crash at GENERATING_REPORT:
 *
 *   Transaction API error: Transaction not found. Transaction ID is invalid,
 *   refers to an old closed transaction …
 *
 * This client uses DATABASE_URL_UNPOOLED (a direct connection) so the
 * transaction owns its connection for its whole lifetime. Use it ONLY for the
 * report-evaluation write path — everything else stays on the pooled `db`.
 * Falls back to the pooled URL when the unpooled one is not configured, which
 * is no worse than the previous behaviour.
 */
const globalForPrisma = globalThis as unknown as { prismaLong?: PrismaClient };

function makeClient(): PrismaClient {
  const unpooled = process.env.DATABASE_URL_UNPOOLED?.trim();
  return new PrismaClient({
    ...(unpooled ? { datasources: { db: { url: unpooled } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const dbLong = globalForPrisma.prismaLong ?? makeClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaLong = dbLong;
}
