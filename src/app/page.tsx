import { listLeads } from "@/lib/repo/leads";
import LeadTable from "@/components/LeadTable";
import AddLeadForm from "@/components/AddLeadForm";

export default async function Home() {
  const leads = listLeads();

  return (
    <main className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lead Call Prep</h1>
          <p className="text-sm text-slate-500">
            Research pool-construction leads and call them with a personalized script.
          </p>
        </div>
      </div>

      <AddLeadForm />
      <LeadTable leads={leads} />
    </main>
  );
}
