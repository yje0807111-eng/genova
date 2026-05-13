"use client";

import Link from "next/link";
import { Camera, Info, Paperclip, Phone, Pin, Search, Send, Smile, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { followUserAction, unfollowUserAction } from "@/app/actions/profile";
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
  /** Most recent public video title (for subtitle) */
  latestVideoTitle?: string;
  lastActive?: string;
};

type DiscoverUser = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  latestVideoTitle?: string;
};

function startOfDayMs(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Conversation list timestamps — labels via i18n; clock/weekday via Intl */
function formatChatRelativeTime(
  iso: string,
  locale: string,
  t: (key: string, fallback?: string) => string,
): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const minutes = Math.floor(diffMs / 60000);

  const sodNow = startOfDayMs(now);
  const sodMsg = startOfDayMs(d);
  const dayDiff = Math.round((sodNow - sodMsg) / 86400000);

  if (minutes < 1) {
    return t("chat.timeJustNow");
  }
  if (minutes < 60) {
    return t("chat.timeMinutesAgo").replace("{n}", String(minutes));
  }

  if (dayDiff === 0) {
    return d.toLocaleTimeString(locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: locale === "en",
    });
  }

  if (dayDiff === 1) {
    return t("chat.yesterday");
  }

  if (dayDiff > 1 && dayDiff < 7) {
    return d.toLocaleDateString(locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US", {
      weekday: "long",
    });
  }

  return d.toLocaleDateString(locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US", {
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    month: "numeric",
    day: "numeric",
  });
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
  const { t, locale } = useI18n();
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
    sharedVideoId: string | null;
  }[]>([]);
  const [sharedVideos, setSharedVideos] = useState<Record<string, { id: string; title: string; thumbnailUrl: string | null }>>({});
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
  const [followingTabVersion, setFollowingTabVersion] = useState(0);
  const totalUnreadCount = conversations.filter((c) => c.unreadCount > 0).length;

  const bumpFollowingTab = () => setFollowingTabVersion((v) => v + 1);

  const handleDiscoverFollow = async (userId: string) => {
    const res = await followUserAction(userId);
    if (res.ok === true) bumpFollowingTab();
  };

  const handleFollowingUnfollow = async (userId: string) => {
    if (!window.confirm(t("profile.unfollowConfirmBody"))) return;
    const res = await unfollowUserAction(userId);
    if (res.ok === true) bumpFollowingTab();
  };

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
          displayName: (profile.display_name as string) ?? t("chat.unknownUser", "사용자"),
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
            displayName: (profile.display_name as string) ?? t("chat.unknownUser", "사용자"),
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

  useEffect(() => {
    if (activeTab !== "following" || !currentUserId) return;
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;

    setFollowingLoading(true);

    const load = async () => {
      try {
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
          const latestTitleMap: Record<string, string> = {};
          for (const vid of videos ?? []) {
            const uid = vid.uploaded_by as string;
            if (!latestTitleMap[uid] && (vid.title as string)?.trim()) {
              latestTitleMap[uid] = vid.title as string;
            }
            if (watchedVideoIds.includes(vid.id as string)) {
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
              latestVideoTitle: latestTitleMap[p.id as string],
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
  }, [activeTab, currentUserId, followingTabVersion]);

  useEffect(() => {
    if (!activeTarget || !currentUserId) return;
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;

    // 기존 메시지 로드
    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, receiver_id, content, created_at, likes, reply_to_id, reply_to_content, is_deleted, shared_video_id")
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${activeTarget.userId}),and(sender_id.eq.${activeTarget.userId},receiver_id.eq.${currentUserId})`,
        )
        .order("created_at", { ascending: true });

      const mapped = (data ?? []).map((m) => ({
        id: m.id as string,
        senderId: m.sender_id as string,
        content: m.content as string,
        createdAt: m.created_at as string,
        likes: (m.likes as string[]) ?? [],
        replyToId: (m.reply_to_id as string) ?? null,
        replyToContent: (m.reply_to_content as string) ?? null,
        isDeleted: (m.is_deleted as boolean) ?? false,
        sharedVideoId: (m.shared_video_id as string) ?? null,
      }));
      setMessages(mapped);

      // Fetch shared video metadata
      const videoIds = [...new Set(mapped.map((m) => m.sharedVideoId).filter((id): id is string => Boolean(id)))];
      if (videoIds.length > 0) {
        const { data: vids } = await supabase
          .from("videos")
          .select("id, title, thumbnail_url")
          .in("id", videoIds);
        const map: Record<string, { id: string; title: string; thumbnailUrl: string | null }> = {};
        for (const v of vids ?? []) {
          map[v.id as string] = {
            id: v.id as string,
            title: v.title as string,
            thumbnailUrl: (v.thumbnail_url as string) ?? null,
          };
        }
        setSharedVideos(map);
      } else {
        setSharedVideos({});
      }

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
            shared_video_id?: string | null;
          };
          if (m.sender_id !== activeTarget.userId) return;
          const sharedVideoId = m.shared_video_id ?? null;
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
              sharedVideoId,
            },
          ]);
          if (sharedVideoId) {
            void (async () => {
              const sb = getBrowserSupabaseClient();
              if (!sb) return;
              const { data: v } = await sb
                .from("videos")
                .select("id, title, thumbnail_url")
                .eq("id", sharedVideoId)
                .maybeSingle();
              if (v) {
                setSharedVideos((prev) => ({
                  ...prev,
                  [v.id as string]: {
                    id: v.id as string,
                    title: v.title as string,
                    thumbnailUrl: (v.thumbnail_url as string) ?? null,
                  },
                }));
              }
            })();
          }
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
            const deletedText = t("chat.deletedMessageDbContent");
            setMessages((prev) =>
              prev.map((msg) => (msg.id === m.id ? { ...msg, isDeleted: true, content: deletedText } : msg))
            );
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeTarget, currentUserId, t]);

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
    const deletedText = t("chat.deletedMessageDbContent");
    await supabase
      .from("messages")
      .update({ is_deleted: true, content: deletedText })
      .eq("id", messageId)
      .eq("sender_id", currentUserId ?? "");
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isDeleted: true, content: deletedText } : m))
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
          sharedVideoId: (data as { shared_video_id?: string | null }).shared_video_id ?? null,
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
        background: "#0a0a0a",
        borderLeft: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
      }}
      aria-hidden={!open}
    >
      {activeTarget ? (
        <>
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTarget(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-white/35 transition hover:bg-white/[0.05] hover:text-white"
              >
                ←
              </button>
              <Link
                href={`/profile/${activeTarget?.userId}`}
                className="group flex min-w-0 items-center gap-3"
              >
                <div className="relative shrink-0">
                  <div className="h-9 w-9 overflow-hidden rounded-full bg-[#26215C] ring-1 ring-white/10 transition group-hover:ring-[#7F77DD]/40">
                    <img src={activeTarget?.avatarUrl || "/default-avatar.png"} alt="" className="h-full w-full object-cover" />
                  </div>
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[#0a0a0a]",
                      activeTarget?.status === "online"
                        ? "bg-emerald-400"
                        : activeTarget?.status === "away"
                          ? "bg-amber-400"
                          : "bg-white/20",
                    )}
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-bold leading-tight text-white transition group-hover:text-[#AFA9EC]">
                    {activeTarget?.displayName}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-white/35">
                    <span
                      className={cn(
                        "h-1 w-1 rounded-full",
                        activeTarget?.status === "online" ? "bg-emerald-400" : "bg-white/30",
                      )}
                    />
                    {activeTarget?.status === "online"
                      ? t("chat.status.active", "온라인")
                      : activeTarget?.status === "away"
                        ? t("chat.status.away", "자리비움")
                        : t("chat.member", "Genova 멤버")}
                  </p>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-1 text-white/30">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/[0.06] hover:text-white"
                aria-label={t("chat.info", "대화 정보")}
              >
                <Info className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>

          <div className="sidebar-scroll min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-4">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
                <div
                  className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
                  style={{
                    background: "rgba(83,74,183,0.12)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#7F77DD]/60" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-[13px] font-semibold text-white/55">{t("chat.emptyStateTitle")}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/30">
                  {t("chat.emptyStateSubtitle").replace("{name}", activeTarget.displayName)}
                </p>
              </div>
            )}
            {messages.map((m, idx) => {
              const isMine = m.senderId === currentUserId;
              const prev = messages[idx - 1];
              const next = messages[idx + 1];
              const FIVE_MIN = 5 * 60 * 1000;

              const prevSame =
                prev &&
                prev.senderId === m.senderId &&
                new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < FIVE_MIN;
              const nextSame =
                next &&
                next.senderId === m.senderId &&
                new Date(next.createdAt).getTime() - new Date(m.createdAt).getTime() < FIVE_MIN;

              const isGroupStart = !prevSame;
              const isGroupEnd = !nextSame;

              return (
                <div
                  key={m.id}
                  className={cn(
                    "group flex",
                    isMine ? "justify-end" : "justify-start",
                    isGroupStart ? "mt-3" : "mt-0.5",
                  )}
                >
                  {!isMine && (
                    <div className="mr-2 h-6 w-6 shrink-0 self-end">
                      {isGroupEnd ? (
                        <div className="h-6 w-6 overflow-hidden rounded-full bg-[#26215C]">
                          <img src={activeTarget.avatarUrl || "/default-avatar.png"} alt="" className="h-full w-full object-cover" />
                        </div>
                      ) : null}
                    </div>
                  )}
                  <div className={`flex max-w-[75%] flex-col gap-0.5 ${isMine ? "items-end" : "items-start"}`}>
                    {m.replyToContent && (
                      <div
                        className="mb-0.5 rounded-lg border-l-2 border-[#534AB7]/60 bg-white/[0.03] px-2 py-1"
                        style={{ fontSize: "11px" }}
                      >
                        <p className="line-clamp-1 text-white/35">{m.replyToContent}</p>
                      </div>
                    )}
                    <div className="relative">
                      <div
                        className="px-3 py-2 text-sm"
                        style={{
                          background: m.isDeleted
                            ? "rgba(255,255,255,0.04)"
                            : isMine
                              ? "#534AB7"
                              : "rgba(255,255,255,0.08)",
                          color: m.isDeleted ? "rgba(255,255,255,0.4)" : "white",
                          borderRadius: "16px",
                        }}
                      >
                        {m.isDeleted ? (
                          <span className="italic">{t("chat.messageDeletedShort")}</span>
                        ) : (
                          <>
                            {m.sharedVideoId && sharedVideos[m.sharedVideoId] && (
                              <Link
                                href={`/watch/${m.sharedVideoId}`}
                                className="mb-2 block overflow-hidden rounded-lg border border-white/10 bg-black/20 transition hover:border-white/30"
                              >
                                {sharedVideos[m.sharedVideoId].thumbnailUrl && (
                                  <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/9" }}>
                                    <img
                                      src={sharedVideos[m.sharedVideoId].thumbnailUrl ?? ""}
                                      alt=""
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                )}
                                <p className="line-clamp-1 px-2 py-1.5 text-[11px] font-semibold text-white/90">
                                  🎬 {sharedVideos[m.sharedVideoId].title}
                                </p>
                              </Link>
                            )}
                            {m.content && <span>{m.content}</span>}
                          </>
                        )}
                      </div>
                      {!m.isDeleted && (
                        <div
                          className={cn(
                            "absolute -top-3 right-2 z-10 flex items-center gap-0.5 rounded-full border border-white/[0.08] bg-[#0a0820]/95 px-1 py-0.5 opacity-0 shadow-lg shadow-black/40 backdrop-blur-md transition-opacity group-hover:opacity-100",
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
                                senderName: isMine ? t("chat.selfLabel") : activeTarget.displayName,
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
                              title={t("chat.deleteTooltip")}
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
                    {isGroupEnd && (
                      <span className="text-[10px] text-white/25">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <div
            className="flex-shrink-0 px-4 pb-4 pt-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            {replyTarget && (
              <div
                className="mb-2 flex items-center gap-2 rounded-xl px-3 py-2"
                style={{
                  background: "rgba(83,74,183,0.12)",
                  border: "1px solid rgba(127,119,221,0.2)",
                  boxShadow: "0 4px 16px rgba(83,74,183,0.08)",
                }}
              >
                <div className="h-8 w-[2px] shrink-0 rounded-full bg-[#7F77DD]/60" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7F77DD]">
                    {t("chat.replyToLabel").replace("{name}", replyTarget.senderName)}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-white/50">{replyTarget.content}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/35 transition hover:bg-white/[0.08] hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <div
              className="flex items-center gap-1.5 rounded-2xl px-2.5 py-2 transition focus-within:border-[#7F77DD]/40 focus-within:bg-white/[0.05]"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <button
                type="button"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/35 transition hover:bg-white/[0.06] hover:text-white/70"
                aria-label={t("chat.attachAria")}
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/35 transition hover:bg-white/[0.06] hover:text-white/70"
                aria-label={t("chat.emojiAria")}
              >
                <Smile className="h-4 w-4" />
              </button>
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
                className="flex-1 bg-transparent px-1 text-sm text-white outline-none placeholder:text-white/35"
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={!msgInput.trim() || msgSending}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition disabled:opacity-30"
                style={{
                  background: msgInput.trim() ? "linear-gradient(135deg, #534AB7 0%, #7B6FE8 100%)" : "rgba(255,255,255,0.06)",
                  boxShadow: msgInput.trim() ? "0 4px 16px rgba(83,74,183,0.4)" : "none",
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
                  background: "linear-gradient(135deg, rgba(26,26,26,0.99) 0%, rgba(10,10,10,1) 100%)",
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
                <h2 className="text-center text-sm font-black text-white">{t("chat.deleteModalTitle")}</h2>
                <p className="mt-1 text-center text-xs text-white/35">{t("chat.deleteModalLead")}</p>
                <p className="mt-1 text-center text-xs text-white/35">{t("chat.deleteModalNote")}</p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(null)}
                    className="flex-1 rounded-xl border border-white/[0.08] py-2 text-xs font-semibold text-white/50 transition hover:border-white/20 hover:text-white"
                  >
                    {t("common.cancel")}
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
                    {t("profile.delete")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-bold text-white">
                {activeTab === "messages" ? t("chat.messages") : t("chat.connect")}
              </h2>
              {activeTab === "messages" && totalUnreadCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#7F77DD] px-1.5 text-[10px] font-bold text-white">
                  {totalUnreadCount}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-white/35 transition hover:bg-white/[0.06] hover:text-white"
              aria-label={t("common.close")}
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex gap-6 border-b border-white/[0.04] px-5">
            <button
              type="button"
              onClick={() => setActiveTab("messages")}
              className={cn(
                "relative py-3 text-[13px] font-semibold transition",
                activeTab === "messages" ? "text-white" : "text-white/35 hover:text-white/55",
              )}
            >
              {t("chat.messages")}
              {activeTab === "messages" && (
                <span
                  className="absolute -bottom-px left-0 right-0 h-[2px] rounded-full"
                  style={{ background: "linear-gradient(90deg, #7F77DD 0%, #AFA9EC 100%)" }}
                />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("following")}
              className={cn(
                "relative py-3 text-[13px] font-semibold transition",
                activeTab === "following" ? "text-white" : "text-white/35 hover:text-white/55",
              )}
            >
              {t("chat.following")}
              {activeTab === "following" && (
                <span
                  className="absolute -bottom-px left-0 right-0 h-[2px] rounded-full"
                  style={{ background: "linear-gradient(90deg, #7F77DD 0%, #AFA9EC 100%)" }}
                />
              )}
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
            <div className="sidebar-scroll flex-1 overflow-y-auto pb-4">
              {convsLoading ? (
                <p className="py-8 text-center text-xs text-white/30">{t("chat.loading")}</p>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                  <div
                    className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                    style={{ background: "var(--tint-accent-15)", border: "1px solid rgba(127,119,221,0.2)" }}
                  >
                    <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#7F77DD]/50" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-white/50">{t("chat.conversationsEmptyTitle")}</p>
                  <p className="mt-1 text-xs text-white/25">{t("chat.conversationsEmptyHint")}</p>
                </div>
              ) : (
                <div>
                  {conversations
                    .filter((c) => !searchQuery || c.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
                    .sort((a, b) => {
                      const aPinned = pinnedUserIds.includes(a.userId) ? 1 : 0;
                      const bPinned = pinnedUserIds.includes(b.userId) ? 1 : 0;
                      if (bPinned !== aPinned) return bPinned - aPinned;
                      return new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime();
                    })
                    .map((conv) => (
                      <div key={conv.userId} className="group relative border-b border-white/[0.04]">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveTarget({
                              userId: conv.userId,
                              displayName: conv.displayName,
                              avatarUrl: conv.avatarUrl ?? undefined,
                            })
                          }
                          className={cn(
                            "flex w-full cursor-pointer items-start gap-3 p-3 text-left transition hover:bg-white/[0.02]",
                            pinnedUserIds.includes(conv.userId) && "bg-white/[0.02]",
                          )}
                        >
                          <div className="relative shrink-0">
                            <img src={conv.avatarUrl || "/default-avatar.png"} alt="" className="h-11 w-11 rounded-full object-cover ring-1 ring-white/[0.06]" />
                            {conv.unreadCount > 0 ? (
                              <span
                                className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-[#7F77DD] ring-2 ring-[#0a0a0a]"
                                style={{ boxShadow: "0 0 8px rgba(127,119,221,0.6)" }}
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p
                                className={cn(
                                  "flex items-center gap-1 truncate text-[13.5px] leading-tight",
                                  conv.unreadCount > 0 ? "font-bold text-white" : "font-semibold text-white/90",
                                )}
                              >
                                {pinnedUserIds.includes(conv.userId) && (
                                  <Pin className="h-3 w-3 shrink-0 fill-[#7F77DD] text-[#7F77DD]" />
                                )}
                                <span className="truncate">{conv.displayName}</span>
                              </p>
                              <span
                                className={cn(
                                  "shrink-0 text-[10px]",
                                  conv.unreadCount > 0 ? "font-semibold text-[#AFA9EC]" : "text-white/35",
                                )}
                              >
                                {conv.lastTime ? formatChatRelativeTime(conv.lastTime, locale, t) : ""}
                              </span>
                            </div>
                            <p
                              className={cn(
                                "mt-1 truncate text-[12px]",
                                conv.unreadCount > 0 ? "font-medium text-white/70" : "text-white/45",
                              )}
                            >
                              {conv.lastMessage || t("chat.lastMessageEmpty", "No messages")}
                            </p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(conv.userId);
                          }}
                          className={cn(
                            "absolute bottom-2 right-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition",
                            pinnedUserIds.includes(conv.userId)
                              ? "bg-[#7F77DD]/15 text-[#AFA9EC] opacity-100"
                              : "text-white/30 opacity-0 hover:bg-white/[0.06] hover:text-white/70 group-hover:opacity-100",
                          )}
                          aria-label={t("chat.pinAria")}
                        >
                          <Pin
                            className={cn(
                              "h-3.5 w-3.5",
                              pinnedUserIds.includes(conv.userId) && "fill-current",
                            )}
                          />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : activeTab === "following" ? (
            <div className="sidebar-scroll flex-1 overflow-y-auto pb-4">
              {followingLoading ? (
                <p className="py-8 text-center text-xs text-white/35">{t("chat.loading")}</p>
              ) : (
                <>
                  <div className="flex items-center gap-2 px-5 pb-2 pt-5">
                    <span className="h-[2px] w-4 rounded-full bg-gradient-to-r from-[#7F77DD]/60 to-transparent" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
                      {t("chat.sectionFollowing")}
                    </p>
                  </div>
                  {followingUsers.length === 0 ? (
                    <div className="px-5 py-6 text-center">
                      <p className="text-[12px] text-white/35">{t("chat.noFollowing")}</p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {followingUsers.map((user) => (
                        <div key={user.id} className="flex items-center gap-3 px-5 py-2.5 transition hover:bg-white/[0.02]">
                          <Link href={`/profile/${user.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="relative shrink-0">
                              <img
                                src={user.avatarUrl || "/default-avatar.png"}
                                alt=""
                                className={cn(
                                  "h-9 w-9 rounded-full object-cover",
                                  user.hasNewVideo ? "ring-2 ring-[#8b5cf6] ring-offset-1 ring-offset-[#0a0a0a]" : "",
                                )}
                              />
                              {user.hasNewVideo ? (
                                <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-[#8b5cf6] text-[7px] font-bold text-white">
                                  N
                                </span>
                              ) : null}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-semibold text-white">{user.displayName ?? t("chat.unknownUser")}</p>
                              <p
                                className={cn(
                                  "truncate text-[11px]",
                                  user.latestVideoTitle?.trim() ? "text-white/45" : "italic text-white/25",
                                )}
                              >
                                {user.latestVideoTitle?.trim() ? user.latestVideoTitle : t("chat.noVideosYet")}
                              </p>
                            </div>
                          </Link>
                          <button
                            type="button"
                            onClick={() => void handleFollowingUnfollow(user.id)}
                            className="shrink-0 rounded-full border border-white/[0.12] bg-transparent px-3 py-1 text-[11px] font-semibold text-white/70 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
                          >
                            {t("profile.following")}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2 border-t border-white/[0.04] px-5 pb-2 pt-5">
                    <span className="h-[2px] w-4 rounded-full bg-gradient-to-r from-[#7F77DD]/60 to-transparent" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
                      {t("chat.sectionDiscover")}
                    </p>
                  </div>
                  <div>
                    {discoverUsers.map((user) => (
                      <div key={user.id} className="flex items-center gap-3 px-5 py-2.5 transition hover:bg-white/[0.02]">
                        <Link href={`/profile/${user.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                          <img src={user.avatarUrl || "/default-avatar.png"} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-semibold text-white">{user.displayName ?? t("chat.unknownUser")}</p>
                            <p
                              className={cn(
                                "truncate text-[11px]",
                                user.latestVideoTitle?.trim() ? "text-white/45" : "italic text-white/25",
                              )}
                            >
                              {user.latestVideoTitle?.trim() ? user.latestVideoTitle : t("chat.noVideosYet")}
                            </p>
                          </div>
                        </Link>
                        <button
                          type="button"
                          onClick={() => void handleDiscoverFollow(user.id)}
                          className="shrink-0 rounded-full border border-[#7F77DD]/40 bg-transparent px-3 py-1 text-[11px] font-semibold text-[#AFA9EC] transition hover:border-[#7F77DD] hover:bg-[#7F77DD]/15 hover:text-white"
                        >
                          {t("profile.follow")}
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
