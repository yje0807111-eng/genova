"use client";

import Link from "next/link";
import { Camera, Info, Paperclip, Phone, Search, Send, Smile, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/genova/language-provider";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils/cn";

type ChatTarget = {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  status?: "online" | "away" | "offline";
  lastMessage?: string;
  lastTime?: string;
};

type FollowingUser = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  watchCount: number;
  hasNewVideo: boolean;
  newVideoTitle?: string;
  lastActive?: string;
};

type DiscoverUser = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  latestVideoTitle?: string;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function Avatar({ name }: { name: string }) {
  const initials = getInitials(name);
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
      style={{ backgroundColor: "#534AB7" }}
    >
      {initials}
    </div>
  );
}

export function ChatDrawer({
  open,
  onClose,
  initialTarget,
  onUnreadChange,
}: {
  open: boolean;
  onClose: () => void;
  initialTarget?: ChatTarget | null;
  onUnreadChange?: (count: number) => void;
}) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"messages" | "following">("messages");
  const [activeTarget, setActiveTarget] = useState<ChatTarget | null>(null);
  const [messages, setMessages] = useState<{
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
    likes: string[];
    replyToId: string | null;
    replyToContent: string | null;
    isDeleted: boolean;
  }[]>([]);
  const [replyTarget, setReplyTarget] = useState<{
    id: string;
    content: string;
    senderName: string;
  } | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<{
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    lastMessage: string;
    lastTime: string;
    unreadCount: number;
  }[]>([]);
  const [convsLoading, setConvsLoading] = useState(false);
  const [pinnedUserIds, setPinnedUserIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("chat_pinned_users");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [msgInput, setMsgInput] = useState("");
  const [msgSending, setMsgSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followingUsers, setFollowingUsers] = useState<FollowingUser[]>([]);
  const [discoverUsers, setDiscoverUsers] = useState<DiscoverUser[]>([]);
  const [followingLoading, setFollowingLoading] = useState(false);
  const totalUnreadCount = conversations.filter((c) => c.unreadCount > 0).length;

  const togglePin = (userId: string) => {
    setPinnedUserIds((prev) => {
      const next = prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [userId, ...prev];
      localStorage.setItem("chat_pinned_users", JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (!open || !initialTarget) return;
    setActiveTarget(initialTarget);
  }, [open, initialTarget]);

  useEffect(() => {
    if (open) return;
    setActiveTarget(null);
  }, [open]);

  useEffect(() => {
    onUnreadChange?.(totalUnreadCount);
  }, [totalUnreadCount, onUnreadChange]);

  useEffect(() => {
    if (activeTarget !== null || !currentUserId) return;
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;

    const refresh = async () => {
      const { data: sent } = await supabase
        .from("messages")
        .select("receiver_id, content, created_at, is_read")
        .eq("sender_id", currentUserId)
        .order("created_at", { ascending: false });

      const { data: received } = await supabase
        .from("messages")
        .select("sender_id, content, created_at, is_read")
        .eq("receiver_id", currentUserId)
        .order("created_at", { ascending: false });

      const partnerIds = Array.from(new Set([
        ...(sent ?? []).map((m) => m.receiver_id as string),
        ...(received ?? []).map((m) => m.sender_id as string),
      ]));

      if (partnerIds.length === 0) {
        setConversations([]);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", partnerIds);

      const convs = (profiles ?? []).map((profile) => {
        const allMessages = [
          ...(sent ?? [])
            .filter((m) => m.receiver_id === profile.id)
            .map((m) => ({ content: m.content as string, createdAt: m.created_at as string, unread: false })),
          ...(received ?? [])
            .filter((m) => m.sender_id === profile.id)
            .map((m) => ({ content: m.content as string, createdAt: m.created_at as string, unread: !m.is_read })),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const last = allMessages[0];
        const unreadCount = (received ?? []).filter(
          (m) => m.sender_id === profile.id && !m.is_read
        ).length;

        return {
          userId: profile.id as string,
          displayName: (profile.display_name as string) ?? "User",
          avatarUrl: (profile.avatar_url as string | null),
          lastMessage: last?.content ?? "",
          lastTime: last?.createdAt ?? "",
          unreadCount,
        };
      }).sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());

      setConversations(convs);
    };

    void refresh();
  }, [activeTarget, currentUserId]);

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;

    const loadConversations = async () => {
      setConvsLoading(true);
      try {
        const { data: sent } = await supabase
          .from("messages")
          .select("receiver_id, content, created_at, is_read")
          .eq("sender_id", currentUserId)
          .order("created_at", { ascending: false });

        const { data: received } = await supabase
          .from("messages")
          .select("sender_id, content, created_at, is_read")
          .eq("receiver_id", currentUserId)
          .order("created_at", { ascending: false });

        const partnerIds = Array.from(new Set([
          ...(sent ?? []).map((m) => m.receiver_id as string),
          ...(received ?? []).map((m) => m.sender_id as string),
        ]));

        if (partnerIds.length === 0) {
          setConversations([]);
          return;
        }

        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", partnerIds);

        const convs = (profiles ?? []).map((profile) => {
          const allMessages = [
            ...(sent ?? [])
              .filter((m) => m.receiver_id === profile.id)
              .map((m) => ({ content: m.content as string, createdAt: m.created_at as string, isMine: true, isRead: m.is_read as boolean })),
            ...(received ?? [])
              .filter((m) => m.sender_id === profile.id)
              .map((m) => ({ content: m.content as string, createdAt: m.created_at as string, isMine: false, isRead: m.is_read as boolean })),
          ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          const last = allMessages[0];
          const unreadCount = (received ?? []).filter(
            (m) => m.sender_id === profile.id && !m.is_read
          ).length;

          return {
            userId: profile.id as string,
            displayName: (profile.display_name as string) ?? "User",
            avatarUrl: (profile.avatar_url as string | null),
            lastMessage: last?.content ?? "",
            lastTime: last?.createdAt ?? "",
            unreadCount,
          };
        }).sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());

        setConversations(convs);
      } finally {
        setConvsLoading(false);
      }
    };

    void loadConversations();

    const channel = supabase
      .channel("new-messages-badge")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const m = payload.new as {
            sender_id: string;
            content: string;
            created_at: string;
          };
          // activeTarget이 해당 유저면 무시 (이미 읽음 처리)
          setConversations((prev) => {
            const existing = prev.find((c) => c.userId === m.sender_id);
            if (existing) {
              return prev
                .map((c) =>
                  c.userId === m.sender_id
                    ? { ...c, lastMessage: m.content, lastTime: m.created_at, unreadCount: c.unreadCount + 1 }
                    : c
                )
                .sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [currentUserId]);

  const statusLabel = useMemo(() => {
    if (!activeTarget?.status) return "";
    if (activeTarget.status === "online") return t("chat.statusOnline");
    if (activeTarget.status === "away") return t("chat.statusAway");
    return t("chat.statusOffline");
  }, [activeTarget?.status, t]);

  useEffect(() => {
    if (activeTab !== "following" || !currentUserId) return;
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;

    setFollowingLoading(true);

    const load = async () => {
      try {
        console.log("currentUserId:", currentUserId);
        const { data: follows } = await supabase
          .from("follows")
          .select("*")
          .eq("follower_id", currentUserId);
        const followingIds = follows?.map((f) => f.following_id as string) ?? [];

        if (followingIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, display_name, avatar_url")
            .in("id", followingIds);
          const { data: watchHistory } = await supabase
            .from("watch_history")
            .select("video_id")
            .eq("user_id", currentUserId);

          const watchedVideoIds = watchHistory?.map((w) => w.video_id as string) ?? [];

          const { data: videos } = await supabase
            .from("videos")
            .select("id, title, uploaded_by, created_at")
            .in("uploaded_by", followingIds)
            .order("created_at", { ascending: false });

          const watchCountMap: Record<string, number> = {};
          for (const vid of videos ?? []) {
            if (watchedVideoIds.includes(vid.id as string)) {
              const uid = vid.uploaded_by as string;
              watchCountMap[uid] = (watchCountMap[uid] ?? 0) + 1;
            }
          }

          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const newVideoMap: Record<string, string> = {};
          for (const vid of videos ?? []) {
            const uid = vid.uploaded_by as string;
            if ((vid.created_at as string) > sevenDaysAgo && !newVideoMap[uid]) {
              newVideoMap[uid] = vid.title as string;
            }
          }

          const result: FollowingUser[] = (profiles ?? [])
            .map((p) => ({
              id: p.id as string,
              displayName: p.display_name as string | null,
              avatarUrl: p.avatar_url as string | null,
              watchCount: watchCountMap[p.id as string] ?? 0,
              hasNewVideo: Boolean(newVideoMap[p.id as string]),
              newVideoTitle: newVideoMap[p.id as string],
            }))
            .sort((a, b) => b.watchCount - a.watchCount);

          setFollowingUsers(result);
        } else {
          setFollowingUsers([]);
        }

        const excluded = [currentUserId, ...followingIds].map((id) => `"${id}"`).join(",");
        const { data: allProfiles } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .not("id", "in", `(${excluded})`)
          .limit(10);

        const discoverIds = allProfiles?.map((p) => p.id as string) ?? [];
        const { data: discoverVideos } = discoverIds.length > 0
          ? await supabase
              .from("videos")
              .select("id, title, uploaded_by")
              .in("uploaded_by", discoverIds)
              .order("created_at", { ascending: false })
          : { data: [] };

        const discoverVideoMap: Record<string, string> = {};
        for (const vid of discoverVideos ?? []) {
          const uid = vid.uploaded_by as string;
          if (!discoverVideoMap[uid]) {
            discoverVideoMap[uid] = vid.title as string;
          }
        }

        setDiscoverUsers(
          (allProfiles ?? []).map((p) => ({
            id: p.id as string,
            displayName: p.display_name as string | null,
            avatarUrl: p.avatar_url as string | null,
            latestVideoTitle: discoverVideoMap[p.id as string],
          }))
        );
      } finally {
        setFollowingLoading(false);
      }
    };

    void load();
  }, [activeTab, currentUserId]);

  useEffect(() => {
    if (!activeTarget || !currentUserId) return;
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;

    // 기존 메시지 로드
    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, receiver_id, content, created_at, likes, reply_to_id, reply_to_content, is_deleted")
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${activeTarget.userId}),and(sender_id.eq.${activeTarget.userId},receiver_id.eq.${currentUserId})`,
        )
        .order("created_at", { ascending: true });

      setMessages(
        (data ?? []).map((m) => ({
          id: m.id as string,
          senderId: m.sender_id as string,
          content: m.content as string,
          createdAt: m.created_at as string,
          likes: (m.likes as string[]) ?? [],
          replyToId: (m.reply_to_id as string) ?? null,
          replyToContent: (m.reply_to_content as string) ?? null,
          isDeleted: (m.is_deleted as boolean) ?? false,
        })),
      );

      // 읽음 처리
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("sender_id", activeTarget.userId)
        .eq("receiver_id", currentUserId)
        .eq("is_read", false);
    };
    void load();

    // 실시간 구독
    const channel = supabase
      .channel(`chat-${currentUserId}-${activeTarget.userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        (payload) => {
          const m = payload.new as {
            id: string;
            sender_id: string;
            content: string;
            created_at: string;
            likes: string[];
            reply_to_id: string | null;
            reply_to_content: string | null;
            is_deleted: boolean;
          };
          if (m.sender_id !== activeTarget.userId) return;
          setMessages((prev) => [
            ...prev,
            {
              id: m.id,
              senderId: m.sender_id,
              content: m.content,
              createdAt: m.created_at,
              likes: m.likes ?? [],
              replyToId: m.reply_to_id ?? null,
              replyToContent: m.reply_to_content ?? null,
              isDeleted: m.is_deleted ?? false,
            },
          ]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        (payload) => {
          const m = payload.new as { id: string; is_deleted: boolean; content: string };
          if (m.is_deleted) {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === m.id ? { ...msg, isDeleted: true, content: "삭제된 메시지입니다." } : msg))
            );
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeTarget, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleMessageLike = async (messageId: string) => {
    if (!currentUserId) return;
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;
    const hasLiked = msg.likes.includes(currentUserId);
    const newLikes = hasLiked
      ? msg.likes.filter((id) => id !== currentUserId)
      : [...msg.likes, currentUserId];
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, likes: newLikes } : m)),
    );
    await supabase.from("messages").update({ likes: newLikes }).eq("id", messageId);
  };

  const deleteMessage = async (messageId: string) => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    await supabase
      .from("messages")
      .update({ is_deleted: true, content: "삭제된 메시지입니다." })
      .eq("id", messageId)
      .eq("sender_id", currentUserId ?? "");
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isDeleted: true, content: "삭제된 메시지입니다." } : m))
    );
  };

  const sendMessage = async () => {
    const text = msgInput.trim();
    if (!text || !activeTarget || !currentUserId || msgSending) return;
    setMsgSending(true);
    setMsgInput("");
    const reply = replyTarget;
    setReplyTarget(null);
    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setMsgSending(false);
      return;
    }
    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: currentUserId,
        receiver_id: activeTarget.userId,
        content: text,
        is_read: false,
        likes: [],
        reply_to_id: reply?.id ?? null,
        reply_to_content: reply?.content ?? null,
      })
      .select()
      .maybeSingle();
    if (!error && data) {
      setMessages((prev) => [
        ...prev,
        {
          id: data.id as string,
          senderId: currentUserId,
          content: text,
          createdAt: data.created_at as string,
          likes: [],
          replyToId: reply?.id ?? null,
          replyToContent: reply?.content ?? null,
          isDeleted: false,
        },
      ]);
    }
    setMsgSending(false);
  };

  return (
    <aside
      className={cn(
        "fixed right-0 top-0 z-[60] flex h-screen w-80 flex-col transition-transform duration-300",
        open ? "translate-x-0" : "translate-x-full",
      )}
      style={{
        background: "linear-gradient(180deg, rgba(12,10,30,0.99) 0%, rgba(8,6,24,1) 100%)",
        borderLeft: "1px solid rgba(127,119,221,0.12)",
        backdropFilter: "blur(20px)",
      }}
      aria-hidden={!open}
    >
      {activeTarget ? (
        <>
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid rgba(127,119,221,0.1)" }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTarget(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition hover:bg-white/[0.05] hover:text-white"
              >
                ←
              </button>
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-2xl bg-[#26215C]">
                {activeTarget?.avatarUrl ? (
                  <img src={activeTarget.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white/60">
                    {activeTarget?.displayName.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{activeTarget?.displayName}</p>
                <p className="text-[10px] text-white/30">{statusLabel || "Genova Member"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-white/25">
              <button type="button" className="rounded-xl p-1.5 transition hover:bg-white/[0.05] hover:text-white/60">
                <Info className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="sidebar-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-white/30">No messages yet</p>
                <p className="mt-1 text-xs text-white/20">Say hello to {activeTarget.displayName}!</p>
              </div>
            )}
            {messages.map((m) => {
              const isMine = m.senderId === currentUserId;
              return (
                <div key={m.id} className={`group flex ${isMine ? "justify-end" : "justify-start"}`}>
                  {!isMine && (
                    <div className="mr-2 h-6 w-6 shrink-0 self-end overflow-hidden rounded-full bg-[#26215C]">
                      {activeTarget.avatarUrl ? (
                        <img src={activeTarget.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[9px] font-bold text-white/60">
                          {activeTarget.displayName.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}
                  <div className={`flex max-w-[75%] flex-col gap-0.5 ${isMine ? "items-end" : "items-start"}`}>
                    {m.replyToContent && (
                      <div
                        className="mb-0.5 rounded-lg border-l-2 border-[#7F77DD]/50 bg-white/[0.04] px-2 py-1"
                        style={{ fontSize: "11px" }}
                      >
                        <p className="line-clamp-1 text-white/40">{m.replyToContent}</p>
                      </div>
                    )}
                    <div className="relative">
                      <div
                        className="rounded-2xl px-3 py-2 text-sm"
                        style={{
                          background: m.isDeleted
                            ? "rgba(255,255,255,0.03)"
                            : isMine
                              ? "linear-gradient(135deg, #534AB7 0%, #7B6FE8 100%)"
                              : "rgba(255,255,255,0.06)",
                          borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                          border: m.isDeleted ? "1px dashed rgba(255,255,255,0.1)" : "none",
                        }}
                      >
                        {m.isDeleted ? (
                          <span className="flex items-center gap-1.5 text-[12px] italic text-white/30">
                            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2}>
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v6M14 11v6" />
                              <path d="M9 6V4h6v2" />
                            </svg>
                            삭제된 메시지입니다.
                          </span>
                        ) : (
                          m.content
                        )}
                      </div>
                      {!m.isDeleted && (
                        <div
                          className={cn(
                            "absolute top-1/2 flex -translate-y-1/2 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100",
                            isMine ? "-left-20" : "-right-20",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => void toggleMessageLike(m.id)}
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.08] text-[11px] transition hover:bg-white/[0.15]"
                          >
                            {m.likes.includes(currentUserId ?? "") ? "❤️" : "🤍"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setReplyTarget({
                                id: m.id,
                                content: m.content,
                                senderName: isMine ? "나" : activeTarget.displayName,
                              })
                            }
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.08] text-[10px] transition hover:bg-white/[0.15]"
                          >
                            ↩
                          </button>
                          {isMine && !m.isDeleted && (
                            <button
                              type="button"
                              onClick={() => setDeleteTargetId(m.id)}
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.08] text-[11px] transition hover:bg-red-500/20 hover:text-red-400"
                              title="삭제"
                            >
                              🗑
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {m.likes.length > 0 && (
                      <div className="flex items-center gap-0.5 rounded-full bg-white/[0.06] px-1.5 py-0.5">
                        <span className="text-[10px]">❤️</span>
                        <span className="text-[10px] text-white/50">{m.likes.length}</span>
                      </div>
                    )}
                    <span className="text-[10px] text-white/25">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div
            className="flex-shrink-0 px-3 py-3"
            style={{ borderTop: "1px solid rgba(127,119,221,0.1)" }}
          >
            {replyTarget && (
              <div
                className="mb-2 flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: "rgba(83,74,183,0.15)", border: "1px solid rgba(127,119,221,0.2)" }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold text-[#7F77DD]">↩ {replyTarget.senderName}에게 답장</p>
                  <p className="truncate text-[11px] text-white/40">{replyTarget.content}</p>
                </div>
                <button type="button" onClick={() => setReplyTarget(null)} className="text-white/30 hover:text-white/60">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <div
              className="flex items-center gap-2 rounded-2xl px-3 py-2"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <input
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder={t("chat.msgPlaceholder")}
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={!msgInput.trim() || msgSending}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition disabled:opacity-30"
                style={{
                  background: msgInput.trim() ? "linear-gradient(135deg, #534AB7 0%, #7B6FE8 100%)" : "rgba(255,255,255,0.06)",
                }}
              >
                <Send className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
          </div>
          {deleteTargetId && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div
                className="mx-4 w-full max-w-xs rounded-2xl border border-white/[0.08] p-5"
                style={{
                  background: "linear-gradient(135deg, rgba(20,17,50,0.99) 0%, rgba(10,8,28,1) 100%)",
                  boxShadow: "0 0 0 1px rgba(127,119,221,0.1), 0 40px 80px rgba(0,0,0,0.6)",
                }}
              >
                <div
                  className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.3)" }}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" strokeWidth={2}>
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </div>
                <h2 className="text-center text-sm font-black text-white">메시지 삭제</h2>
                <p className="mt-1 text-center text-xs text-white/40">
                  이 메시지를 삭제하시겠습니까?<br />상대방 화면에서도 삭제됩니다.
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(null)}
                    className="flex-1 rounded-xl border border-white/[0.08] py-2 text-xs font-semibold text-white/50 transition hover:border-white/20 hover:text-white"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (deleteTargetId) {
                        void deleteMessage(deleteTargetId);
                      }
                      setDeleteTargetId(null);
                    }}
                    className="flex-1 rounded-xl py-2 text-xs font-bold text-white transition hover:opacity-90"
                    style={{
                      background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
                      boxShadow: "0 4px 16px rgba(220,38,38,0.3)",
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="px-4 py-4" style={{ borderBottom: "1px solid rgba(127,119,221,0.1)" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]/50">Genova</p>
                <p className="text-base font-black text-white">{t("chat.connect")}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/30 transition hover:bg-white/[0.05] hover:text-white/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-1 px-4 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("messages")}
              className="flex-1 rounded-xl py-2 text-[12px] font-semibold transition"
              style={{
                background: activeTab === "messages" ? "rgba(83,74,183,0.3)" : "transparent",
                color: activeTab === "messages" ? "#AFA9EC" : "rgba(255,255,255,0.3)",
                border: activeTab === "messages" ? "1px solid rgba(127,119,221,0.3)" : "1px solid transparent",
              }}
            >
              Messages
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("following")}
              className="flex-1 rounded-xl py-2 text-[12px] font-semibold transition"
              style={{
                background: activeTab === "following" ? "rgba(83,74,183,0.3)" : "transparent",
                color: activeTab === "following" ? "#AFA9EC" : "rgba(255,255,255,0.3)",
                border: activeTab === "following" ? "1px solid rgba(127,119,221,0.3)" : "1px solid transparent",
              }}
            >
              {t("chat.following")}
            </button>
          </div>

          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === "messages" ? t("chat.searchConversations") : t("chat.searchCreators")}
                className="w-full rounded-xl py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/25"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              />
            </div>
          </div>

          {activeTab === "messages" ? (
            <div className="sidebar-scroll flex-1 overflow-y-auto px-4 pb-4">
              {convsLoading ? (
                <p className="py-8 text-center text-xs text-white/30">Loading...</p>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div
                    className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                    style={{ background: "rgba(83,74,183,0.15)", border: "1px solid rgba(127,119,221,0.2)" }}
                  >
                    <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#7F77DD]/50" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-white/50">No messages yet</p>
                  <p className="mt-1 text-xs text-white/25">Messages from creators will appear here.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {conversations
                    .filter((c) => !searchQuery || c.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
                    .sort((a, b) => {
                      const aPinned = pinnedUserIds.includes(a.userId) ? 1 : 0;
                      const bPinned = pinnedUserIds.includes(b.userId) ? 1 : 0;
                      if (bPinned !== aPinned) return bPinned - aPinned;
                      return new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime();
                    })
                    .map((conv) => (
                      <div key={conv.userId} className="group relative">
                        <button
                          type="button"
                          onClick={() => setActiveTarget({
                            userId: conv.userId,
                            displayName: conv.displayName,
                            avatarUrl: conv.avatarUrl ?? undefined,
                          })}
                          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition"
                          style={{
                            background: conv.unreadCount > 0
                              ? "rgba(83,74,183,0.12)"
                              : "transparent",
                            border: pinnedUserIds.includes(conv.userId)
                              ? "1px solid rgba(127,119,221,0.2)"
                              : "1px solid transparent",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = conv.unreadCount > 0 ? "rgba(83,74,183,0.18)" : "rgba(255,255,255,0.03)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = conv.unreadCount > 0 ? "rgba(83,74,183,0.12)" : "transparent"; }}
                        >
                          <div className="relative h-10 w-10 shrink-0">
                            <div
                              className="h-full w-full overflow-hidden rounded-2xl bg-[#26215C]"
                              style={{ boxShadow: conv.unreadCount > 0 ? "0 0 0 2px rgba(83,74,183,0.5)" : "none" }}
                            >
                              {conv.avatarUrl ? (
                                <img src={conv.avatarUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white/60">
                                  {conv.displayName.slice(0, 1).toUpperCase()}
                                </div>
                              )}
                            </div>
                            {conv.unreadCount > 0 && (
                              <span
                                className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                                style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", boxShadow: "0 2px 8px rgba(239,68,68,0.5)" }}
                              >
                                {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <p className={`text-[13px] font-bold ${conv.unreadCount > 0 ? "text-white" : "text-white/60"}`}>
                                {pinnedUserIds.includes(conv.userId) && <span className="mr-1 text-[10px] text-[#7F77DD]">📌</span>}
                                {conv.displayName}
                              </p>
                              <span className="shrink-0 text-[10px] text-white/30">
                                {conv.lastTime ? (() => {
                                  const d = new Date(conv.lastTime);
                                  const now = new Date();
                                  const diff = now.getTime() - d.getTime();
                                  if (diff < 60 * 1000) return "방금";
                                  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}분 전`;
                                  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}시간 전`;
                                  return `${d.getMonth() + 1}.${d.getDate()}`;
                                })() : ""}
                              </span>
                            </div>
                            <p className={`mt-0.5 truncate text-[12px] ${conv.unreadCount > 0 ? "font-semibold text-white/70" : "text-white/30"}`}>
                              {conv.lastMessage || "No messages"}
                            </p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => togglePin(conv.userId)}
                          className={cn(
                            "absolute right-3 top-1/2 -translate-y-1/2 shrink-0 rounded-full p-1 text-[10px] transition opacity-0 group-hover:opacity-100",
                            pinnedUserIds.includes(conv.userId) ? "text-[#7F77DD]" : "text-white/20 hover:text-white/50"
                          )}
                        >
                          📌
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : activeTab === "following" ? (
            <div className="sidebar-scroll flex-1 overflow-y-auto px-4 pb-4">
              {followingLoading ? (
                <p className="py-8 text-center text-xs text-[var(--muted-foreground)]">{t("chat.loading")}</p>
              ) : (
                <>
                  <p className="mb-3 text-xs font-semibold tracking-widest text-white/30">{t("chat.sectionFollowing")}</p>
                  {followingUsers.length === 0 ? (
                    <p className="mb-6 text-xs text-[var(--muted-foreground)]">{t("chat.noFollowing")}</p>
                  ) : (
                    <div className="mb-6 space-y-1.5">
                      {followingUsers.map((user) => (
                        <Link
                          key={user.id}
                          href={`/profile/${user.id}`}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-white/5"
                        >
                          <div className="relative shrink-0">
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt=""
                                className={cn(
                                  "h-9 w-9 rounded-full object-cover",
                                  user.hasNewVideo ? "ring-2 ring-[#8b5cf6] ring-offset-1 ring-offset-[var(--sidebar)]" : ""
                                )}
                              />
                            ) : (
                              <div
                                className={cn(
                                  "flex h-9 w-9 items-center justify-center rounded-full bg-[#534AB7] text-xs font-semibold text-white",
                                  user.hasNewVideo ? "ring-2 ring-[#8b5cf6] ring-offset-1 ring-offset-[var(--sidebar)]" : ""
                                )}
                              >
                                {(user.displayName ?? "U").slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            {user.hasNewVideo && (
                              <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-[#8b5cf6] text-[7px] font-bold text-white">
                                N
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">
                              {user.displayName ?? t("chat.unknownUser")}
                            </p>
                            {user.hasNewVideo ? (
                              <p className="truncate text-xs text-[#8b5cf6]">🎬 {user.newVideoTitle}</p>
                            ) : (
                              <p className="truncate text-xs text-[var(--muted-foreground)]">
                                {user.watchCount > 0
                                  ? t("chat.watchedVideos").replace("{n}", String(user.watchCount))
                                  : t("chat.noRecentActivity")}
                              </p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="mb-3 border-t border-white/[0.06]" />
                  <p className="mb-3 text-xs font-semibold tracking-widest text-white/30">{t("chat.sectionDiscover")}</p>
                  <div className="space-y-1.5">
                    {discoverUsers.map((user) => (
                      <div key={user.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-white/5">
                        <Link href={`/profile/${user.id}`} className="relative shrink-0">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#534AB7] text-xs font-semibold text-white">
                              {(user.displayName ?? "U").slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </Link>
                        <Link href={`/profile/${user.id}`} className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">
                            {user.displayName ?? t("chat.unknownUser")}
                          </p>
                          {user.latestVideoTitle ? (
                            <p className="truncate text-xs text-[#8b5cf6]">🎬 {user.latestVideoTitle}</p>
                          ) : (
                            <p className="truncate text-xs text-[var(--muted-foreground)]">{t("chat.noVideosYet")}</p>
                          )}
                        </Link>
                        <button
                          type="button"
                          className="shrink-0 rounded-full border border-[#8b5cf6]/40 px-2.5 py-1 text-[10px] font-medium text-[#8b5cf6] transition hover:bg-[#8b5cf6]/10"
                        >
                          {t("chat.follow")}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : null}
        </>
      )}
    </aside>
  );
}
