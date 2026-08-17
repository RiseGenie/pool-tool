import { NextRequest, NextResponse } from "next/server";
import { getScorecard, upsertScorecard } from "@/lib/repo/scorecards";
import { getLead } from "@/lib/repo/leads";
import type { ScorecardInput } from "@/lib/types";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const scorecard = await getScorecard(id);
  return NextResponse.json(scorecard);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const body = (await req.json()) as Partial<ScorecardInput>;
  const scorecard = await upsertScorecard(id, body);
  return NextResponse.json(scorecard);
}
