import type { LeadWithMeta } from "@/lib/types";

const STYLES: Record<LeadWithMeta["opportunity_label"], string> = {
  "High opportunity": "bg-emerald-100 text-emerald-800 border-emerald-300",
  Moderate: "bg-amber-100 text-amber-800 border-amber-300",
  "Low opportunity": "bg-rose-100 text-rose-800 border-rose-300",
  "Not scored": "bg-slate-100 text-slate-600 border-slate-300",
};

export default function ScoreBadge({
  score,
  label,
}: {
  score: number;
  label: LeadWithMeta["opportunity_label"];
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${STYLES[label]}`}
      title={label === "Not scored" ? "Fill in the scorecard to compute a score" : undefined}
    >
      <span className="tabular-nums">{score}</span>
      <span>{label}</span>
    </span>
  );
}
