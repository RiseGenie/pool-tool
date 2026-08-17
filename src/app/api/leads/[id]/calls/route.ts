import { NextRequest, NextResponse } from "next/server";
import { addCall, listCalls } from "@/lib/repo/calls";
import { getLead } from "@/lib/repo/leads";
import { CALL_OUTCOMES, type NewCallLog } from "@/lib/types";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  return NextResponse.json(listCalls(id));
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const lead = getLead(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const body = (await req.json()) as Partial<NewCallLog>;
  if (!body.outcome || !CALL_OUTCOMES.includes(body.outcome)) {
    return NextResponse.json({ error: "Valid outcome is required" }, { status: 400 });
  }

  const call = addCall(id, {
    outcome: body.outcome,
    callback_datetime: body.callback_datetime ?? null,
    notes: body.notes ?? null,
  });

  return NextResponse.json(call, { status: 201 });
}
