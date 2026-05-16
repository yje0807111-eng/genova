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
  // Defense-in-depth: never trust an unverified email even if it matches
  // ADMIN_EMAILS. If Supabase "Confirm email" is off, an attacker could
  // sign up with a known admin address; require proven ownership here.
  if (!user.email_confirmed_at) return { error: "Access denied." };
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
    return {
      error:
        "서버 설정 오류: SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다. " +
        "Supabase 대시보드(Project Settings → API → service_role)의 키를 " +
        "서버 환경(.env.local / 배포 환경)에 추가하고 서버를 재시작하세요.",
    };
  }
  return { ...auth, service };
}
