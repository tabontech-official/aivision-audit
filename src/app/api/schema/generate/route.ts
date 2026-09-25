import { NextRequest, NextResponse } from "next/server";
import { generateSchemaJsonLd, buildSchemaPayload } from "@/services/schema/generator";
import { SchemaGeneratorInput } from "@/services/schema/types";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { getUserUsageSummary, recordSchemaUsage } from "@/services/billing/entitlements";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = (await req.json()) as SchemaGeneratorInput & {
      websiteId?: string;
      pageUrl?: string;
      name?: string;
      saveToHistory?: boolean;
    };
    const { type, data, websiteId, pageUrl, name, saveToHistory = true } = body;

    if (!type || !data) {
      return NextResponse.json({ error: "Missing 'type' or 'data' in request body." }, { status: 400 });
    }

    let usageSummary = null;
    if (session?.user?.id) {
      usageSummary = await getUserUsageSummary(session.user.id);
      if (!usageSummary.schemas.enabled) {
        return NextResponse.json(
          { error: "Schema Builder is disabled on your current plan. Please upgrade to access this feature.", upgradeRequired: true },
          { status: 403 },
        );
      }
      if (usageSummary.schemas.isLimitReached) {
        return NextResponse.json(
          {
            error: `You've reached your monthly limit of ${usageSummary.schemas.limit} schema generations. Upgrade to Pro for 100/mo or Agency for unlimited.`,
            limitReached: true,
            upgradeRequired: true,
          },
          { status: 429 },
        );
      }
    }

    const jsonLdString = generateSchemaJsonLd({ type, data });
    const payload = buildSchemaPayload(type, data);

    let savedSchemaId: string | null = null;
    if (session?.user?.id && saveToHistory) {
      const saved = await db.generatedSchema.create({
        data: {
          userId: session.user.id,
          websiteId: websiteId || null,
          schemaType: type,
          name: name || (data as Record<string, unknown>).headline as string || (data as Record<string, unknown>).name as string || `${type} Schema`,
          pageUrl: pageUrl || (data as Record<string, unknown>).url as string || null,
          jsonLd: jsonLdString,
          formData: data as any,
        },
      });
      savedSchemaId = saved.id;

      await recordSchemaUsage({
        userId: session.user.id,
        websiteId: websiteId || null,
        schemaType: type,
        name: name || null,
      });

      // Refetch updated usage
      usageSummary = await getUserUsageSummary(session.user.id);
    }

    return NextResponse.json({
      ok: true,
      schemaId: savedSchemaId,
      type,
      jsonLd: jsonLdString,
      payload,
      htmlSnippet: `<script type="application/ld+json">\n${jsonLdString}\n</script>`,
      usage: usageSummary
        ? {
            used: usageSummary.schemas.used,
            limit: usageSummary.schemas.limit,
            remaining: usageSummary.schemas.remaining,
            isUnlimited: usageSummary.schemas.isUnlimited,
            periodResetsAt: usageSummary.periodEnd,
          }
        : null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Schema generation error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
