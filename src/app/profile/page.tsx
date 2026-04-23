import { redirect } from "next/navigation";
import { ensureProfile } from "@/lib/queries/profile-queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** `/profile` -> redirect to signed-in user's `/profile/[UUID]` */
export default async function ProfileRootRedirect() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/auth");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  await ensureProfile(user.id, user.email);

  redirect(`/profile/${user.id}`);
}
