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
    <div className="min-h-screen px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-2xl">
        <AnimateIn delay={0}>
          <NotificationsList items={items} />
        </AnimateIn>
      </div>
    </div>
  );
}
