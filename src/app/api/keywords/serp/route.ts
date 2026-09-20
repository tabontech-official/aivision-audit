import { NextRequest, NextResponse } from "next/server";
import { getKeywordSerp } from "@/services/keywords/engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keyword } = body;

    if (!keyword || typeof keyword !== "string" || !keyword.trim()) {
      return NextResponse.json({ error: "Keyword is required." }, { status: 400 });
    }

    const serp = await getKeywordSerp(keyword.trim());

    return NextResponse.json({ keyword: keyword.trim(), serp });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch SERP competitors";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
