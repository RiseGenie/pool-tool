"use client";

import type { ReactNode } from "react";
import type { Scorecard, ScorecardInput } from "@/lib/types";
import TrafficLight from "./TrafficLight";
import BoolToggle from "./BoolToggle";

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-800">{label}</span>
        {children}
      </div>
      <p className="text-xs text-slate-500">{help}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-500">{title}</h3>
      <div>{children}</div>
    </div>
  );
}

const textInputClass =
  "w-48 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none";

export default function ScorecardForm({
  scorecard,
  onChange,
}: {
  scorecard: Scorecard;
  onChange: (patch: Partial<ScorecardInput>) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Section title="Google Business Profile">
        <Field
          label="Claimed / verified?"
          help="Is the Google Business Profile claimed/verified? Reveals review-generation gap — core pitch angle."
        >
          <BoolToggle
            value={scorecard.gbp_claimed}
            onChange={(v) => onChange({ gbp_claimed: v })}
          />
        </Field>
        <Field label="Star rating" help="Google star rating (0–5).">
          <input
            type="number"
            min={0}
            max={5}
            step={0.1}
            className={textInputClass}
            value={scorecard.gbp_rating ?? ""}
            onChange={(e) =>
              onChange({ gbp_rating: e.target.value === "" ? null : Number(e.target.value) })
            }
          />
        </Field>
        <Field label="Review count" help="Total number of Google reviews.">
          <input
            type="number"
            min={0}
            className={textInputClass}
            value={scorecard.gbp_review_count ?? ""}
            onChange={(e) =>
              onChange({
                gbp_review_count: e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        </Field>
        <Field label="Most recent review date" help="Date of the most recent review.">
          <input
            type="date"
            className={textInputClass}
            value={scorecard.gbp_last_review_date ?? ""}
            onChange={(e) => onChange({ gbp_last_review_date: e.target.value || null })}
          />
        </Field>
        <Field
          label="Owner replies to reviews?"
          help="Does the owner respond to reviews? Reveals follow-up speed — highest-weighted pitch angle."
        >
          <TrafficLight
            value={scorecard.gbp_owner_replies}
            onChange={(v) => onChange({ gbp_owner_replies: v })}
          />
        </Field>
      </Section>

      <Section title="Website">
        <Field label="Website exists?" help="Do they have a live website?">
          <BoolToggle
            value={scorecard.website_exists}
            onChange={(v) => onChange({ website_exists: v })}
          />
        </Field>
        <Field label="Mobile-friendly?" help="Is the site usable/readable on a phone?">
          <TrafficLight
            value={scorecard.website_mobile_friendly}
            onChange={(v) => onChange({ website_mobile_friendly: v })}
          />
        </Field>
        <Field
          label="Contact form or click-to-call?"
          help="Contact form or click-to-call present? Reveals lead-capture gap — highest-weighted pitch angle."
        >
          <BoolToggle
            value={scorecard.website_has_contact_form}
            onChange={(v) => onChange({ website_has_contact_form: v })}
          />
        </Field>
        <Field label="Gallery updated recently?" help="Recent project photos on the site?">
          <TrafficLight
            value={scorecard.website_gallery_updated}
            onChange={(v) => onChange({ website_gallery_updated: v })}
          />
        </Field>
        <Field
          label="Last-updated signal"
          help="e.g. copyright year in footer — reveals credibility gap."
        >
          <input
            className={textInputClass}
            placeholder="e.g. © 2019"
            value={scorecard.website_last_updated_signal ?? ""}
            onChange={(e) => onChange({ website_last_updated_signal: e.target.value || null })}
          />
        </Field>
      </Section>

      <Section title="Social (Facebook / Instagram)">
        <Field label="Last post date" help="Date of the most recent Facebook/Instagram post.">
          <input
            type="date"
            className={textInputClass}
            value={scorecard.social_last_post_date ?? ""}
            onChange={(e) => onChange({ social_last_post_date: e.target.value || null })}
          />
        </Field>
        <Field label="Followers" help="Follower count, for context.">
          <input
            type="number"
            min={0}
            className={textInputClass}
            value={scorecard.social_followers ?? ""}
            onChange={(e) =>
              onChange({ social_followers: e.target.value === "" ? null : Number(e.target.value) })
            }
          />
        </Field>
        <Field
          label='"Responsive to messages" badge?'
          help='"Very responsive to messages" or similar signal — reveals responsiveness gap. Highest-weighted pitch angle.'
        >
          <TrafficLight
            value={scorecard.social_response_badge}
            onChange={(v) => onChange({ social_response_badge: v })}
          />
        </Field>
        <Field label="Unanswered comments?" help="Are there comments left unanswered?">
          <BoolToggle
            value={scorecard.social_unanswered_comments}
            onChange={(v) => onChange({ social_unanswered_comments: v })}
          />
        </Field>
      </Section>

      <Section title="Other Review Sites">
        <Field
          label="Sentiment (Yelp / Houzz / Angi / BBB)"
          help="Check sentiment and volume vs. Google — cross-check reputation, spot recurring complaints."
        >
          <TrafficLight
            value={scorecard.other_reviews_sentiment}
            onChange={(v) => onChange({ other_reviews_sentiment: v })}
          />
        </Field>
      </Section>

      <Section title="Local Search & Competitors">
        <Field
          label='Ranks for "pool builder [city]"?'
          help="Search it and check — frames urgency: competitors showing up, they aren't."
        >
          <TrafficLight
            value={scorecard.local_search_rank}
            onChange={(v) => onChange({ local_search_rank: v })}
          />
        </Field>
        <Field label="Running local ads?" help="Are they running ads for local search?">
          <BoolToggle
            value={scorecard.running_ads}
            onChange={(v) => onChange({ running_ads: v })}
          />
        </Field>
        <Field
          label="Competitor notes"
          help="2–3 nearby pool builders' sites/reviews — gives a comparison line for the pitch."
        >
          <input
            className={textInputClass}
            value={scorecard.competitor_notes ?? ""}
            onChange={(e) => onChange({ competitor_notes: e.target.value || null })}
          />
        </Field>
      </Section>

      <Section title="Hook & Notes">
        <div className="flex flex-col gap-1 border-b border-slate-100 py-3">
          <label className="text-sm font-medium text-slate-800">
            The hook <span className="text-rose-500">*</span>
          </label>
          <p className="text-xs text-slate-500">
            ONE specific, positive, verifiable detail — a recent great review, a nice project
            photo, years in business. This is the opening line of the call.
          </p>
          <textarea
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            rows={2}
            value={scorecard.hook ?? ""}
            onChange={(e) => onChange({ hook: e.target.value || null })}
            placeholder='e.g. "their 4.9-star reviews rave about how clean their crew leaves the yard"'
          />
        </div>
        <div className="flex flex-col gap-1 py-3">
          <label className="text-sm font-medium text-slate-800">Notes</label>
          <textarea
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            rows={3}
            value={scorecard.notes ?? ""}
            onChange={(e) => onChange({ notes: e.target.value || null })}
          />
        </div>
      </Section>
    </div>
  );
}
