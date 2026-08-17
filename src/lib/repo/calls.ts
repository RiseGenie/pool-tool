import { supabase } from "@/lib/db";
import type { CallLog, NewCallLog } from "@/lib/types";

function generateId(): string {
  return crypto.randomUUID();
}

export async function listCalls(leadId: string): Promise<CallLog[]> {
  const { data, error } = await supabase
    .from("call_logs")
    .select("*")
    .eq("lead_id", leadId)
    .order("timestamp", { ascending: false });
  if (error) throw error;
  return (data as CallLog[]) ?? [];
}

export async function addCall(leadId: string, input: NewCallLog): Promise<CallLog> {
  const call: CallLog = {
    id: generateId(),
    lead_id: leadId,
    timestamp: input.timestamp ?? new Date().toISOString(),
    outcome: input.outcome,
    callback_datetime: input.callback_datetime ?? null,
    notes: input.notes ?? null,
  };

  const { error } = await supabase.from("call_logs").insert(call);
  if (error) throw error;

  return call;
}
