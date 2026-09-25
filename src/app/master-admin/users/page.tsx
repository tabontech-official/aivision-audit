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

  const [users, total, plans] = await Promise.all([
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
        subscriptions: {
          where: { status: { in: ["ACTIVE", "TRIALING"] } },
          include: {
            plan: {
              select: {
                id: true,
                key: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    db.user.count({ where }),
    db.plan.findMany({
      orderBy: { displayOrder: "asc" },
      select: {
        id: true,
        key: true,
        name: true,
        isActive: true,
      },
    }),
  ]);

  return (
    <UsersTable
      currentAdminId={admin.id}
      plans={plans.map((p) => ({
        id: p.id,
        key: p.key,
        name: p.name,
        isActive: p.isActive,
      }))}
      users={users.map((u) => {
        const activeSub = u.subscriptions?.[0];
        const userPlanId =
          activeSub?.plan?.id ??
          plans.find((p) => p.key.toUpperCase() === u.plan.toUpperCase())?.id ??
          "";
        const userPlanKey = activeSub?.plan?.key ?? u.plan;
        const userPlanName =
          activeSub?.plan?.name ?? (u.plan === "PREMIUM" ? "Premium" : "Free");

        return {
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          plan: u.plan,
          planId: userPlanId,
          planKey: userPlanKey,
          planName: userPlanName,
          verified: u.emailVerifiedAt !== null,
          lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
          createdAt: u.createdAt.toISOString(),
          reportCount: u._count.reports,
        };
      })}
      total={total}
      page={pageNum}
      pageSize={PAGE_SIZE}
      query={q}
    />
  );
}
