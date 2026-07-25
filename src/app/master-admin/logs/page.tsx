import type { Metadata } from "next";
import { db } from "@/lib/db/client";
import { requireMasterAdmin } from "@/lib/auth/rbac";
import {
  LogsClientView,
  type SerializedSystemLog,
  type SerializedAdminLog,
} from "./logs-client";

export const metadata: Metadata = { title: "Logs & System Diagnostics" };
export const revalidate = 0; // Live logs page — non-cached

const PAGE_SIZE = 50;

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    page?: string;
    search?: string;
    level?: string;
    category?: string;
  }>;
}) {
  await requireMasterAdmin();

  const {
    page = "1",
    search = "",
    level = "",
    category = "",
  } = await searchParams;

  const pageNum = Math.max(1, Number(page) || 1);

  // System Execution Logs filter construction
  const systemWhere: Record<string, unknown> = {};
  if (level) {
    systemWhere.level = level;
  }
  if (category) {
    systemWhere.category = category;
  }
  if (search) {
    systemWhere.OR = [
      { message: { contains: search, mode: "insensitive" } },
      { websiteUrl: { contains: search, mode: "insensitive" } },
      { stackTrace: { contains: search, mode: "insensitive" } },
    ];
  }

  // Admin Activity Logs filter construction
  const adminWhere: Record<string, unknown> = {};
  if (search) {
    adminWhere.OR = [
      { action: { contains: search, mode: "insensitive" } },
      { entityType: { contains: search, mode: "insensitive" } },
      { entityId: { contains: search, mode: "insensitive" } },
      { actor: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  // Safe execution in case systemExecutionLog model is generating on build worker
  const hasSystemLogModel = "systemExecutionLog" in db && typeof (db as unknown as Record<string, unknown>).systemExecutionLog === "object";

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const dbAny = db as any;

  const [
    systemLogsRaw,
    totalSystemLogs,
    adminLogsRaw,
    totalAdminLogs,
    distinctCategoriesRaw,
  ] = await Promise.all([
    hasSystemLogModel
      ? (dbAny.systemExecutionLog.findMany({
          where: systemWhere,
          orderBy: { createdAt: "desc" },
          skip: (pageNum - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }) as Promise<Array<Record<string, unknown>>>)
      : Promise.resolve([]),
    hasSystemLogModel
      ? (dbAny.systemExecutionLog.count({ where: systemWhere }) as Promise<number>)
      : Promise.resolve(0),
    db.adminActivityLog.findMany({
      where: adminWhere as any,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { email: true } } },
    }),
    db.adminActivityLog.count({ where: adminWhere as any }),
    hasSystemLogModel
      ? (dbAny.systemExecutionLog.groupBy({
          by: ["category"],
        }) as Promise<Array<{ category: string }>>)
      : Promise.resolve([]),
  ]);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const categories = distinctCategoriesRaw.map((c) => c.category);

  // Serialize System Logs
  const systemLogs: SerializedSystemLog[] = systemLogsRaw.map((log) => ({
    id: String(log.id ?? ""),
    level: (log.level as SerializedSystemLog["level"]) ?? "INFO",
    category: String(log.category ?? "SYSTEM"),
    message: String(log.message ?? ""),
    reportId: (log.reportId as string | null) ?? null,
    websiteUrl: (log.websiteUrl as string | null) ?? null,
    stage: (log.stage as string | null) ?? null,
    durationMs: (log.durationMs as number | null) ?? null,
    meta: (log.meta as Record<string, unknown> | null) ?? null,
    stackTrace: (log.stackTrace as string | null) ?? null,
    createdAt: log.createdAt ? new Date(log.createdAt as string).toISOString() : new Date().toISOString(),
  }));

  // Serialize Admin Logs
  const adminLogs: SerializedAdminLog[] = adminLogsRaw.map((log) => ({
    id: log.id,
    actorEmail: log.actor?.email ?? null,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    before: log.before,
    after: log.after,
    ipAddress: log.ipAddress,
    createdAt: log.createdAt.toISOString(),
  }));

  return (
    <LogsClientView
      systemLogs={systemLogs}
      adminLogs={adminLogs}
      totalSystemLogs={totalSystemLogs}
      totalAdminLogs={totalAdminLogs}
      categories={categories}
    />
  );
}

