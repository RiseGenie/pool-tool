import { supabase } from "@/lib/db";
import { computeScore } from "@/lib/scoring";
import type { Lead, LeadWithMeta, NewLead } from "@/lib/types";
import { getScorecard } from "./scorecards";

function generateId(): string {
  return crypto.randomUUID();
}

export async function listLeads(): Promise<LeadWithMeta[]> {
  const { data: leads, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const results: LeadWithMeta[] = [];
  for (const lead of (leads ?? []) as Lead[]) {
    const scorecard = await getScorecard(lead.id);
    const { score, label } = computeScore(scorecard);
    const { data: lastCall } = await supabase
      .from("call_logs")
      .select("outcome")
      .eq("lead_id", lead.id)
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();

    results.push({
      ...lead,
      opportunity_score: score,
      opportunity_label: scorecard ? label : "Not scored",
      last_call_outcome: (lastCall?.outcome as LeadWithMeta["last_call_outcome"]) ?? null,
    });
  }
  return results;
}

export async function getLead(id: string): Promise<Lead | null> {
  const { data, error } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Lead) ?? null;
}

export async function createLead(input: NewLead): Promise<Lead> {
  const lead: Lead = {
    id: generateId(),
    business_name: input.business_name,
    contact_name: input.contact_name ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    city: input.city ?? null,
    website_url: input.website_url ?? null,
    google_business_url: input.google_business_url ?? null,
    facebook_url: input.facebook_url ?? null,
    instagram_url: input.instagram_url ?? null,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("leads").insert(lead);
  if (error) throw error;

  // Seed an empty scorecard row so the detail screen always has one to edit.
  const { error: scError } = await supabase.from("scorecards").insert({ lead_id: lead.id });
  if (scError) throw scError;

  return lead;
}

export async function updateLead(id: string, input: Partial<NewLead>): Promise<Lead | null> {
  const existing = await getLead(id);
  if (!existing) return null;

  const updated: Lead = { ...existing, ...input };

  const { error } = await supabase.from("leads").update(updated).eq("id", id);
  if (error) throw error;

  return updated;
}

export async function deleteLead(id: string): Promise<void> {
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) throw error;
}
