"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { LOCALE_COOKIE_NAME } from "@/lib/i18n/constants";
import { type Locale, translate } from "@/lib/i18n/translations";
import { updateProfileLocaleAction } from "@/app/actions/profile";

const STORAGE_KEY = "genova-locale";
// Cookie name MUST match `getServerLocale` — single source: `@/lib/i18n/constants`.
const COOKIE_NAME = LOCALE_COOKIE_NAME;
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

type LanguageContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: string, fallback?: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

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

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  /** From `getServerLocale()` in root layout — must match SSR. */
  initialLocale: Locale;
}) {
  const router = useRouter();
  // Use the server-resolved locale for the first render (SSR + hydration).
  // Do not read document.cookie or localStorage here — that diverges from
  // `getServerLocale()` (profile DB > cookie > en) and causes mismatches.
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    setLocaleState(initialLocale);
  }, [initialLocale]);

  // After hydration, persist the server locale to this device so toggles
  // and legacy localStorage-only sessions converge without changing paint.
  useEffect(() => {
    document.documentElement.lang = locale;
    writeClientLocale(locale);
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    writeClientLocale(next);
    document.documentElement.lang = next;
    // B.2-7: fire-and-forget the server action so the choice follows
    // the user across devices.  Signed-out callers get an ok:true
    // no-op (the action returns success without writing) so we never
    // need to gate on auth state here.  Promise rejection is swallowed
    // because the cookie write above already covers this device — a
    // DB hiccup must not block the UI.
    void updateProfileLocaleAction(next).catch(() => {
      /* network/RLS failure — cookie persists this device's choice */
    });
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
