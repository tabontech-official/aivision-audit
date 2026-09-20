import { NextRequest, NextResponse } from "next/server";
import { toggleTrackKeyword } from "@/services/keywords/engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { websiteId, keyword, searchVolume, cpc, difficulty, targetUrl } = body;

    if (!websiteId || !keyword) {
      return NextResponse.json({ error: "Missing websiteId or keyword" }, { status: 400 });
    }

    const result = await toggleTrackKeyword(websiteId, keyword, {
      searchVolume,
      cpc,
      difficulty,
      targetUrl,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to toggle keyword tracking";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
