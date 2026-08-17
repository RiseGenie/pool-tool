"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { LeadWithMeta } from "@/lib/types";
import ScoreBadge from "./ScoreBadge";

type SortKey = "score" | "name" | "created";

export default function LeadTable({ leads }: { leads: LeadWithMeta[] }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = leads;
    if (q) {
      rows = rows.filter(
        (l) =>
          l.business_name.toLowerCase().includes(q) || (l.city ?? "").toLowerCase().includes(q)
      );
    }
    rows = [...rows].sort((a, b) => {
      if (sortKey === "score") return b.opportunity_score - a.opportunity_score;
      if (sortKey === "name") return a.business_name.localeCompare(b.business_name);
      return b.created_at.localeCompare(a.created_at);
    });
    return rows;
  }, [leads, query, sortKey]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-3">
        <input
          placeholder="Search by name or city…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-64 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
        />
        <div className="ml-auto flex items-center gap-2 text-sm text-slate-600">
          <span>Sort by</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="score">Opportunity score (highest first)</option>
            <option value="name">Name</option>
            <option value="created">Recently added</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="p-6 text-center text-sm text-slate-500">
          {leads.length === 0
            ? "No leads yet — add your first one above."
            : "No leads match your search."}
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2">Business</th>
              <th className="px-4 py-2">City</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Opportunity</th>
              <th className="px-4 py-2">Last call</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead) => (
              <tr key={lead.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/leads/${lead.id}`} className="font-medium text-slate-900 hover:underline">
                    {lead.business_name}
                  </Link>
                  {lead.contact_name && (
                    <div className="text-xs text-slate-500">{lead.contact_name}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{lead.city || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{lead.phone || "—"}</td>
                <td className="px-4 py-3">
                  <ScoreBadge score={lead.opportunity_score} label={lead.opportunity_label} />
                </td>
                <td className="px-4 py-3 text-slate-600">{lead.last_call_outcome || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
