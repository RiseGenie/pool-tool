"use client";

import { useState } from "react";
import type { SeoAuditResult } from "@/lib/seo-audit";

function scoreBadgeClass(score: number): string {
  if (score >= 70) return "bg-emerald-100 text-emerald-800 border-emerald-300";
  if (score >= 40) return "bg-amber-100 text-amber-800 border-amber-300";
  return "bg-rose-100 text-rose-800 border-rose-300";
}

const IMPACT_STYLES: Record<string, string> = {
  high: "bg-rose-100 text-rose-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-600",
};

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
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${scoreBadgeClass(result.score)}`}
            >
              <span className="tabular-nums">{result.score}</span>
              <span>SEO score</span>
            </span>
            <span className="text-xs text-slate-500">
              {issues.length} issue{issues.length === 1 ? "" : "s"} · {passes.length} passing
              {result.responseTimeMs !== null && ` · ${result.responseTimeMs}ms response`}
            </span>
          </div>

          {issues.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">Issue</th>
                    <th className="px-3 py-2">Impact</th>
                    <th className="px-3 py-2">Evidence</th>
                    <th className="px-3 py-2">Fix</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((f) => (
                    <tr key={f.id} className="border-t border-slate-100 align-top">
                      <td className="px-3 py-2 font-medium text-slate-800">{f.title}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded px-1.5 py-0.5 font-semibold ${IMPACT_STYLES[f.impact]}`}
                        >
                          {f.impact}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{f.evidence}</td>
                      <td className="px-3 py-2 text-slate-600">{f.fix}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {passes.length > 0 && (
            <details className="text-xs text-slate-500">
              <summary className="cursor-pointer font-semibold text-slate-600">
                {passes.length} check{passes.length === 1 ? "" : "s"} passing
              </summary>
              <ul className="mt-2 list-inside list-disc space-y-1">
                {passes.map((f) => (
                  <li key={f.id}>{f.title}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
