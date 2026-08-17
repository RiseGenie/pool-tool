import { NextRequest, NextResponse } from "next/server";
import { deleteLead, getLead, updateLead } from "@/lib/repo/leads";
import { getScorecard } from "@/lib/repo/scorecards";
import type { NewLead } from "@/lib/types";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const lead = getLead(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  const scorecard = getScorecard(id);
  return NextResponse.json({ lead, scorecard });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = (await req.json()) as Partial<NewLead>;
  const lead = updateLead(id, body);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  return NextResponse.json(lead);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  deleteLead(id);
  return NextResponse.json({ ok: true });
}
