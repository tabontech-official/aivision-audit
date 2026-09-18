import type { Metadata } from "next";
import { db } from "@/lib/db/client";
import { requireMasterAdmin } from "@/lib/auth/rbac";
import { getFunnelSummary } from "@/services/leads/funnel";
import { LeadsClient, type SerializedLead } from "./leads-client";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

/**
 * The lead surface — the internal purpose of the entire product. Every audit
 * started from the landing page has a row here, joined to its reports and
 * conversion state, filterable by the things that drive distribution
 * decisions (platform above all).
 */
export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    platform?: string;
    consent?: string;
    converted?: string;
  }>;
}) {
  await requireMasterAdmin();
  const { page = "1", search = "", platform = "", consent = "", converted = "" } =
    await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);

  const where: Prisma.LeadWhereInput = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { domain: { contains: search, mode: "insensitive" } },
    ];
  }
  if (platform) where.platform = platform;
  if (consent === "yes") where.marketingConsent = true;
  if (consent === "no") where.marketingConsent = false;
  if (consent === "unsubscribed") where.unsubscribedAt = { not: null };
  if (converted === "account") where.convertedUserId = { not: null };
  if (converted === "none") where.convertedUserId = null;

  const [leadsRaw, total, platformsRaw] = await Promise.all([
    db.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.lead.count({ where }),
    db.lead.groupBy({ by: ["platform"], _count: true }),
  ]);

  /* ---- join audits + conversion state ---- */
  const anonIds = leadsRaw.map((l) => l.anonymousSessionId).filter((v): v is string => !!v);
  const userIds = leadsRaw.map((l) => l.convertedUserId).filter((v): v is string => !!v);

  const [reports, subscriptions] = await Promise.all([
    anonIds.length || userIds.length
      ? db.report.findMany({
          where: {
            deletedAt: null,
            OR: [
              ...(anonIds.length ? [{ anonymousSessionId: { in: anonIds } }] : []),
              ...(userIds.length ? [{ userId: { in: userIds } }] : []),
            ],
          },
          select: {
            anonymousSessionId: true,
            userId: true,
            overallScore: true,
            createdAt: true,
            website: { select: { domain: true } },
          },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),
    userIds.length
      ? db.subscription.findMany({
          where: { userId: { in: userIds }, status: { in: ["ACTIVE", "TRIALING"] } },
          select: { userId: true },
        })
      : Promise.resolve([]),
  ]);

  const paidUserIds = new Set(subscriptions.map((s) => s.userId));

  const leads: SerializedLead[] = leadsRaw.map((lead) => {
    const own = reports.filter(
      (r) =>
        (lead.anonymousSessionId && r.anonymousSessionId === lead.anonymousSessionId) ||
        (lead.convertedUserId &&
          r.userId === lead.convertedUserId &&
          r.website.domain === lead.domain),
    );
    const scores = own
      .map((r) => r.overallScore)
      .filter((s): s is number => s !== null);
    const first = scores[0] ?? null;
    const latest = scores[scores.length - 1] ?? null;

    return {
      id: lead.id,
      email: lead.email,
      domain: lead.domain,
      websiteUrl: lead.websiteUrl,
      firstSeen: lead.createdAt.toISOString(),
      marketingConsent: lead.marketingConsent,
      consentAt: lead.consentAt?.toISOString() ?? null,
      unsubscribed: lead.unsubscribedAt !== null,
      platform: lead.platform,
      themeName: lead.themeName,
      appCount: lead.appCount,
      plusLikelihood: lead.plusLikelihood,
      auditCount: own.length,
      latestScore: latest,
      scoreTrend:
        latest !== null && first !== null && own.length > 1
          ? Math.round((latest - first) * 10) / 10
          : null,
      convertedAccount: lead.convertedUserId !== null,
      convertedPaid: lead.convertedUserId !== null && paidUserIds.has(lead.convertedUserId),
    };
  });

  const funnel = await getFunnelSummary(30);

  return (
    <LeadsClient
      funnel={funnel}
      leads={leads}
      total={total}
      page={pageNum}
      pageSize={PAGE_SIZE}
      platforms={platformsRaw
        .map((p) => ({ platform: p.platform ?? "—", count: p._count }))
        .sort((a, b) => b.count - a.count)}
      filters={{ search, platform, consent, converted }}
    />
  );
}
