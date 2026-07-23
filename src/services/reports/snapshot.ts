import "server-only";
import { db } from "@/lib/db/client";
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
  version: 1;
  generatedAt: string;
  sections: SnapshotSection[];
};

export async function buildAndStoreSnapshot(reportId: string): Promise<void> {
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

  const payload: ReportSnapshotPayload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    sections,
  };

  await db.reportSnapshot.upsert({
    where: { reportId },
    update: { payload: payload as unknown as Prisma.InputJsonValue },
    create: { reportId, payload: payload as unknown as Prisma.InputJsonValue },
  });
}
