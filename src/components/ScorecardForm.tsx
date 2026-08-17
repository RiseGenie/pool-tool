"use client";

import { type ReactNode, useState } from "react";
import type { Lead, Scorecard, ScorecardInput } from "@/lib/types";
import type { WebsiteScanResult } from "@/lib/website-scan";
import type { PlacesScanResult } from "@/lib/places-scan";
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

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">{title}</h3>
        {action}
      </div>
      <div>{children}</div>
    </div>
  );
}

const textInputClass =
  "w-48 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-slate-500 focus:outline-none";

const autoFillButtonClass =
  "rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50";

export default function ScorecardForm({
  lead,
  scorecard,
  onChange,
}: {
  lead: Lead;
  scorecard: Scorecard;
  onChange: (patch: Partial<ScorecardInput>) => void;
}) {
  const [websiteScanState, setWebsiteScanState] = useState<
    "idle" | "loading" | "done" | "error"
  >("idle");
  const [gbpScanState, setGbpScanState] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [gbpScanMessage, setGbpScanMessage] = useState<string | null>(null);

  async function handleAutoFillWebsite() {
    if (!lead.website_url) return;
    setWebsiteScanState("loading");
    try {
      const res = await fetch("/api/scan/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: lead.website_url }),
      });
      const result = (await res.json()) as WebsiteScanResult;
      onChange({
        website_exists: result.website_exists,
        website_mobile_friendly: result.website_mobile_friendly,
        website_has_contact_form: result.website_has_contact_form,
        website_last_updated_signal: result.website_last_updated_signal,
      });
      setWebsiteScanState("done");
    } catch {
      setWebsiteScanState("error");
    }
  }

  async function handleAutoFillGbp() {
    const query = [lead.business_name, lead.city].filter(Boolean).join(" ");
    if (!query) return;
    setGbpScanState("loading");
    setGbpScanMessage(null);
    try {
      const res = await fetch("/api/scan/gbp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const result = (await res.json()) as PlacesScanResult;
      if (!result.configured) {
        setGbpScanState("error");
        setGbpScanMessage("Not set up yet — needs a Google Places API key.");
        return;
      }
      if (!result.found) {
        setGbpScanState("error");
        setGbpScanMessage(result.error || "No matching Google Business Profile found.");
        return;
      }
      onChange({
        gbp_rating: result.gbp_rating,
        gbp_review_count: result.gbp_review_count,
        gbp_last_review_date: result.gbp_last_review_date,
      });
      setGbpScanState("done");
    } catch {
      setGbpScanState("error");
      setGbpScanMessage("Lookup failed.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Section
        title="Google Business Profile"
        action={
          <div className="flex items-center gap-2">
            {gbpScanMessage && <span className="text-xs text-rose-500">{gbpScanMessage}</span>}
            <button
              type="button"
              onClick={handleAutoFillGbp}
              disabled={gbpScanState === "loading" || !lead.business_name}
              className={autoFillButtonClass}
              title="Auto-fills rating, review count, and most recent review date only — claimed status and owner replies can't be fetched for businesses you don't manage."
            >
              {gbpScanState === "loading" ? "Looking up…" : "Auto-fill from Google"}
            </button>
          </div>
        }
      >
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

      <Section
        title="Website"
        action={
          <div className="flex items-center gap-2">
            {websiteScanState === "error" && (
              <span className="text-xs text-rose-500">Couldn&apos;t reach that site.</span>
            )}
            <button
              type="button"
              onClick={handleAutoFillWebsite}
              disabled={websiteScanState === "loading" || !lead.website_url}
              className={autoFillButtonClass}
              title="Fetches the site and infers mobile-friendliness, contact form presence, and copyright year — heuristics, not ground truth."
            >
              {websiteScanState === "loading" ? "Scanning…" : "Auto-fill from website"}
            </button>
          </div>
        }
      >
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
