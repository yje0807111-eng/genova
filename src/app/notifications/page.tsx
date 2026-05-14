import type { Metadata } from "next";
import { AnimateIn } from "@/components/animate-in";
import { redirect } from "next/navigation";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { fetchMyNotifications } from "@/lib/queries/notifications-queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

export default async function NotificationsPage() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/auth");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const [items, profileResult] = await Promise.all([
    fetchMyNotifications(),
    supabase
      .from("profiles")
      .select("notify_likes, notify_comments, notify_follows")
      .eq("id", user.id)
      .single(),
  ]);

  const profile = profileResult.data;

  return (
    <div className="min-h-screen px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-2xl">
        <AnimateIn delay={0}>
          <NotificationsList
            items={items}
            initialNotifyLikes={profile?.notify_likes ?? true}
            initialNotifyComments={profile?.notify_comments ?? true}
            initialNotifyFollows={profile?.notify_follows ?? true}
          />
        </AnimateIn>
      </div>
    </div>
  );
}
