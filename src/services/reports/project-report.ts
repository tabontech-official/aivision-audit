import "server-only";
import { db } from "@/lib/db/client";
import type {
  ReportSnapshotPayload,
  SnapshotSection,
  SnapshotCheck,
} from "./snapshot";

/**
 * Plan projection — the server-side gating boundary.
 *
 * Takes a report's stored snapshot and the VIEWER'S effective plan, and
 * returns only what that viewer is allowed to see. Locked (premium) content
 * is reduced to a title + preview stub BEFORE it leaves the server: detected
 * values, messages, suggestions, and evidence for locked checks are never
 * serialized to a free viewer's browser.
 *
 * Access rules per plan_access:
 *   BOTH     → always visible
 *   FREE     → visible to everyone (free-only content)
 *   PREMIUM  → full detail for PREMIUM viewers; locked stub for FREE viewers
 *   HIDDEN   → never included for anyone
 */

export type ViewerPlan = "FREE" | "PREMIUM";

export type ProjectedCheck =
  | {
      locked: false;
      fieldId: string;
      name: string;
      fieldKey: string;
      /** Sub-section group label (F.3) — null on pre-pillar snapshots. */
      category: string | null;
      description: string | null;
      status: string;
      severity: string;
      resultLabel: string;
      actualValue: string | null;
      expectedSummary: string | null;
      message: string | null;
      suggestion: string | null;
      evidence: Record<string, unknown> | null;
      helpArticleUrl: string | null;
      isQuickWin: boolean;
    }
  | {
      locked: true;
      fieldId: string;
      name: string;
      description: string | null;
      severity: string;
      /** status is kept so the UI can show a colored lock, but no detail */
      status: string;
    };

export type ProjectedSection =
  | {
      locked: false;
      sectionId: string;
      name: string;
      slug: string;
      /** Pillar + weight (F.2) — null on pre-pillar (v1) snapshots, which
       *  render the flat list. */
      pillar: string | null;
      weight: number | null;
      shortDescription: string | null;
      icon: string | null;
      accentColor: string | null;
      score: number | null;
      status: string;
      summary: string | null;
      passedCount: number;
      failedCount: number;
      warningCount: number;
      defaultExpanded: boolean;
      checks: ProjectedCheck[];
      /** number of premium checks hidden from a free viewer in this section */
      lockedCheckCount: number;
    }
  | {
      locked: true;
      sectionId: string;
      name: string;
      slug: string;
      pillar: string | null;
      weight: number | null;
      shortDescription: string | null;
      icon: string | null;
      accentColor: string | null;
      /** how many checks are inside, to tease the value */
      checkCount: number;
    };

export type ProjectedReport = {
  sections: ProjectedSection[];
  /** Platform detection context — safe for every viewer, drives the
   *  non-Shopify banner and the detected-store header. */
  site: ReportSnapshotPayload["site"] | null;
  /** true when anything was locked → drives the upgrade CTA */
  hasLockedContent: boolean;
  lockedSectionCount: number;
  lockedCheckCount: number;
  visiblePassed: number;
  visibleFailed: number;
  visibleWarning: number;
};

function isVisibleToPlan(planAccess: string, viewer: ViewerPlan): "full" | "locked" | "hidden" {
  switch (planAccess) {
    case "HIDDEN":
      return "hidden";
    case "BOTH":
    case "FREE":
      return "full";
    case "PREMIUM":
      return viewer === "PREMIUM" ? "full" : "locked";
    default:
      return "full";
  }
}

function projectCheck(check: SnapshotCheck, viewer: ViewerPlan): ProjectedCheck | null {
  const visibility = isVisibleToPlan(check.planAccess, viewer);
  if (visibility === "hidden") return null;

  if (visibility === "locked") {
    // Locked stub — NO detected value / message / suggestion / evidence
    return {
      locked: true,
      fieldId: check.fieldId,
      name: check.name,
      description: check.description,
      severity: check.severity,
      status: check.status,
    };
  }

  return {
    locked: false,
    fieldId: check.fieldId,
    name: check.name,
    fieldKey: check.fieldKey,
    category: check.category ?? null,
    description: check.description,
    status: check.status,
    severity: check.severity,
    resultLabel: check.resultLabel,
    actualValue: check.actualValue,
    expectedSummary: check.expectedSummary,
    message: check.message,
    suggestion: check.suggestion,
    evidence: check.evidence,
    helpArticleUrl: check.helpArticleUrl,
    isQuickWin: check.isQuickWin,
  };
}

function projectSection(
  section: SnapshotSection,
  viewer: ViewerPlan,
): ProjectedSection | null {
  const visibility = isVisibleToPlan(section.planAccess, viewer);
  if (visibility === "hidden") return null;

  // A locked (premium) section: title + tease only, no checks serialized
  if (visibility === "locked") {
    return {
      locked: true,
      sectionId: section.sectionId,
      name: section.name,
      slug: section.slug,
      pillar: section.pillar ?? null,
      weight: section.weight ?? null,
      shortDescription: section.shortDescription,
      icon: section.icon,
      accentColor: section.accentColor,
      checkCount: section.checks.length,
    };
  }

  const checks: ProjectedCheck[] = [];
  let lockedCheckCount = 0;
  for (const check of section.checks) {
    const projected = projectCheck(check, viewer);
    if (!projected) continue; // hidden
    if (projected.locked) lockedCheckCount++;
    checks.push(projected);
  }

  return {
    locked: false,
    sectionId: section.sectionId,
    name: section.name,
    slug: section.slug,
    pillar: section.pillar ?? null,
    weight: section.weight ?? null,
    shortDescription: section.shortDescription,
    icon: section.icon,
    accentColor: section.accentColor,
    score: section.score,
    status: section.status,
    summary: section.summary,
    passedCount: section.passedCount,
    failedCount: section.failedCount,
    warningCount: section.warningCount,
    defaultExpanded: section.defaultExpanded,
    checks,
    lockedCheckCount,
  };
}

export function projectSnapshot(
  payload: ReportSnapshotPayload,
  viewer: ViewerPlan,
): ProjectedReport {
  const sections: ProjectedSection[] = [];
  let lockedSectionCount = 0;
  let lockedCheckCount = 0;
  let visiblePassed = 0;
  let visibleFailed = 0;
  let visibleWarning = 0;

  for (const section of payload.sections) {
    const projected = projectSection(section, viewer);
    if (!projected) continue;
    if (projected.locked) {
      lockedSectionCount++;
    } else {
      lockedCheckCount += projected.lockedCheckCount;
      for (const c of projected.checks) {
        if (c.locked) continue;
        if (c.status === "PASS") visiblePassed++;
        else if (c.status === "FAIL") visibleFailed++;
        else if (c.status === "WARNING") visibleWarning++;
      }
    }
    sections.push(projected);
  }

  return {
    sections,
    site: payload.site ?? null,
    hasLockedContent: lockedSectionCount > 0 || lockedCheckCount > 0,
    lockedSectionCount,
    lockedCheckCount,
    visiblePassed,
    visibleFailed,
    visibleWarning,
  };
}

/**
 * Load a report's snapshot and project it for the given viewer plan.
 * Returns null if no snapshot exists (report not yet evaluated).
 */
export async function getProjectedReport(
  reportId: string,
  viewer: ViewerPlan,
): Promise<ProjectedReport | null> {
  const snapshot = await db.reportSnapshot.findUnique({ where: { reportId } });
  if (!snapshot) return null;
  const payload = snapshot.payload as unknown as ReportSnapshotPayload;
  if (!payload?.sections) return null;
  return projectSnapshot(payload, viewer);
}
