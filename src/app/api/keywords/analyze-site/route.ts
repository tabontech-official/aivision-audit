import { NextRequest, NextResponse } from "next/server";
import { analyzeEntireSiteKeywords } from "@/services/keywords/engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { websiteId } = body;

    if (!websiteId) {
      return NextResponse.json({ error: "Missing 'websiteId' in request body" }, { status: 400 });
    }

    const items = await analyzeEntireSiteKeywords(websiteId);

    return NextResponse.json({ success: true, count: items.length, items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to analyze site keywords";
    console.error("Analyze site keywords API error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
