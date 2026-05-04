"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, Search, Upload, User } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 최근 검색어 로드
  useEffect(() => {
    try {
      const stored = localStorage.getItem("genova_recent_searches");
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {}
  }, []);

  // 최근 검색어 저장
  const saveRecentSearch = (q: string) => {
    if (!q.trim()) return;
    try {
      const prev = JSON.parse(localStorage.getItem("genova_recent_searches") ?? "[]") as string[];
      const next = [q, ...prev.filter((s) => s !== q)].slice(0, 8);
      localStorage.setItem("genova_recent_searches", JSON.stringify(next));
      setRecentSearches(next);
    } catch {}
  };

  // 연관 검색어
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        const tags: string[] = data.tags ?? [];
        const videoTitles: string[] = (data.videos ?? []).map((v: { title: string }) => v.title);
        setSuggestions([...new Set([...tags, ...videoTitles])].slice(0, 7));
      } catch {}
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (q: string) => {
    if (!q.trim()) return;
    saveRecentSearch(q.trim());
    setFocused(false);
    setQuery("");
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const removeRecent = (q: string) => {
    const next = recentSearches.filter((s) => s !== q);
    setRecentSearches(next);
    localStorage.setItem("genova_recent_searches", JSON.stringify(next));
  };

  const showDropdown = focused && (query.trim() ? suggestions.length > 0 : recentSearches.length > 0);

  return (
    <div ref={wrapperRef} className="relative flex min-w-0 flex-1 justify-center px-6">
      <div className="relative w-full max-w-[720px]">
        <div
          className={`flex items-center gap-2 rounded-full border bg-white/[0.06] px-4 py-2 transition-colors duration-200 ${focused ? "border-[#7F77DD]/50 bg-white/[0.08]" : "border-white/10"}`}
        >
          <Search className="h-4 w-4 shrink-0 text-white/40" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) handleSearch(query);
              if (e.key === "Escape") setFocused(false);
            }}
            placeholder="Search AI films..."
            className="min-w-0 flex-1 border-0 bg-transparent text-sm font-normal tracking-[-0.01em] text-white outline-none ring-0 placeholder:text-white/38 focus:ring-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="text-white/30 hover:text-white/60"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* 드롭다운 */}
        {showDropdown && (
          <div
            className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/[0.08] py-2"
            style={{
              background: "linear-gradient(135deg, rgba(15,13,36,0.99) 0%, rgba(8,6,24,1) 100%)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(127,119,221,0.08)",
            }}
          >
            {query.trim() ? (
              // 연관 검색어
              <>
                <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-white/25">Suggestions</p>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSearch(s)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-white/[0.05]"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-white/25" fill="none" stroke="currentColor" strokeWidth={2}>
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-3.5-3.5" />
                    </svg>
                    <span className="text-white/70">{s}</span>
                  </button>
                ))}
              </>
            ) : (
              // 최근 검색어
              <>
                <div className="flex items-center justify-between px-4 pb-1 pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">Recent</p>
                  <button
                    type="button"
                    onClick={() => {
                      setRecentSearches([]);
                      localStorage.removeItem("genova_recent_searches");
                    }}
                    className="text-[10px] text-white/25 transition hover:text-white/50"
                  >
                    Clear all
                  </button>
                </div>
                {recentSearches.map((s) => (
                  <div key={s} className="flex items-center gap-2 px-4 py-2.5 transition hover:bg-white/[0.05]">
                    <button
                      type="button"
                      onClick={() => handleSearch(s)}
                      className="flex flex-1 items-center gap-3 text-left text-sm"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-white/25" fill="none" stroke="currentColor" strokeWidth={2}>
                        <polyline points="12 8 12 12 14 14" />
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                      <span className="text-white/70">{s}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRecent(s)}
                      className="text-white/20 transition hover:text-white/50"
                    >
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function Navbar() {
  const { t } = useI18n();
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setUserId(null);
      setIsAdmin(false);
      return;
    }

    const syncUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",").map((e) => e.trim()) ?? [];
      if (user?.email && adminEmails.includes(user.email)) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }

      if (user) {
        try {
          const { count } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("is_read", false);
          setUnreadCount(count ?? 0);
        } catch {}
      }
    };
    void syncUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUserId(u?.id ?? null);
      const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",").map((e) => e.trim()) ?? [];
      if (u?.email && adminEmails.includes(u.email)) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const profileHref = userId ? `/profile/${userId}` : "/auth";

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/[0.06] bg-[#080618]/90 backdrop-blur-xl">
      <div className="flex h-16 min-w-0 items-center justify-between gap-3 px-2">
          <Link href="/" className="flex w-60 shrink-0 items-center gap-1 pl-2">
            <Image src="/genova-logo.png" alt="Genova" width={48} height={48} className="ml-1 h-[38px] w-[38px] shrink-0" />
            <span className="font-display text-2xl font-bold tracking-[-0.06em] text-foreground">Genova</span>
            <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/90">
              Beta
            </span>
          </Link>

          <SearchBar />

          <div className="flex shrink-0 items-center gap-3 pr-4">
            <Link
              href="/upload"
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white transition-all duration-300 hover:scale-[1.03]"
              style={{
                background: "linear-gradient(135deg, #534AB7 0%, #7B6FE8 100%)",
                boxShadow: "0 0 20px rgba(83,74,183,0.4), 0 4px 12px rgba(83,74,183,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("nav.upload", "Upload")}</span>
            </Link>
            {userId && (
              <Link
                href="/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] transition-all duration-200 hover:border-[#7F77DD]/40 hover:bg-white/[0.1]"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4 text-white/60" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                    style={{ background: "#534AB7" }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            )}
            {userId === undefined ? (
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary"
                aria-busy="true"
                aria-label={t("common.loadingAccount", "Loading account")}
              />
            ) : (
              <>
                <Link
                  href={profileHref}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] transition-all duration-200 hover:border-[#7F77DD]/40 hover:bg-white/[0.1]"
                  aria-label={userId ? t("common.myProfile", "My profile") : t("common.signIn", "Sign in")}
                >
                  <User className="h-4 w-4 text-white/60" />
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] transition-all duration-200 hover:border-[#7F77DD]/40 hover:bg-white/[0.1]"
                    aria-label="Admin"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/60" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                )}
              </>
            )}
          </div>
      </div>
    </nav>
  );
}
