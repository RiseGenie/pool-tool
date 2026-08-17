"use client";

import type { TrafficLight as TLValue } from "@/lib/types";

const OPTIONS: {
  value: TLValue;
  label: string;
  active: string;
  idle: string;
}[] = [
  {
    value: "green",
    label: "Green",
    active: "bg-emerald-500 text-white border-emerald-500",
    idle: "border-slate-300 text-slate-600 hover:bg-emerald-50",
  },
  {
    value: "yellow",
    label: "Yellow",
    active: "bg-amber-500 text-white border-amber-500",
    idle: "border-slate-300 text-slate-600 hover:bg-amber-50",
  },
  {
    value: "red",
    label: "Red",
    active: "bg-rose-500 text-white border-rose-500",
    idle: "border-slate-300 text-slate-600 hover:bg-rose-50",
  },
];

export default function TrafficLight({
  value,
  onChange,
}: {
  value: TLValue | null;
  onChange: (v: TLValue | null) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {OPTIONS.map((opt) => (
        <button
          type="button"
          key={opt.value}
          onClick={() => onChange(value === opt.value ? null : opt.value)}
          className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
            value === opt.value ? opt.active : opt.idle
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
