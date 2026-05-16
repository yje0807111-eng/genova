import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Append an admin audit-log row.  Server-only (call sites are Server
 * Actions that already hold a service-role client + the authenticated
 * admin user from requireAdmin*()).
 *
 * Best-effort by contract: a logging failure (missing table, transient
 * DB error) must NEVER block or roll back the primary admin action, so
 * all errors are swallowed.  The matching table is created in
 * supabase/migrations/20260516210000_admin_audit_log.sql — until that
 * migration is applied this is a silent no-op.
 */
export async function logAdminAction(
  service: SupabaseClient,
  actor: Pick<User, "id" | "email">,
  action: string,
  target: {
    type?: string;
    id?: string | null;
    detail?: Record<string, unknown>;
  } = {},
): Promise<void> {
  try {
    await service.from("admin_audit_log").insert({
      actor_id: actor.id,
      actor_email: actor.email ?? null,
      action,
      target_type: target.type ?? null,
      target_id: target.id ?? null,
      detail: target.detail ?? null,
    });
  } catch {
    /* audit logging is best-effort — never block the admin action */
  }
}
