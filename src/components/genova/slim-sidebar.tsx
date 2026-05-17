"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Bell, Home, LogIn, LogOut, MessageCircle, MoreHorizontal, Shield, Ticket, Trophy, Upload, User, X } from "lucide-react";
import { markAllNotificationsReadAction } from "@/app/actions/notifications";
import { useI18n } from "@/components/genova/language-provider";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils/cn";
import { useUploadModal } from "@/components/upload/upload-modal-context";
import { useLotteryGuideModal } from "@/components/lottery/lottery-guide-modal";
import { getNotificationLabel } from "@/lib/notifications-i18n";

export interface SlimSidebarProps {
  onOpenChat: () => void;
  unreadMessageCount?: number;
}

type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  type: string | null;
  isRead: boolean;
  href: string | null;
  createdAt: string | null;
  metadata: Record<string, unknown> | null;
};

const TOP_NAV: {
  href: string;
  labelKey: string;
  labelFb: string;
  icon: LucideIcon;
  match: (p: string) => boolean;
}[] = [
  { href: "/", labelKey: "sidebar.home", labelFb: "Home", icon: Home, match: (p) => p === "/" },
  {
    href: "/competition",
    labelKey: "sidebar.competition",
    labelFb: "Contest",
    icon: Trophy,
    match: (p) => p === "/competition" || p.startsWith("/competition/"),
  },
  {
    href: "/upload",
    labelKey: "nav.upload",
    labelFb: "Upload",
    icon: Upload,
    match: (p) => p === "/upload" || p.startsWith("/upload/"),
  },
];

export function SlimSidebar({ onOpenChat, unreadMessageCount = 0 }: SlimSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const { open: openUploadModal } = useUploadModal();
  const { open: openLotteryGuide } = useLotteryGuideModal();

  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notifUnread, setNotifUnread] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  // 사이드바 응모권 칸 — 이번 달 발급/사용한 응모권 수(0→5 채워짐).
  // 프로필/업로드의 LotteryCounter 와 동일하게 used 기준으로 통일.
  const [lotteryUsed, setLotteryUsed] = useState<number | null>(null);

  const notifBtnRef = useRef<HTMLButtonElement>(null);
  const notifPanelRef = useRef<HTMLDivElement>(null);
  const langBtnRef = useRef<HTMLButtonElement>(null);
  const langPanelRef = useRef<HTMLDivElement>(null);

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

  const performLogout = async () => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    try { sessionStorage.removeItem("genova:isAdmin"); } catch {}
    setShowLogoutConfirm(false);
    router.refresh();
    router.push("/");
  };

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        showNotifications &&
        notifPanelRef.current &&
        !notifPanelRef.current.contains(target) &&
        notifBtnRef.current &&
        !notifBtnRef.current.contains(target)
      ) {
        setShowNotifications(false);
      }
      if (
        showLang &&
        langPanelRef.current &&
        !langPanelRef.current.contains(target) &&
        langBtnRef.current &&
        !langBtnRef.current.contains(target)
      ) {
        setShowLang(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showNotifications, showLang]);

  useEffect(() => {
    // Cache hit on remount keeps the admin button stable across page transitions.
    try {
      const cached = sessionStorage.getItem("genova:isAdmin");
      if (cached !== null) setIsAdmin(cached === "true");
    } catch {}

    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setUserId(null);
      return;
    }

    const syncAdmin = async (email: string | null | undefined) => {
      if (!email) {
        setIsAdmin(false);
        try { sessionStorage.removeItem("genova:isAdmin"); } catch {}
        return;
      }
      try {
        const res = await fetch("/api/check-admin");
        const data = await res.json();
        const v = data.isAdmin === true;
        setIsAdmin(v);
        try { sessionStorage.setItem("genova:isAdmin", String(v)); } catch {}
      } catch {
        setIsAdmin(false);
      }
    };

    const syncUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      void syncAdmin(user?.email);

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
              metadata: (n.metadata as Record<string, unknown> | null) ?? null,
            })),
          );
          const unread = (notifs ?? []).filter((n) => !n.is_read).length;
          setNotifUnread(unread);
        } catch {
          setNotifications([]);
          setNotifUnread(0);
        }
      } else {
        setNotifications([]);
        setNotifUnread(0);
      }
    };
    void syncUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUserId(u?.id ?? null);
      void syncAdmin(u?.email);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 응모권 잔여 수 — 로그인 사용자만.  /api/lottery/my-count 는
  // current_month_ticket_counts 뷰(RLS 본인 클립)를 읽음.
  useEffect(() => {
    if (!userId) {
      setLotteryUsed(null);
      return;
    }
    let cancelled = false;
    fetch("/api/lottery/my-count")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        const total = d?.count?.total;
        setLotteryUsed(typeof total === "number" ? total : null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel("slim-sidebar-notifications")
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
            metadata: Record<string, unknown> | null;
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
              metadata: n.metadata ?? null,
            },
            ...prev,
          ]);
          setNotifUnread((prev) => prev + 1);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const profileHref = userId ? `/profile/${userId}` : "/auth";
  const popupUnreadCount = notifications.filter((n) => !n.isRead).length;

  const openNotifications = () => {
    setShowLang(false);
    setShowNotifications((prev) => {
      const next = !prev;
      if (next && notifUnread > 0) {
        setNotifUnread(0);
      }
      return next;
    });
  };

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-[55] hidden h-screen w-[84px] flex-col items-center justify-between border-r border-white/[0.06] bg-[#0a0a0a]/95 pb-6 pt-7 backdrop-blur-xl md:flex",
        )}
      >
        <div className="flex w-full flex-col items-center">
          <Link
            href="/"
            className="mb-6 flex h-14 w-14 items-center justify-center transition-transform hover:scale-110"
            aria-label="Genova"
          >
            <img src="/genova-logo.png" alt="Genova" className="h-[52px] w-[52px] object-contain mt-2" />
          </Link>

          <nav className="mt-3 flex w-full flex-col items-center gap-5" aria-label="Main">
            {TOP_NAV.map(({ href, labelKey, labelFb, icon: Icon, match }) => {
              const active = match(pathname);
              const label = t(labelKey, labelFb);
              const sharedClassName = cn(
                "group relative flex h-12 w-12 flex-col items-center justify-center gap-0.5 overflow-visible rounded-xl transition-colors",
                active
                  ? "bg-gradient-to-br from-[#7F77DD]/20 to-[#534AB7]/10 text-[#C7C2F0] shadow-[0_0_16px_rgba(83,74,183,0.10)] ring-1 ring-inset ring-[#7F77DD]/25"
                  : "text-white/35 hover:bg-white/[0.04] hover:text-white/80",
              );
              const inner = (
                <>
                  {active ? (
                    <div
                      className="pointer-events-none absolute -left-3 top-1/2 z-0 h-12 w-8 -translate-y-1/2 rounded-full opacity-80"
                      style={{
                        background: "radial-gradient(circle, rgba(83,74,183,0.18) 0%, transparent 74%)",
                        filter: "blur(14px)",
                      }}
                      aria-hidden
                    />
                  ) : null}
                  <Icon className={cn("relative z-[1] h-5 w-5 shrink-0", active ? "text-[#C7C2F0]" : "")} aria-hidden />
                  <span
                    className={cn(
                      "relative z-[1] max-w-[64px] whitespace-nowrap text-center text-[9px] font-semibold uppercase tracking-wider",
                      active ? "text-[#C7C2F0]" : "text-inherit",
                    )}
                  >
                    {label}
                  </span>
                </>
              );

              if (href === "/upload") {
                return (
                  <button
                    key={href}
                    type="button"
                    onClick={() => openUploadModal()}
                    className={sharedClassName}
                  >
                    {inner}
                  </button>
                );
              }

              return (
                <Link
                  key={href}
                  href={href}
                  className={sharedClassName}
                >
                  {inner}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="min-h-0 flex-1" aria-hidden />

        <div className="flex w-full flex-col items-center gap-3">
          <div className="my-2 h-px w-6 bg-white/[0.05]" aria-hidden />

          <button
            type="button"
            onClick={() => {
              setShowNotifications(false);
              setShowLang(false);
              onOpenChat();
            }}
            className="relative flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-xl text-white/35 transition-colors hover:bg-white/[0.04] hover:text-white/80"
            aria-label={t("layout.messages", "Messages")}
          >
            <MessageCircle className="h-5 w-5 shrink-0" aria-hidden />
            <span className="max-w-[64px] whitespace-nowrap text-center text-[9px] font-semibold uppercase tracking-wider">
              {t("layout.messages", "Messages")}
            </span>
            {unreadMessageCount > 0 ? (
              <span
                className="absolute right-0.5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[9px] font-bold text-white"
                style={{ background: "#534AB7" }}
              >
                {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
              </span>
            ) : null}
          </button>

          <Link
            href={profileHref}
            className={cn(
              "group relative flex h-12 w-12 flex-col items-center justify-center gap-0.5 overflow-visible rounded-xl transition-colors",
              pathname === "/profile" || pathname.startsWith("/profile/")
                ? "bg-gradient-to-br from-[#7F77DD]/20 to-[#534AB7]/10 text-[#C7C2F0] shadow-[0_0_16px_rgba(83,74,183,0.10)] ring-1 ring-inset ring-[#7F77DD]/25"
                : "text-white/35 hover:bg-white/[0.04] hover:text-white/80",
            )}
            aria-label={t("nav.profile", "Profile")}
          >
            {(pathname === "/profile" || pathname.startsWith("/profile/")) && (
              <div
                className="pointer-events-none absolute -left-3 top-1/2 z-0 h-12 w-8 -translate-y-1/2 rounded-full opacity-80"
                style={{
                  background: "radial-gradient(circle, rgba(83,74,183,0.18) 0%, transparent 74%)",
                  filter: "blur(14px)",
                }}
                aria-hidden
              />
            )}
            <User
              className={cn(
                "relative z-[1] h-5 w-5 shrink-0",
                pathname === "/profile" || pathname.startsWith("/profile/") ? "text-[#C7C2F0]" : "",
              )}
              aria-hidden
            />
            <span
              className={cn(
                "relative z-[1] max-w-[64px] whitespace-nowrap text-center text-[9px] font-semibold uppercase tracking-wider",
                pathname === "/profile" || pathname.startsWith("/profile/") ? "text-[#C7C2F0]" : "",
              )}
            >
              {t("nav.profile", "Profile")}
            </span>
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "group relative flex h-12 w-12 flex-col items-center justify-center gap-0.5 overflow-visible rounded-xl transition-colors",
                pathname === "/admin" || pathname.startsWith("/admin/")
                  ? "bg-gradient-to-br from-[#7F77DD]/20 to-[#534AB7]/10 text-[#C7C2F0] shadow-[0_0_16px_rgba(83,74,183,0.10)] ring-1 ring-inset ring-[#7F77DD]/25"
                  : "text-white/35 hover:bg-white/[0.04] hover:text-white/80",
              )}
              aria-label={t("nav.admin", "Admin")}
            >
              {(pathname === "/admin" || pathname.startsWith("/admin/")) && (
                <div
                  className="pointer-events-none absolute -left-3 top-1/2 z-0 h-12 w-8 -translate-y-1/2 rounded-full opacity-80"
                  style={{
                    background: "radial-gradient(circle, rgba(83,74,183,0.18) 0%, transparent 74%)",
                    filter: "blur(14px)",
                  }}
                  aria-hidden
                />
              )}
              <Shield
                className={cn(
                  "relative z-[1] h-5 w-5 shrink-0",
                  pathname === "/admin" || pathname.startsWith("/admin/") ? "text-[#C7C2F0]" : "",
                )}
                aria-hidden
              />
              <span
                className={cn(
                  "relative z-[1] max-w-[64px] whitespace-nowrap text-center text-[9px] font-semibold uppercase tracking-wider",
                  pathname === "/admin" || pathname.startsWith("/admin/") ? "text-[#C7C2F0]" : "",
                )}
              >
                {t("nav.admin", "Admin")}
              </span>
            </Link>
          )}

          <div className="my-1 h-px w-6 bg-white/[0.05]" aria-hidden />

          {/* 응모권 — 잔여 수 코너 인디케이터 유지 */}
          <button
            type="button"
            onClick={openLotteryGuide}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-white/35 transition-colors hover:bg-white/[0.04] hover:text-white/80"
            aria-label={t("lottery.guideLink", "응모권 추첨 안내")}
            title={t("nav.lottery", "응모권")}
          >
            <Ticket className="h-[19px] w-[19px] shrink-0" aria-hidden />
            {lotteryUsed !== null ? (
              <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-[#0a0a0a] px-0.5 text-[8px] font-bold tabular-nums leading-tight text-[#AFA9EC]/85">
                {lotteryUsed}
              </span>
            ) : null}
          </button>

          {/* 알림 — 배지 가시성 위해 노출 유지 */}
          <button
            ref={notifBtnRef}
            type="button"
            onClick={openNotifications}
            className={cn(
              "relative flex h-10 w-10 items-center justify-center rounded-xl text-white/35 transition-colors hover:bg-white/[0.04] hover:text-white/80",
              showNotifications && "bg-white/[0.04] text-white/80",
            )}
            aria-label={t("notifications.title")}
            aria-expanded={showNotifications}
            title={t("sidebar.notifications", "Alerts")}
          >
            <Bell className="h-[19px] w-[19px] shrink-0" aria-hidden />
            {userId && notifUnread > 0 && !showNotifications ? (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5 text-[8px] font-bold text-white"
                style={{ background: "#534AB7" }}
              >
                {notifUnread > 9 ? "9+" : notifUnread}
              </span>
            ) : null}
          </button>

          {/* 더보기 — 언어 설정 / 로그아웃 (사용 빈도 낮아 메뉴로 접음) */}
          <button
            ref={langBtnRef}
            type="button"
            onClick={() => {
              setShowNotifications(false);
              setShowLang((v) => !v);
            }}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl text-white/35 transition-colors hover:bg-white/[0.04] hover:text-white/80",
              showLang && "bg-white/[0.04] text-white/80",
            )}
            aria-haspopup="menu"
            aria-expanded={showLang}
            aria-label={t("common.more", "더보기")}
            title={t("common.more", "더보기")}
          >
            <MoreHorizontal className="h-[19px] w-[19px] shrink-0" aria-hidden />
          </button>
        </div>
      </aside>

      {showNotifications ? (
        <div
          ref={notifPanelRef}
          className="anim-pop fixed bottom-4 left-[84px] z-[100] hidden w-[320px] origin-bottom-left overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0a] shadow-2xl md:block"
        >
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-bold text-white">{t("notifications.title")}</p>
              {popupUnreadCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#7F77DD] px-1.5 text-[10px] font-bold text-white">
                  {popupUnreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {userId && popupUnreadCount > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    await markAllNotificationsReadAction();
                    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                    setNotifUnread(0);
                  }}
                  className="text-[10px] text-white/35 transition hover:text-white/70"
                >
                  {t("notifications.markAllRead")}
                </button>
              )}
              {userId && notifications.length > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    const supabase = getBrowserSupabaseClient();
                    const ids = notifications.map((n) => n.id);
                    if (ids.length === 0 || !supabase) return;
                    await supabase.from("notifications").delete().in("id", ids);
                    setNotifications([]);
                    setNotifUnread(0);
                  }}
                  className="text-[10px] text-white/35 transition hover:text-red-400"
                >
                  {t("notifications.deleteAll")}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowNotifications(false)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-white/30 transition hover:bg-white/[0.05] hover:text-white/55"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {userId === undefined ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-sm text-white/30">{t("common.loadingAccount")}</p>
              </div>
            ) : userId === null ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <p className="text-sm text-white/35">{t("notifications.empty")}</p>
                <Link
                  href="/auth"
                  className="mt-3 text-[12px] font-semibold text-[#AFA9EC] underline-offset-2 hover:underline"
                  onClick={() => setShowNotifications(false)}
                >
                  {t("common.signIn")}
                </Link>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell className="mb-3 h-8 w-8 text-white/15" />
                <p className="text-sm text-white/30">{t("notifications.empty")}</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="group">
                  <div
                    className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition hover:bg-white/[0.04] ${!n.isRead ? "bg-white/[0.03]" : "bg-transparent"}`}
                    onClick={async () => {
                      if (!n.isRead) {
                        const supabase = getBrowserSupabaseClient();
                        if (supabase) {
                          await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
                        }
                        setNotifications((prev) =>
                          prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item)),
                        );
                        setNotifUnread((prev) => Math.max(0, prev - 1));
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
                      {(() => {
                        const label = getNotificationLabel(n, t);
                        return (
                          <>
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-xs font-semibold ${n.isRead ? "text-white/50" : "text-white"}`}>{label.title}</p>
                              {n.createdAt && (
                                <span className="shrink-0 text-[10px] text-white/35">
                                  {formatNotificationRelativeTime(n.createdAt)}
                                </span>
                              )}
                            </div>
                            {label.body && <p className="mt-0.5 text-[10px] text-white/55">{label.body}</p>}
                          </>
                        );
                      })()}
                    </div>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const supabase = getBrowserSupabaseClient();
                        if (!supabase) return;
                        await supabase.from("notifications").delete().eq("id", n.id);
                        setNotifications((prev) => prev.filter((item) => item.id !== n.id));
                        if (!n.isRead) setNotifUnread((prev) => Math.max(0, prev - 1));
                      }}
                      className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white/20 opacity-0 transition hover:bg-white/[0.05] hover:text-red-400 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {userId ? (
            <div className="border-t border-white/[0.06] px-4 py-2.5">
              <Link
                href="/notifications"
                onClick={() => setShowNotifications(false)}
                className="block text-center text-[11px] text-white/35 transition hover:text-white/70"
              >
                {t("notifications.viewAllNotifications")}
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}

      {showLang ? (
        <div
          ref={langPanelRef}
          role="menu"
          className="anim-pop fixed bottom-[56px] left-[84px] z-[100] hidden origin-bottom-left md:block"
        >
          <div className="w-[184px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0a]/95 p-1.5 shadow-2xl backdrop-blur-xl">
            <p className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
              {t("sidebar.language")}
            </p>
            <div className="flex gap-1 px-1 pb-1.5">
              {(["en", "ko", "ja"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    setLocale(lang);
                    setShowLang(false);
                  }}
                  className={cn(
                    "h-8 flex-1 rounded-lg text-[11px] font-bold transition",
                    locale === lang
                      ? "bg-gradient-to-br from-[#7F77DD]/25 to-[#534AB7]/15 text-[#C7C2F0] ring-1 ring-inset ring-[#7F77DD]/30"
                      : "text-white/40 hover:bg-white/[0.04] hover:text-white/75",
                  )}
                >
                  {lang === "en" ? "EN" : lang === "ko" ? "KO" : "JA"}
                </button>
              ))}
            </div>
            <div className="my-1 h-px bg-white/[0.06]" aria-hidden />
            {userId === undefined ? null : userId ? (
              <button
                type="button"
                onClick={() => {
                  setShowLang(false);
                  setShowLogoutConfirm(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-semibold text-white/55 transition hover:bg-red-500/[0.08] hover:text-red-300"
              >
                <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                {t("sidebar.logout", "Logout")}
              </button>
            ) : (
              <Link
                href="/auth"
                onClick={() => setShowLang(false)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-semibold text-white/55 transition hover:bg-white/[0.05] hover:text-[#C7C2F0]"
              >
                <LogIn className="h-4 w-4 shrink-0" aria-hidden />
                {t("auth.signIn", "Sign in")}
              </Link>
            )}
          </div>
        </div>
      ) : null}

      {showLogoutConfirm ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="anim-scrim absolute inset-0 bg-black/65 backdrop-blur-sm"
            aria-hidden
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className="anim-modal relative w-full max-w-[360px] overflow-hidden rounded-2xl border border-[#7F77DD]/20 p-6 text-center"
            style={{
              background:
                "linear-gradient(160deg, rgba(20,16,40,0.96) 0%, rgba(10,10,10,0.98) 100%)",
              boxShadow:
                "0 24px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(127,119,221,0.16)",
            }}
          >
            <div
              className="pointer-events-none absolute -top-16 left-1/2 h-32 w-48 -translate-x-1/2 rounded-full opacity-70"
              style={{
                background:
                  "radial-gradient(circle, rgba(83,74,183,0.28) 0%, transparent 70%)",
                filter: "blur(28px)",
              }}
              aria-hidden
            />
            <div
              className="relative mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#7F77DD]/25"
              style={{ background: "rgba(83,74,183,0.14)" }}
            >
              <LogOut className="h-5 w-5 text-[#AFA9EC]" aria-hidden />
            </div>
            <h2 className="relative text-[16px] font-bold text-white">
              {t("sidebar.logout", "Logout")}
            </h2>
            <p className="relative mt-2 text-[13px] leading-relaxed text-white/55">
              {t("sidebar.logoutConfirm", "정말 로그아웃 하시겠어요?")}
            </p>
            <div className="relative mt-6 flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-full border border-white/[0.1] bg-white/[0.04] py-2.5 text-[13px] font-semibold text-white/70 backdrop-blur-md transition hover:border-white/20 hover:text-white"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={() => void performLogout()}
                className="flex-1 rounded-full py-2.5 text-[13px] font-bold text-white transition-all duration-200 hover:brightness-110"
                style={{
                  background:
                    "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  boxShadow: "0 4px 16px rgba(220,38,38,0.35)",
                }}
              >
                {t("sidebar.logout", "Logout")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
