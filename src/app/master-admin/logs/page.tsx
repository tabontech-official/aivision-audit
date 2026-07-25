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
  type SystemWhere = NonNullable<Parameters<typeof db.systemExecutionLog.findMany>[0]>["where"];
  type AdminWhere = NonNullable<Parameters<typeof db.adminActivityLog.findMany>[0]>["where"];

  const systemWhere: SystemWhere = {};
  if (level) {
    systemWhere.level = level as unknown as SystemWhere["level"];
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
  const adminWhere: AdminWhere = {};
  if (search) {
    adminWhere.OR = [
      { action: { contains: search, mode: "insensitive" } },
      { entityType: { contains: search, mode: "insensitive" } },
      { entityId: { contains: search, mode: "insensitive" } },
      { actor: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [
    systemLogsRaw,
    totalSystemLogs,
    adminLogsRaw,
    totalAdminLogs,
    distinctCategoriesRaw,
  ] = await Promise.all([
    db.systemExecutionLog.findMany({
      where: systemWhere,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.systemExecutionLog.count({ where: systemWhere }),
    db.adminActivityLog.findMany({
      where: adminWhere,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { email: true } } },
    }),
    db.adminActivityLog.count({ where: adminWhere }),
    db.systemExecutionLog.groupBy({
      by: ["category"],
    }),
  ]);

  const categories = distinctCategoriesRaw.map((c) => c.category);

  // Serialize System Logs
  const systemLogs: SerializedSystemLog[] = systemLogsRaw.map((log) => ({
    id: log.id,
    level: log.level,
    category: log.category,
    message: log.message,
    reportId: log.reportId,
    websiteUrl: log.websiteUrl,
    stage: log.stage,
    durationMs: log.durationMs,
    meta: (log.meta as Record<string, unknown> | null) ?? null,
    stackTrace: log.stackTrace,
    createdAt: log.createdAt.toISOString(),
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
