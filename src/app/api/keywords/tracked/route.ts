import { NextRequest, NextResponse } from "next/server";
import { getTrackedKeywords } from "@/services/keywords/engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const websiteId = searchParams.get("websiteId");

    if (!websiteId) {
      return NextResponse.json({ error: "Missing 'websiteId' query parameter" }, { status: 400 });
    }

    const items = await getTrackedKeywords(websiteId);

    return NextResponse.json({ websiteId, items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to retrieve tracked keywords";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
