"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, Search, Upload, User, X } from "lucide-react";
import { markAllNotificationsReadAction } from "@/app/actions/notifications";
import { useI18n } from "@/components/genova/language-provider";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

function SearchBar() {
  const { t } = useI18n();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [suggestVideos, setSuggestVideos] = useState<{ id: string; title: string; thumbnailUrl?: string }[]>([]);
  const [suggestProfiles, setSuggestProfiles] = useState<{ id: string; displayName: string; avatarUrl?: string }[]>([]);
  const [suggestTags, setSuggestTags] = useState<string[]>([]);
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
      setSuggestVideos([]);
      setSuggestProfiles([]);
      setSuggestTags(["AI", "ShortFilm", "Animation", "Sci-Fi", "Music"]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestVideos(
          ((data.videos ?? []) as { id: string; title: string; thumbnailUrl?: string }[]).slice(0, 4),
        );
        setSuggestProfiles(
          ((data.profiles ?? []) as { id: string; displayName: string; avatarUrl?: string }[]).slice(0, 3),
        );
        setSuggestTags(((data.tags ?? []) as string[]).slice(0, 5));
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

  const showDropdown = focused
    && (
      query.trim()
        ? true
        : recentSearches.length > 0 || suggestTags.length > 0
    );

  return (
    <div ref={wrapperRef} className="relative flex min-w-0 flex-1 justify-center px-6">
      <div className="relative w-full max-w-[720px]">
        <div
          className={`flex items-center gap-2 rounded-full border px-4 py-2 transition-colors duration-200 ${focused ? "border-[#7F77DD]/50 bg-[#080614]/80 backdrop-blur-xl" : "border-white/10 bg-[#080614]/70 backdrop-blur-xl"}`}
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
            placeholder={t("common.searchAiFilms", "Search AI films...")}
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
              <>
        {suggestVideos.length === 0 && suggestProfiles.length === 0 && suggestTags.length === 0 && (
          <div className="px-4 py-6 text-center">
            <p className="text-[12px] text-white/40">{t("search.noResultsLine", "No results for \"{q}\"").replace("{q}", query)}</p>
            <p className="mt-1 text-[10px] text-white/25">{t("search.navbarTryOther")}</p>
          </div>
        )}
                {suggestVideos.length > 0 && (
                  <>
                    <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-[#AFA9EC]/70">✦ {t("search.sectionFilms")}</p>
                    {suggestVideos.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setFocused(false);
                          setQuery("");
                          router.push(`/watch/${v.id}`);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-white/[0.05]"
                      >
                <div className="aspect-video h-10 shrink-0 overflow-hidden rounded-md border border-white/10 bg-[#1a1638]">
                          {v.thumbnailUrl ? (
                            <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <span className="line-clamp-1 text-white/75">{v.title}</span>
                      </button>
                    ))}
                  </>
                )}
                {suggestProfiles.length > 0 && (
                  <>
                    <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-[#AFA9EC]/70">✦ {t("search.sectionCreators")}</p>
                    {suggestProfiles.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setFocused(false);
                          setQuery("");
                          router.push(`/profile/${p.id}`);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-white/[0.05]"
                      >
                        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/10 bg-[#26215C]">
                          {p.avatarUrl ? (
                            <img src={p.avatarUrl} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <span className="line-clamp-1 text-white/75">{p.displayName}</span>
                      </button>
                    ))}
                  </>
                )}
                {suggestTags.length > 0 && (
                  <>
                    <p className="px-4 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-[#AFA9EC]/70">✦ {t("search.sectionTags")}</p>
                    <div className="flex flex-wrap gap-2 px-4 pb-2 pt-1">
                      {suggestTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleSearch(`#${tag}`)}
                          className="rounded-full border border-[#7F77DD]/30 bg-[#534AB7]/20 px-2.5 py-1 text-xs font-medium text-[#C8C3F7] transition hover:bg-[#534AB7]/35"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </>
                )}
        <div className="mt-1 border-t border-white/[0.06] px-2 pt-2 pb-1">
                  <button
                    type="button"
                    onClick={() => handleSearch(query)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[12px] font-semibold text-[#AFA9EC] transition hover:bg-[#7F77DD]/10 hover:text-white"
                  >
            <span>{t("search.navbarViewAllFor").replace("{q}", query)}</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between px-4 pb-1 pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">{t("search.navbarRecent")}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setRecentSearches([]);
                      localStorage.removeItem("genova_recent_searches");
                    }}
                    className="text-[10px] text-white/25 transition hover:text-white/50"
                  >
                    {t("notifications.deleteAll")}
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
                {suggestTags.length > 0 && (
                  <>
                    <div className="mt-1 border-t border-white/[0.06] px-4 pb-1 pt-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#AFA9EC]/70">✦ {t("search.sectionTags")}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 px-4 pb-2 pt-1">
                      {suggestTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleSearch(`#${tag}`)}
                          className="rounded-full border border-[#7F77DD]/30 bg-[#534AB7]/20 px-2.5 py-1 text-xs font-medium text-[#C8C3F7] transition hover:bg-[#534AB7]/35"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </>
                )}
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
  const router = useRouter();
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<
    {
      id: string;
      title: string;
      body: string | null;
      type: string | null;
      isRead: boolean;
      href: string | null;
      createdAt: string | null;
    }[]
  >([]);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

      if (user?.email) {
        try {
          const res = await fetch("/api/check-admin");
          const data = await res.json();
          setIsAdmin(data.isAdmin === true);
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }

      if (user) {
        try {
          const { data: notifs } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10);
          setNotifications(
            (notifs ?? []).map((n) => ({
              id: n.id as string,
              title: n.title as string,
              body: (n.body as string | null) ?? null,
              type: (n.type as string | null) ?? null,
              isRead: Boolean(n.is_read),
              href: (n.href as string | null) ?? null,
              createdAt: (n.created_at as string | null) ?? null,
            })),
          );
          const unread = (notifs ?? []).filter((n) => !n.is_read).length;
          setUnreadCount(unread);
        } catch {}
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    };
    void syncUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUserId(u?.id ?? null);
      if (u?.email) {
        void (async () => {
          try {
            const res = await fetch("/api/check-admin");
            const data = await res.json();
            setIsAdmin(data.isAdmin === true);
          } catch {
            setIsAdmin(false);
          }
        })();
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const n = payload.new as {
            id: string;
            title: string;
            body: string | null;
            type: string | null;
            is_read: boolean;
            href: string | null;
            created_at: string | null;
          };
          setNotifications((prev) => [
            {
              id: n.id,
              title: n.title,
              body: n.body,
              type: n.type,
              isRead: n.is_read,
              href: n.href,
              createdAt: n.created_at,
            },
            ...prev,
          ]);
          setUnreadCount((prev) => prev + 1);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const profileHref = userId ? `/profile/${userId}` : "/auth";
  const popupUnreadCount = notifications.filter((n) => !n.isRead).length;

  const formatNotificationRelativeTime = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return t("notifications.justNow");
    if (mins < 60) return t("notifications.timeAgo", "{n} ago").replace("{n}", `${mins}m`);
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t("notifications.timeAgo", "{n} ago").replace("{n}", `${hours}h`);
    const days = Math.floor(hours / 24);
    if (days < 7) return t("notifications.timeAgo", "{n} ago").replace("{n}", `${days}d`);
    return d.toLocaleDateString(undefined, { month: "numeric", day: "numeric" });
  };

  return (
    <nav className="fixed left-0 right-0 top-0 z-50">
      <div className="flex h-16 min-w-0 items-center justify-between gap-3 pl-64 pr-4">
          <SearchBar />

          <div className="flex shrink-0 items-center gap-3 pr-4">
            <Link
              href="/upload"
              onClick={(e) => {
                if (userId === null) {
                  e.preventDefault();
                  router.push("/auth");
                }
              }}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white transition-all duration-300 hover:scale-[1.03]"
              style={{
                background: "linear-gradient(135deg, rgba(107,95,212,0.85) 0%, rgba(83,74,183,0.75) 50%, rgba(63,54,163,0.65) 100%)",
                border: "1px solid rgba(175,169,236,0.35)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 8px rgba(83,74,183,0.2)",
              }}
            >
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("nav.upload", "Upload")}</span>
            </Link>
            {userId && (
              <div ref={notificationRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    const next = !showNotifications;
                    setShowNotifications(next);
                    if (next && unreadCount > 0) {
                      setUnreadCount(0);
                    }
                  }}
                  className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#080614]/80 backdrop-blur-xl transition-all duration-200 hover:border-[#7F77DD]/40 hover:bg-[#0f0d24]/90"
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
                </button>

                {showNotifications && (
                  <div
                    className="absolute right-0 top-full z-[100] mt-2 w-80 overflow-hidden rounded-2xl border border-white/[0.08]"
                    style={{
                      background: "linear-gradient(135deg, rgba(20,17,50,0.99) 0%, rgba(10,8,28,1) 100%)",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(127,119,221,0.08)",
                    }}
                  >
                    <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-bold text-white">{t("notifications.title")}</p>
                        {popupUnreadCount > 0 && (
                          <span
                            className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#7F77DD] px-1.5 text-[10px] font-bold text-white"
                          >
                            {popupUnreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {popupUnreadCount > 0 && (
                          <button
                            type="button"
                            onClick={async () => {
                              await markAllNotificationsReadAction();
                              setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                              setUnreadCount(0);
                            }}
                            className="text-[10px] text-white/40 transition hover:text-white/70"
                          >
                            {t("notifications.markAllRead")}
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button
                            type="button"
                            onClick={async () => {
                              const supabase = getBrowserSupabaseClient();
                              const ids = notifications.map((n) => n.id);
                              if (ids.length === 0 || !supabase) return;
                              await supabase.from("notifications").delete().in("id", ids);
                              setNotifications([]);
                              setUnreadCount(0);
                            }}
                            className="text-[10px] text-white/40 transition hover:text-red-400"
                          >
                            {t("notifications.deleteAll")}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowNotifications(false)}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-white/30 transition hover:bg-white/[0.05] hover:text-white/60"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <Bell className="mb-3 h-8 w-8 text-white/15" />
                          <p className="text-sm text-white/30">{t("notifications.empty")}</p>
                        </div>
                      ) : (
                        notifications.map((n) => {
                          const content = (
                            <div
                              className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition hover:bg-white/[0.04] ${!n.isRead ? "bg-[#534AB7]/10" : ""}`}
                              onClick={async () => {
                                if (!n.isRead) {
                                  const supabase = getBrowserSupabaseClient();
                                  if (supabase) {
                                    await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
                                  }
                                  setNotifications((prev) =>
                                    prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item)),
                                  );
                                  setUnreadCount((prev) => Math.max(0, prev - 1));
                                }
                                if (n.href) {
                                  setShowNotifications(false);
                                  router.push(n.href);
                                }
                              }}
                            >
                              {!n.isRead && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#7F77DD]" />}
                              <div
                                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                                style={{ background: n.isRead ? "rgba(255,255,255,0.04)" : "rgba(83,74,183,0.2)" }}
                              >
                                {n.type === "comment" ? (
                                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                  </svg>
                                ) : n.type === "follow" ? (
                                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <line x1="19" y1="8" x2="19" y2="14" />
                                    <line x1="22" y1="11" x2="16" y2="11" />
                                  </svg>
                                ) : (
                                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth={2}>
                                    <path d="M8 21h8M12 17v4M17 3H7l-2 7c0 2.8 2.24 5 5 5s5-2.2 5-5l-2-7z" />
                                  </svg>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`text-xs font-semibold ${n.isRead ? "text-white/50" : "text-white"}`}>{n.title}</p>
                                  {n.createdAt && (
                                    <span className="shrink-0 text-[10px] text-white/25">
                                      {formatNotificationRelativeTime(n.createdAt)}
                                    </span>
                                  )}
                                </div>
                                {n.body && <p className="mt-0.5 text-[10px] text-white/30">{n.body}</p>}
                              </div>

                              <div className="flex shrink-0 items-center gap-1 self-start pt-0.5">
                                {!n.isRead && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#7F77DD]" />}
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const supabase = getBrowserSupabaseClient();
                                    if (!supabase) return;
                                    await supabase.from("notifications").delete().eq("id", n.id);
                                    setNotifications((prev) => prev.filter((item) => item.id !== n.id));
                                    if (!n.isRead) setUnreadCount((prev) => Math.max(0, prev - 1));
                                  }}
                                  className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white/20 opacity-0 transition hover:bg-white/[0.05] hover:text-red-400 group-hover:opacity-100"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          );
                          return (
                            <div key={n.id} className="group">
                              {content}
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="border-t border-white/[0.06] px-4 py-2.5">
                      <Link
                        href="/notifications"
                        onClick={() => setShowNotifications(false)}
                        className="block text-center text-[11px] text-white/40 transition hover:text-white/70"
                      >
                        {t("notifications.viewAllNotifications")}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
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
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#080614]/80 backdrop-blur-xl transition-all duration-200 hover:border-[#7F77DD]/40 hover:bg-[#0f0d24]/90"
                  aria-label={userId ? t("common.myProfile", "My profile") : t("common.signIn", "Sign in")}
                >
                  <User className="h-4 w-4 text-white/60" />
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#080614]/80 backdrop-blur-xl transition-all duration-200 hover:border-[#7F77DD]/40 hover:bg-[#0f0d24]/90"
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
