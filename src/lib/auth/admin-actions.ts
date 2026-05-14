import { isAdminEmail } from "@/lib/auth/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceSupabaseClient } from "@/lib/supabase/service";

/**
 * Auth guard for admin Server Actions and admin server components.
 * Validates the caller is signed in and their email is in ADMIN_EMAILS.
 *
 * Returns the user-session supabase client (for reads under caller
 * identity) plus the authenticated user record.
 */
export async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { error: "Please check your Supabase configuration." } as const;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." } as const;
  if (!isAdminEmail(user.email)) return { error: "Access denied." } as const;
  return { supabase, user } as const;
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
export async function requireAdminWithService() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;
  const service = createServiceSupabaseClient();
  if (!service) {
    return { error: "Service role key not configured." } as const;
  }
  return { ...auth, service } as const;
}
