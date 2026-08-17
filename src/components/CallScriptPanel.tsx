import type { ScriptModel, Segment } from "@/lib/script";
import ObjectionTable from "./ObjectionTable";

function Segments({ segments }: { segments: Segment[] }) {
  return (
    <p className="text-sm leading-relaxed text-slate-700">
      {segments.map((s, i) =>
        s.highlight ? (
          <mark key={i} className="rounded bg-amber-200/70 px-0.5 font-semibold text-slate-900">
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        )
      )}
    </p>
  );
}

function ScriptSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">{title}</h4>
      {children}
    </div>
  );
}

export default function CallScriptPanel({ model }: { model: ScriptModel }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <ScriptSection title="Opener (10–15 sec)">
          <Segments segments={model.opener} />
          <p className="mt-2 text-xs italic text-slate-500">{model.busyLine}</p>
        </ScriptSection>

        <ScriptSection title="Purpose statement">
          <p className="text-sm leading-relaxed text-slate-700">{model.purpose}</p>
        </ScriptSection>

        <ScriptSection title="Discovery questions (pick 3–4)">
          <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
            {model.discoveryQuestions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </ScriptSection>

        <ScriptSection title="Bridge to value">
          <p className="text-sm leading-relaxed text-slate-700">{model.bridge}</p>
        </ScriptSection>

        <ScriptSection title="Soft pitch (angled to this lead's weakest area)">
          <Segments segments={model.softPitch} />
        </ScriptSection>

        <ScriptSection title="Close">
          <Segments segments={model.close} />
        </ScriptSection>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
          Objection handling (reference — always visible)
        </h4>
        <ObjectionTable objections={model.objections} />
      </div>
    </div>
  );
}
