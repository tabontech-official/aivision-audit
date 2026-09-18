import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/rbac";
import { db } from "@/lib/db/client";
import { recordFunnelEvent } from "@/services/leads/funnel";
import { Alert } from "@/components/ui/alert";
import { Badge, severityBadgeVariant } from "@/components/ui/badge";
import type { ScoreBasis } from "@/services/reports/evaluate-report";
import type { ReportSnapshotPayload } from "@/services/reports/snapshot";

export const metadata: Metadata = { title: "What changed" };
export const dynamic = "force-dynamic";

/**
 * Comparison view (§2.7 / H.3): fully deterministic — pure set operations
 * over this report's FindingEvents plus the website's stale findings. No AI,
 * reproducible, debuggable, free.
 */
export default async function ComparePage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const user = await requireUser();
  const { reportId: publicId } = await params;

  const report = await db.report.findUnique({
    where: { publicId },
    include: { website: { select: { id: true, domain: true, userId: true } } },
  });
  if (!report || report.deletedAt) notFound();
  if (report.website.userId !== user.id && user.role !== "MASTER_ADMIN") notFound();

  /* ---- baseline: no previous report → no comparison, never an empty one ---- */
  if (!report.previousReportId) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
        <h1 className="text-xl font-bold text-ink">This is your baseline</h1>
        <p className="text-sm text-ink-secondary">
          Tracking started with this audit. Re-run after making changes and this page will show
          exactly what got fixed, what&apos;s new, and what regressed.
        </p>
        <Link
          href={`/dashboard/reports/${publicId}`}
          className="inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          View the report
        </Link>
      </div>
    );
  }

  const previous = await db.report.findUnique({
    where: { id: report.previousReportId },
    select: { publicId: true, overallScore: true, completedAt: true, createdAt: true, id: true },
  });

  const [events, staleFindings, snapshots] = await Promise.all([
    db.findingEvent.findMany({
      where: { reportId: report.id },
      include: { finding: true },
      orderBy: { createdAt: "asc" },
    }),
    db.finding.findMany({
      where: { websiteId: report.website.id, staleSince: { not: null } },
    }),
    db.reportSnapshot.findMany({
      where: { reportId: { in: [report.id, report.previousReportId] } },
      select: { reportId: true, scoreBasis: true, payload: true },
    }),
  ]);

  await recordFunnelEvent("comparison_viewed", report.id);

  /* ---- the seven buckets, from events ---- */
  const fixed = events.filter((e) => e.stateAfter === "VERIFIED_FIXED" && e.stateBefore !== "VERIFIED_FIXED");
  const stillFailingAfterFix = events.filter((e) => e.stateAfter === "STILL_FAILING" && e.stateBefore === "MARKED_FIXED");
  const fresh = events.filter((e) => e.stateBefore === null);
  const regressed = events.filter((e) => e.stateAfter === "REGRESSED" && e.stateBefore === "VERIFIED_FIXED");
  const stillOpen = events.filter(
    (e) =>
      e.stateBefore === e.stateAfter &&
      ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "STILL_FAILING", "REGRESSED"].includes(e.stateAfter) &&
      (e.checkStatus === "FAIL" || e.checkStatus === "WARNING"),
  );
  const suppressed = events.filter((e) => ["WONT_FIX", "FALSE_POSITIVE"].includes(e.stateAfter));

  /* ---- score-basis guard (§2.7): warn + like-for-like when coverage differs ---- */
  const basisNow = snapshots.find((s) => s.reportId === report.id)?.scoreBasis as ScoreBasis | null;
  const basisPrev = snapshots.find((s) => s.reportId === report.previousReportId)?.scoreBasis as ScoreBasis | null;
  const basisMismatch =
    !!basisNow && !!basisPrev &&
    (basisNow.coverage !== basisPrev.coverage ||
      JSON.stringify([...basisNow.excludedSections.map((e) => e.slug)].sort()) !==
        JSON.stringify([...basisPrev.excludedSections.map((e) => e.slug)].sort()));

  let likeForLike: { now: number; prev: number } | null = null;
  if (basisMismatch) {
    const payloadNow = snapshots.find((s) => s.reportId === report.id)?.payload as unknown as ReportSnapshotPayload | null;
    const payloadPrev = snapshots.find((s) => s.reportId === report.previousReportId)?.payload as unknown as ReportSnapshotPayload | null;
    if (payloadNow && payloadPrev) {
      const scored = (p: ReportSnapshotPayload) =>
        new Map(p.sections.filter((s) => s.score !== null).map((s) => [s.slug, s]));
      const nowMap = scored(payloadNow);
      const prevMap = scored(payloadPrev);
      const shared = [...nowMap.keys()].filter((slug) => prevMap.has(slug));
      const rollup = (map: Map<string, ReportSnapshotPayload["sections"][number]>) => {
        let sum = 0, weight = 0;
        for (const slug of shared) {
          const s = map.get(slug)!;
          const w = s.weight ?? 1;
          sum += (s.score ?? 0) * w;
          weight += w;
        }
        return weight > 0 ? Math.round(sum / weight) : null;
      };
      const now = rollup(nowMap);
      const prev = rollup(prevMap);
      if (now !== null && prev !== null) likeForLike = { now, prev };
    }
  }

  const scoreNow = report.overallScore !== null ? Math.round(report.overallScore) : null;
  const scorePrev = previous?.overallScore != null ? Math.round(previous.overallScore) : null;
  const delta = report.scoreDelta;
  const daysApart = previous
    ? Math.max(1, Math.round((report.createdAt.getTime() - (previous.completedAt ?? previous.createdAt).getTime()) / 86_400_000))
    : null;

  const buckets: Array<{
    key: string;
    icon: string;
    title: string;
    tone: string;
    rows: Array<{ id: string; name: string; section: string; sectionSlug: string; severity: string; note?: string | null }>;
  }> = [
    { key: "fixed", icon: "✓", title: "Fixed & verified", tone: "text-success-700", rows: fixed.map((e) => row(e)) },
    { key: "still", icon: "✗", title: "Marked fixed, still failing", tone: "text-danger-600", rows: stillFailingAfterFix.map((e) => row(e)) },
    { key: "new", icon: "⚠", title: "New issues", tone: "text-warning-700", rows: fresh.map((e) => row(e)) },
    { key: "regressed", icon: "↩", title: "Regressed", tone: "text-danger-600", rows: regressed.map((e) => row(e)) },
    { key: "open", icon: "○", title: "Still open", tone: "text-ink-secondary", rows: stillOpen.map((e) => row(e)) },
    { key: "suppressed", icon: "–", title: "Suppressed by you", tone: "text-ink-muted", rows: suppressed.map((e) => row(e)) },
    {
      key: "stale", icon: "…", title: "Not checked this run", tone: "text-ink-muted",
      rows: staleFindings.map((f) => ({ id: f.id, name: f.checkName, section: f.sectionName, sectionSlug: f.sectionSlug, severity: f.severity })),
    },
  ];

  function row(e: (typeof events)[number]) {
    return {
      id: e.id,
      name: e.finding.checkName,
      section: e.finding.sectionName,
      sectionSlug: e.finding.sectionSlug,
      severity: e.finding.severity,
      note: e.finding.userNote,
    };
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href={`/dashboard/reports/${publicId}`} className="text-sm text-ink-secondary hover:text-ink">
        ← Back to the report
      </Link>

      <div className="card p-6">
        <h1 className="text-xl font-bold text-ink">What changed</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          This audit vs the previous one{daysApart !== null ? ` — ${daysApart} day${daysApart === 1 ? "" : "s"} apart` : ""}.
        </p>
        {scoreNow !== null && scorePrev !== null && (
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold tabular-nums text-ink">
              {scorePrev} → {scoreNow}
            </span>
            {delta !== null && delta !== 0 && (
              <span className={`text-lg font-semibold ${delta > 0 ? "text-success-600" : "text-danger-600"}`}>
                {delta > 0 ? "+" : ""}
                {delta}
              </span>
            )}
          </div>
        )}
      </div>

      {basisMismatch && (
        <Alert variant="warning">
          These two audits covered different parts of the scoring model, so the headline scores are
          not directly comparable.
          {likeForLike && (
            <>
              {" "}Over the sections both audits measured, the like-for-like movement is{" "}
              <strong>
                {likeForLike.prev} → {likeForLike.now}
              </strong>
              .
            </>
          )}
        </Alert>
      )}

      {buckets.map((bucket) => (
        <details key={bucket.key} className="card overflow-hidden" open={bucket.rows.length > 0 && bucket.key !== "open" && bucket.key !== "suppressed" && bucket.key !== "stale"}>
          <summary className="flex cursor-pointer items-center justify-between px-5 py-3.5">
            <span className={`text-sm font-semibold ${bucket.tone}`}>
              {bucket.icon} {bucket.title}
            </span>
            <span className="text-sm font-bold tabular-nums text-ink">{bucket.rows.length}</span>
          </summary>
          {bucket.rows.length > 0 && (
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {bucket.rows.map((r) => (
                <li key={r.id} className="px-5 py-2.5">
                  <Link
                    href={`/dashboard/reports/${publicId}#section-${r.sectionSlug}`}
                    className="group flex flex-wrap items-center gap-2"
                  >
                    <span className="text-sm font-medium text-ink group-hover:text-brand-700">{r.name}</span>
                    <Badge variant={severityBadgeVariant(r.severity)}>{r.severity.toLowerCase()}</Badge>
                    <span className="text-xs text-ink-muted">{r.section}</span>
                    {r.note && <span className="w-full text-xs text-ink-muted">note: {r.note.slice(0, 100)}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </details>
      ))}

      {previous && (
        <p className="text-center text-xs text-ink-muted">
          Comparing against the audit from{" "}
          {new Date(previous.completedAt ?? previous.createdAt).toLocaleDateString("en-US", {
            month: "long", day: "numeric", year: "numeric",
          })}
          {" · "}
          <Link href={`/dashboard/reports/${previous.publicId}`} className="underline hover:text-ink">
            open it
          </Link>
        </p>
      )}
    </div>
  );
}

