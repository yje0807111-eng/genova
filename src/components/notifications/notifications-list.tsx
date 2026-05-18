"use client";

import Link from "next/link";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Bell, MessageCircle, UserPlus, Star, Trash2, X, Settings } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useExitAnimation } from "@/lib/hooks/use-exit-animation";
import { markAllNotificationsReadAction } from "@/app/actions/notifications";
import { updateProfileAction } from "@/app/actions/profile";
import type { AppNotification } from "@/lib/queries/notifications-queries";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { useI18n } from "@/components/genova/language-provider";
import { getNotificationLabel } from "@/lib/notifications-i18n";

function NotificationIcon({ type }: { type: string }) {
  const base = "h-4 w-4";
  if (type === "comment") return <MessageCircle className={`${base} text-blue-400`} />;
  if (type === "follow") return <UserPlus className={`${base} text-emerald-400`} />;
  if (type === "trophy") return <Star className={`${base} text-yellow-400`} />;
  if (type === "competition_result") return <Star className={`${base} text-[#7F77DD]`} />;
  return <Bell className={`${base} text-[#7F77DD]`} />;
}

function timeAgo(iso: string, t: (key: string, fallback?: string) => string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("notifications.justNow", "Just now");
  if (mins < 60) return t("notifications.timeAgo", "{n} ago").replace("{n}", `${mins}m`);
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("notifications.timeAgo", "{n} ago").replace("{n}", `${hours}h`);
  const days = Math.floor(hours / 24);
  return t("notifications.timeAgo", "{n} ago").replace("{n}", `${days}d`);
}

function NotificationToggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition hover:border-white/[0.12]"
    >
      <div className="flex flex-col items-start text-left">
        <span className="text-[13px] font-bold text-white">{label}</span>
        <span className="text-[11px] text-white/45">{description}</span>
      </div>
      <span className={cn(
        "relative h-5 w-9 shrink-0 rounded-full transition",
        value ? "bg-[#534AB7]" : "bg-white/[0.1]"
      )}>
        <span className={cn(
          "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
          value ? "translate-x-4" : "translate-x-0"
        )} />
      </span>
    </button>
  );
}

type FilterType = "all" | "unread" | "read";

export function NotificationsList({
  items: initialItems,
  initialNotifyLikes = true,
  initialNotifyComments = true,
  initialNotifyFollows = true,
}: {
  items: AppNotification[];
  initialNotifyLikes?: boolean;
  initialNotifyComments?: boolean;
  initialNotifyFollows?: boolean;
}) {
  const { t } = useI18n();
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<FilterType>("all");
  const [notifyLikes, setNotifyLikes] = useState(initialNotifyLikes);
  const [notifyComments, setNotifyComments] = useState(initialNotifyComments);
  const [notifyFollows, setNotifyFollows] = useState(initialNotifyFollows);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { render: settingsRender, closing: settingsClosing } =
    useExitAnimation(settingsOpen, 200);

  const handleToggle = async (field: "notifyLikes" | "notifyComments" | "notifyFollows", value: boolean) => {
    if (field === "notifyLikes") setNotifyLikes(value);
    if (field === "notifyComments") setNotifyComments(value);
    if (field === "notifyFollows") setNotifyFollows(value);
    await updateProfileAction({ [field]: value });
  };

  const unreadCount = items.filter((n) => !n.isRead).length;

  const filteredItems = items.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read") return n.isRead;
    return true;
  });

  const markAsRead = async (id: string) => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  };

  const deleteOne = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    await supabase.from("notifications").delete().eq("id", id);
    setItems((prev) => prev.filter((n) => n.id !== id));
  };

  const onReadAll = async () => {
    const res = await markAllNotificationsReadAction();
    if (!res.ok) return;
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const deleteAll = async () => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    const ids = items.map((n) => n.id);
    await supabase.from("notifications").delete().in("id", ids);
    setItems([]);
  };

  const handleClick = async (n: AppNotification) => {
    if (!n.isRead) await markAsRead(n.id);

    // comment 타입이면 채팅 사이드바 오픈
    if (n.type === "comment") {
      window.dispatchEvent(new CustomEvent("open-chat-sidebar", {
        detail: { href: n.href }
      }));
    }
  };

  return (
    <div
      className="rounded-2xl border border-white/[0.08] p-5"
      style={{
        background: "#0a0a0a",
      }}
    >
      {/* 헤더 */}
      <div className="mb-5 flex flex-col gap-3 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]/60">
            {t("notifications.inboxEyebrow", "INBOX")}
          </p>
          <h1 className="mt-0.5 text-xl font-black tracking-tight text-white">
            {t("notifications.title", "Notifications")}
            {unreadCount > 0 && (
              <span
                className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
                style={{ background: "#534AB7" }}
              >
                {unreadCount}
              </span>
            )}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void onReadAll()}
              className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-white/35 transition hover:border-[#7F77DD]/30 hover:text-white/70"
            >
              {t("notifications.markAllRead", "Mark all as read")}
            </button>
          )}
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => void deleteAll()}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-white/35 transition hover:border-red-500/30 hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
              {t("notifications.deleteAll", "전체 삭제")}
            </button>
          )}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-white/35 transition hover:border-[#7F77DD]/30 hover:text-white/70"
          >
            <Settings className="h-3 w-3" />
            {t("notifications.settings.short", "Settings")}
          </button>
        </div>
      </div>

      {/* 알림 설정 — 팝업 모달 (헤더 '설정' 버튼으로 진입) */}
      {settingsRender &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className={`fixed inset-0 z-[140] flex items-center justify-center p-4 ${
              settingsClosing ? "anim-scrim-out" : "anim-scrim"
            } bg-black/70 backdrop-blur-sm`}
            onClick={() => setSettingsOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-5"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#AFA9EC]/70">
                    ✦ {t("notifications.settings.eyebrow", "SETTINGS")}
                  </p>
                  <h3 className="mt-1 text-[15px] font-bold text-white">
                    {t("notifications.settings.title", "Notification settings")}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  aria-label="Close"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/55 transition hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                <NotificationToggle
                  label={t("notifications.toggle.likes", "Likes")}
                  description={t("notifications.toggle.likesDesc", "When someone likes your film")}
                  value={notifyLikes}
                  onChange={(v) => void handleToggle("notifyLikes", v)}
                />
                <NotificationToggle
                  label={t("notifications.toggle.comments", "Comments")}
                  description={t("notifications.toggle.commentsDesc", "When someone comments on your film")}
                  value={notifyComments}
                  onChange={(v) => void handleToggle("notifyComments", v)}
                />
                <NotificationToggle
                  label={t("notifications.toggle.follows", "Followers")}
                  description={t("notifications.toggle.followsDesc", "When someone follows you")}
                  value={notifyFollows}
                  onChange={(v) => void handleToggle("notifyFollows", v)}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* 필터 탭 */}
      <div
        className="mb-4 flex gap-1 rounded-xl p-1"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {(["all", "unread", "read"] as FilterType[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "flex-1 rounded-lg py-1.5 text-xs font-semibold transition",
              filter === f
                ? "border border-white/[0.08] bg-white/[0.06] text-white"
                : "border border-transparent text-white/35 hover:text-white/60"
            )}
          >
            {f === "all"
              ? `${t("notifications.tab.all", "전체")} (${items.length})`
              : f === "unread"
                ? `${t("notifications.tab.unread", "안 읽음")} (${unreadCount})`
                : `${t("notifications.tab.read", "읽음")} (${items.length - unreadCount})`}
          </button>
        ))}
      </div>

      {/* 알림 목록 */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "var(--tint-accent-15)", border: "1px solid rgba(127,119,221,0.2)" }}
          >
            <Bell className="h-6 w-6 text-[#7F77DD]/50" />
          </div>
          <p className="text-base font-bold text-white/50">
            {filter === "unread"
              ? t("notifications.emptyUnreadList", "No unread notifications")
              : filter === "read"
                ? t("notifications.emptyRead", "No read notifications")
                : t("notifications.empty", "No notifications yet.")}
          </p>
          <p className="mt-1 text-sm text-white/25">
            {filter === "unread"
              ? t("notifications.unreadAllCaughtUp", "You're all caught up.")
              : t("notifications.emptyHint", "Likes, comments, and follows will appear here.")}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filteredItems.map((n) => {
            const content = (
              <div
                onClick={!n.href ? () => void handleClick(n) : undefined}
                className={`group relative flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition hover:bg-white/[0.04] hover:border-white/[0.12] ${
                  n.isRead
                    ? "border-white/[0.06] bg-transparent opacity-60"
                    : "border-white/[0.06] bg-white/[0.02]"
                }`}
              >
                <span
                  className={cn(
                    "absolute bottom-2 left-0 top-2 w-[2px] rounded-r-full",
                    n.isRead ? "bg-transparent" : "bg-[#7F77DD]"
                  )}
                  aria-hidden
                />
                {!n.isRead && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#7F77DD]" aria-hidden />}
                {/* 아이콘 */}
                <div
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: n.isRead ? "rgba(255,255,255,0.04)" : "rgba(83,74,183,0.2)",
                    border: `1px solid ${n.isRead ? "rgba(255,255,255,0.06)" : "rgba(127,119,221,0.25)"}`,
                  }}
                >
                  <NotificationIcon type={n.type ?? ""} />
                </div>

                {/* 텍스트 */}
                <div className="min-w-0 flex-1">
                  {(() => {
                    const { title, body } = getNotificationLabel(n, t);
                    return (
                      <>
                        <p className={`text-sm font-semibold ${n.isRead ? "text-white/55" : "text-white"}`}>
                          {title}
                        </p>
                        {body && (
                          <p className="mt-0.5 text-xs text-white/35">{body}</p>
                        )}
                      </>
                    );
                  })()}
                  {n.createdAt && (
                    <p className="mt-1 text-[10px] text-white/25">{timeAgo(n.createdAt, t)}</p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {/* 개별 삭제 */}
                  <button
                    type="button"
                    onClick={(e) => void deleteOne(n.id, e)}
                    className="opacity-0 transition group-hover:opacity-100 text-white/20 hover:text-red-400"
                    aria-label="Delete notification"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );

            return (
              <li key={n.id}>
                {n.href ? (
                  <Link href={n.href} onClick={() => void handleClick(n)}>
                    {content}
                  </Link>
                ) : content}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
