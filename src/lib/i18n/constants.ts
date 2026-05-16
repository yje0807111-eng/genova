/**
 * Cookie name for the selected locale. Shared by server (`getServerLocale`)
 * and client (`language-provider`). Must not import `next/headers` or other
 * server-only modules so client bundles can import it safely.
 */
export const LOCALE_COOKIE_NAME = "genova-locale";
