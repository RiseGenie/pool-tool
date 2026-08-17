import db from "@/lib/db";
import type { Scorecard, ScorecardInput } from "@/lib/types";

type ScorecardRow = {
  lead_id: string;
  gbp_claimed: number | null;
  gbp_rating: number | null;
  gbp_review_count: number | null;
  gbp_last_review_date: string | null;
  gbp_owner_replies: string | null;
  website_exists: number | null;
  website_mobile_friendly: string | null;
  website_has_contact_form: number | null;
  website_gallery_updated: string | null;
  website_last_updated_signal: string | null;
  social_last_post_date: string | null;
  social_followers: number | null;
  social_response_badge: string | null;
  social_unanswered_comments: number | null;
  other_reviews_sentiment: string | null;
  local_search_rank: string | null;
  running_ads: number | null;
  competitor_notes: string | null;
  hook: string | null;
  notes: string | null;
};

const BOOLEAN_KEYS = [
  "gbp_claimed",
  "website_exists",
  "website_has_contact_form",
  "social_unanswered_comments",
  "running_ads",
] as const;

function intToBool(value: number | null): boolean | null {
  if (value === null || value === undefined) return null;
  return value === 1;
}

function boolToInt(value: boolean | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return value ? 1 : 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToScorecard(row: any): Scorecard {
  const r = row as ScorecardRow;
  return {
    lead_id: r.lead_id,
    gbp_claimed: intToBool(r.gbp_claimed),
    gbp_rating: r.gbp_rating,
    gbp_review_count: r.gbp_review_count,
    gbp_last_review_date: r.gbp_last_review_date,
    gbp_owner_replies: r.gbp_owner_replies as Scorecard["gbp_owner_replies"],
    website_exists: intToBool(r.website_exists),
    website_mobile_friendly: r.website_mobile_friendly as Scorecard["website_mobile_friendly"],
    website_has_contact_form: intToBool(r.website_has_contact_form),
    website_gallery_updated: r.website_gallery_updated as Scorecard["website_gallery_updated"],
    website_last_updated_signal: r.website_last_updated_signal,
    social_last_post_date: r.social_last_post_date,
    social_followers: r.social_followers,
    social_response_badge: r.social_response_badge as Scorecard["social_response_badge"],
    social_unanswered_comments: intToBool(r.social_unanswered_comments),
    other_reviews_sentiment: r.other_reviews_sentiment as Scorecard["other_reviews_sentiment"],
    local_search_rank: r.local_search_rank as Scorecard["local_search_rank"],
    running_ads: intToBool(r.running_ads),
    competitor_notes: r.competitor_notes,
    hook: r.hook,
    notes: r.notes,
  };
}

export function getScorecard(leadId: string): Scorecard | null {
  const row = db.prepare(`SELECT * FROM scorecards WHERE lead_id = ?`).get(leadId);
  return row ? rowToScorecard(row) : null;
}

export function upsertScorecard(leadId: string, input: Partial<ScorecardInput>): Scorecard {
  const existing = getScorecard(leadId);
  const merged: ScorecardInput = {
    gbp_claimed: input.gbp_claimed ?? existing?.gbp_claimed ?? null,
    gbp_rating: input.gbp_rating ?? existing?.gbp_rating ?? null,
    gbp_review_count: input.gbp_review_count ?? existing?.gbp_review_count ?? null,
    gbp_last_review_date: input.gbp_last_review_date ?? existing?.gbp_last_review_date ?? null,
    gbp_owner_replies: input.gbp_owner_replies ?? existing?.gbp_owner_replies ?? null,
    website_exists: input.website_exists ?? existing?.website_exists ?? null,
    website_mobile_friendly:
      input.website_mobile_friendly ?? existing?.website_mobile_friendly ?? null,
    website_has_contact_form:
      input.website_has_contact_form ?? existing?.website_has_contact_form ?? null,
    website_gallery_updated:
      input.website_gallery_updated ?? existing?.website_gallery_updated ?? null,
    website_last_updated_signal:
      input.website_last_updated_signal ?? existing?.website_last_updated_signal ?? null,
    social_last_post_date: input.social_last_post_date ?? existing?.social_last_post_date ?? null,
    social_followers: input.social_followers ?? existing?.social_followers ?? null,
    social_response_badge: input.social_response_badge ?? existing?.social_response_badge ?? null,
    social_unanswered_comments:
      input.social_unanswered_comments ?? existing?.social_unanswered_comments ?? null,
    other_reviews_sentiment:
      input.other_reviews_sentiment ?? existing?.other_reviews_sentiment ?? null,
    local_search_rank: input.local_search_rank ?? existing?.local_search_rank ?? null,
    running_ads: input.running_ads ?? existing?.running_ads ?? null,
    competitor_notes: input.competitor_notes ?? existing?.competitor_notes ?? null,
    hook: input.hook ?? existing?.hook ?? null,
    notes: input.notes ?? existing?.notes ?? null,
  };

  // Explicit-null fields (cleared by the user) should stay cleared rather than
  // falling back to the old value — only apply the `??` fallback for keys
  // absent from the input entirely.
  for (const key of Object.keys(input) as (keyof ScorecardInput)[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (merged as any)[key] = input[key];
  }

  const params = {
    lead_id: leadId,
    gbp_claimed: boolToInt(merged.gbp_claimed),
    gbp_rating: merged.gbp_rating,
    gbp_review_count: merged.gbp_review_count,
    gbp_last_review_date: merged.gbp_last_review_date,
    gbp_owner_replies: merged.gbp_owner_replies,
    website_exists: boolToInt(merged.website_exists),
    website_mobile_friendly: merged.website_mobile_friendly,
    website_has_contact_form: boolToInt(merged.website_has_contact_form),
    website_gallery_updated: merged.website_gallery_updated,
    website_last_updated_signal: merged.website_last_updated_signal,
    social_last_post_date: merged.social_last_post_date,
    social_followers: merged.social_followers,
    social_response_badge: merged.social_response_badge,
    social_unanswered_comments: boolToInt(merged.social_unanswered_comments),
    other_reviews_sentiment: merged.other_reviews_sentiment,
    local_search_rank: merged.local_search_rank,
    running_ads: boolToInt(merged.running_ads),
    competitor_notes: merged.competitor_notes,
    hook: merged.hook,
    notes: merged.notes,
  };

  db.prepare(
    `INSERT INTO scorecards (
      lead_id, gbp_claimed, gbp_rating, gbp_review_count, gbp_last_review_date, gbp_owner_replies,
      website_exists, website_mobile_friendly, website_has_contact_form, website_gallery_updated,
      website_last_updated_signal, social_last_post_date, social_followers, social_response_badge,
      social_unanswered_comments, other_reviews_sentiment, local_search_rank, running_ads,
      competitor_notes, hook, notes
    ) VALUES (
      @lead_id, @gbp_claimed, @gbp_rating, @gbp_review_count, @gbp_last_review_date, @gbp_owner_replies,
      @website_exists, @website_mobile_friendly, @website_has_contact_form, @website_gallery_updated,
      @website_last_updated_signal, @social_last_post_date, @social_followers, @social_response_badge,
      @social_unanswered_comments, @other_reviews_sentiment, @local_search_rank, @running_ads,
      @competitor_notes, @hook, @notes
    )
    ON CONFLICT(lead_id) DO UPDATE SET
      gbp_claimed = excluded.gbp_claimed,
      gbp_rating = excluded.gbp_rating,
      gbp_review_count = excluded.gbp_review_count,
      gbp_last_review_date = excluded.gbp_last_review_date,
      gbp_owner_replies = excluded.gbp_owner_replies,
      website_exists = excluded.website_exists,
      website_mobile_friendly = excluded.website_mobile_friendly,
      website_has_contact_form = excluded.website_has_contact_form,
      website_gallery_updated = excluded.website_gallery_updated,
      website_last_updated_signal = excluded.website_last_updated_signal,
      social_last_post_date = excluded.social_last_post_date,
      social_followers = excluded.social_followers,
      social_response_badge = excluded.social_response_badge,
      social_unanswered_comments = excluded.social_unanswered_comments,
      other_reviews_sentiment = excluded.other_reviews_sentiment,
      local_search_rank = excluded.local_search_rank,
      running_ads = excluded.running_ads,
      competitor_notes = excluded.competitor_notes,
      hook = excluded.hook,
      notes = excluded.notes`
  ).run(params);

  return getScorecard(leadId) as Scorecard;
}

export { BOOLEAN_KEYS };
