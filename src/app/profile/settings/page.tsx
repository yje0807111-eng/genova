import { redirect } from "next/navigation";
import { ProfileSettingsClient } from "@/components/profile/profile-settings-client";
import { profileHandle } from "@/lib/profile-handle";
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

  const userEmail = user.email ?? null;
  const provider = user.app_metadata?.provider ?? "email";
  const hasPassword = provider === "email";
  const handle = profileHandle(profile.displayName ?? "", profile.id);

  return (
    <div className="min-h-screen bg-background py-8 text-foreground">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <ProfileSettingsClient
          profile={profile}
          userEmail={userEmail}
          hasPassword={hasPassword}
          authProvider={provider}
          handle={handle}
        />
      </div>
    </div>
  );
}
