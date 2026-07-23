import "server-only";
import { db } from "@/lib/db/client";
import type { Prisma } from "@prisma/client";

/**
 * Draft-version management for the report builder.
 * The admin always edits a DRAFT; publishing freezes it and clones a new one.
 * Reports pin the version they ran against, so history never mutates.
 */

/** Deep-clone a version's sections/fields/criteria/suggestions into a new DRAFT. */
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

  return db.$transaction(
    async (tx) => {
      const draft = await tx.templateVersion.create({
        data: { templateId, versionNumber: newVersionNumber, status: "DRAFT" },
      });
      for (const section of source.sections) {
        const newSection = await tx.reportSection.create({
          data: {
            templateVersionId: draft.id,
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
            adminNotes: section.adminNotes,
          },
        });
        for (const field of section.fields) {
          const newField = await tx.auditField.create({
            data: {
              sectionId: newSection.id,
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
              adminNotes: field.adminNotes,
            },
          });
          if (field.criteria) {
            await tx.auditCriteria.create({
              data: {
                fieldId: newField.id,
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
                config: field.criteria.config as Prisma.InputJsonValue,
              },
            });
          }
          for (const s of field.suggestions) {
            await tx.auditSuggestion.create({
              data: {
                fieldId: newField.id,
                forStatus: s.forStatus,
                message: s.message,
                suggestion: s.suggestion,
              },
            });
          }
        }
      }
      return draft;
    },
    { timeout: 30_000 },
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
