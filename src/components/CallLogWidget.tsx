"use client";

import { useState } from "react";
import { CALL_OUTCOMES, type CallLog, type CallOutcome } from "@/lib/types";

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CallLogWidget({
  leadId,
  initialCalls,
}: {
  leadId: string;
  initialCalls: CallLog[];
}) {
  const [calls, setCalls] = useState<CallLog[]>(initialCalls);
  const [outcome, setOutcome] = useState<CallOutcome>("Voicemail");
  const [callbackDatetime, setCallbackDatetime] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/calls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outcome,
          callback_datetime: outcome === "Callback requested" && callbackDatetime ? callbackDatetime : null,
          notes: notes || null,
        }),
      });
      if (res.ok) {
        const call = (await res.json()) as CallLog;
        setCalls((prev) => [call, ...prev]);
        setNotes("");
        setCallbackDatetime("");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
        Log this call
      </h4>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Outcome</label>
          <select
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as CallOutcome)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            {CALL_OUTCOMES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        {outcome === "Callback requested" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Callback date/time
            </label>
            <input
              type="datetime-local"
              value={callbackDatetime}
              onChange={(e) => setCallbackDatetime(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
        )}
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-xs font-medium text-slate-600">Notes</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save outcome"}
        </button>
      </div>

      {calls.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
          {calls.slice(0, 5).map((c) => (
            <div key={c.id} className="flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">{c.outcome}</span>
              <span>· {formatTimestamp(c.timestamp)}</span>
              {c.callback_datetime && <span>· callback {formatTimestamp(c.callback_datetime)}</span>}
              {c.notes && <span className="text-slate-500">· {c.notes}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
