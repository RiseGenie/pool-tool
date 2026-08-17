import db from "@/lib/db";
import { computeScore } from "@/lib/scoring";
import type { Lead, LeadWithMeta, NewLead } from "@/lib/types";
import { rowToScorecard } from "./scorecards";

function generateId(): string {
  return crypto.randomUUID();
}

export function listLeads(): LeadWithMeta[] {
  const leads = db
    .prepare<[], Lead>(`SELECT * FROM leads ORDER BY created_at DESC`)
    .all();

  const scorecardStmt = db.prepare(`SELECT * FROM scorecards WHERE lead_id = ?`);
  const lastCallStmt = db.prepare(
    `SELECT outcome FROM call_logs WHERE lead_id = ? ORDER BY timestamp DESC LIMIT 1`
  );

  return leads.map((lead) => {
    const scorecardRow = scorecardStmt.get(lead.id);
    const scorecard = scorecardRow ? rowToScorecard(scorecardRow) : null;
    const { score, label } = computeScore(scorecard);
    const lastCall = lastCallStmt.get(lead.id) as { outcome: string } | undefined;

    return {
      ...lead,
      opportunity_score: score,
      opportunity_label: scorecard ? label : "Not scored",
      last_call_outcome: (lastCall?.outcome as LeadWithMeta["last_call_outcome"]) ?? null,
    };
  });
}

export function getLead(id: string): Lead | null {
  return (db.prepare(`SELECT * FROM leads WHERE id = ?`).get(id) as Lead | undefined) ?? null;
}

export function createLead(input: NewLead): Lead {
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

  db.prepare(
    `INSERT INTO leads (
      id, business_name, contact_name, phone, email, city,
      website_url, google_business_url, facebook_url, instagram_url, created_at
    ) VALUES (@id, @business_name, @contact_name, @phone, @email, @city,
      @website_url, @google_business_url, @facebook_url, @instagram_url, @created_at)`
  ).run(lead);

  // Seed an empty scorecard row so the detail screen always has one to edit.
  db.prepare(`INSERT INTO scorecards (lead_id) VALUES (?)`).run(lead.id);

  return lead;
}

export function updateLead(id: string, input: Partial<NewLead>): Lead | null {
  const existing = getLead(id);
  if (!existing) return null;

  const updated: Lead = { ...existing, ...input };

  db.prepare(
    `UPDATE leads SET
      business_name = @business_name,
      contact_name = @contact_name,
      phone = @phone,
      email = @email,
      city = @city,
      website_url = @website_url,
      google_business_url = @google_business_url,
      facebook_url = @facebook_url,
      instagram_url = @instagram_url
    WHERE id = @id`
  ).run(updated);

  return updated;
}

export function deleteLead(id: string): void {
  db.prepare(`DELETE FROM leads WHERE id = ?`).run(id);
}
