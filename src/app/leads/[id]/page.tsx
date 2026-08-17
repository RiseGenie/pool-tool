import { notFound } from "next/navigation";
import { getLead } from "@/lib/repo/leads";
import { getScorecard } from "@/lib/repo/scorecards";
import { listCalls } from "@/lib/repo/calls";
import LeadDetailClient from "@/components/LeadDetailClient";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLead(id);
  if (!lead) notFound();

  const scorecard = await getScorecard(id);
  const calls = await listCalls(id);

  return <LeadDetailClient lead={lead} initialScorecard={scorecard} initialCalls={calls} />;
}
