import { db } from "@/lib/db/client";
import { extractSchemaFromHtml } from "./extractor";
import { validateExtractedSchemas } from "./validator";
import { SchemaValidationResult } from "./types";
import { Prisma } from "@prisma/client";
import { nanoid } from "nanoid";

/**
 * Runs a complete Schema Markup audit on a live URL and persists findings.
 */
export async function auditUrlSchema(
  targetUrl: string,
  websiteId?: string
): Promise<SchemaValidationResult & { auditId: string; url: string; domain: string }> {
  const normalizedUrl = normalizeUrl(targetUrl);
  let domain = "";
  try {
    domain = new URL(normalizedUrl).hostname.replace(/^www\./, "");
  } catch {
    domain = normalizedUrl;
  }

  // 1. Fetch live page HTML
  const html = await fetchPageHtml(normalizedUrl);

  // 2. Extract and Validate
  const extraction = extractSchemaFromHtml(html);
  const validation = validateExtractedSchemas(extraction.items);

  // 3. Persist to Neon DB with error resilience
  let auditId = nanoid();
  try {
    const audit = await db.schemaAudit.create({
      data: {
        websiteId: websiteId || null,
        url: normalizedUrl,
        domain,
        overallScore: validation.overallScore,
        totalSchemas: validation.totalSchemas,
        validCount: validation.validCount,
        errorCount: validation.errorCount,
        warningCount: validation.warningCount,
        opportunityCount: validation.opportunityCount,
        detectedTypes: validation.detectedTypes,
        status: "completed",
        rawExtractionJson: validation.items.map((i) => i.rawJson) as Prisma.InputJsonValue,
        summaryJson: validation.summary as unknown as Prisma.InputJsonValue,
        items: {
          create: validation.items.map((item) => ({
            schemaType: item.schemaType,
            format: item.format,
            isValid: item.isValid,
            hasErrors: item.hasErrors,
            hasWarnings: item.hasWarnings,
            rawJson: item.rawJson as Prisma.InputJsonValue,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    auditId = audit.id;

    // Save issues linked to schema items
    if (validation.issues.length > 0) {
      const issuesData = validation.issues.map((issue) => {
        const matchingItem = audit.items.find((it) => it.schemaType === issue.schemaType);
        return {
          auditId: audit.id,
          schemaItemId: matchingItem?.id || null,
          schemaType: issue.schemaType,
          field: issue.field || null,
          issueType: issue.issueType,
          severity: issue.severity,
          message: issue.message,
          recommendation: issue.recommendation,
        };
      });

      await db.schemaIssue.createMany({
        data: issuesData,
      });
    }
  } catch (dbErr) {
    console.error("Schema audit DB save notice (audit results preserved in memory):", dbErr);
  }

  return {
    ...validation,
    auditId,
    url: normalizedUrl,
    domain,
  };
}

/**
 * Direct evaluation of raw HTML string without network fetch.
 */
export function auditHtmlSchema(html: string): SchemaValidationResult {
  const extraction = extractSchemaFromHtml(html);
  return validateExtractedSchemas(extraction.items);
}

/**
 * Retrieves the latest schema audit from the database.
 */
export async function getLatestSchemaAudit(urlOrDomain: string) {
  const isUrl = urlOrDomain.startsWith("http://") || urlOrDomain.startsWith("https://");
  const normalized = isUrl ? normalizeUrl(urlOrDomain) : urlOrDomain.replace(/^www\./, "");

  try {
    const audit = await db.schemaAudit.findFirst({
      where: isUrl ? { url: normalized } : { domain: normalized },
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        issues: true,
      },
    });

    return audit;
  } catch (err) {
    console.error("getLatestSchemaAudit error:", err);
    return null;
  }
}

/**
 * Normalizes URL string to ensure protocol.
 */
function normalizeUrl(input: string): string {
  let trimmed = input.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Robust, standalone HTML fetcher with timeouts and realistic browser headers.
 */
async function fetchPageHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
    });

    if (!res.ok) {
      throw new Error(`Target returned HTTP status ${res.status}: ${res.statusText}`);
    }

    const text = await res.text();
    if (!text || text.length === 0) {
      throw new Error("Target returned an empty HTML response.");
    }
    return text;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("abort") || message.includes("timeout")) {
      throw new Error("Connection timed out while fetching the webpage (12s limit exceeded).");
    }
    throw new Error(`Unable to fetch target webpage: ${message}`);
  } finally {
    clearTimeout(timeoutId);
  }
}
