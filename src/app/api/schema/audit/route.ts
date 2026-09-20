import { NextRequest, NextResponse } from "next/server";
import { auditUrlSchema, getLatestSchemaAudit } from "@/services/schema/engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, websiteId, forceRefresh } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "A valid URL is required." }, { status: 400 });
    }

    // Check for cached audit if not forcing refresh
    if (!forceRefresh) {
      const existing = await getLatestSchemaAudit(url);
      if (existing) {
        // If audited within the last 24 hours, return cached
        const isFresh = Date.now() - new Date(existing.createdAt).getTime() < 24 * 60 * 60 * 1000;
        if (isFresh) {
          return NextResponse.json({
            auditId: existing.id,
            url: existing.url,
            domain: existing.domain,
            overallScore: existing.overallScore,
            totalSchemas: existing.totalSchemas,
            validCount: existing.validCount,
            errorCount: existing.errorCount,
            warningCount: existing.warningCount,
            opportunityCount: existing.opportunityCount,
            detectedTypes: existing.detectedTypes,
            items: existing.items,
            issues: existing.issues,
            summary: existing.summaryJson,
            cached: true,
          });
        }
      }
    }

    // Run new audit
    const result = await auditUrlSchema(url, websiteId);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal schema audit error";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "Missing 'url' query parameter" }, { status: 400 });
    }

    const audit = await getLatestSchemaAudit(url);
    if (!audit) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      auditId: audit.id,
      url: audit.url,
      domain: audit.domain,
      overallScore: audit.overallScore,
      totalSchemas: audit.totalSchemas,
      validCount: audit.validCount,
      errorCount: audit.errorCount,
      warningCount: audit.warningCount,
      opportunityCount: audit.opportunityCount,
      detectedTypes: audit.detectedTypes,
      items: audit.items,
      issues: audit.issues,
      summary: audit.summaryJson,
      createdAt: audit.createdAt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve schema audit";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
