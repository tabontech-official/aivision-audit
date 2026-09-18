import "server-only";
import { db } from "@/lib/db/client";
import type { ScoreBasis } from "./evaluate-report";
import type { ExtractedData } from "@/services/inspection/types";
import type { Prisma } from "@prisma/client";

/**
 * Build and store the immutable report snapshot: the complete, denormalized
 * payload of a finished report. The Phase 7 report page and PDF export read
 * from this (after plan projection) instead of re-joining live builder tables,
 * so admin edits never mutate delivered reports.
 */

export type SnapshotCheck = {
  fieldId: string;
  name: string;
  fieldKey: string;
  /** Sub-section group label (F.3) — v2 snapshots; absent on v1. */
  category?: string | null;
  description: string | null;
  status: string;
  severity: string;
  planAccess: string;
  resultLabel: string;
  actualValue: string | null;
  expectedSummary: string | null;
  message: string | null;
  suggestion: string | null;
  evidence: Record<string, unknown> | null;
  helpArticleUrl: string | null;
  score: number;
  maxScore: number;
  isQuickWin: boolean;
};

export type SnapshotSection = {
  sectionId: string;
  name: string;
  slug: string;
  /** Section carried an appliesWhen gate — i.e. it is platform-specific
   *  (Shopify) analysis. The teaser prefers findings from these. */
  platformSpecific?: boolean;
  /** Pillar + weight (F.2) — v2 snapshots; absent on v1, where the report
   *  renders the flat section list exactly as before. */
  pillar?: string;
  weight?: number;
  shortDescription: string | null;
  icon: string | null;
  accentColor: string | null;
  planAccess: string;
  displayOrder: number;
  defaultExpanded: boolean;
  score: number | null;
  status: string;
  summary: string | null;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  checks: SnapshotCheck[];
};

export type ReportSnapshotPayload = {
  /** 1 = flat sections; 2 = adds pillar/weight per section and category per
   *  check. Renderers must keep the v1 path working for stored snapshots. */
  version: 1 | 2;
  generatedAt: string;
  sections: SnapshotSection[];
  /** Platform detection context (additive — absent on older snapshots). */
  site?: ExtractedData["site"] | null;
};

export async function buildAndStoreSnapshot(
  reportId: string,
  scoreBasis?: ScoreBasis,
): Promise<void> {
  const sectionResults = await db.reportSectionResult.findMany({
    where: { reportId },
    include: {
      section: true,
      results: {
        include: { field: true },
      },
    },
  });

  const sections: SnapshotSection[] = sectionResults
    .map((sr) => ({
      sectionId: sr.sectionId,
      name: sr.section.name,
      slug: sr.section.slug,
      platformSpecific: sr.section.appliesWhen !== null,
      pillar: sr.section.pillar,
      weight: sr.section.weight,
      shortDescription: sr.section.shortDescription,
      icon: sr.section.icon,
      accentColor: sr.section.accentColor,
      planAccess: sr.section.planAccess,
      displayOrder: sr.section.displayOrder,
      defaultExpanded: sr.section.defaultExpanded,
      score: sr.score,
      status: sr.status,
      summary: sr.summary,
      passedCount: sr.passedCount,
      failedCount: sr.failedCount,
      warningCount: sr.warningCount,
      checks: sr.results
        .sort((a, b) => a.field.displayOrder - b.field.displayOrder)
        .map((r) => ({
          fieldId: r.fieldId,
          name: r.field.name,
          fieldKey: r.field.fieldKey,
          category: r.field.category,
          description: r.field.description,
          status: r.status,
          severity: r.severity,
          planAccess: r.field.planAccess,
          resultLabel:
            r.status === "PASS"
              ? r.field.passLabel
              : r.status === "WARNING"
                ? r.field.warningLabel
                : r.status === "FAIL"
                  ? r.field.failLabel
                  : r.status,
          actualValue: r.actualValue,
          expectedSummary: r.expectedSummary,
          message: r.renderedMessage,
          suggestion: r.renderedSuggestion,
          evidence: (r.evidence as Record<string, unknown> | null) ?? null,
          helpArticleUrl: r.field.helpArticleUrl,
          score: r.score,
          maxScore: r.maxScore,
          isQuickWin: r.isQuickWin,
        })),
    }))
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const rawData = await db.websiteRawData.findUnique({
    where: { reportId },
    select: { extracted: true },
  });
  const site =
    (rawData?.extracted as unknown as ExtractedData | null)?.site ?? null;

  const payload: ReportSnapshotPayload = {
    version: 2,
    generatedAt: new Date().toISOString(),
    sections,
    site,
  };

  await db.reportSnapshot.upsert({
    where: { reportId },
    update: {
      payload: payload as unknown as Prisma.InputJsonValue,
      scoreBasis: (scoreBasis ?? undefined) as Prisma.InputJsonValue | undefined,
    },
    create: {
      reportId,
      payload: payload as unknown as Prisma.InputJsonValue,
      scoreBasis: (scoreBasis ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}
