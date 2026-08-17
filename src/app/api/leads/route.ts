import { NextRequest, NextResponse } from "next/server";
import { createLead, listLeads } from "@/lib/repo/leads";
import type { NewLead } from "@/lib/types";

export async function GET() {
  const leads = await listLeads();
  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<NewLead>;

  if (!body.business_name || !body.business_name.trim()) {
    return NextResponse.json({ error: "business_name is required" }, { status: 400 });
  }

  const lead = await createLead({
    business_name: body.business_name.trim(),
    contact_name: body.contact_name ?? null,
    phone: body.phone ?? null,
    email: body.email ?? null,
    city: body.city ?? null,
    website_url: body.website_url ?? null,
    google_business_url: body.google_business_url ?? null,
    facebook_url: body.facebook_url ?? null,
    instagram_url: body.instagram_url ?? null,
  });

  return NextResponse.json(lead, { status: 201 });
}
