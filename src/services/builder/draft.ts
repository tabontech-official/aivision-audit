import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db/client";
import type { Prisma } from "@prisma/client";

/**
 * Draft-version management for the report builder.
 * The admin always edits a DRAFT; publishing freezes it and clones a new one.
 * Reports pin the version they ran against, so history never mutates.
 */

/**
 * Postgres caps a statement at 65535 bind parameters, and Prisma does not split
 * `createMany` for you. 500 rows keeps every table here well under the cap while
 * still collapsing a whole template into a handful of round-trips.
 */
const INSERT_CHUNK = 500;

function chunk<T>(rows: T[], size = INSERT_CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

/**
 * Deep-clone a version's sections/fields/criteria/suggestions into a new DRAFT.
 *
 * Every row is built in memory with a client-generated UUID first, so the write
 * is a few bulk inserts rather than one round-trip per row. That matters: a
 * full template is thousands of rows, and a per-row loop against a remote
 * Postgres kept an interactive transaction open long enough for the pooler to
 * terminate the connection mid-publish.
 */
export async function cloneVersionAsDraft(
  sourceVersionId: string,
  templateId: string,
  newVersionNumber: number,
) {
  const source = await db.templateVersion.findUnique({
    where: { id: sourceVersionId },
    include: {
      sections: {
        where: { deletedAt: null },
        include: {
          fields: {
            where: { deletedAt: null },
            include: { criteria: true, suggestions: true },
          },
        },
      },
    },
  });
  if (!source) throw new Error("Source version not found");

  const draftId = randomUUID();
  const sectionRows: Prisma.ReportSectionCreateManyInput[] = [];
  const fieldRows: Prisma.AuditFieldCreateManyInput[] = [];
  const criteriaRows: Prisma.AuditCriteriaCreateManyInput[] = [];
  const suggestionRows: Prisma.AuditSuggestionCreateManyInput[] = [];

  for (const section of source.sections) {
    const sectionId = randomUUID();
    sectionRows.push({
      id: sectionId,
      templateVersionId: draftId,
      name: section.name,
      slug: section.slug,
      shortDescription: section.shortDescription,
      detailedDescription: section.detailedDescription,
      icon: section.icon,
      displayOrder: section.displayOrder,
      isEnabled: section.isEnabled,
      defaultExpanded: section.defaultExpanded,
      weight: section.weight,
      contributesToScore: section.contributesToScore,
      planAccess: section.planAccess,
      visibleInReport: section.visibleInReport,
      accentColor: section.accentColor,
      isSystem: section.isSystem,
      pillar: section.pillar,
      appliesWhen: section.appliesWhen,
      adminNotes: section.adminNotes,
    });

    for (const field of section.fields) {
      const fieldId = randomUUID();
      fieldRows.push({
        id: fieldId,
        sectionId,
        name: field.name,
        fieldKey: field.fieldKey,
        description: field.description,
        displayOrder: field.displayOrder,
        isEnabled: field.isEnabled,
        planAccess: field.planAccess,
        severity: field.severity,
        category: field.category,
        score: field.score,
        weight: field.weight,
        passLabel: field.passLabel,
        failLabel: field.failLabel,
        warningLabel: field.warningLabel,
        helpArticleUrl: field.helpArticleUrl,
        appliesWhen: field.appliesWhen,
        pageType: field.pageType,
        adminNotes: field.adminNotes,
      });

      if (field.criteria) {
        criteriaRows.push({
          id: randomUUID(),
          fieldId,
          inspectionType: field.criteria.inspectionType,
          dataSource: field.criteria.dataSource,
          selector: field.criteria.selector,
          attributeName: field.criteria.attributeName,
          operator: field.criteria.operator,
          expectedValue: field.criteria.expectedValue,
          minValue: field.criteria.minValue,
          maxValue: field.criteria.maxValue,
          regexPattern: field.criteria.regexPattern,
          caseSensitive: field.criteria.caseSensitive,
          warnOperator: field.criteria.warnOperator,
          warnExpectedValue: field.criteria.warnExpectedValue,
          warnMinValue: field.criteria.warnMinValue,
          warnMaxValue: field.criteria.warnMaxValue,
          config: (field.criteria.config ?? {}) as Prisma.InputJsonValue,
        });
      }

      for (const s of field.suggestions) {
        suggestionRows.push({
          id: randomUUID(),
          fieldId,
          forStatus: s.forStatus,
          message: s.message,
          suggestion: s.suggestion,
        });
      }
    }
  }

  return db.$transaction(
    async (tx) => {
      const draft = await tx.templateVersion.create({
        data: { id: draftId, templateId, versionNumber: newVersionNumber, status: "DRAFT" },
      });
      // Order matters: each table's FK points at the one before it.
      for (const rows of chunk(sectionRows)) await tx.reportSection.createMany({ data: rows });
      for (const rows of chunk(fieldRows)) await tx.auditField.createMany({ data: rows });
      for (const rows of chunk(criteriaRows)) await tx.auditCriteria.createMany({ data: rows });
      for (const rows of chunk(suggestionRows)) await tx.auditSuggestion.createMany({ data: rows });
      return draft;
    },
    { timeout: 30_000, maxWait: 10_000 },
  );
}

/**
 * Return the editable draft of the default template, creating one from the
 * latest version when none exists (e.g. right after seeding or publishing).
 */
export async function ensureDraftVersion() {
  const template = await db.reportTemplate.findFirst({
    where: { isDefault: true, deletedAt: null },
  });
  if (!template) return null;

  const draft = await db.templateVersion.findFirst({
    where: { templateId: template.id, status: "DRAFT" },
    orderBy: { versionNumber: "desc" },
  });
  if (draft) return draft;

  const latest = await db.templateVersion.findFirst({
    where: { templateId: template.id },
    orderBy: { versionNumber: "desc" },
  });
  if (!latest) return null;
  return cloneVersionAsDraft(latest.id, template.id, latest.versionNumber + 1);
}
