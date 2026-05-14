"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Locale, translate } from "@/lib/i18n/translations";
import { LOCALE_COOKIE_NAME } from "@/lib/i18n/server";

const STORAGE_KEY = "genova-locale";
// Cookie name MUST match the server-side LOCALE_COOKIE_NAME so server and
// client agree.  Re-exported here as a constant for readability; sourced
// from `server.ts` so changing one updates both.
const COOKIE_NAME = LOCALE_COOKIE_NAME;
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

type LanguageContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: string, fallback?: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * Synchronous-on-the-client read of the locale cookie.  Used by the
 * `useState` initializer so the very first client render matches what
 * the server emitted (no hydration mismatch).  Falls through to
 * localStorage, then to `"en"` — keeping the localStorage fallback
 * preserves the user's existing preference during the B.2 rollout
 * window before everyone has the cookie set.
 */
function readClientLocale(): Locale {
  if (typeof document === "undefined") return "en";
  const cookieMatch = document.cookie.match(/(?:^|;\s*)genova-locale=([^;]+)/);
  if (cookieMatch) {
    const v = decodeURIComponent(cookieMatch[1]);
    if (v === "en" || v === "ko" || v === "ja") return v;
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "ko" || stored === "en" || stored === "ja") return stored;
  } catch {
    /* localStorage disabled (incognito Safari, etc.) — ignore */
  }
  return "en";
}

function writeClientLocale(next: Locale) {
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  // Cookie: SameSite=Lax, Path=/, Max-Age=1y, NOT HttpOnly (we need to
  // write it client-side here).  Secure attribute is added implicitly
  // by the browser on https: origins.
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
    next,
  )}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // Synchronously hydrate from cookie/localStorage so the first client
  // render lines up with the server's cookie-derived locale.  Server
  // emits `<html lang={locale}>` based on the cookie; this initializer
  // reads the same source.
  const [locale, setLocaleState] = useState<Locale>(() => readClientLocale());

  // Keep `<html lang>` in sync on mount in case it was hard-coded to en
  // by an older root layout that has not yet been deployed with the
  // dynamic-lang change (B.2-3 follow-up).  Safe to remove once
  // B.2-3 ships and stabilizes.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    writeClientLocale(next);
    if (typeof document !== "undefined") {
      document.documentElement.lang = next;
    }
    // Re-run the server tree so newly-server-rendered fragments (e.g.,
    // converted i18n-only components, locale-aware generateMetadata)
    // pick up the new locale without a full page reload.  Keeps client
    // state (form inputs, scroll position, modal open state) intact.
    router.refresh();
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, fallback) => translate(locale, key, fallback),
    }),
    // setLocale is stable per-render but doesn't need to be in deps; the
    // closure captures `locale` via state which is the only dynamic
    // input.  eslint-disable preserved for the existing pattern.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useI18n must be used within LanguageProvider");
  }
  return ctx;
}
