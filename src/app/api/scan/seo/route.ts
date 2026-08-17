import { NextRequest, NextResponse } from "next/server";
import { runSeoAudit } from "@/lib/seo-audit";

export async function POST(req: NextRequest) {
  const { url } = (await req.json()) as { url?: string };
  if (!url || !url.trim()) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }
  const result = await runSeoAudit(url);
  return NextResponse.json(result);
}
