import { AnimateIn } from "@/components/animate-in";
import { redirect } from "next/navigation";
import { NotificationsList } from "@/components/notifications/notifications-list";
import { fetchMyNotifications } from "@/lib/queries/notifications-queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function NotificationsPage() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) redirect("/auth");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const items = await fetchMyNotifications();

  return (
    <div className="page-cinematic mx-auto max-w-4xl space-y-4 px-4 py-7 text-[#F8F7FF] sm:px-6">
        <AnimateIn delay={0} className="space-y-2">
          <p className="eyebrow">Notifications</p>
          <h1 className="page-title text-3xl sm:text-4xl">Activity Inbox</h1>
          <p className="page-subtitle">Track likes, comments, follows, and platform updates in one feed.</p>
        </AnimateIn>
        <NotificationsList items={items} />
    </div>
  );
}
