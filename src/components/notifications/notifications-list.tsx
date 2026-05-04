"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, MessageCircle, UserPlus, Star, Trash2, X } from "lucide-react";
import { markAllNotificationsReadAction } from "@/app/actions/notifications";
import type { AppNotification } from "@/lib/queries/notifications-queries";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

function NotificationIcon({ type }: { type: string }) {
  const base = "h-4 w-4";
  if (type === "comment") return <MessageCircle className={`${base} text-blue-400`} />;
  if (type === "follow") return <UserPlus className={`${base} text-emerald-400`} />;
  if (type === "trophy") return <Star className={`${base} text-yellow-400`} />;
  if (type === "competition_result") return <Star className={`${base} text-[#7F77DD]`} />;
  return <Bell className={`${base} text-[#7F77DD]`} />;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type FilterType = "all" | "unread" | "read";

export function NotificationsList({ items: initialItems }: { items: AppNotification[] }) {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<FilterType>("all");

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
        background: "linear-gradient(135deg, rgba(20,17,50,0.98) 0%, rgba(10,8,28,0.99) 100%)",
        boxShadow: "0 0 0 1px rgba(127,119,221,0.08)",
      }}
    >
      {/* 헤더 */}
      <div className="mb-5 flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]/60">Inbox</p>
          <h1 className="mt-0.5 text-xl font-black tracking-tight text-white">
            Notifications
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
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void onReadAll()}
              className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-white/40 transition hover:border-[#7F77DD]/30 hover:text-white/70"
            >
              Mark all read
            </button>
          )}
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => void deleteAll()}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-white/40 transition hover:border-red-500/30 hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
              Delete all
            </button>
          )}
        </div>
      </div>

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
            className="flex-1 rounded-lg py-1.5 text-xs font-semibold transition"
            style={{
              background: filter === f ? "rgba(83,74,183,0.4)" : "transparent",
              border: filter === f ? "1px solid rgba(127,119,221,0.4)" : "1px solid transparent",
              color: filter === f ? "#AFA9EC" : "rgba(255,255,255,0.35)",
            }}
          >
            {f === "all" ? `All (${items.length})` : f === "unread" ? `Unread (${unreadCount})` : `Read (${items.length - unreadCount})`}
          </button>
        ))}
      </div>

      {/* 알림 목록 */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "rgba(83,74,183,0.15)", border: "1px solid rgba(127,119,221,0.2)" }}
          >
            <Bell className="h-6 w-6 text-[#7F77DD]/50" />
          </div>
          <p className="text-base font-bold text-white/50">
            {filter === "unread" ? "No unread notifications" : filter === "read" ? "No read notifications" : "No notifications yet"}
          </p>
          <p className="mt-1 text-sm text-white/25">
            Likes, comments, and follows will appear here.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filteredItems.map((n) => {
            const content = (
              <div
                onClick={!n.href ? () => void handleClick(n) : undefined}
                className={`group flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition hover:bg-white/[0.03] ${
                  n.isRead
                    ? "border-white/[0.06] bg-transparent"
                    : "border-[#7F77DD]/25 bg-[#534AB7]/10"
                }`}
              >
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
                  <p className={`text-sm font-semibold ${n.isRead ? "text-white/60" : "text-white"}`}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="mt-0.5 text-xs text-white/35">{n.body}</p>
                  )}
                  {n.createdAt && (
                    <p className="mt-1 text-[10px] text-white/25">{timeAgo(n.createdAt)}</p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {/* 읽지 않음 표시 */}
                  {!n.isRead && (
                    <div className="h-2 w-2 rounded-full bg-[#7F77DD]" />
                  )}
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
