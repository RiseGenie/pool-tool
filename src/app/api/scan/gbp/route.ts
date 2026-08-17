import { NextRequest, NextResponse } from "next/server";
import { scanGoogleBusinessProfile } from "@/lib/places-scan";

export async function POST(req: NextRequest) {
  const { query } = (await req.json()) as { query?: string };
  if (!query || !query.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }
  const result = await scanGoogleBusinessProfile(query);
  return NextResponse.json(result);
}
