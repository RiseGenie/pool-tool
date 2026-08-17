// Core domain types for Lead Call Prep.
//
// V2 hook: these types intentionally mirror what a Google Places API /
// Facebook Graph API auto-fetch would populate (gbp_rating, gbp_review_count,
// social_followers, etc). When that's wired up, those fields become
// read-only / auto-refreshed instead of manually typed.

export type TrafficLight = "green" | "yellow" | "red";

export interface Lead {
  id: string;
  business_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  website_url: string | null;
  google_business_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  created_at: string;
}

export type NewLead = Omit<Lead, "id" | "created_at">;

export interface Scorecard {
  lead_id: string;

  // Google Business Profile
  gbp_claimed: boolean | null;
  gbp_rating: number | null;
  gbp_review_count: number | null;
  gbp_last_review_date: string | null;
  gbp_owner_replies: TrafficLight | null;

  // Website
  website_exists: boolean | null;
  website_mobile_friendly: TrafficLight | null;
  website_has_contact_form: boolean | null;
  website_gallery_updated: TrafficLight | null;
  website_last_updated_signal: string | null;

  // Social
  social_last_post_date: string | null;
  social_followers: number | null;
  social_response_badge: TrafficLight | null;
  social_unanswered_comments: boolean | null;

  // Other reviews / local search / competitors
  other_reviews_sentiment: TrafficLight | null;
  local_search_rank: TrafficLight | null;
  running_ads: boolean | null;
  competitor_notes: string | null;

  // Hook & notes
  hook: string | null;
  notes: string | null;
}

export type ScorecardInput = Omit<Scorecard, "lead_id">;

export const CALL_OUTCOMES = [
  "Booked",
  "Callback requested",
  "Voicemail",
  "No answer",
  "Not interested",
  "Other",
] as const;

export type CallOutcome = (typeof CALL_OUTCOMES)[number];

export interface CallLog {
  id: string;
  lead_id: string;
  timestamp: string;
  outcome: CallOutcome;
  callback_datetime: string | null;
  notes: string | null;
}

export type NewCallLog = Omit<CallLog, "id" | "lead_id" | "timestamp"> & {
  timestamp?: string;
};

export interface LeadWithMeta extends Lead {
  opportunity_score: number;
  opportunity_label: "High opportunity" | "Moderate" | "Low opportunity" | "Not scored";
  last_call_outcome: CallOutcome | null;
}
