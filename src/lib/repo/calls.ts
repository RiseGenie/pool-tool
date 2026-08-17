import db from "@/lib/db";
import type { CallLog, NewCallLog } from "@/lib/types";

function generateId(): string {
  return crypto.randomUUID();
}

export function listCalls(leadId: string): CallLog[] {
  return db
    .prepare<[string], CallLog>(
      `SELECT * FROM call_logs WHERE lead_id = ? ORDER BY timestamp DESC`
    )
    .all(leadId);
}

export function addCall(leadId: string, input: NewCallLog): CallLog {
  const call: CallLog = {
    id: generateId(),
    lead_id: leadId,
    timestamp: input.timestamp ?? new Date().toISOString(),
    outcome: input.outcome,
    callback_datetime: input.callback_datetime ?? null,
    notes: input.notes ?? null,
  };

  db.prepare(
    `INSERT INTO call_logs (id, lead_id, timestamp, outcome, callback_datetime, notes)
     VALUES (@id, @lead_id, @timestamp, @outcome, @callback_datetime, @notes)`
  ).run(call);

  return call;
}
