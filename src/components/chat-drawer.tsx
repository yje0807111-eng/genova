"use client";

import Link from "next/link";
import { Camera, Info, Paperclip, Phone, Search, Send, Smile, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

const AVATAR_COLOR_MAP: Record<string, string> = {
  SK: "#7c3aed",
  AC: "#0891b2",
  ML: "#059669",
  RK: "#ea580c",
  JP: "#2563eb",
  TW: "#db2777",
  DK: "#65a30d",
  LZ: "#dc2626",
};

type DemoContactDef = {
  userId: string;
  displayName: string;
  status: "online" | "away" | "offline";
  previewKey: string;
  lastTime: string;
  lastTimeIsYesterday?: boolean;
};

const PINNED_DEFS: DemoContactDef[] = [
  {
    userId: "sarah-kim",
    displayName: "Sarah Kim",
    status: "online",
    previewKey: "chat.contactPreview.sarahKim",
    lastTime: "9:42 AM",
  },
  {
    userId: "alex-chen",
    displayName: "Alex Chen",
    status: "online",
    previewKey: "chat.contactPreview.alexChen",
    lastTime: "9:25 AM",
  },
  {
    userId: "maya-lee",
    displayName: "Maya Lee",
    status: "away",
    previewKey: "chat.contactPreview.mayaLee",
    lastTime: "",
    lastTimeIsYesterday: true,
  },
];

const OTHER_CONTACT_DEFS: DemoContactDef[] = [
  {
    userId: "ryan-ko",
    displayName: "Ryan Ko",
    status: "online",
    previewKey: "chat.contactPreview.ryanKo",
    lastTime: "8:58 AM",
  },
  {
    userId: "james-park",
    displayName: "James Park",
    status: "offline",
    previewKey: "chat.contactPreview.jamesPark",
    lastTime: "2h",
  },
  {
    userId: "tina-wu",
    displayName: "Tina Wu",
    status: "offline",
    previewKey: "chat.contactPreview.tinaWu",
    lastTime: "5h",
  },
  {
    userId: "david-kim",
    displayName: "David Kim",
    status: "offline",
    previewKey: "chat.contactPreview.davidKim",
    lastTime: "",
    lastTimeIsYesterday: true,
  },
  {
    userId: "lisa-zhang",
    displayName: "Lisa Zhang",
    status: "offline",
    previewKey: "chat.contactPreview.lisaZhang",
    lastTime: "",
    lastTimeIsYesterday: true,
  },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function Avatar({ name }: { name: string }) {
  const initials = getInitials(name);
  const color = AVATAR_COLOR_MAP[initials] ?? "#6b7280";
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ backgroundColor: color }}>
      {initials}
    </div>
  );
}

export function ChatDrawer({
  open,
  onClose,
  initialTarget,
}: {
  open: boolean;
  onClose: () => void;
  initialTarget?: ChatTarget | null;
}) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"messages" | "following">("messages");
  const [activeTarget, setActiveTarget] = useState<ChatTarget | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followingUsers, setFollowingUsers] = useState<FollowingUser[]>([]);
  const [discoverUsers, setDiscoverUsers] = useState<DiscoverUser[]>([]);
  const [followingLoading, setFollowingLoading] = useState(false);

  useEffect(() => {
    if (!open || !initialTarget) return;
    setActiveTarget(initialTarget);
  }, [open, initialTarget]);

  useEffect(() => {
    if (open) return;
    setActiveTarget(null);
  }, [open]);

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  const demoPinned = useMemo(
    () =>
      PINNED_DEFS.map((row) => ({
        userId: row.userId,
        displayName: row.displayName,
        status: row.status,
        lastMessage: t(row.previewKey),
        lastTime: row.lastTimeIsYesterday ? t("chat.yesterday") : row.lastTime,
      })),
    [t],
  );
  const demoOthers = useMemo(
    () =>
      OTHER_CONTACT_DEFS.map((row) => ({
        userId: row.userId,
        displayName: row.displayName,
        status: row.status,
        lastMessage: t(row.previewKey),
        lastTime: row.lastTimeIsYesterday ? t("chat.yesterday") : row.lastTime,
      })),
    [t],
  );

  const searchableMessages = useMemo(() => [...demoPinned, ...demoOthers], [demoPinned, demoOthers]);
  const filteredMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return searchableMessages;
    return searchableMessages.filter((item) => item.displayName.toLowerCase().includes(q));
  }, [searchQuery, searchableMessages]);
  const filteredPinnedMessages = filteredMessages.filter((item) => demoPinned.some((p) => p.userId === item.userId));
  const filteredAllMessages = filteredMessages.filter((item) => demoOthers.some((c) => c.userId === item.userId));

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

  return (
    <aside
      className={cn(
        "fixed right-0 top-0 z-[60] flex h-screen w-80 flex-col border-l border-[var(--border)] bg-[var(--sidebar)] transition-transform duration-300",
        open ? "translate-x-0" : "translate-x-full",
      )}
      aria-hidden={!open}
    >
      {activeTarget ? (
        <>
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <button type="button" onClick={() => setActiveTarget(null)} className="rounded-[2px] p-1.5 text-[var(--muted-foreground)] transition hover:text-white" aria-label={t("chat.back")}>
                ←
              </button>
              <div className="relative">
                <Avatar name={activeTarget.displayName} />
                {(activeTarget.status === "online" || activeTarget.status === "away") && (
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[var(--sidebar)]",
                      activeTarget.status === "online" ? "bg-green-400" : "bg-yellow-400",
                    )}
                  />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{activeTarget.displayName}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{statusLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
              <button type="button" className="rounded-[2px] p-1.5 transition hover:text-white" aria-label="Camera"><Camera className="h-4 w-4" /></button>
              <button type="button" className="rounded-[2px] p-1.5 transition hover:text-white" aria-label="Phone"><Phone className="h-4 w-4" /></button>
              <button type="button" className="rounded-[2px] p-1.5 transition hover:text-white" aria-label="Info"><Info className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="sidebar-scroll flex-1 overflow-y-auto px-4 py-3">
            <p className="my-2 text-center text-xs text-[var(--muted-foreground)]">Today</p>
            <div className="mb-2 max-w-[75%] rounded-2xl rounded-bl-sm bg-[var(--secondary)] px-3 py-2 text-sm text-white">
              Hey! Did you see the latest cut?
              <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">10:04 AM</p>
            </div>
            <div className="mb-2 ml-auto max-w-[75%] rounded-2xl rounded-br-sm bg-[#534AB7] px-3 py-2 text-sm text-white">
              Yes, looks great. I can polish the color pass.
              <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">10:06 AM</p>
            </div>
            <div className="mb-2 max-w-[75%] rounded-2xl rounded-bl-sm bg-[var(--secondary)] px-3 py-2 text-sm text-white">
              Perfect, let's lock it today.
              <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">10:09 AM</p>
            </div>
          </div>

          <div className="flex-shrink-0 border-t border-[var(--border)] p-3">
            <textarea
              rows={2}
              placeholder={t("chat.msgPlaceholder")}
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--secondary)] px-3 py-2 text-sm text-white outline-none placeholder:text-[var(--muted-foreground)]"
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                <button type="button" className="rounded-[2px] p-1 transition hover:text-white" aria-label="Attach"><Paperclip className="h-4 w-4" /></button>
                <button type="button" className="rounded-[2px] p-1 transition hover:text-white" aria-label="Emoji"><Smile className="h-4 w-4" /></button>
                <button type="button" className="rounded-[2px] px-1 py-0.5 text-xs transition hover:text-white">GIF</button>
              </div>
              <button type="button" className="rounded-full bg-[#8b5cf6] p-2 text-white transition hover:bg-[#7c3aed]" aria-label="Send">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="border-b border-[var(--border)] px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">{t("chat.connect")}</p>
              <div className="flex items-center gap-1">
                <button type="button" onClick={onClose} className="rounded-[2px] p-1.5 text-[var(--muted-foreground)] transition hover:text-white" aria-label="Close"><X className="h-4 w-4" /></button>
              </div>
            </div>
          </div>

          <div className="flex border-b border-[var(--border)] px-4">
            <button
              type="button"
              onClick={() => setActiveTab("messages")}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm transition",
                activeTab === "messages" ? "border-[#8b5cf6] text-white" : "border-transparent text-[var(--muted-foreground)] hover:text-white",
              )}
            >
              Messages
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("following")}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm transition",
                activeTab === "following" ? "border-[#8b5cf6] text-white" : "border-transparent text-[var(--muted-foreground)] hover:text-white",
              )}
            >
              {t("chat.following")}
            </button>
          </div>

          <div className="px-4 py-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === "messages" ? t("chat.searchConversations") : t("chat.searchCreators")}
                className="w-full rounded-full border border-[var(--border)] bg-[var(--secondary)] py-1.5 pl-8 pr-3 text-sm text-white outline-none placeholder:text-[var(--muted-foreground)]"
              />
            </div>
          </div>

          {activeTab === "messages" ? (
            <div className="sidebar-scroll flex-1 overflow-y-auto px-4 pb-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-[var(--muted-foreground)]">Pinned</p>
                <button type="button" className="text-xs text-[#8b5cf6] transition hover:text-[#a78bfa]">See all</button>
              </div>
              <div className="space-y-1.5">
                {filteredPinnedMessages.map((user) => (
                  <div key={user.userId} onClick={() => setActiveTarget(user)} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/5">
                    <div className="relative">
                      <Avatar name={user.displayName} />
                      {(user.status === "online" || user.status === "away") && (
                        <span
                          className={cn(
                            "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[var(--sidebar)]",
                            user.status === "online" ? "bg-green-400" : "bg-yellow-400",
                          )}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm text-white">{user.displayName}</p>
                        <span className="text-[10px] text-[var(--muted-foreground)]">{user.lastTime}</span>
                      </div>
                      <p className="truncate text-xs text-[var(--muted-foreground)]">{user.lastMessage}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mb-2 mt-4 text-xs font-medium text-[var(--muted-foreground)]">{t("chat.allMessages")}</p>
              <div className="space-y-1.5">
                {filteredAllMessages.map((user) => (
                  <div key={user.userId} onClick={() => setActiveTarget(user)} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/5">
                    <div className="relative">
                      <Avatar name={user.displayName} />
                      {(user.status === "online" || user.status === "away") && (
                        <span
                          className={cn(
                            "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-[var(--sidebar)]",
                            user.status === "online" ? "bg-green-400" : "bg-yellow-400",
                          )}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm text-white">{user.displayName}</p>
                        <span className="text-[10px] text-[var(--muted-foreground)]">{user.lastTime}</span>
                      </div>
                      <p className="truncate text-xs text-[var(--muted-foreground)]">{user.lastMessage}</p>
                    </div>
                  </div>
                ))}
              </div>
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
