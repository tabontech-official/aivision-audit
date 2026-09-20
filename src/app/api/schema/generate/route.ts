import { NextRequest, NextResponse } from "next/server";
import { generateSchemaJsonLd, buildSchemaPayload } from "@/services/schema/generator";
import { SchemaGeneratorInput } from "@/services/schema/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SchemaGeneratorInput;
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json({ error: "Missing 'type' or 'data' in request body." }, { status: 400 });
    }

    const jsonLdString = generateSchemaJsonLd({ type, data });
    const payload = buildSchemaPayload(type, data);

    return NextResponse.json({
      type,
      jsonLd: jsonLdString,
      payload,
      htmlSnippet: `<script type="application/ld+json">\n${jsonLdString}\n</script>`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Schema generation error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
