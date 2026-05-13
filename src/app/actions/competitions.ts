"use server";

import { fetchCompetitionsForUpload, fetchCurrentCompetition } from "@/lib/queries";

export async function getUploadCompetitionData() {
  const [competitions, currentCompetition] = await Promise.all([
    fetchCompetitionsForUpload(),
    fetchCurrentCompetition(),
  ]);

  return {
    competitions: competitions.map((c) => ({ id: c.id, title: c.title })),
    activeCompetitionId: currentCompetition?.id ?? null,
  };
}
