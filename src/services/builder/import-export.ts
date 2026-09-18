import "server-only";
import { db } from "@/lib/db/client";
import {
  sectionInputSchema,
  fieldInputSchema,
  type SectionInput,
  type FieldInput,
} from "@/lib/validation/builder";
import type { Prisma } from "@prisma/client";

/**
 * Bulk import / export for the report builder.
 *
 * Two behaviours the one-section-at-a-time importer never had:
 *
 *  1. **Re-importing the same section merges instead of colliding.** A section
 *     that already exists in the draft (matched on slug, then on name) keeps
 *     every one of its own settings; the incoming checks are appended to it as
 *     a named sub-section (stored in `AuditField.category`, which the builder
 *     renders as a group header). Only checks whose `fieldKey` already exists
 *     are touched, and only because they *are* that check — an edit, not a
 *     duplicate.
 *
 *  2. **One file can carry the whole template.** The payload may be a single
 *     section, an array of sections, or the `{ sections: [...] }` envelope that
 *     `exportDraftTemplate()` writes — so export → edit → import round-trips.
 */

export const TEMPLATE_EXPORT_FORMAT = "auditflow.template/v1";

export type ImportOptions = {
  /**
   * When a section already exists: overwrite its own settings (weight, plan
   * access, description, …) with the incoming ones. Default false — the main
   * section is left exactly as it is and only its checks grow.
   */
  updateSectionSettings?: boolean;
  /**
   * What to do with an incoming check whose `fieldKey` already exists in the
   * target section. "update" (default) rewrites it in place — that is how a
   * regenerated file applies changes. "skip" leaves the stored check untouched.
   */
  onExistingCheck?: "update" | "skip";
};

export type ImportSectionOutcome = {
  name: string;
  slug: string;
  action: "created" | "merged";
  /** Group header the appended checks were filed under, when merging. */
  subSection: string | null;
  createdChecks: number;
  updatedChecks: number;
  skippedChecks: number;
  sectionSettingsUpdated: boolean;
  restored: boolean;
};

export type ImportResult =
  | { ok: true; outcomes: ImportSectionOutcome[]; summary: string }
  | { ok: false; error: string };

type ParsedSection = {
  section: SectionInput;
  /** Explicit `subSection` key from the JSON, if the author set one. */
  subSection: string | null;
  /** Whether the file explicitly carried a pillar — an explicit pillar is
   *  taxonomy data and is adopted even by a settings-preserving merge. */
  pillarExplicit: boolean;
  fields: FieldInput[];
  /** Per-field `category` exactly as written in the file (before defaulting). */
  fieldCategories: Array<string | null>;
};

/* ------------------------------------------------------------------ */
/* Parsing + validation (all-or-nothing, before any write)             */
/* ------------------------------------------------------------------ */

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Accepts a single section, an array of sections, or `{ sections: [...] }`. */
function unwrapPayload(parsed: unknown): unknown[] | { error: string } {
  if (Array.isArray(parsed)) return parsed;

  const record = asRecord(parsed);
  if (!record) {
    return { error: "The JSON must be a section object, an array of sections, or { \"sections\": [...] }." };
  }

  if (Array.isArray(record.sections)) return record.sections;

  // A bare section — it has the keys a section has.
  if (typeof record.name === "string" || typeof record.slug === "string") return [parsed];

  return {
    error:
      "Could not find a section in this file. Expected a section object, an array of sections, or { \"sections\": [...] }.",
  };
}

/**
 * Validate the whole payload up front. A file with one bad check imports
 * nothing at all, so a half-applied template is never possible.
 */
export function parseTemplatePayload(
  jsonContent: string,
): { ok: true; sections: ParsedSection[] } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonContent);
  } catch {
    return { ok: false, error: "Invalid JSON format. Please ensure the file contains valid JSON." };
  }

  const unwrapped = unwrapPayload(parsed);
  if (!Array.isArray(unwrapped)) return { ok: false, error: unwrapped.error };
  if (unwrapped.length === 0) return { ok: false, error: "The file contains no sections." };
  if (unwrapped.length > 50) {
    return { ok: false, error: `Too many sections in one file (${unwrapped.length}). Import 50 or fewer at a time.` };
  }

  const sections: ParsedSection[] = [];

  for (let s = 0; s < unwrapped.length; s++) {
    const raw = asRecord(unwrapped[s]);
    const where = unwrapped.length > 1 ? `Section #${s + 1}` : "Section";
    if (!raw) return { ok: false, error: `${where} is not a JSON object.` };

    const sectionParsed = sectionInputSchema.safeParse(raw);
    if (!sectionParsed.success) {
      const issue = sectionParsed.error.issues[0];
      return {
        ok: false,
        error: `${where} failed validation${issue?.path?.length ? ` at "${issue.path.join(".")}"` : ""}: ${
          issue?.message ?? "Invalid section structure"
        }`,
      };
    }

    const rawFields = Array.isArray(raw.fields) ? (raw.fields as unknown[]) : [];
    const fields: FieldInput[] = [];
    const fieldCategories: Array<string | null> = [];
    const seenKeys = new Set<string>();

    for (let i = 0; i < rawFields.length; i++) {
      const fieldParsed = fieldInputSchema.safeParse(rawFields[i]);
      if (!fieldParsed.success) {
        const issue = fieldParsed.error.issues[0];
        return {
          ok: false,
          error: `${where}, check #${i + 1} failed validation${
            issue?.path?.length ? ` at "${issue.path.join(".")}"` : ""
          }: ${issue?.message ?? "Invalid check structure"}`,
        };
      }
      if (seenKeys.has(fieldParsed.data.fieldKey)) {
        return {
          ok: false,
          error: `${where} uses the field key "${fieldParsed.data.fieldKey}" twice. Field keys must be unique within a section.`,
        };
      }
      seenKeys.add(fieldParsed.data.fieldKey);
      fields.push(fieldParsed.data);

      const rawField = asRecord(rawFields[i]);
      const rawCategory = typeof rawField?.category === "string" ? rawField.category.trim() : "";
      fieldCategories.push(rawCategory || null);
    }

    const rawSub = typeof raw.subSection === "string" ? raw.subSection.trim() : "";

    sections.push({
      section: sectionParsed.data,
      subSection: rawSub ? rawSub.slice(0, 60) : null,
      pillarExplicit: typeof raw.pillar === "string" && raw.pillar.length > 0,
      fields,
      fieldCategories,
    });
  }

  return { ok: true, sections };
}

/* ------------------------------------------------------------------ */
/* Import                                                              */
/* ------------------------------------------------------------------ */

type Tx = Prisma.TransactionClient;

/**
 * Name for the group the appended checks are filed under. Explicit wins; a
 * differing section name is the next-best label; otherwise the incoming
 * one-liner; otherwise a numbered set so repeat imports stay distinguishable.
 */
function resolveSubSectionLabel(
  incoming: ParsedSection,
  existingName: string,
  existingCategories: Array<string | null>,
): string {
  if (incoming.subSection) return incoming.subSection;

  const name = incoming.section.name.trim();
  if (name.toLowerCase() !== existingName.trim().toLowerCase()) return name.slice(0, 60);

  const shortDescription = incoming.section.shortDescription?.trim();
  if (shortDescription && shortDescription.length <= 60) return shortDescription;

  // Numbered fallback: every existing group counts as one set, and any
  // ungrouped checks count as the section's original set.
  const distinct = new Set(existingCategories.filter((c): c is string => !!c));
  const hasUngrouped = existingCategories.some((c) => !c);
  return `Set ${distinct.size + (hasUngrouped ? 1 : 0) + 1}`;
}

function criteriaCreateData(criteria: FieldInput["criteria"]) {
  return {
    inspectionType: criteria.inspectionType,
    dataSource: criteria.dataSource,
    selector: criteria.selector ?? null,
    attributeName: criteria.attributeName ?? null,
    operator: criteria.operator,
    expectedValue: criteria.expectedValue ?? null,
    minValue: criteria.minValue ?? null,
    maxValue: criteria.maxValue ?? null,
    regexPattern: criteria.regexPattern ?? null,
    caseSensitive: criteria.caseSensitive,
    warnOperator: criteria.warnOperator ?? null,
    warnExpectedValue: criteria.warnExpectedValue ?? null,
    warnMinValue: criteria.warnMinValue ?? null,
    warnMaxValue: criteria.warnMaxValue ?? null,
    config: (criteria.config ?? {}) as Prisma.InputJsonValue,
  };
}

function suggestionRows(messages: FieldInput["messages"]) {
  return [
    { forStatus: "PASS" as const, message: messages.PASS.message ?? "Passed check.", suggestion: messages.PASS.suggestion ?? null },
    { forStatus: "FAIL" as const, message: messages.FAIL.message ?? "Failed check.", suggestion: messages.FAIL.suggestion ?? null },
    { forStatus: "WARNING" as const, message: messages.WARNING.message ?? "Warning check.", suggestion: messages.WARNING.suggestion ?? null },
  ];
}

async function writeField(
  tx: Tx,
  sectionId: string,
  field: FieldInput,
  displayOrder: number,
  category: string | null,
): Promise<void> {
  const { criteria, messages, ...scalar } = field;

  await tx.auditField.create({
    data: {
      sectionId,
      ...scalar,
      category,
      displayOrder,
      criteria: { create: criteriaCreateData(criteria) },
      suggestions: { createMany: { data: suggestionRows(messages) } },
    },
  });
}

async function rewriteField(
  tx: Tx,
  fieldId: string,
  field: FieldInput,
  category: string | null,
): Promise<void> {
  const { criteria, messages, ...scalar } = field;

  await tx.auditField.update({
    where: { id: fieldId },
    data: {
      ...scalar,
      // Only move the check into another group when the file says so.
      ...(category ? { category } : {}),
      deletedAt: null,
    },
  });

  await tx.auditCriteria.upsert({
    where: { fieldId },
    update: criteriaCreateData(criteria),
    create: { fieldId, ...criteriaCreateData(criteria) },
  });

  await tx.auditSuggestion.deleteMany({ where: { fieldId } });
  await tx.auditSuggestion.createMany({
    data: suggestionRows(messages).map((row) => ({ fieldId, ...row })),
  });
}

/**
 * Apply a validated payload to the draft version.
 * Runs as one transaction: either the whole file lands or none of it does.
 */
export async function importSections(
  draftVersionId: string,
  payload: ParsedSection[],
  options: ImportOptions = {},
): Promise<ImportResult> {
  const updateSectionSettings = options.updateSectionSettings ?? false;
  const onExistingCheck = options.onExistingCheck ?? "update";

  try {
    const outcomes = await db.$transaction(
      async (tx) => {
        const results: ImportSectionOutcome[] = [];

        const maxSection = await tx.reportSection.aggregate({
          where: { templateVersionId: draftVersionId, deletedAt: null },
          _max: { displayOrder: true },
        });
        let nextSectionOrder = (maxSection._max.displayOrder ?? 0) + 1;

        for (const incoming of payload) {
          const { section, fields, fieldCategories } = incoming;

          // Match on slug first (it is the unique key), then on name — an
          // admin regenerating a file often keeps the name and loses the slug.
          // Soft-deleted rows count: the DB unique constraint ignores deletedAt.
          const bySlug = await tx.reportSection.findUnique({
            where: { templateVersionId_slug: { templateVersionId: draftVersionId, slug: section.slug } },
          });
          const existing =
            bySlug ??
            (await tx.reportSection.findFirst({
              where: {
                templateVersionId: draftVersionId,
                name: { equals: section.name, mode: "insensitive" },
                deletedAt: null,
              },
            }));

          /* ---------- New section: create it whole ---------- */
          if (!existing) {
            const createdSection = await tx.reportSection.create({
              data: { templateVersionId: draftVersionId, ...section, displayOrder: nextSectionOrder++ },
            });

            for (let i = 0; i < fields.length; i++) {
              await writeField(
                tx,
                createdSection.id,
                fields[i]!,
                i + 1,
                fieldCategories[i] ?? incoming.subSection,
              );
            }

            results.push({
              name: createdSection.name,
              slug: createdSection.slug,
              action: "created",
              subSection: null,
              createdChecks: fields.length,
              updatedChecks: 0,
              skippedChecks: 0,
              sectionSettingsUpdated: false,
              restored: false,
            });
            continue;
          }

          /* ---------- Existing section: merge into it ---------- */
          const existingFields = await tx.auditField.findMany({
            where: { sectionId: existing.id },
            select: { id: true, fieldKey: true, category: true, displayOrder: true, deletedAt: true },
          });

          const restored = existing.deletedAt !== null;
          const settingsChanged = updateSectionSettings;
          // An explicitly-provided pillar is adopted even by a
          // settings-preserving merge: it is taxonomy data (where the section
          // renders), not a tuned setting like weight or plan access.
          const adoptPillar =
            incoming.pillarExplicit && !settingsChanged && existing.pillar !== section.pillar;

          if (restored || settingsChanged || adoptPillar) {
            await tx.reportSection.update({
              where: { id: existing.id },
              data: {
                ...(settingsChanged ? section : {}),
                ...(adoptPillar ? { pillar: section.pillar } : {}),
                ...(restored ? { deletedAt: null, displayOrder: nextSectionOrder++ } : {}),
              },
            });
          }

          const label = resolveSubSectionLabel(
            incoming,
            existing.name,
            existingFields.filter((f) => !f.deletedAt).map((f) => f.category),
          );

          const byKey = new Map(existingFields.map((f) => [f.fieldKey, f]));
          let nextFieldOrder =
            existingFields.reduce((max, f) => Math.max(max, f.displayOrder), 0) + 1;

          let createdChecks = 0;
          let updatedChecks = 0;
          let skippedChecks = 0;
          let usedLabel = false;

          for (let i = 0; i < fields.length; i++) {
            const field = fields[i]!;
            const explicitCategory = fieldCategories[i];
            const match = byKey.get(field.fieldKey);

            if (match) {
              if (onExistingCheck === "skip" && !match.deletedAt) {
                skippedChecks++;
                continue;
              }
              // A soft-deleted check coming back is effectively a re-add, so it
              // joins the new group; a live one keeps whatever group it is in.
              const category = explicitCategory ?? (match.deletedAt ? label : null);
              if (category === label) usedLabel = true;
              await rewriteField(tx, match.id, field, category);
              updatedChecks++;
              continue;
            }

            const category = explicitCategory ?? label;
            if (category === label) usedLabel = true;
            await writeField(tx, existing.id, field, nextFieldOrder++, category);
            createdChecks++;
          }

          results.push({
            name: existing.name,
            slug: existing.slug,
            action: "merged",
            subSection: usedLabel ? label : null,
            createdChecks,
            updatedChecks,
            skippedChecks,
            sectionSettingsUpdated: settingsChanged,
            restored,
          });
        }

        return results;
      },
      { timeout: 30_000, maxWait: 10_000 },
    );

    return { ok: true, outcomes, summary: summarize(outcomes) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Import failed and nothing was written: ${message.slice(0, 300)}` };
  }
}

function summarize(outcomes: ImportSectionOutcome[]): string {
  const created = outcomes.filter((o) => o.action === "created");
  const merged = outcomes.filter((o) => o.action === "merged");
  const checks = outcomes.reduce((n, o) => n + o.createdChecks, 0);
  const updated = outcomes.reduce((n, o) => n + o.updatedChecks, 0);
  const skipped = outcomes.reduce((n, o) => n + o.skippedChecks, 0);

  const parts: string[] = [];
  if (created.length) parts.push(`${created.length} section${created.length === 1 ? "" : "s"} created`);
  if (merged.length) parts.push(`${merged.length} section${merged.length === 1 ? "" : "s"} merged`);
  if (checks) parts.push(`${checks} check${checks === 1 ? "" : "s"} added`);
  if (updated) parts.push(`${updated} updated`);
  if (skipped) parts.push(`${skipped} left untouched`);

  return parts.length ? `Import complete — ${parts.join(", ")}.` : "Import complete — nothing to change.";
}

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

export type ExportResult =
  | {
      ok: true;
      json: string;
      fileName: string;
      sectionCount: number;
      fieldCount: number;
      /** Checks left out because they have no criteria row and could not be re-imported. */
      omittedFieldCount: number;
    }
  | { ok: false; error: string };

/**
 * Serialize the whole draft version as one file that `parseTemplatePayload()`
 * accepts unchanged — export, edit in an AI chat, import back.
 */
export async function exportDraftTemplate(draftVersionId: string): Promise<ExportResult> {
  const version = await db.templateVersion.findUnique({
    where: { id: draftVersionId },
    include: {
      template: { select: { name: true } },
      sections: {
        where: { deletedAt: null },
        orderBy: { displayOrder: "asc" },
        include: {
          fields: {
            where: { deletedAt: null },
            orderBy: { displayOrder: "asc" },
            include: { criteria: true, suggestions: true },
          },
        },
      },
    },
  });

  if (!version) return { ok: false, error: "Draft version not found." };

  let fieldCount = 0;
  let omittedFieldCount = 0;

  const sections = version.sections.map((section) => {
    const fields = section.fields
      .filter((field) => {
        if (field.criteria) return true;
        omittedFieldCount++;
        return false;
      })
      .map((field) => {
        fieldCount++;
        const messageFor = (status: "PASS" | "FAIL" | "WARNING") => {
          const row = field.suggestions.find((s) => s.forStatus === status);
          return { message: row?.message ?? "", suggestion: row?.suggestion ?? "" };
        };
        const c = field.criteria!;

        return {
          name: field.name,
          fieldKey: field.fieldKey,
          description: field.description ?? "",
          category: field.category ?? "",
          planAccess: field.planAccess,
          severity: field.severity,
          score: field.score,
          weight: field.weight,
          passLabel: field.passLabel,
          failLabel: field.failLabel,
          warningLabel: field.warningLabel,
          helpArticleUrl: field.helpArticleUrl ?? "",
          isEnabled: field.isEnabled,
          ...(field.appliesWhen ? { appliesWhen: field.appliesWhen } : {}),
          ...(field.pageType !== "HOME" ? { pageType: field.pageType } : {}),
          adminNotes: field.adminNotes ?? "",
          criteria: {
            inspectionType: c.inspectionType,
            dataSource: c.dataSource,
            selector: c.selector ?? "",
            attributeName: c.attributeName ?? "",
            operator: c.operator,
            expectedValue: c.expectedValue ?? "",
            ...(c.minValue !== null ? { minValue: c.minValue } : {}),
            ...(c.maxValue !== null ? { maxValue: c.maxValue } : {}),
            regexPattern: c.regexPattern ?? "",
            caseSensitive: c.caseSensitive,
            ...(c.warnOperator ? { warnOperator: c.warnOperator } : {}),
            ...(c.warnExpectedValue ? { warnExpectedValue: c.warnExpectedValue } : {}),
            ...(c.warnMinValue !== null ? { warnMinValue: c.warnMinValue } : {}),
            ...(c.warnMaxValue !== null ? { warnMaxValue: c.warnMaxValue } : {}),
            // The importer expects configJson as a STRING containing JSON.
            configJson: JSON.stringify(c.config ?? {}),
          },
          messages: {
            PASS: messageFor("PASS"),
            FAIL: messageFor("FAIL"),
            WARNING: messageFor("WARNING"),
          },
        };
      });

    return {
      name: section.name,
      slug: section.slug,
      shortDescription: section.shortDescription ?? "",
      detailedDescription: section.detailedDescription ?? "",
      icon: section.icon ?? undefined,
      weight: section.weight,
      contributesToScore: section.contributesToScore,
      planAccess: section.planAccess,
      isEnabled: section.isEnabled,
      defaultExpanded: section.defaultExpanded,
      visibleInReport: section.visibleInReport,
      accentColor: section.accentColor ?? "",
      pillar: section.pillar,
      ...(section.appliesWhen ? { appliesWhen: section.appliesWhen } : {}),
      adminNotes: section.adminNotes ?? "",
      fields,
    };
  });

  const envelope = {
    _format: TEMPLATE_EXPORT_FORMAT,
    _exportedAt: new Date().toISOString(),
    _note:
      "Import this file back through Report Builder → Import JSON. Sections that still exist are merged: the section keeps its own settings and the checks are appended as a sub-section, while checks with a matching fieldKey are updated in place. Add a \"subSection\" string to a section to name the group its checks land in.",
    template: version.template.name,
    versionNumber: version.versionNumber,
    sections,
  };

  return {
    ok: true,
    json: JSON.stringify(envelope, null, 2),
    fileName: `audit-template-v${version.versionNumber}-draft.json`,
    sectionCount: sections.length,
    fieldCount,
    omittedFieldCount,
  };
}
