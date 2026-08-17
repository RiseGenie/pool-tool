import { notFound } from "next/navigation";
import { getLead } from "@/lib/repo/leads";
import { getScorecard } from "@/lib/repo/scorecards";
import { listCalls } from "@/lib/repo/calls";
import LeadDetailClient from "@/components/LeadDetailClient";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = getLead(id);
  if (!lead) notFound();

  const scorecard = getScorecard(id);
  const calls = listCalls(id);

  return <LeadDetailClient lead={lead} initialScorecard={scorecard} initialCalls={calls} />;
}
