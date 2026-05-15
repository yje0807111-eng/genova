import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/auth/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

/**
 * Result shapes for the admin auth guards.  Declared explicitly so the
 * inferred return type of `requireAdminWithService` stays a clean
 * two-arm discriminated union (`error` vs.
 * `{ supabase, user, service }`).  Without the annotation TS couldn't
 * track the `{ ...auth, service }` spread across the inner narrowing
 * and the success branch lost the `service` field at every call site
 * (22× TS2339).
 */
export type AdminAuthError = { readonly error: string };
export type AdminAuth = { readonly supabase: SupabaseClient; readonly user: User };
export type AdminAuthWithService = AdminAuth & { readonly service: SupabaseClient };

/**
 * Auth guard for admin Server Actions and admin server components.
 * Validates the caller is signed in and their email is in ADMIN_EMAILS.
 *
 * Returns the user-session supabase client (for reads under caller
 * identity) plus the authenticated user record.
 */
export async function requireAdmin(): Promise<AdminAuthError | AdminAuth> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Please check your Supabase configuration." };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };
  if (!isAdminEmail(user.email)) return { error: "Access denied." };
  return { supabase, user };
}

/**
 * Same as requireAdmin() but also returns a service-role client.
 * Use for writes (and admin-only reads) on tables where admin needs
 * to bypass RLS — competitions, video_reports, business_inquiries,
 * site_settings, etc.
 *
 * The user-session `supabase` client is still returned for any reads
 * the action wants to perform under the caller's identity.
 */
export async function requireAdminWithService(): Promise<
  AdminAuthError | AdminAuthWithService
> {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;
  const service = createServiceSupabaseClient();
  if (!service) {
    return { error: "Service role key not configured." };
  }
  return { ...auth, service };
}
