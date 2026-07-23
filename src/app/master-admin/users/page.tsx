import type { Metadata } from "next";
import { db } from "@/lib/db/client";
import { requireMasterAdmin } from "@/lib/auth/rbac";
import { UsersTable } from "./users-table";

export const metadata: Metadata = { title: "Users" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const admin = await requireMasterAdmin();
  const { q = "", page = "1" } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);

  const where = {
    deletedAt: null,
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" as const } },
            { name: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { reports: true } },
      },
    }),
    db.user.count({ where }),
  ]);

  return (
    <UsersTable
      currentAdminId={admin.id}
      users={users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        plan: u.plan,
        verified: u.emailVerifiedAt !== null,
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
        reportCount: u._count.reports,
      }))}
      total={total}
      page={pageNum}
      pageSize={PAGE_SIZE}
      query={q}
    />
  );
}
