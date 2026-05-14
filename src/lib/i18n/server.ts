import { cookies } from "next/headers";
import { type Locale, translate } from "@/lib/i18n/translations";

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

/**
 * Read the caller's locale from the request cookie.  Use from any
 * Server Component, Route Handler, Server Action, or `generateMetadata`
 * function.  Falls back to `"en"` when the cookie is missing or
 * invalid — bots, first-time visitors, and crawl-only requests all
 * land here.
 *
 * `cookies()` is already memoized per request by Next.js (15+), so
 * repeated calls within the same request are cheap; no additional
 * `cache()` wrap needed.
 */
export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE_NAME)?.value;
  if (value === "en" || value === "ko" || value === "ja") return value;
  return "en";
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
