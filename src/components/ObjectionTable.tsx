import type { ObjectionRow } from "@/lib/script";

export default function ObjectionTable({ objections }: { objections: ObjectionRow[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2 w-2/5">Objection</th>
            <th className="px-3 py-2">Response</th>
          </tr>
        </thead>
        <tbody>
          {objections.map((row) => (
            <tr key={row.objection} className="border-t border-slate-100 align-top">
              <td className="px-3 py-2 font-medium text-slate-800">{row.objection}</td>
              <td className="px-3 py-2 text-slate-600">{row.response}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
