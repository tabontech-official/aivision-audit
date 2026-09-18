import "server-only";
import { createHash } from "node:crypto";
import { db } from "@/lib/db/client";
import { dbLong } from "@/lib/db/long-client";
import { logExecution } from "@/services/system-log/log";
import { normalizePageUrlForIdentity } from "@/lib/security/url";
import { applyTransition } from "./transitions";
import type { FindingState, Prisma } from "@prisma/client";

/**
 * Reconciliation — the heart of the Fix Loop (§2.3).
 *
 * Runs after evaluateReport() and before buildAndStoreSnapshot(). Takes this
 * run's AuditResults, matches them against the website's persistent Findings
 * by identity, and applies the transition table. A report becomes an
 * *observation of ongoing state* instead of an orphan.
 *
 * Idempotent (§2.11): re-running for an already-reconciled report first rolls
 * back that report's own events (created findings are deleted; state changes
 * are restored from stateBefore), then reconciles fresh — so re-evaluation
 * never double-applies transitions. `staleSince` and `resolvedAt` are
 * recomputed by the fresh pass rather than restored bit-for-bit, which
 * converges to the same state.
 *
 * Scope (§2.10): ONLY websites owned by a registered user. Anonymous audits
 * create no findings; claiming triggers a one-time seeding reconciliation.
 *
 * Failure isolation (G.4): the caller wraps this — a findings failure must
 * never cost the user their report.
 */

/**
 * Finding identity. `pageType` is folded in for SAMPLED pages only, so the
 * same check on a product page and on the home page are distinct findings.
 *
 * HOME deliberately keeps the original two-part hash: it is the overwhelming
 * majority of findings, and changing it would orphan every one of them. A URL
 * fragment cannot carry this — `normalizePageUrlForIdentity` strips fragments
 * by design — so the page type is hashed explicitly.
 */
export function findingIdentityHash(
  fieldKey: string,
  pageUrl: string,
  pageType: string = "HOME",
): string {
  const base = `${fieldKey}:${normalizePageUrlForIdentity(pageUrl)}`;
  return createHash("sha256")
    .update(pageType === "HOME" ? base : `${base}:${pageType}`)
    .digest("hex");
}

export type ReconcileSummary = {
  skipped: "anonymous" | null;
  created: number;
  verifiedFixed: number;
  stillFailing: number;
  regressed: number;
  stillOpen: number;
  staleMarked: number;
  previousReportId: string | null;
  scoreDelta: number | null;
};

export async function reconcileFindings(
  reportId: string,
  overallScore: number | null,
): Promise<ReconcileSummary> {
  const empty: ReconcileSummary = {
    skipped: null, created: 0, verifiedFixed: 0, stillFailing: 0, regressed: 0,
    stillOpen: 0, staleMarked: 0, previousReportId: null, scoreDelta: null,
  };

  const report = await db.report.findUniqueOrThrow({
    where: { id: reportId },
    include: {
      website: { select: { id: true, url: true, userId: true } },
    },
  });

  // §2.10 — findings are meaningless without an owner who can act on them.
  if (!report.website.userId) {
    return { ...empty, skipped: "anonymous" };
  }

  /* ---- 1. previousReportId: resolved NOW, not at intake, so out-of-order
   *         completion cannot produce a wrong chain ---- */
  const previous = await db.report.findFirst({
    where: {
      websiteId: report.websiteId,
      status: { in: ["COMPLETED", "PARTIAL"] },
      findingsReconciledAt: { not: null },
      createdAt: { lt: report.createdAt },
      deletedAt: null,
      NOT: { id: reportId },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, overallScore: true },
  });
  const scoreDelta =
    previous?.overallScore != null && overallScore != null
      ? Math.round((overallScore - previous.overallScore) * 10) / 10
      : null;

  const results = await db.auditResult.findMany({
    where: { reportId },
    include: {
      field: {
        select: {
          fieldKey: true, name: true, pageType: true,
          section: { select: { slug: true, name: true, pillar: true } },
        },
      },
    },
  });

  // Multi-page sampling: identity is (fieldKey, PAGE URL), so a product-page
  // finding is distinct from the same check on the homepage. Sampled page URLs
  // can change between audits (a different representative product), so the
  // identity for a sampled type keys off the page TYPE rather than its
  // volatile URL — otherwise every re-audit would orphan the old finding and
  // create a duplicate.
  const sampled = await db.sampledPage.findMany({
    where: { reportId },
    select: { pageType: true, url: true },
  });
  const sampledUrlByType = new Map(sampled.map((s) => [s.pageType as string, s.url]));
  const primaryUrl = report.website.url;

  const pageUrl = primaryUrl;
  const websiteId = report.website.id;

  const summary = await dbLong.$transaction(
    async (tx) => {
      /* ---- 2. rollback if this report was already reconciled (§2.11) ---- */
      if (report.findingsReconciledAt) {
        const priorEvents = await tx.findingEvent.findMany({
          where: { reportId },
          orderBy: { createdAt: "desc" },
        });
        for (const event of priorEvents) {
          if (event.stateBefore === null) {
            // This run created the finding — remove it (events cascade).
            await tx.finding.delete({ where: { id: event.findingId } }).catch(() => undefined);
          } else if (event.stateBefore !== event.stateAfter) {
            await tx.finding
              .update({
                where: { id: event.findingId },
                data: {
                  state: event.stateBefore,
                  resolvedAt: event.stateBefore === "VERIFIED_FIXED" ? new Date() : null,
                },
              })
              .catch(() => undefined);
          }
        }
        await tx.findingEvent.deleteMany({ where: { reportId } });
        await tx.report.update({
          where: { id: reportId },
          data: { findingsReconciledAt: null },
        });
      }

      /* ---- 3. load current findings for the website ---- */
      const findings = await tx.finding.findMany({ where: { websiteId } });
      const byHash = new Map(findings.map((f) => [f.identityHash, f]));

      const counts = { created: 0, verifiedFixed: 0, stillFailing: 0, regressed: 0, stillOpen: 0 };
      const observedHashes = new Set<string>();
      const resultFindingIds: Array<{ resultId: string; findingId: string }> = [];

      /* ---- 4. apply the transition table per result ---- */
      for (const result of results) {
        const pageType = result.field.pageType;
        const identityHash = findingIdentityHash(result.field.fieldKey, primaryUrl, pageType);
        // Display URL: the page actually inspected. Denormalized like the
        // section/check names, refreshed each run — the representative
        // product may differ between audits.
        const displayUrl = sampledUrlByType.get(pageType) ?? primaryUrl;
        const prior = byHash.get(identityHash) ?? null;
        const transition = applyTransition(result.status, prior?.state ?? null);

        // NOT_APPLICABLE / ERROR: never touch, never create — not even lastSeen.
        if (result.status === "NOT_APPLICABLE" || result.status === "ERROR" || result.status === "INFO") {
          continue;
        }
        observedHashes.add(identityHash);

        const denorm = {
          fieldKey: result.field.fieldKey,
          checkName: result.field.name,
          sectionSlug: result.field.section.slug,
          sectionName: result.field.section.name,
          severity: result.severity,
          pillar: result.field.section.pillar,
          lastSeenAt: new Date(),
          lastReportId: reportId,
          staleSince: null,
          pageUrl: normalizePageUrlForIdentity(displayUrl),
        };

        if (transition.action === "none") continue;

        if (transition.action === "create") {
          const created = await tx.finding.create({
            data: {
              websiteId,
              identityHash,
              state: "OPEN",
              ...denorm,
            },
          });
          await tx.findingEvent.create({
            data: {
              findingId: created.id, reportId, checkStatus: result.status,
              stateBefore: null, stateAfter: "OPEN", actor: "ENGINE",
            },
          });
          resultFindingIds.push({ resultId: result.id, findingId: created.id });
          counts.created++;
          continue;
        }

        // keep / set — the finding exists
        const finding = prior!;
        const nextState: FindingState =
          transition.action === "set" ? transition.state : finding.state;

        await tx.finding.update({
          where: { id: finding.id },
          data: {
            ...denorm,
            state: nextState,
            resolvedAt:
              nextState === "VERIFIED_FIXED"
                ? finding.state === "VERIFIED_FIXED"
                  ? finding.resolvedAt
                  : new Date()
                : null,
          },
        });
        // Event for every OBSERVED finding — keeps included — so the
        // comparison view is pure set operations over this report's events.
        await tx.findingEvent.create({
          data: {
            findingId: finding.id, reportId, checkStatus: result.status,
            stateBefore: finding.state, stateAfter: nextState, actor: "ENGINE",
          },
        });
        resultFindingIds.push({ resultId: result.id, findingId: finding.id });

        if (transition.action === "set") {
          if (nextState === "VERIFIED_FIXED") counts.verifiedFixed++;
          else if (nextState === "STILL_FAILING") counts.stillFailing++;
          else if (nextState === "REGRESSED") counts.regressed++;
        } else if (
          (result.status === "FAIL" || result.status === "WARNING") &&
          ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "STILL_FAILING", "REGRESSED"].includes(nextState)
        ) {
          counts.stillOpen++;
        }
      }

      /* ---- 5. stale: existing findings this audit did not observe ---- */
      const unobserved = findings.filter((f) => !observedHashes.has(f.identityHash));
      let staleMarked = 0;
      for (const finding of unobserved) {
        if (!finding.staleSince) {
          await tx.finding.update({
            where: { id: finding.id },
            data: { staleSince: new Date() },
          });
          staleMarked++;
        }
      }

      /* ---- link results → findings (loose reference) ---- */
      for (const link of resultFindingIds) {
        await tx.auditResult.update({
          where: { id: link.resultId },
          data: { findingId: link.findingId },
        });
      }

      /* ---- 7/8. chain, delta, reconciled stamp ---- */
      await tx.report.update({
        where: { id: reportId },
        data: {
          previousReportId: previous?.id ?? null,
          scoreDelta,
          findingsReconciledAt: new Date(),
        },
      });

      return { ...counts, staleMarked };
    },
    { timeout: 30_000, maxWait: 10_000 },
  );

  await logExecution({
    level: "INFO",
    category: "FINDINGS",
    message: `Findings reconciled: ${summary.created} new, ${summary.verifiedFixed} verified fixed, ${summary.stillFailing} still failing, ${summary.regressed} regressed, ${summary.stillOpen} still open, ${summary.staleMarked} gone stale${scoreDelta !== null ? ` (score ${scoreDelta > 0 ? "+" : ""}${scoreDelta})` : ""}`,
    reportId,
    websiteUrl: pageUrl,
    meta: { ...summary, previousReportId: previous?.id ?? null } as unknown as Record<string, unknown> & Prisma.InputJsonValue,
  });

  return { ...empty, ...summary, previousReportId: previous?.id ?? null, scoreDelta };
}
