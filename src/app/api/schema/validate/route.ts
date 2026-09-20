import { NextRequest, NextResponse } from "next/server";
import { validateExtractedSchemas } from "@/services/schema/validator";
import { nanoid } from "nanoid";
import { ExtractedSchemaItem } from "@/services/schema/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawJson } = body;

    if (!rawJson) {
      return NextResponse.json({ error: "Missing 'rawJson' in request body." }, { status: 400 });
    }

    let parsed: Record<string, unknown>;
    if (typeof rawJson === "string") {
      try {
        parsed = JSON.parse(rawJson);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "JSON syntax error";
        return NextResponse.json({
          overallScore: 0,
          isValid: false,
          errors: [
            {
              issueType: "SYNTAX_ERROR",
              severity: "Error",
              message: `Syntax parsing failed: ${msg}`,
              recommendation: "Ensure JSON is well-formed with valid quotes and brackets.",
            },
          ],
        });
      }
    } else {
      parsed = rawJson;
    }

    const typeStr = String(parsed["@type"] || "Unknown");
    const item: ExtractedSchemaItem = {
      id: nanoid(10),
      schemaType: typeStr,
      format: "JSON-LD",
      rawJson: parsed,
      isValid: true,
      hasErrors: false,
      hasWarnings: false,
      issues: [],
    };

    const result = validateExtractedSchemas([item]);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Validation error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
