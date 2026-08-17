import type { Scorecard, TrafficLight } from "./types";

// ---------------------------------------------------------------------------
// Opportunity scoring
//
// Green = full points (they're doing well here -> low opportunity on this row)
// Yellow = half points
// Red / missing / falsy-on-a-desirable-boolean = 0 points
//
// gbp_owner_replies, social_response_badge, and website_has_contact_form are
// weighted highest because they map directly to the pitch: faster follow-up
// and a stronger review flow.
// ---------------------------------------------------------------------------

export type PitchAngle = "reviews" | "followup_speed" | "online_presence";

interface ScoredField {
  key: keyof Scorecard;
  weight: number;
  label: string;
  angle: PitchAngle;
  points: (sc: Scorecard) => number; // 0, 0.5, or 1
}

function boolPoints(value: boolean | null, desirableWhenTrue = true): number {
  if (value === null || value === undefined) return 0;
  const desirable = desirableWhenTrue ? value : !value;
  return desirable ? 1 : 0;
}

function trafficLightPoints(value: TrafficLight | null): number {
  if (value === "green") return 1;
  if (value === "yellow") return 0.5;
  return 0; // red or missing
}

function ratingPoints(rating: number | null): number {
  if (rating === null || rating === undefined) return 0;
  if (rating >= 4.5) return 1;
  if (rating >= 3.5) return 0.5;
  return 0;
}

function reviewCountPoints(count: number | null): number {
  if (count === null || count === undefined) return 0;
  if (count >= 50) return 1;
  if (count >= 15) return 0.5;
  return 0;
}

function daysSince(dateStr: string): number {
  const then = new Date(dateStr).getTime();
  if (Number.isNaN(then)) return Infinity;
  return (Date.now() - then) / (1000 * 60 * 60 * 24);
}

function recencyPoints(dateStr: string | null, greenWithinDays: number, yellowWithinDays: number): number {
  if (!dateStr) return 0;
  const days = daysSince(dateStr);
  if (days <= greenWithinDays) return 1;
  if (days <= yellowWithinDays) return 0.5;
  return 0;
}

const SCORED_FIELDS: ScoredField[] = [
  {
    key: "gbp_claimed",
    weight: 1,
    label: "Google Business Profile claimed",
    angle: "online_presence",
    points: (sc) => boolPoints(sc.gbp_claimed),
  },
  {
    key: "gbp_rating",
    weight: 1,
    label: "Google star rating",
    angle: "reviews",
    points: (sc) => ratingPoints(sc.gbp_rating),
  },
  {
    key: "gbp_review_count",
    weight: 1,
    label: "Google review count",
    angle: "reviews",
    points: (sc) => reviewCountPoints(sc.gbp_review_count),
  },
  {
    key: "gbp_last_review_date",
    weight: 1,
    label: "Recency of Google reviews",
    angle: "reviews",
    points: (sc) => recencyPoints(sc.gbp_last_review_date, 30, 90),
  },
  {
    key: "gbp_owner_replies",
    weight: 3,
    label: "Owner replies to Google reviews",
    angle: "reviews",
    points: (sc) => trafficLightPoints(sc.gbp_owner_replies),
  },
  {
    key: "website_exists",
    weight: 1,
    label: "Website presence",
    angle: "online_presence",
    points: (sc) => boolPoints(sc.website_exists),
  },
  {
    key: "website_mobile_friendly",
    weight: 1,
    label: "Mobile-friendly website",
    angle: "online_presence",
    points: (sc) => trafficLightPoints(sc.website_mobile_friendly),
  },
  {
    key: "website_has_contact_form",
    weight: 3,
    label: "Contact form / click-to-call on site",
    angle: "followup_speed",
    points: (sc) => boolPoints(sc.website_has_contact_form),
  },
  {
    key: "website_gallery_updated",
    weight: 1,
    label: "Recently updated project gallery",
    angle: "online_presence",
    points: (sc) => trafficLightPoints(sc.website_gallery_updated),
  },
  {
    key: "social_last_post_date",
    weight: 1,
    label: "Recency of social posts",
    angle: "online_presence",
    points: (sc) => recencyPoints(sc.social_last_post_date, 30, 90),
  },
  {
    key: "social_response_badge",
    weight: 3,
    label: "Social \"responsive to messages\" signal",
    angle: "followup_speed",
    points: (sc) => trafficLightPoints(sc.social_response_badge),
  },
  {
    key: "social_unanswered_comments",
    weight: 1,
    label: "Unanswered social comments",
    angle: "followup_speed",
    // desirable state is FALSE (no unanswered comments)
    points: (sc) => boolPoints(sc.social_unanswered_comments, false),
  },
  {
    key: "other_reviews_sentiment",
    weight: 1,
    label: "Sentiment on Yelp/Houzz/Angi/BBB",
    angle: "reviews",
    points: (sc) => trafficLightPoints(sc.other_reviews_sentiment),
  },
  {
    key: "local_search_rank",
    weight: 1,
    label: "Local search ranking",
    angle: "online_presence",
    points: (sc) => trafficLightPoints(sc.local_search_rank),
  },
  {
    key: "running_ads",
    weight: 1,
    label: "Running local ads",
    angle: "online_presence",
    points: (sc) => boolPoints(sc.running_ads),
  },
];

export interface WeakestArea {
  key: keyof Scorecard;
  label: string;
  angle: PitchAngle;
}

export interface ScoreResult {
  score: number; // 0-100
  label: "High opportunity" | "Moderate" | "Low opportunity";
  weakest: WeakestArea | null;
}

export function scoreLabel(score: number): ScoreResult["label"] {
  if (score < 40) return "High opportunity";
  if (score < 70) return "Moderate";
  return "Low opportunity";
}

export function computeScore(scorecard: Scorecard | null | undefined): ScoreResult {
  if (!scorecard) {
    return { score: 0, label: "High opportunity", weakest: null };
  }

  let totalWeight = 0;
  let earned = 0;
  let weakest: { field: ScoredField; points: number } | null = null;

  for (const field of SCORED_FIELDS) {
    const points = field.points(scorecard);
    totalWeight += field.weight;
    earned += field.weight * points;

    // Weakest = lowest points; tie-break toward the higher-weight field
    // since that's the one that matters most for the pitch.
    if (
      !weakest ||
      points < weakest.points ||
      (points === weakest.points && field.weight > weakest.field.weight)
    ) {
      weakest = { field, points };
    }
  }

  const score = totalWeight > 0 ? Math.round((earned / totalWeight) * 100) : 0;

  return {
    score,
    label: scoreLabel(score),
    weakest: weakest
      ? { key: weakest.field.key, label: weakest.field.label, angle: weakest.field.angle }
      : null,
  };
}

// V2 hook: once GBP/social auto-fetch lands, SCORED_FIELDS stays the same —
// only where the underlying values come from changes (manual entry -> API).
