# Lead Call Prep

A single-user web app for researching pool-construction-company leads and
calling them with a personalized script. Each lead gets one screen combining
a research scorecard (left) and a live, personalized call script (right).

Originally scoped as local-only for V1; now also deployed (see "Deployment"
below) since a hosted link was needed to view it off the local machine.

## Stack

- **Next.js (App Router) + TypeScript + Tailwind** — one process serves both
  the UI and the API routes, so there's no separate backend process to run.
- **Postgres via Supabase** (`@supabase/supabase-js`) — swapped in from the
  original local SQLite (`better-sqlite3`) design so data persists on a
  serverless deploy, which has no durable local disk. `lib/db.ts` is the only
  file that knows about Supabase; everything else talks to `lib/repo/*`.

## Running it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. This talks to the same hosted Supabase project
as the deployed version (see `lib/db.ts`) — there's no separate local
database to set up.

## Deployment

Live at Vercel, connected to this repo's `main` branch. The Supabase project
URL and publishable (anon) key are baked into `lib/db.ts` rather than set as
Vercel env vars — that key is meant to be public and is scoped by the RLS
policies on the `leads`/`scorecards`/`call_logs` tables (see the
`init_schema` Supabase migration), so it's safe to ship in server-side code.
The Vercel project has password protection enabled at the platform level
(Project Settings → Deployment Protection) as the access gate, since this
tool has no in-app auth.

## How it works

1. **Add a lead** from the list screen (business name, contact, phone, city,
   links).
2. **Fill in the scorecard** on the lead's detail screen — six sections
   (GBP / Website / Social / Other Reviews / Local Search / Hook & Notes),
   traffic-light fields as one-click 3-button toggles, inline help under each
   field explaining what to check and why. Designed to take 5–10 minutes.
3. **Opportunity score** (0–100) and the **weakest scored area** compute live
   as you fill the form in — that weakest area becomes the pitch angle.
4. **The call script** on the right updates in real time: business name,
   city, and your hook are substituted into the opener/close, and the "soft
   pitch" paragraph is dynamically angled toward whichever gap scored
   weakest (reviews vs. follow-up speed vs. general online presence).
   Substituted values are highlighted. The objection-handling table is
   always visible underneath.
5. **Print / Save as PDF** gives a clean one-page version of the scorecard +
   script for the call, via the browser's native print dialog.
6. **Log the call outcome** at the bottom of the script panel — it shows up
   as "last call" in the lead list.

## Project structure

```
src/
  app/
    page.tsx                       # Lead List
    leads/[id]/page.tsx             # Lead Detail (scorecard + script)
    leads/[id]/print/page.tsx       # Print/export view
    api/leads/...                   # REST API routes (CRUD for leads/scorecards/calls)
  components/                       # UI components (forms, toggles, script panel, etc.)
  lib/
    db.ts                           # Supabase client
    types.ts                        # Lead / Scorecard / CallLog types
    scoring.ts                      # Weighted opportunity score + weakest-area detection
    script.ts                       # Call script generation with placeholder substitution
    repo/                           # Data access (leads, scorecards, call logs)
```

## Auto-fill

Two "Auto-fill" buttons on the scorecard reduce manual lookup — both stay
fully editable/overridable afterward:

- **Auto-fill from website** (`lib/website-scan.ts`, always on, no API key)
  — fetches the lead's site and infers `website_exists`,
  `website_mobile_friendly` (viewport meta), `website_has_contact_form`
  (`<form>`/`tel:` presence), and `website_last_updated_signal` (copyright
  year). These are heuristics, not ground truth.
- **Auto-fill from Google** (`lib/places-scan.ts`, needs
  `GOOGLE_PLACES_API_KEY`) — looks up the business by name+city via the
  Google Places API and fills `gbp_rating`, `gbp_review_count`, and
  `gbp_last_review_date`. Shows "Not set up yet" until a key is provided.

**Fields that can never be auto-fetched, for any business you don't
manage, regardless of tooling or budget** — these stay manual by
necessity, not by choice:
- `gbp_claimed` and `gbp_owner_replies` — Google doesn't expose
  claim/reply status for businesses outside your own account.
- All Facebook/Instagram fields (`social_last_post_date`,
  `social_followers`, `social_response_badge`,
  `social_unanswered_comments`) — Meta's Graph API only returns this for
  pages you administer.
- `other_reviews_sentiment`, `local_search_rank`, `running_ads`,
  `competitor_notes`, `website_gallery_updated` — would need paid
  scraping/SERP services (e.g. SerpApi) or manual lookup; no clean API
  exists for any of these.

## V2 hooks (not built, left as clear extension points)

- **CSV import/export** — the repo functions in `lib/repo/` are the only
  integration point a bulk import/export would need.
- A second script template (e.g. a "Call 2" demo/close call) — `lib/script.ts`
  is structured as one `buildScript()` function; a second template would live
  alongside it.

## Notes

- No in-app auth, no multi-user support — this is scoped for one person.
  Public access to the deployed URL is gated by Vercel's platform-level
  password protection instead of app code.
- No external research API calls are made. All scorecard fields are entered
  manually after you look them up.
