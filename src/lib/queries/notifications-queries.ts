import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AppNotification = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  type:
    | "comment"
    | "follow"
    | "competition_result"
    | "trophy"
    | "like"
    | "lottery_winner"
    | "lottery_reminder";
  isRead: boolean;
  createdAt: string;
};

export async function fetchMyNotifications(limit = 30): Promise<AppNotification[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, body, href, type, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    body: (r.body as string | null) ?? null,
    href: (r.href as string | null) ?? null,
    type: r.type as AppNotification["type"],
    isRead: Boolean(r.is_read),
    createdAt: r.created_at as string,
  }));
}

export async function fetchMyUnreadCount(): Promise<number> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return 0;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);
  return count ?? 0;
}
