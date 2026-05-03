import { redirect } from "next/navigation";
import { ProfileSettingsClient } from "@/components/profile/profile-settings-client";
import { ensureProfile, fetchProfileById } from "@/lib/queries/profile-queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/auth");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  await ensureProfile(user.id, user.email);
  const profile = await fetchProfileById(user.id);
  if (!profile) redirect("/auth");

  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6">
      <ProfileSettingsClient profile={profile} />
    </div>
  );
}
