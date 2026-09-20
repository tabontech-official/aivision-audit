import { NextRequest, NextResponse } from "next/server";
import { searchKeywords } from "@/services/keywords/engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, location, language, websiteId } = body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json({ error: "Search query is required." }, { status: 400 });
    }

    const result = await searchKeywords(query.trim(), location, language, websiteId);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Keyword search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
