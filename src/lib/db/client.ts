import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton — prevents connection exhaustion during
 * Next.js dev hot-reload, and reuses one client per serverless instance.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
