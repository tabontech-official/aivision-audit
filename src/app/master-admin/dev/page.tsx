import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { requireMasterAdmin } from "@/lib/auth/rbac";
import { isDevToolsEnabled } from "@/lib/dev/tools";
import { getSecretStatus } from "@/services/settings/secret";
import { getDispatchMode } from "@/services/jobs/enqueue";
import { checkBrowserAvailability } from "@/services/inspection/renderer";
import { DevConsole } from "./dev-console";
import type { DevReportListItem } from "./types";

export const metadata: Metadata = { title: "Pipeline Console" };
export const revalidate = 0;

/**
 * Developer console — a live trace of what the audit engine is doing.
 * Gated twice: MASTER_ADMIN, plus the DEV_TOOLS_ENABLED switch.
 */
export default async function DevPage({
  searchParams,
}: {
  searchParams: Promise<{ report?: string }>;
}) {
  await requireMasterAdmin();
  if (!isDevToolsEnabled()) notFound();

  const { report: initialReportId } = await searchParams;

  const recentRaw = await db.report.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: {
      id: true,
      publicId: true,
      status: true,
      currentStage: true,
      progressPercent: true,
      createdAt: true,
      website: { select: { url: true } },
    },
  });

  const recent: DevReportListItem[] = recentRaw.map((r) => ({
    id: r.id,
    publicId: r.publicId,
    url: r.website.url,
    status: r.status,
    currentStage: r.currentStage,
    progressPercent: r.progressPercent,
    createdAt: r.createdAt.toISOString(),
  }));

  const stuckCount = await db.report.count({
    where: { status: { in: ["QUEUED", "PROCESSING"] }, deletedAt: null },
  });

  // Same resolution the PSI client uses (DB first, env fallback, decrypted) —
  // an unset key is why an audit finishes PARTIAL instead of COMPLETED.
  const pageSpeedConfigured = (
    await getSecretStatus("pagespeed_api_key", process.env.PAGESPEED_API_KEY)
  ).isSet;

  // Render-cost stats over the last 100 audits (B.10.5) — the numbers that
  // say whether RENDER_DECISION_THRESHOLD is tuned correctly.
  const recentRaw100 = await db.websiteRawData.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { renderMetrics: true },
  });
  const metrics = recentRaw100
    .map((r) => r.renderMetrics as { renderAttempted?: boolean; renderBenefited?: boolean; renderDurationMs?: number | null } | null)
    .filter((m): m is NonNullable<typeof m> => m !== null && typeof m === "object");
  const attempted = metrics.filter((m) => m.renderAttempted);
  const durations = attempted
    .map((m) => m.renderDurationMs)
    .filter((d): d is number => typeof d === "number")
    .sort((a, b) => a - b);
  const renderStats = {
    sampled: metrics.length,
    attempted: attempted.length,
    benefited: attempted.filter((m) => m.renderBenefited).length,
    meanMs: durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null,
    p95Ms: durations.length
      ? durations[Math.min(durations.length - 1, Math.floor(durations.length * 0.95))]!
      : null,
    browserMode: await (async () => {
      const probe = await checkBrowserAvailability();
      if (probe.mode === "remote") return `remote (${probe.detail})`;
      return probe.available ? "local (available)" : `local — UNAVAILABLE: ${probe.detail}`;
    })(),
  };

  return (
    <DevConsole
      recentReports={recent}
      initialReportId={initialReportId ?? null}
      inFlightCount={stuckCount}
      environment={process.env.NODE_ENV ?? "development"}
      queueMode={
        {
          qstash: "QStash (durable)",
          inline: "inline (long-lived server)",
          none: "NONE — serverless with no queue; audits fail at dispatch",
        }[getDispatchMode()]
      }
      pageSpeedConfigured={pageSpeedConfigured}
      renderStats={renderStats}
    />
  );
}
