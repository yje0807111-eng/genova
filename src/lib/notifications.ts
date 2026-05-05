import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationType = "comment" | "follow" | "competition_result" | "trophy" | "like";

export async function createNotification(
  supabase: SupabaseClient,
  input: {
    userId: string;
    actorId: string | null;
    type: NotificationType;
    title: string;
    body?: string | null;
    href?: string | null;
    entityType?: string | null;
    entityId?: string | null;
  },
) {
  return supabase.from("notifications").insert({
    user_id: input.userId,
    actor_id: input.actorId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    href: input.href ?? null,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
  });
}
