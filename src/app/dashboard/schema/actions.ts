"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { auth } from "@/lib/auth/auth";
import { getUserUsageSummary, recordSchemaUsage } from "@/services/billing/entitlements";
import { generateSchemaJsonLd } from "@/services/schema/generator";
import type { SchemaGeneratorInput } from "@/services/schema/types";

export type SchemaItemRow = {
  id: string;
  schemaType: string;
  name: string | null;
  pageUrl: string | null;
  jsonLd: string;
  formData: any;
  createdAt: Date;
  updatedAt: Date;
  websiteDomain?: string | null;
};

export async function getUserSchemaUsageAction() {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authorized" };
  }

  const summary = await getUserUsageSummary(session.user.id);
  return {
    ok: true,
    usage: {
      used: summary.schemas.used,
      limit: summary.schemas.limit,
      remaining: summary.schemas.remaining,
      isUnlimited: summary.schemas.isUnlimited,
      enabled: summary.schemas.enabled,
      periodResetsAt: summary.periodEnd,
    },
  };
}

export async function getSchemaHistoryAction(): Promise<{
  ok: boolean;
  schemas?: SchemaItemRow[];
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authorized" };
  }

  try {
    const schemas = await db.generatedSchema.findMany({
      where: { userId: session.user.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        website: { select: { domain: true } },
      },
    });

    return {
      ok: true,
      schemas: schemas.map((s) => ({
        id: s.id,
        schemaType: s.schemaType,
        name: s.name,
        pageUrl: s.pageUrl,
        jsonLd: s.jsonLd,
        formData: s.formData,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        websiteDomain: s.website?.domain || null,
      })),
    };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to load schema history" };
  }
}

export async function deleteSchemaAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authorized" };
  }

  try {
    const schema = await db.generatedSchema.findUnique({ where: { id } });
    if (!schema || schema.userId !== session.user.id) {
      return { ok: false, error: "Schema not found." };
    }

    await db.generatedSchema.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    revalidatePath("/dashboard/schema");
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to delete schema" };
  }
}

export async function saveGeneratedSchemaAction(input: {
  id?: string;
  schemaType: SchemaGeneratorInput["type"];
  name?: string;
  pageUrl?: string;
  data: any;
  websiteId?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authorized" };
  }

  const { id, schemaType, name, pageUrl, data, websiteId } = input;
  const jsonLdString = generateSchemaJsonLd({ type: schemaType, data });

  try {
    if (id) {
      // Update existing schema without deducting new generation credit
      const existing = await db.generatedSchema.findUnique({ where: { id } });
      if (!existing || existing.userId !== session.user.id) {
        return { ok: false, error: "Schema not found" };
      }

      const updated = await db.generatedSchema.update({
        where: { id },
        data: {
          schemaType,
          name: name || existing.name,
          pageUrl: pageUrl || existing.pageUrl,
          jsonLd: jsonLdString,
          formData: data,
          websiteId: websiteId || existing.websiteId,
        },
      });

      revalidatePath("/dashboard/schema");
      return { ok: true, schemaId: updated.id, jsonLd: jsonLdString };
    } else {
      // New schema generation: check plan limits
      const summary = await getUserUsageSummary(session.user.id);
      if (!summary.schemas.enabled) {
        return { ok: false, error: "Schema Builder is disabled on your current plan.", upgradeRequired: true };
      }
      if (summary.schemas.isLimitReached) {
        return {
          ok: false,
          error: `You've reached your monthly limit of ${summary.schemas.limit} schema generations. Upgrade your plan for more generations.`,
          upgradeRequired: true,
        };
      }

      const created = await db.generatedSchema.create({
        data: {
          userId: session.user.id,
          websiteId: websiteId || null,
          schemaType,
          name: name || `${schemaType} Schema`,
          pageUrl: pageUrl || null,
          jsonLd: jsonLdString,
          formData: data,
        },
      });

      await recordSchemaUsage({
        userId: session.user.id,
        websiteId: websiteId || null,
        schemaType,
        name: name || null,
      });

      revalidatePath("/dashboard/schema");
      return { ok: true, schemaId: created.id, jsonLd: jsonLdString };
    }
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to save schema" };
  }
}
