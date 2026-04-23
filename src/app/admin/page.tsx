import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { isAdminEmail } from "@/lib/auth/admin";
import { fetchVideosWithCreators } from "@/lib/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/auth");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  if (!isAdminEmail(user.email)) redirect("/");

  const [videos, competitionsRes] = await Promise.all([
    fetchVideosWithCreators(),
    supabase.from("competitions").select("*").order("deadline", { ascending: false }),
  ]);
  const competitions = (competitionsRes.data ?? []).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    genre: r.genre as string,
    status: r.status as string,
    deadline: r.deadline as string,
    voteEnd: r.vote_end as string,
    prizeInfo: r.prize_info as string,
    sponsor: r.sponsor as string,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 text-[#EEEDFE] sm:px-6">
        <h1 className="mb-4 text-xl font-bold">Admin</h1>
        <AdminDashboard competitions={competitions} videos={videos} />
    </div>
  );
}
