import { notFound } from "next/navigation";
import { getLead } from "@/lib/repo/leads";
import { getScorecard } from "@/lib/repo/scorecards";
import { computeScore } from "@/lib/scoring";
import { buildScript, type Segment } from "@/lib/script";
import type { Scorecard, TrafficLight } from "@/lib/types";
import PrintButton from "@/components/PrintButton";

function fmtBool(v: boolean | null): string {
  if (v === null) return "—";
  return v ? "Yes" : "No";
}

function fmtTL(v: TrafficLight | null): string {
  if (!v) return "—";
  return v.charAt(0).toUpperCase() + v.slice(1);
}

function fmtVal(v: string | number | null): string {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-1 text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

function PrintSegments({ segments }: { segments: Segment[] }) {
  return (
    <p className="text-sm leading-relaxed">
      {segments.map((s, i) =>
        s.highlight ? (
          <strong key={i} className="underline">
            {s.text}
          </strong>
        ) : (
          <span key={i}>{s.text}</span>
        )
      )}
    </p>
  );
}

function scorecardSections(sc: Scorecard) {
  return [
    {
      title: "Google Business Profile",
      rows: [
        { label: "Claimed / verified", value: fmtBool(sc.gbp_claimed) },
        { label: "Star rating", value: fmtVal(sc.gbp_rating) },
        { label: "Review count", value: fmtVal(sc.gbp_review_count) },
        { label: "Most recent review", value: fmtVal(sc.gbp_last_review_date) },
        { label: "Owner replies to reviews", value: fmtTL(sc.gbp_owner_replies) },
      ],
    },
    {
      title: "Website",
      rows: [
        { label: "Exists", value: fmtBool(sc.website_exists) },
        { label: "Mobile-friendly", value: fmtTL(sc.website_mobile_friendly) },
        { label: "Contact form / click-to-call", value: fmtBool(sc.website_has_contact_form) },
        { label: "Gallery updated recently", value: fmtTL(sc.website_gallery_updated) },
        { label: "Last-updated signal", value: fmtVal(sc.website_last_updated_signal) },
      ],
    },
    {
      title: "Social",
      rows: [
        { label: "Last post date", value: fmtVal(sc.social_last_post_date) },
        { label: "Followers", value: fmtVal(sc.social_followers) },
        { label: "Responsive-to-messages badge", value: fmtTL(sc.social_response_badge) },
        { label: "Unanswered comments", value: fmtBool(sc.social_unanswered_comments) },
      ],
    },
    {
      title: "Other Reviews & Local Search",
      rows: [
        { label: "Other review sentiment", value: fmtTL(sc.other_reviews_sentiment) },
        { label: "Local search rank", value: fmtTL(sc.local_search_rank) },
        { label: "Running ads", value: fmtBool(sc.running_ads) },
        { label: "Competitor notes", value: fmtVal(sc.competitor_notes) },
      ],
    },
  ];
}

export default async function PrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = getLead(id);
  if (!lead) notFound();

  const scorecard = getScorecard(id);
  const sc: Scorecard =
    scorecard ?? {
      lead_id: id,
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

  const { score, label, weakest } = computeScore(sc);
  const script = buildScript(lead, sc, weakest);

  return (
    <div className="mx-auto max-w-4xl p-6 text-slate-900 print:p-2">
      <div className="no-print mb-4">
        <PrintButton />
      </div>

      <header className="mb-4 border-b-2 border-slate-900 pb-2">
        <h1 className="text-2xl font-bold">{lead.business_name}</h1>
        <p className="text-sm text-slate-600">
          {[lead.contact_name, lead.city, lead.phone, lead.email].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-1 text-sm font-semibold">
          Opportunity score: {score} — {label}
          {weakest ? ` · Suggested angle: ${weakest.label}` : ""}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-6">
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            Research Scorecard
          </h2>
          {scorecardSections(sc).map((section) => (
            <div key={section.title} className="mb-3">
              <h3 className="text-xs font-bold uppercase text-slate-400">{section.title}</h3>
              {section.rows.map((row) => (
                <Row key={row.label} label={row.label} value={row.value} />
              ))}
            </div>
          ))}
          <div className="mt-3">
            <h3 className="text-xs font-bold uppercase text-slate-400">Hook</h3>
            <p className="text-sm">{fmtVal(sc.hook)}</p>
          </div>
          {sc.notes && (
            <div className="mt-3">
              <h3 className="text-xs font-bold uppercase text-slate-400">Notes</h3>
              <p className="text-sm">{sc.notes}</p>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            Call Script
          </h2>

          <div className="mb-2">
            <h3 className="text-xs font-bold uppercase text-slate-400">Opener</h3>
            <PrintSegments segments={script.opener} />
            <p className="text-xs italic text-slate-500">{script.busyLine}</p>
          </div>

          <div className="mb-2">
            <h3 className="text-xs font-bold uppercase text-slate-400">Purpose</h3>
            <p className="text-sm leading-relaxed">{script.purpose}</p>
          </div>

          <div className="mb-2">
            <h3 className="text-xs font-bold uppercase text-slate-400">Discovery questions</h3>
            <ul className="list-inside list-disc text-sm">
              {script.discoveryQuestions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>

          <div className="mb-2">
            <h3 className="text-xs font-bold uppercase text-slate-400">Bridge to value</h3>
            <p className="text-sm leading-relaxed">{script.bridge}</p>
          </div>

          <div className="mb-2">
            <h3 className="text-xs font-bold uppercase text-slate-400">Soft pitch</h3>
            <PrintSegments segments={script.softPitch} />
          </div>

          <div className="mb-2">
            <h3 className="text-xs font-bold uppercase text-slate-400">Close</h3>
            <PrintSegments segments={script.close} />
          </div>
        </section>
      </div>

      <section className="mt-4 break-inside-avoid">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
          Objection Handling
        </h2>
        <table className="w-full border-collapse text-xs">
          <tbody>
            {script.objections.map((row) => (
              <tr key={row.objection} className="border-b border-slate-200 align-top">
                <td className="w-1/3 py-1 pr-2 font-semibold">{row.objection}</td>
                <td className="py-1 text-slate-700">{row.response}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
