"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { CallLog, Lead, Scorecard, ScorecardInput } from "@/lib/types";
import { computeScore } from "@/lib/scoring";
import { buildScript } from "@/lib/script";
import ScoreBadge from "./ScoreBadge";
import ScorecardForm from "./ScorecardForm";
import CallScriptPanel from "./CallScriptPanel";
import CallLogWidget from "./CallLogWidget";

const EMPTY_SCORECARD: Scorecard = {
  lead_id: "",
  gbp_claimed: null,
  gbp_rating: null,
  gbp_review_count: null,
  gbp_last_review_date: null,
  gbp_owner_replies: null,
  website_exists: null,
  website_mobile_friendly: null,
  website_has_contact_form: null,
  website_gallery_updated: null,
  website_last_updated_signal: null,
  social_last_post_date: null,
  social_followers: null,
  social_response_badge: null,
  social_unanswered_comments: null,
  other_reviews_sentiment: null,
  local_search_rank: null,
  running_ads: null,
  competitor_notes: null,
  hook: null,
  notes: null,
};

export default function LeadDetailClient({
  lead,
  initialScorecard,
  initialCalls,
}: {
  lead: Lead;
  initialScorecard: Scorecard | null;
  initialCalls: CallLog[];
}) {
  const [scorecard, setScorecard] = useState<Scorecard>(
    initialScorecard ?? { ...EMPTY_SCORECARD, lead_id: lead.id }
  );
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [mobileTab, setMobileTab] = useState<"scorecard" | "script">("scorecard");
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const { score, label, weakest } = useMemo(() => computeScore(scorecard), [scorecard]);
  const script = useMemo(() => buildScript(lead, scorecard, weakest), [lead, scorecard, weakest]);

  function handleChange(patch: Partial<ScorecardInput>) {
    setScorecard((prev) => ({ ...prev, ...patch }));
  }

  // Debounced autosave — fires ~500ms after the last edit so we're not
  // hitting the API on every keystroke.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaveState("saving");
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        await fetch(`/api/leads/${lead.id}/scorecard`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(scorecard),
        });
        setSaveState("saved");
      } catch {
        setSaveState("idle");
      }
    }, 500);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scorecard]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/" className="text-sm text-slate-500 hover:underline">
            ← All leads
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{lead.business_name}</h1>
          <p className="text-sm text-slate-500">
            {[lead.contact_name, lead.city, lead.phone].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <ScoreBadge score={score} label={label} />
            {weakest && (
              <p className="mt-1 max-w-xs text-xs text-slate-500">
                Weakest area / suggested angle: <span className="font-semibold">{weakest.label}</span>
              </p>
            )}
          </div>
          <Link
            href={`/leads/${lead.id}/print`}
            className="no-print rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Print / Save as PDF
          </Link>
        </div>
      </div>

      <p className="no-print text-xs text-slate-400">
        {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved." : ""}
      </p>

      {/* Mobile / narrow-screen tab switcher */}
      <div className="no-print flex gap-2 lg:hidden">
        <button
          onClick={() => setMobileTab("scorecard")}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
            mobileTab === "scorecard" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-300"
          }`}
        >
          Scorecard
        </button>
        <button
          onClick={() => setMobileTab("script")}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
            mobileTab === "script" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-300"
          }`}
        >
          Call Script
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={mobileTab === "scorecard" ? "block" : "hidden lg:block"}>
          <ScorecardForm scorecard={scorecard} onChange={handleChange} />
        </div>
        <div className={mobileTab === "script" ? "flex flex-col gap-4" : "hidden lg:flex lg:flex-col lg:gap-4"}>
          <CallScriptPanel model={script} />
          <CallLogWidget leadId={lead.id} initialCalls={initialCalls} />
        </div>
      </div>
    </div>
  );
}
