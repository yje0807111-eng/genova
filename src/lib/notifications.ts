import { createServiceSupabaseClient } from "@/lib/supabase/service";

export type NotificationType =
  | "comment"
  | "follow"
  | "competition_result"
  | "trophy"
  | "like"
  | "lottery_winner"   // initial draw + each redraw replacement
  | "lottery_reminder"; // D-3 / D-1 deadline reminder while pending

/**
 * Inserts a notification row. Always runs through the service-role
 * client so the recipient `user_id` is trusted server-side — direct
 * user-session inserts are blocked by RLS (no INSERT policy).
 *
 * Callers MUST validate the recipient identity through business
 * logic before invoking this helper (e.g. the recipient is the
 * uploader of a video the actor commented on / liked, the user the
 * actor just followed, the prize winner the admin just announced).
 */
export async function createNotification(input: {
  userId: string;
  actorId: string | null;
  type: NotificationType;
  title: string;
  body?: string | null;
  href?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  /**
   * Structured payload consumed by `getNotificationLabel()` in
   * notifications-i18n.ts to render locale-aware copy.  Shape per
   * type (E1):
   *   comment / like  → { video_title }
   *   follow          → { actor_name }
   *   lottery_winner  → { prize_tier, prize_amount_usd, claim_token }
   *   lottery_reminder → { prize_amount_usd, days_left, claim_token }
   * Pass null / omit if no structured fields are available — the i18n
   * switch falls through to the generic body key.
   */
  metadata?: Record<string, unknown> | null;
}) {
  const service = createServiceSupabaseClient();
  if (!service) {
    return { data: null, error: new Error("Service role key not configured") };
  }
  return service.from("notifications").insert({
    user_id: input.userId,
    actor_id: input.actorId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    href: input.href ?? null,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    metadata: input.metadata ?? null,
  });
}
