import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

// Single local SQLite file — no server, no auth, survives restarts.
// V2 hook: if this ever needs to move to a hosted DB, this is the only
// file that would need to change; every repo/*.ts consumes `db` from here.
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "pool-tool.db");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

declare global {
  var __poolToolDb: Database.Database | undefined;
}

// Reuse the connection across hot reloads in dev so we don't hit
// "database is locked" from stacking up connections.
const db = globalThis.__poolToolDb ?? new Database(DB_PATH);
if (process.env.NODE_ENV !== "production") {
  globalThis.__poolToolDb = db;
}

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    business_name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    city TEXT,
    website_url TEXT,
    google_business_url TEXT,
    facebook_url TEXT,
    instagram_url TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS scorecards (
    lead_id TEXT PRIMARY KEY REFERENCES leads(id) ON DELETE CASCADE,
    gbp_claimed INTEGER,
    gbp_rating REAL,
    gbp_review_count INTEGER,
    gbp_last_review_date TEXT,
    gbp_owner_replies TEXT,
    website_exists INTEGER,
    website_mobile_friendly TEXT,
    website_has_contact_form INTEGER,
    website_gallery_updated TEXT,
    website_last_updated_signal TEXT,
    social_last_post_date TEXT,
    social_followers INTEGER,
    social_response_badge TEXT,
    social_unanswered_comments INTEGER,
    other_reviews_sentiment TEXT,
    local_search_rank TEXT,
    running_ads INTEGER,
    competitor_notes TEXT,
    hook TEXT,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS call_logs (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    timestamp TEXT NOT NULL,
    outcome TEXT NOT NULL,
    callback_datetime TEXT,
    notes TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_call_logs_lead_id ON call_logs(lead_id);
`);

export default db;
