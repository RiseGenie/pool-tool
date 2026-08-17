import { createClient } from "@supabase/supabase-js";

// Hosted Postgres via Supabase (needed once this app is deployed off
// localhost — a serverless deploy has no persistent local disk for
// better-sqlite3 to write to). The publishable key below is meant to be
// public: it only grants what the RLS policies on these tables allow
// (see the `init_schema` migration), and it's only ever used from
// server-side code here, never shipped to the browser.
const SUPABASE_URL = process.env.SUPABASE_URL || "https://rytjcgxdypxloncmpewc.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_KEY || "sb_publishable_6WKRLfPTj-BSsEjtGvqwSw_8LyFEDj_";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});
