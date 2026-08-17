"use client";

import { useState } from "react";
import type { SeoAuditResult, SeoFinding } from "@/lib/seo-audit";

const IMPACT_STYLES: Record<string, string> = {
  high: "bg-rose-100 text-rose-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-600",
};

function scoreColor(score: number): string {
  if (score >= 70) return "#059669"; // emerald-600
  if (score >= 40) return "#d97706"; // amber-600
  return "#e11d48"; // rose-600
}

function ScoreRing({ score }: { score: number }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const color = scoreColor(score);

  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 72 72" className="h-20 w-20 -rotate-90">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tabular-nums" style={{ color }}>
          {score}
        </span>
      </div>
    </div>
  );
}

function CheckIcon({ ok }: { ok: boolean }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
        ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
      }`}
    >
      {ok ? (
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
          <path
            d="M3 8.5L6.2 11.5L13 4.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
          <path
            d="M4 4L12 12M12 4L4 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
    </span>
  );
}

function FindingCard({ finding }: { finding: SeoFinding }) {
  const ok = finding.status === "pass";
  return (
    <div
      className={`flex gap-3 rounded-lg border p-3 ${
        ok ? "border-emerald-200 bg-emerald-50/40" : "border-rose-200 bg-rose-50/40"
      }`}
    >
      <CheckIcon ok={ok} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">{finding.title}</span>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${IMPACT_STYLES[finding.impact]}`}
          >
            {finding.impact} impact
          </span>
        </div>
        <p className="mt-0.5 text-xs text-slate-600">{finding.evidence}</p>
        {!ok && (
          <p className="mt-1.5 rounded-md bg-white px-2 py-1.5 text-xs text-slate-700">
            <span className="font-semibold text-rose-700">Suggestion: </span>
            {finding.fix}
          </p>
        )}
      </div>
    </div>
  );
}

export default function SeoAuditPanel({ websiteUrl }: { websiteUrl: string | null }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<SeoAuditResult | null>(null);

  async function handleRunAudit() {
    if (!websiteUrl) return;
    setState("loading");
    try {
      const res = await fetch("/api/scan/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: websiteUrl }),
      });
      const data = (await res.json()) as SeoAuditResult;
      setResult(data);
      setState(data.error ? "error" : "done");
    } catch {
      setState("error");
    }
  }

  const issues = result?.findings.filter((f) => f.status === "issue") ?? [];
  const passes = result?.findings.filter((f) => f.status === "pass") ?? [];
  const orderedFindings = [...issues, ...passes];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">SEO Audit</h3>
          <p className="text-xs text-slate-500">
            Quick technical + on-page check of the lead&apos;s website — another concrete detail
            for the pitch.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRunAudit}
          disabled={state === "loading" || !websiteUrl}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          title={!websiteUrl ? "Add a website URL to this lead first" : undefined}
        >
          {state === "loading" ? "Auditing…" : "Run SEO audit"}
        </button>
      </div>

      {state === "error" && (
        <p className="mt-3 text-sm text-rose-600">{result?.error || "Couldn't run the audit."}</p>
      )}

      {result && !result.error && (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center gap-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
            <ScoreRing score={result.score} />
            <div>
              <p className="text-sm font-semibold text-slate-800">SEO health score</p>
              <p className="text-xs text-slate-500">
                {issues.length} issue{issues.length === 1 ? "" : "s"} to fix ·{" "}
                {passes.length} check{passes.length === 1 ? "" : "s"} passing
                {result.responseTimeMs !== null && ` · ${result.responseTimeMs}ms response`}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {orderedFindings.map((f) => (
              <FindingCard key={f.id} finding={f} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
