-- B.2-7: persist the user's UI language across devices.
--
-- Stores the locale alongside the rest of the user profile.  Read by
-- `getServerLocale()` (`src/lib/i18n/server.ts`) which prefers this
-- value over the request cookie when the caller is authenticated;
-- written by the `updateProfileLocale` server action which is fired
-- and forgotten from `language-provider.tsx#setLocale`.
--
-- Three allowed values match the `Locale` type
-- (`src/lib/i18n/translations.ts`).  NULL means "no explicit
-- preference yet" — `getServerLocale()` falls through to the cookie
-- in that case so the existing localStorage-bridged flow keeps
-- working until users next change their language.
alter table public.profiles
  add column if not exists locale text
    check (locale in ('en', 'ko', 'ja'));
