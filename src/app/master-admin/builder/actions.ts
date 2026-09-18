"use server";

import { revalidatePath } from "next/cache";
import { db, ensureDbConnection, isTransientDbError } from "@/lib/db/client";
import { auth } from "@/lib/auth/auth";
import {
  sectionInputSchema,
  fieldInputSchema,
  testCriterionSchema,
} from "@/lib/validation/builder";
import { logAdminActivity } from "@/services/audit-log/log";
import { ensureDraftVersion, cloneVersionAsDraft } from "@/services/builder/draft";
import {
  parseTemplatePayload,
  importSections,
  exportDraftTemplate,
  type ImportOptions,
  type ImportSectionOutcome,
} from "@/services/builder/import-export";
import { validateAndNormalizeUrl } from "@/lib/security/url";
import { assertPublicHost } from "@/lib/security/ssrf";
import { rateLimit } from "@/lib/security/rate-limit";
import { fetchPage } from "@/services/inspection/fetcher";
import { extractFromHtml } from "@/services/inspection/extract-html";
import { extractValue, evaluateRules } from "@/services/criteria/extract-value";
import { evaluateCriteria } from "@/services/criteria/evaluate";
import { detectPlatform } from "@/services/inspection/detect-platform";
import type { CheckStatus, Prisma } from "@prisma/client";

export type BuilderResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/** Every builder action re-verifies the role server-side. */
async function requireAdmin(): Promise<{ id: string } | null> {
  const session = await auth();
  if (!session?.user || session.user.role !== "MASTER_ADMIN") return null;
  return { id: session.user.id };
}

const BUILDER_PATH = "/master-admin/builder";

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

export async function createSectionAction(input: unknown): Promise<BuilderResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const parsed = sectionInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const draft = await ensureDraftVersion();
  if (!draft) return { ok: false, error: "No default template exists. Run the seed first." };

  const slugTaken = await db.reportSection.findFirst({
    where: { templateVersionId: draft.id, slug: parsed.data.slug, deletedAt: null },
  });
  if (slugTaken) return { ok: false, error: "A section with this slug already exists." };

  const maxOrder = await db.reportSection.aggregate({
    where: { templateVersionId: draft.id, deletedAt: null },
    _max: { displayOrder: true },
  });

  const section = await db.reportSection.create({
    data: {
      templateVersionId: draft.id,
      ...parsed.data,
      displayOrder: (maxOrder._max.displayOrder ?? 0) + 1,
    },
  });

  await logAdminActivity({
    actorId: admin.id,
    action: "section.create",
    entityType: "report_section",
    entityId: section.id,
    after: parsed.data,
  });
  revalidatePath(BUILDER_PATH);
  return { ok: true, message: "Section created." };
}

export async function updateSectionAction(
  sectionId: string,
  input: unknown,
): Promise<BuilderResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const parsed = sectionInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const existing = await db.reportSection.findUnique({ where: { id: sectionId } });
  if (!existing || existing.deletedAt) return { ok: false, error: "Section not found." };

  const version = await db.templateVersion.findUnique({
    where: { id: existing.templateVersionId },
  });
  if (version?.status !== "DRAFT") {
    return { ok: false, error: "Only the draft version can be edited. Published versions are frozen." };
  }

  const slugTaken = await db.reportSection.findFirst({
    where: {
      templateVersionId: existing.templateVersionId,
      slug: parsed.data.slug,
      deletedAt: null,
      NOT: { id: sectionId },
    },
  });
  if (slugTaken) return { ok: false, error: "A section with this slug already exists." };

  await db.reportSection.update({ where: { id: sectionId }, data: parsed.data });

  await logAdminActivity({
    actorId: admin.id,
    action: "section.update",
    entityType: "report_section",
    entityId: sectionId,
    before: {
      name: existing.name, slug: existing.slug, planAccess: existing.planAccess,
      weight: existing.weight, isEnabled: existing.isEnabled,
    },
    after: parsed.data,
  });
  revalidatePath(BUILDER_PATH);
  return { ok: true, message: "Section updated." };
}

export async function toggleSectionAction(sectionId: string): Promise<BuilderResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const section = await db.reportSection.findUnique({ where: { id: sectionId } });
  if (!section || section.deletedAt) return { ok: false, error: "Section not found." };

  const version = await db.templateVersion.findUnique({ where: { id: section.templateVersionId } });
  if (version?.status !== "DRAFT") return { ok: false, error: "Only the draft version can be edited." };

  await db.reportSection.update({
    where: { id: sectionId },
    data: { isEnabled: !section.isEnabled },
  });
  await logAdminActivity({
    actorId: admin.id,
    action: section.isEnabled ? "section.disable" : "section.enable",
    entityType: "report_section",
    entityId: sectionId,
  });
  revalidatePath(BUILDER_PATH);
  return { ok: true };
}

export async function deleteSectionAction(sectionId: string): Promise<BuilderResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const section = await db.reportSection.findUnique({ where: { id: sectionId } });
  if (!section || section.deletedAt) return { ok: false, error: "Section not found." };
  if (section.isSystem) {
    return { ok: false, error: "System sections cannot be deleted. You can disable them instead." };
  }

  const version = await db.templateVersion.findUnique({ where: { id: section.templateVersionId } });
  if (version?.status !== "DRAFT") return { ok: false, error: "Only the draft version can be edited." };

  await db.reportSection.update({
    where: { id: sectionId },
    data: { deletedAt: new Date() },
  });
  await logAdminActivity({
    actorId: admin.id,
    action: "section.delete",
    entityType: "report_section",
    entityId: sectionId,
    before: { name: section.name, slug: section.slug },
  });
  revalidatePath(BUILDER_PATH);
  return { ok: true, message: "Section deleted." };
}

export async function duplicateSectionAction(sectionId: string): Promise<BuilderResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const section = await db.reportSection.findUnique({
    where: { id: sectionId },
    include: {
      fields: {
        where: { deletedAt: null },
        include: { criteria: true, suggestions: true },
      },
    },
  });
  if (!section || section.deletedAt) return { ok: false, error: "Section not found." };

  const version = await db.templateVersion.findUnique({ where: { id: section.templateVersionId } });
  if (version?.status !== "DRAFT") return { ok: false, error: "Only the draft version can be edited." };

  // Unique slug: append -copy, -copy-2, ...
  let newSlug = `${section.slug}-copy`;
  for (let i = 2; i < 20; i++) {
    const exists = await db.reportSection.findFirst({
      where: { templateVersionId: section.templateVersionId, slug: newSlug, deletedAt: null },
    });
    if (!exists) break;
    newSlug = `${section.slug}-copy-${i}`;
  }

  const maxOrder = await db.reportSection.aggregate({
    where: { templateVersionId: section.templateVersionId, deletedAt: null },
    _max: { displayOrder: true },
  });

  await db.$transaction(async (tx) => {
    const copy = await tx.reportSection.create({
      data: {
        templateVersionId: section.templateVersionId,
        name: `${section.name} (copy)`,
        slug: newSlug,
        shortDescription: section.shortDescription,
        detailedDescription: section.detailedDescription,
        icon: section.icon,
        displayOrder: (maxOrder._max.displayOrder ?? 0) + 1,
        isEnabled: false, // copies start disabled to avoid accidental duplicates in reports
        defaultExpanded: section.defaultExpanded,
        weight: section.weight,
        contributesToScore: section.contributesToScore,
        planAccess: section.planAccess,
        visibleInReport: section.visibleInReport,
        accentColor: section.accentColor,
        isSystem: false,
        pillar: section.pillar,
        appliesWhen: section.appliesWhen,
        adminNotes: section.adminNotes,
      },
    });
    for (const field of section.fields) {
      const newField = await tx.auditField.create({
        data: {
          sectionId: copy.id,
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
        },
      });
      if (field.criteria) {
        const { id: _id, fieldId: _fid, createdAt: _c, updatedAt: _u, ...criteriaData } = field.criteria;
        await tx.auditCriteria.create({
          data: {
            ...criteriaData,
            config: field.criteria.config as Prisma.InputJsonValue,
            fieldId: newField.id,
          },
        });
      }
      for (const s of field.suggestions) {
        await tx.auditSuggestion.create({
          data: { fieldId: newField.id, forStatus: s.forStatus, message: s.message, suggestion: s.suggestion },
        });
      }
    }
  }, { timeout: 20_000 });

  await logAdminActivity({
    actorId: admin.id,
    action: "section.duplicate",
    entityType: "report_section",
    entityId: sectionId,
    after: { newSlug },
  });
  revalidatePath(BUILDER_PATH);
  return { ok: true, message: "Section duplicated (disabled by default)." };
}

export async function reorderSectionsAction(orderedIds: string[]): Promise<BuilderResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };
  if (!Array.isArray(orderedIds) || orderedIds.length === 0 || orderedIds.length > 100) {
    return { ok: false, error: "Invalid order." };
  }

  const sections = await db.reportSection.findMany({
    where: { id: { in: orderedIds }, deletedAt: null },
    select: { id: true, templateVersionId: true },
  });
  if (sections.length !== orderedIds.length) return { ok: false, error: "Invalid order." };
  const versionIds = new Set(sections.map((s) => s.templateVersionId));
  if (versionIds.size !== 1) return { ok: false, error: "Invalid order." };
  const version = await db.templateVersion.findUnique({
    where: { id: sections[0]!.templateVersionId },
  });
  if (version?.status !== "DRAFT") return { ok: false, error: "Only the draft version can be edited." };

  await db.$transaction(
    orderedIds.map((id, i) =>
      db.reportSection.update({ where: { id }, data: { displayOrder: i + 1 } }),
    ),
  );
  await logAdminActivity({
    actorId: admin.id,
    action: "section.reorder",
    entityType: "template_version",
    entityId: version.id,
  });
  revalidatePath(BUILDER_PATH);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Fields                                                              */
/* ------------------------------------------------------------------ */

export async function saveFieldAction(
  sectionId: string,
  fieldId: string | null,
  input: unknown,
): Promise<BuilderResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const parsed = fieldInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const section = await db.reportSection.findUnique({ where: { id: sectionId } });
  if (!section || section.deletedAt) return { ok: false, error: "Section not found." };
  const version = await db.templateVersion.findUnique({ where: { id: section.templateVersionId } });
  if (version?.status !== "DRAFT") return { ok: false, error: "Only the draft version can be edited." };

  const { criteria, messages, ...fieldData } = parsed.data;

  const keyTaken = await db.auditField.findFirst({
    where: {
      sectionId,
      fieldKey: fieldData.fieldKey,
      deletedAt: null,
      ...(fieldId ? { NOT: { id: fieldId } } : {}),
    },
  });
  if (keyTaken) return { ok: false, error: "A check with this field key already exists in the section." };

  await db.$transaction(async (tx) => {
    let savedFieldId: string;
    if (fieldId) {
      const existing = await tx.auditField.findUnique({ where: { id: fieldId } });
      if (!existing || existing.sectionId !== sectionId) throw new Error("Field not found");
      await tx.auditField.update({ where: { id: fieldId }, data: fieldData });
      savedFieldId = fieldId;
    } else {
      const maxOrder = await tx.auditField.aggregate({
        where: { sectionId, deletedAt: null },
        _max: { displayOrder: true },
      });
      const created = await tx.auditField.create({
        data: {
          sectionId,
          ...fieldData,
          displayOrder: (maxOrder._max.displayOrder ?? 0) + 1,
        },
      });
      savedFieldId = created.id;
    }

    await tx.auditCriteria.upsert({
      where: { fieldId: savedFieldId },
      update: { ...criteria, config: criteria.config as Prisma.InputJsonValue },
      create: {
        fieldId: savedFieldId,
        ...criteria,
        config: criteria.config as Prisma.InputJsonValue,
      },
    });

    for (const status of ["PASS", "FAIL", "WARNING"] as const) {
      const pair = messages[status];
      if (pair.message) {
        await tx.auditSuggestion.upsert({
          where: { fieldId_forStatus: { fieldId: savedFieldId, forStatus: status } },
          update: { message: pair.message, suggestion: pair.suggestion ?? null },
          create: {
            fieldId: savedFieldId,
            forStatus: status,
            message: pair.message,
            suggestion: pair.suggestion ?? null,
          },
        });
      } else {
        await tx.auditSuggestion.deleteMany({
          where: { fieldId: savedFieldId, forStatus: status },
        });
      }
    }
  });

  await logAdminActivity({
    actorId: admin.id,
    action: fieldId ? "field.update" : "field.create",
    entityType: "audit_field",
    entityId: fieldId ?? undefined,
    after: { name: fieldData.name, fieldKey: fieldData.fieldKey, sectionId },
  });
  revalidatePath(BUILDER_PATH);
  return { ok: true, message: fieldId ? "Check updated." : "Check created." };
}

export async function toggleFieldAction(fieldId: string): Promise<BuilderResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const field = await db.auditField.findUnique({
    where: { id: fieldId },
    include: { section: true },
  });
  if (!field || field.deletedAt) return { ok: false, error: "Check not found." };
  const version = await db.templateVersion.findUnique({
    where: { id: field.section.templateVersionId },
  });
  if (version?.status !== "DRAFT") return { ok: false, error: "Only the draft version can be edited." };

  await db.auditField.update({
    where: { id: fieldId },
    data: { isEnabled: !field.isEnabled },
  });
  await logAdminActivity({
    actorId: admin.id,
    action: field.isEnabled ? "field.disable" : "field.enable",
    entityType: "audit_field",
    entityId: fieldId,
  });
  revalidatePath(BUILDER_PATH);
  return { ok: true };
}

export async function deleteFieldAction(fieldId: string): Promise<BuilderResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const field = await db.auditField.findUnique({
    where: { id: fieldId },
    include: { section: true },
  });
  if (!field || field.deletedAt) return { ok: false, error: "Check not found." };
  const version = await db.templateVersion.findUnique({
    where: { id: field.section.templateVersionId },
  });
  if (version?.status !== "DRAFT") return { ok: false, error: "Only the draft version can be edited." };

  await db.auditField.update({ where: { id: fieldId }, data: { deletedAt: new Date() } });
  await logAdminActivity({
    actorId: admin.id,
    action: "field.delete",
    entityType: "audit_field",
    entityId: fieldId,
    before: { name: field.name, fieldKey: field.fieldKey },
  });
  revalidatePath(BUILDER_PATH);
  return { ok: true, message: "Check deleted." };
}

export async function duplicateFieldAction(fieldId: string): Promise<BuilderResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const field = await db.auditField.findUnique({
    where: { id: fieldId },
    include: { section: true, criteria: true, suggestions: true },
  });
  if (!field || field.deletedAt) return { ok: false, error: "Check not found." };
  const version = await db.templateVersion.findUnique({
    where: { id: field.section.templateVersionId },
  });
  if (version?.status !== "DRAFT") return { ok: false, error: "Only the draft version can be edited." };

  let newKey = `${field.fieldKey}_copy`;
  for (let i = 2; i < 20; i++) {
    const exists = await db.auditField.findFirst({
      where: { sectionId: field.sectionId, fieldKey: newKey, deletedAt: null },
    });
    if (!exists) break;
    newKey = `${field.fieldKey}_copy_${i}`;
  }

  const maxOrder = await db.auditField.aggregate({
    where: { sectionId: field.sectionId, deletedAt: null },
    _max: { displayOrder: true },
  });

  await db.$transaction(async (tx) => {
    const copy = await tx.auditField.create({
      data: {
        sectionId: field.sectionId,
        name: `${field.name} (copy)`,
        fieldKey: newKey,
        description: field.description,
        displayOrder: (maxOrder._max.displayOrder ?? 0) + 1,
        isEnabled: false,
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
      },
    });
    if (field.criteria) {
      const { id: _id, fieldId: _fid, createdAt: _c, updatedAt: _u, ...criteriaData } = field.criteria;
      await tx.auditCriteria.create({
        data: {
          ...criteriaData,
          config: field.criteria.config as Prisma.InputJsonValue,
          fieldId: copy.id,
        },
      });
    }
    for (const s of field.suggestions) {
      await tx.auditSuggestion.create({
        data: { fieldId: copy.id, forStatus: s.forStatus, message: s.message, suggestion: s.suggestion },
      });
    }
  });

  await logAdminActivity({
    actorId: admin.id,
    action: "field.duplicate",
    entityType: "audit_field",
    entityId: fieldId,
    after: { newKey },
  });
  revalidatePath(BUILDER_PATH);
  return { ok: true, message: "Check duplicated (disabled by default)." };
}

export async function reorderFieldsAction(
  sectionId: string,
  orderedIds: string[],
): Promise<BuilderResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };
  if (!Array.isArray(orderedIds) || orderedIds.length === 0 || orderedIds.length > 200) {
    return { ok: false, error: "Invalid order." };
  }

  const fields = await db.auditField.findMany({
    where: { id: { in: orderedIds }, sectionId, deletedAt: null },
    select: { id: true },
  });
  if (fields.length !== orderedIds.length) return { ok: false, error: "Invalid order." };

  const section = await db.reportSection.findUnique({ where: { id: sectionId } });
  const version = section
    ? await db.templateVersion.findUnique({ where: { id: section.templateVersionId } })
    : null;
  if (version?.status !== "DRAFT") return { ok: false, error: "Only the draft version can be edited." };

  await db.$transaction(
    orderedIds.map((id, i) =>
      db.auditField.update({ where: { id }, data: { displayOrder: i + 1 } }),
    ),
  );
  revalidatePath(BUILDER_PATH);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Publish                                                             */
/* ------------------------------------------------------------------ */

export async function publishDraftAction(changelog: string): Promise<BuilderResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  try {
    // Publishing is a multi-step write. Wake the database and drop any dead
    // pooled connections first, so a suspended compute fails here instead of
    // halfway through freezing the version.
    await ensureDbConnection();

    const draft = await ensureDraftVersion();
    if (!draft) return { ok: false, error: "No draft version to publish." };

    const enabledSections = await db.reportSection.count({
      where: { templateVersionId: draft.id, isEnabled: true, deletedAt: null },
    });
    if (enabledSections === 0) {
      return { ok: false, error: "Enable at least one section before publishing." };
    }

    await db.templateVersion.update({
      where: { id: draft.id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        publishedById: admin.id,
        changelog: changelog.trim().slice(0, 500) || null,
      },
    });

    // Immediately clone a fresh draft so editing can continue. The clone runs
    // in its own transaction — if it fails the publish above still stands, and
    // `ensureDraftVersion()` recreates the draft on the next load.
    await cloneVersionAsDraft(draft.id, draft.templateId, draft.versionNumber + 1);

    await logAdminActivity({
      actorId: admin.id,
      action: "template.publish",
      entityType: "template_version",
      entityId: draft.id,
      after: { versionNumber: draft.versionNumber, changelog },
    });
    revalidatePath(BUILDER_PATH);
    return { ok: true, message: `Version ${draft.versionNumber} published. New audits will use it.` };
  } catch (err) {
    if (isTransientDbError(err)) {
      return {
        ok: false,
        error:
          "Lost the database connection while publishing. Reload the page to see whether the version went live, then try again.",
      };
    }
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Publish failed: ${message.slice(0, 300)}` };
  }
}

/* ------------------------------------------------------------------ */
/* Test criterion against a URL                                        */
/* ------------------------------------------------------------------ */

export type TestCriterionData = {
  status: CheckStatus;
  actualValue: string | null;
  expectedSummary: string;
  fetchedUrl: string;
  httpStatus: number;
  /** null when no gate was supplied; otherwise whether it passed on this URL */
  appliesWhenPassed: boolean | null;
  detectedPlatform: string | null;
};

export async function testCriterionAction(
  input: unknown,
): Promise<BuilderResult<TestCriterionData>> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const parsed = testCriterionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid test input." };
  }

  // Rate limit: expensive live fetches
  const rl = await rateLimit(`admin:test:${admin.id}`, 20, 60 * 60 * 1000);
  if (!rl.allowed) return { ok: false, error: "Test limit reached. Try again in a while." };

  const validated = validateAndNormalizeUrl(parsed.data.url);
  if (!validated.ok) return { ok: false, error: validated.error };

  const ssrf = await assertPublicHost(validated.value.hostname);
  if (!ssrf.ok) return { ok: false, error: ssrf.error };

  const fetched = await fetchPage(validated.value.url);
  if (!fetched.ok) return { ok: false, error: fetched.userMessage };

  const extracted = extractFromHtml(fetched.page);
  // Platform detection runs so site.* paths and appliesWhen gates behave as
  // they will in a real audit (robots/sitemap children are skipped for speed —
  // headers + HTML carry the strong signals).
  extracted.site = detectPlatform({
    html: fetched.page.html,
    responseHeaders: fetched.page.responseHeaders,
    robotsContent: null,
    sitemapChildren: [],
  });
  // Aux data + PSI are not fetched for tests (kept fast); PSI checks report NOT_APPLICABLE.
  const ctx = {
    extracted,
    html: fetched.page.html,
    psi: { mobile: null, desktop: null },
  };

  // Evaluate the gate the same way evaluate-report does: falsy → the check
  // would be NOT_APPLICABLE on this site; errors fail open.
  let appliesWhenPassed: boolean | null = null;
  if (parsed.data.appliesWhen) {
    try {
      appliesWhenPassed = Boolean(evaluateRules(JSON.parse(parsed.data.appliesWhen), extracted));
    } catch {
      appliesWhenPassed = true; // fail open, same as the pipeline
    }
  }

  const c = parsed.data.criteria;
  const criteriaRow = {
    id: "test", fieldId: "test",
    inspectionType: c.inspectionType,
    dataSource: c.dataSource,
    selector: c.selector ?? null,
    attributeName: c.attributeName ?? null,
    operator: c.operator,
    expectedValue: c.expectedValue ?? null,
    minValue: c.minValue ?? null,
    maxValue: c.maxValue ?? null,
    regexPattern: c.regexPattern ?? null,
    caseSensitive: c.caseSensitive,
    warnOperator: c.warnOperator ?? null,
    warnExpectedValue: c.warnExpectedValue ?? null,
    warnMinValue: c.warnMinValue ?? null,
    warnMaxValue: c.warnMaxValue ?? null,
    config: c.config as Prisma.JsonValue,
    createdAt: new Date(), updatedAt: new Date(),
  };

  const value = extractValue(criteriaRow, ctx);
  const outcome = evaluateCriteria(criteriaRow, value);

  await logAdminActivity({
    actorId: admin.id,
    action: "criterion.test",
    entityType: "audit_criteria",
    after: { url: validated.value.url, type: c.inspectionType, status: outcome.status },
  });

  return {
    ok: true,
    data: {
      status: outcome.status,
      actualValue: outcome.actualValue,
      expectedSummary: outcome.expectedSummary,
      fetchedUrl: fetched.page.finalUrl,
      httpStatus: fetched.page.httpStatus,
      appliesWhenPassed,
      detectedPlatform: extracted.site?.platform ?? null,
    },
  };
}

/* ------------------------------------------------------------------ */
/* JSON Import                                                         */
/* ------------------------------------------------------------------ */

/**
 * Import one section, an array of sections, or a full exported template.
 *
 * A section that already exists (matched on slug, then on name) is *merged*:
 * the section itself is left exactly as it is and the incoming checks are
 * appended as a named sub-section. Only checks whose `fieldKey` already exists
 * are rewritten, because those are the same check with new settings.
 */
export async function importSectionJsonAction(
  jsonContent: string,
  options?: ImportOptions,
): Promise<BuilderResult<ImportSectionOutcome[]>> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const parsed = parseTemplatePayload(jsonContent);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const draft = await ensureDraftVersion();
  if (!draft) return { ok: false, error: "No default template exists. Run the seed first." };
  if (draft.status !== "DRAFT") return { ok: false, error: "Only the draft version can be edited." };

  const result = await importSections(draft.id, parsed.sections, {
    updateSectionSettings: options?.updateSectionSettings ?? false,
    onExistingCheck: options?.onExistingCheck ?? "update",
  });
  if (!result.ok) return { ok: false, error: result.error };

  await logAdminActivity({
    actorId: admin.id,
    action: "section.import_json",
    entityType: "template_version",
    entityId: draft.id,
    after: {
      sections: result.outcomes.map((o) => ({
        name: o.name,
        slug: o.slug,
        action: o.action,
        subSection: o.subSection,
        createdChecks: o.createdChecks,
        updatedChecks: o.updatedChecks,
        skippedChecks: o.skippedChecks,
      })),
    },
  });

  revalidatePath(BUILDER_PATH);
  return { ok: true, message: result.summary, data: result.outcomes };
}

/* ------------------------------------------------------------------ */
/* JSON Export                                                         */
/* ------------------------------------------------------------------ */

export type TemplateExport = {
  json: string;
  fileName: string;
  sectionCount: number;
  fieldCount: number;
  omittedFieldCount: number;
};

/** Serialize the entire draft as one file the importer accepts unchanged. */
export async function exportTemplateJsonAction(): Promise<BuilderResult<TemplateExport>> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Not authorized." };

  const draft = await ensureDraftVersion();
  if (!draft) return { ok: false, error: "No default template exists. Run the seed first." };

  const result = await exportDraftTemplate(draft.id);
  if (!result.ok) return { ok: false, error: result.error };

  await logAdminActivity({
    actorId: admin.id,
    action: "template.export_json",
    entityType: "template_version",
    entityId: draft.id,
    after: { sectionCount: result.sectionCount, fieldCount: result.fieldCount },
  });

  const omitted = result.omittedFieldCount
    ? ` ${result.omittedFieldCount} check(s) without criteria were left out — they cannot be re-imported.`
    : "";

  return {
    ok: true,
    message: `Exported ${result.sectionCount} section(s) and ${result.fieldCount} check(s).${omitted}`,
    data: {
      json: result.json,
      fileName: result.fileName,
      sectionCount: result.sectionCount,
      fieldCount: result.fieldCount,
      omittedFieldCount: result.omittedFieldCount,
    },
  };
}

