import { createServiceSupabaseClient } from "@/lib/supabase/service";

async function seedCompetitions() {
  const supabase = createServiceSupabaseClient();
  if (!supabase) { console.error("No client"); return; }

  const competitions = [
    {
      id: "cp2",
      title: "AI Short Film World Challenge",
      genre: "short_film",
      status: "Open",
      deadline: "2026-06-13T14:59:59+00",
      vote_end: "2026-06-28T14:59:59+00",
      prize_info: "Total prize pool $25,000",
      sponsor: "RUNWAY AI",
    },
    {
      id: "cp3",
      title: "Animation AI Festival",
      genre: "animation",
      status: "Open",
      deadline: "2026-06-19T14:59:59+00",
      vote_end: "2026-07-04T14:59:59+00",
      prize_info: "Total prize pool ₩15,000,000",
      sponsor: "KLING AI",
    },
    {
      id: "cp4",
      title: "AI Music Video Award 2026",
      genre: "mv",
      status: "Open",
      deadline: "2026-06-09T14:59:59+00",
      vote_end: "2026-06-24T14:59:59+00",
      prize_info: "Total prize pool $15,000",
      sponsor: "SUNO AI",
    },
    {
      id: "cp5",
      title: "AI Horror Film Challenge",
      genre: "horror",
      status: "Upcoming",
      deadline: "2026-06-24T14:59:59+00",
      vote_end: "2026-07-09T14:59:59+00",
      prize_info: "Total prize pool ₩10,000,000",
      sponsor: "PIKA LABS",
    },
    {
      id: "cp6",
      title: "Future City AI Short Contest",
      genre: "short_film",
      status: "Upcoming",
      deadline: "2026-07-09T14:59:59+00",
      vote_end: "2026-07-24T14:59:59+00",
      prize_info: "Total prize pool ₩80,000,000",
      sponsor: "MIDJOURNEY",
    },
    {
      id: "cp7",
      title: "AI Documentary Challenge",
      genre: "documentary",
      status: "Upcoming",
      deadline: "2026-07-24T14:59:59+00",
      vote_end: "2026-08-08T14:59:59+00",
      prize_info: "Total prize pool $20,000",
      sponsor: "ELEVEN LABS",
    },
    {
      id: "cp8",
      title: "AI Action Film Festival",
      genre: "short_film",
      status: "Upcoming",
      deadline: "2026-08-08T14:59:59+00",
      vote_end: "2026-08-23T14:59:59+00",
      prize_info: "Total prize pool $12,000",
      sponsor: "LUMA AI",
    },
    {
      id: "cp9",
      title: "AI Romance Film Award",
      genre: "short_film",
      status: "Closed",
      deadline: "2026-03-15T14:59:59+00",
      vote_end: "2026-03-30T14:59:59+00",
      prize_info: "Total prize pool ₩5,000,000",
      sponsor: "STABLE DIFFUSION",
    },
    {
      id: "cp10",
      title: "AI Sci-Fi Shorts 2025",
      genre: "short_film",
      status: "Closed",
      deadline: "2025-12-31T14:59:59+00",
      vote_end: "2026-01-15T14:59:59+00",
      prize_info: "Total prize pool $8,000",
      sponsor: "OPENAI SORA",
    },
    {
      id: "cp11",
      title: "AI Nature Documentary Cup",
      genre: "documentary",
      status: "Closed",
      deadline: "2026-02-28T14:59:59+00",
      vote_end: "2026-03-15T14:59:59+00",
      prize_info: "Total prize pool ₩3,000,000",
      sponsor: "UDIO",
    },
  ];

  const { error } = await supabase.from("competitions").upsert(competitions);
  if (error) console.error("Error:", error);
  else console.log("Seeded", competitions.length, "competitions!");
}

seedCompetitions();
