# Lead Call Prep

A single-user, local-first web app for researching pool-construction-company
leads and calling them with a personalized script. Each lead gets one screen
combining a research scorecard (left) and a live, personalized call script
(right).

## Stack

- **Next.js (App Router) + TypeScript + Tailwind** — one process serves both
  the UI and the API routes, so there's no separate backend to run.
- **SQLite via `better-sqlite3`** — a single local file at `data/pool-tool.db`.
  No server, no auth, no deployment config. Data survives restarts.

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000. The SQLite file is created automatically at
`data/pool-tool.db` on first run (gitignored).

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
    db.ts                           # better-sqlite3 connection + schema
    types.ts                        # Lead / Scorecard / CallLog types
    scoring.ts                      # Weighted opportunity score + weakest-area detection
    script.ts                       # Call script generation with placeholder substitution
    repo/                           # Data access (leads, scorecards, call logs)
```

## V2 hooks (not built, left as clear extension points)

- **Auto-fetch GBP/social fields** — `lib/scoring.ts` and the `Scorecard`
  type already mirror the shape a Google Places / Facebook Graph API fetch
  would populate (rating, review count, followers, etc). Swapping manual
  entry for an auto-fetch only touches where those values originate.
- **CSV import/export** — the repo functions in `lib/repo/` are the only
  integration point a bulk import/export would need.
- A second script template (e.g. a "Call 2" demo/close call) — `lib/script.ts`
  is structured as one `buildScript()` function; a second template would live
  alongside it.

## Notes

- No auth, no multi-user support, no hosted backend — this is intentionally
  scoped to run on `localhost` for one person.
- No external API calls are made. All scorecard fields are entered manually
  after you look them up.
