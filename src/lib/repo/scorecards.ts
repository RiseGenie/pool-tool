import { supabase } from "@/lib/db";
import type { Scorecard, ScorecardInput } from "@/lib/types";

export async function getScorecard(leadId: string): Promise<Scorecard | null> {
  const { data, error } = await supabase
    .from("scorecards")
    .select("*")
    .eq("lead_id", leadId)
    .maybeSingle();
  if (error) throw error;
  return (data as Scorecard) ?? null;
}

export async function upsertScorecard(
  leadId: string,
  input: Partial<ScorecardInput>
): Promise<Scorecard> {
  const existing = await getScorecard(leadId);

  const merged: Scorecard = {
    lead_id: leadId,
    gbp_claimed: existing?.gbp_claimed ?? null,
    gbp_rating: existing?.gbp_rating ?? null,
    gbp_review_count: existing?.gbp_review_count ?? null,
    gbp_last_review_date: existing?.gbp_last_review_date ?? null,
    gbp_owner_replies: existing?.gbp_owner_replies ?? null,
    website_exists: existing?.website_exists ?? null,
    website_mobile_friendly: existing?.website_mobile_friendly ?? null,
    website_has_contact_form: existing?.website_has_contact_form ?? null,
    website_gallery_updated: existing?.website_gallery_updated ?? null,
    website_last_updated_signal: existing?.website_last_updated_signal ?? null,
    social_last_post_date: existing?.social_last_post_date ?? null,
    social_followers: existing?.social_followers ?? null,
    social_response_badge: existing?.social_response_badge ?? null,
    social_unanswered_comments: existing?.social_unanswered_comments ?? null,
    other_reviews_sentiment: existing?.other_reviews_sentiment ?? null,
    local_search_rank: existing?.local_search_rank ?? null,
    running_ads: existing?.running_ads ?? null,
    competitor_notes: existing?.competitor_notes ?? null,
    hook: existing?.hook ?? null,
    notes: existing?.notes ?? null,
  };

  // Only fields actually present in the input (even if explicitly null, i.e.
  // cleared by the user) should override the existing value.
  for (const key of Object.keys(input) as (keyof ScorecardInput)[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (merged as any)[key] = input[key];
  }

  const { error } = await supabase.from("scorecards").upsert(merged, { onConflict: "lead_id" });
  if (error) throw error;

  return merged;
}
