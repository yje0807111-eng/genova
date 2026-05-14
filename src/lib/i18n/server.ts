import { cookies } from "next/headers";
import { type Locale, translate } from "@/lib/i18n/translations";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Cookie name carrying the user's selected locale.  Mirrored on the
 * client by `language-provider.tsx` (which also writes localStorage
 * for back-compat during the Phase B.2 migration window — see
 * docs / commit history).
 *
 * Intentionally NOT HttpOnly: the client locale switcher needs to
 * write it via `document.cookie`.  SameSite=Lax + 1-year Max-Age
 * is the recommended attribute set; the cookie value itself is
 * non-sensitive (one of three known strings).
 */
export const LOCALE_COOKIE_NAME = "genova-locale";

function narrowLocale(value: string | null | undefined): Locale | null {
  if (value === "en" || value === "ko" || value === "ja") return value;
  return null;
}

/**
 * Read the caller's locale.  Resolution order (B.2-7):
 *
 *   1. authenticated user's `profiles.locale` (cross-device sync)
 *   2. request cookie set by `language-provider`
 *   3. fallback to `"en"`
 *
 * Bots, first-time visitors, and signed-out crawl requests skip step
 * 1 entirely and land at step 2 or 3.  `cookies()` is request-memoized
 * by Next.js 15+, and `supabase.auth.getUser()` is also request-cached,
 * so repeated calls within the same request are cheap; no additional
 * `cache()` wrap needed.
 *
 * `profiles.locale` is intentionally read with the user-session client
 * (not service-role) so RLS still enforces "user can only read their
 * own preference".  A read failure / RLS denial falls through to the
 * cookie — never throws.
 */
export async function getServerLocale(): Promise<Locale> {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
        const { data } = await supabase
          .from("profiles")
          .select("locale")
          .eq("id", user.id)
          .maybeSingle();
        const dbLocale = narrowLocale(data?.locale ?? null);
        if (dbLocale) return dbLocale;
      }
    } catch {
      /* RLS denial, missing column, or auth glitch — fall through */
    }
  }

  const store = await cookies();
  const cookieLocale = narrowLocale(store.get(LOCALE_COOKIE_NAME)?.value ?? null);
  return cookieLocale ?? "en";
}

/**
 * Returns a locale-bound translator with the same signature as the
 * client `useI18n().t` hook: `t(key, fallback?)`.  Use after calling
 * `getServerLocale()`:
 *
 *   const locale = await getServerLocale();
 *   const t = getServerT(locale);
 *   const heading = t("home.hero.eyebrow", "AI Filmmakers");
 *
 * The underlying lookup is the same `translate()` function the
 * client provider uses, so server and client cannot disagree on
 * string values for the same locale.
 */
export function getServerT(locale: Locale): (key: string, fallback?: string) => string {
  return (key, fallback) => translate(locale, key, fallback);
}
