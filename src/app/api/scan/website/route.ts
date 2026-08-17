import { NextRequest, NextResponse } from "next/server";
import { scanWebsite } from "@/lib/website-scan";

export async function POST(req: NextRequest) {
  const { url } = (await req.json()) as { url?: string };
  if (!url || !url.trim()) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }
  const result = await scanWebsite(url);
  return NextResponse.json(result);
}
