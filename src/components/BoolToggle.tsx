"use client";

export default function BoolToggle({
  value,
  onChange,
  yesLabel = "Yes",
  noLabel = "No",
}: {
  value: boolean | null;
  onChange: (v: boolean | null) => void;
  yesLabel?: string;
  noLabel?: string;
}) {
  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        onClick={() => onChange(value === true ? null : true)}
        className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
          value === true
            ? "bg-emerald-500 text-white border-emerald-500"
            : "border-slate-300 text-slate-600 hover:bg-emerald-50"
        }`}
      >
        {yesLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(value === false ? null : false)}
        className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
          value === false
            ? "bg-rose-500 text-white border-rose-500"
            : "border-slate-300 text-slate-600 hover:bg-rose-50"
        }`}
      >
        {noLabel}
      </button>
    </div>
  );
}
