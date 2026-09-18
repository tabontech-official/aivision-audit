import type { Metadata } from "next";
import { db } from "@/lib/db/client";
import { requireMasterAdmin } from "@/lib/auth/rbac";
import { ensureDraftVersion } from "@/services/builder/draft";
import { Alert } from "@/components/ui/alert";
import { BuilderClient, type BuilderData } from "./builder-client";

export const metadata: Metadata = { title: "Report Builder" };
export const revalidate = 60;

export default async function BuilderPage() {
  await requireMasterAdmin();

  const template = await db.reportTemplate.findFirst({
    where: { isDefault: true, deletedAt: null },
  });
  if (!template) {
    return (
      <Alert variant="error">
        No default report template exists. Run <code>npm run db:seed</code> first.
      </Alert>
    );
  }

  // Guarantee an editable draft exists (clones the latest published version
  // right after seeding or publishing) so the builder always shows content.
  const draftVersion = await ensureDraftVersion();

  const [draft, published] = await Promise.all([
    draftVersion
      ? db.templateVersion.findUnique({
          where: { id: draftVersion.id },
          include: {
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
        })
      : Promise.resolve(null),
    db.templateVersion.findFirst({
      where: { templateId: template.id, status: "PUBLISHED" },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true, publishedAt: true },
    }),
  ]);

  // Serialize for the client (dates → ISO, Json → plain)
  const data: BuilderData = {
    templateName: template.name,
    draft: draft
      ? {
          id: draft.id,
          versionNumber: draft.versionNumber,
          sections: draft.sections.map((s) => ({
            id: s.id,
            name: s.name,
            slug: s.slug,
            shortDescription: s.shortDescription,
            detailedDescription: s.detailedDescription,
            icon: s.icon,
            displayOrder: s.displayOrder,
            isEnabled: s.isEnabled,
            defaultExpanded: s.defaultExpanded,
            weight: s.weight,
            contributesToScore: s.contributesToScore,
            planAccess: s.planAccess,
            visibleInReport: s.visibleInReport,
            accentColor: s.accentColor,
            isSystem: s.isSystem,
            pillar: s.pillar,
            appliesWhen: s.appliesWhen,
            adminNotes: s.adminNotes,
            fields: s.fields.map((f) => ({
              id: f.id,
              name: f.name,
              fieldKey: f.fieldKey,
              description: f.description,
              isEnabled: f.isEnabled,
              planAccess: f.planAccess,
              severity: f.severity,
              category: f.category,
              score: f.score,
              weight: f.weight,
              passLabel: f.passLabel,
              failLabel: f.failLabel,
              warningLabel: f.warningLabel,
              helpArticleUrl: f.helpArticleUrl,
              appliesWhen: f.appliesWhen,
              pageType: f.pageType,
              adminNotes: f.adminNotes,
              criteria: f.criteria
                ? {
                    inspectionType: f.criteria.inspectionType,
                    dataSource: f.criteria.dataSource,
                    selector: f.criteria.selector,
                    attributeName: f.criteria.attributeName,
                    operator: f.criteria.operator,
                    expectedValue: f.criteria.expectedValue,
                    minValue: f.criteria.minValue,
                    maxValue: f.criteria.maxValue,
                    regexPattern: f.criteria.regexPattern,
                    caseSensitive: f.criteria.caseSensitive,
                    warnOperator: f.criteria.warnOperator,
                    warnExpectedValue: f.criteria.warnExpectedValue,
                    warnMinValue: f.criteria.warnMinValue,
                    warnMaxValue: f.criteria.warnMaxValue,
                    config: (f.criteria.config ?? {}) as Record<string, unknown>,
                  }
                : null,
              suggestions: f.suggestions.map((sg) => ({
                forStatus: sg.forStatus,
                message: sg.message,
                suggestion: sg.suggestion,
              })),
            })),
          })),
        }
      : null,
    publishedVersion: published
      ? {
          versionNumber: published.versionNumber,
          publishedAt: published.publishedAt?.toISOString() ?? null,
        }
      : null,
  };

  return <BuilderClient data={data} />;
}
