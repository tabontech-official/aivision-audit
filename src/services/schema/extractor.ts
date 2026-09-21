import * as cheerio from "cheerio";
import { ExtractedSchemaItem } from "./types";
import { nanoid } from "nanoid";

export interface ExtractionResult {
  items: ExtractedSchemaItem[];
  rawScriptsCount: number;
  syntaxErrorsCount: number;
}

/**
 * Extracts and parses all structured data (JSON-LD and Microdata) from HTML.
 */
export function extractSchemaFromHtml(html: string): ExtractionResult {
  const $ = cheerio.load(html);
  const items: ExtractedSchemaItem[] = [];
  let rawScriptsCount = 0;
  let syntaxErrorsCount = 0;

  // -------------------------------------------------------------
  // 1. JSON-LD Extraction (<script type="application/ld+json">)
  // -------------------------------------------------------------
  $('script[type="application/ld+json"]').each((_, elem) => {
    rawScriptsCount++;
    const rawContent = $(elem).html() || "";
    const trimmed = rawContent.trim();
    if (!trimmed) return;

    try {
      // Handle potential unescaped control characters
      const cleanJsonStr = trimmed.replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) =>
        c === "\n" || c === "\r" || c === "\t" ? c : ""
      );
      const parsed = JSON.parse(cleanJsonStr);

      processParsedJsonLd(parsed, items);
    } catch (err: unknown) {
      syntaxErrorsCount++;
      const errorMessage = err instanceof Error ? err.message : "JSON syntax parsing error";
      items.push({
        id: nanoid(10),
        schemaType: "Unknown (Invalid JSON)",
        format: "JSON-LD",
        rawJson: { raw: trimmed.slice(0, 500) },
        isValid: false,
        hasErrors: true,
        hasWarnings: false,
        issues: [
          {
            schemaType: "Unknown",
            issueType: "SYNTAX_ERROR",
            severity: "Error",
            message: `JSON-LD syntax error: ${errorMessage}`,
            recommendation:
              "Fix unescaped quotes, trailing commas, or invalid characters inside the <script type=\"application/ld+json\"> tag.",
          },
        ],
      });
    }
  });

  // -------------------------------------------------------------
  // 2. Microdata Extraction ([itemscope])
  // -------------------------------------------------------------
  $("[itemscope]").each((_, elem) => {
    // Only process top-level itemscopes (not nested ones)
    if ($(elem).parents("[itemscope]").length > 0) return;

    const itemTypeAttr = $(elem).attr("itemtype") || "";
    if (!itemTypeAttr) return;

    const typeName = itemTypeAttr.split("/").pop() || "MicrodataItem";
    const microdataObj: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": typeName,
    };

    // Extract child itemprops
    $(elem)
      .find("[itemprop]")
      .each((_, propElem) => {
        const propName = $(propElem).attr("itemprop");
        if (!propName) return;

        const propVal: string | undefined =
          $(propElem).attr("content") ||
          $(propElem).attr("href") ||
          $(propElem).attr("src") ||
          $(propElem).text().trim();

        if (propVal !== undefined && propName) {
          microdataObj[propName] = propVal;
        }
      });

    items.push({
      id: nanoid(10),
      schemaType: typeName,
      format: "Microdata",
      rawJson: microdataObj,
      isValid: true,
      hasErrors: false,
      hasWarnings: false,
      issues: [],
    });
  });

  return {
    items,
    rawScriptsCount,
    syntaxErrorsCount,
  };
}

/**
 * Normalizes arrays, `@graph` clusters, and single objects into discrete schema items.
 */
function processParsedJsonLd(parsed: unknown, items: ExtractedSchemaItem[]) {
  if (!parsed || typeof parsed !== "object") return;

  if (Array.isArray(parsed)) {
    parsed.forEach((entry) => processParsedJsonLd(entry, items));
    return;
  }

  const obj = parsed as Record<string, unknown>;

  // Check if it's a `@graph` container (used by WordPress, Yoast, RankMath, etc.)
  if (Array.isArray(obj["@graph"])) {
    obj["@graph"].forEach((entry) => {
      if (entry && typeof entry === "object") {
        const itemType = extractTypeString(entry["@type"]);
        items.push({
          id: nanoid(10),
          schemaType: itemType,
          format: "JSON-LD",
          rawJson: entry as Record<string, unknown>,
          isValid: true,
          hasErrors: false,
          hasWarnings: false,
          issues: [],
        });
      }
    });
    return;
  }

  // Single standalone JSON-LD object
  const itemType = extractTypeString(obj["@type"]);
  items.push({
    id: nanoid(10),
    schemaType: itemType,
    format: "JSON-LD",
    rawJson: obj,
    isValid: true,
    hasErrors: false,
    hasWarnings: false,
    issues: [],
  });
}

function extractTypeString(typeVal: unknown): string {
  if (typeof typeVal === "string" && typeVal.trim()) {
    return typeVal.trim();
  }
  if (Array.isArray(typeVal) && typeVal.length > 0) {
    return typeVal.map((t) => String(t)).join(", ");
  }
  return "Unknown";
}
