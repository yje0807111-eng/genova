"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Check, Facebook, Link as LinkIcon, MessageCircle, Search, Send, Share2, Twitter, X } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { cn } from "@/lib/utils/cn";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

type FollowingUser = {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export function ShareButton({
  title,
  videoId,
  thumbnailUrl,
  className,
}: {
  title: string;
  videoId?: string;
  thumbnailUrl?: string | null;
  className?: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"main" | "friends">("main");
  const [following, setFollowing] = useState<FollowingUser[]>([]);
  const [search, setSearch] = useState("");
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState<string | null>(null);

  const url = typeof window !== "undefined" ? window.location.href : "";

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Load following list when entering friends view
  useEffect(() => {
    if (view !== "friends") return;
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    void (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const me = userData?.user?.id;
      if (!me) return;
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", me);
      const ids = (follows ?? []).map((r: { following_id: string }) => r.following_id);
      if (ids.length === 0) {
        setFollowing([]);
        return;
      }
      const { data: profs } = await supabase
        .from("public_profiles")
        .select("id, display_name, avatar_url")
        .in("id", ids);
      setFollowing(
        (profs ?? []).map((p: { id: string; display_name: string | null; avatar_url: string | null }) => ({
          userId: p.id,
          displayName: p.display_name,
          avatarUrl: p.avatar_url,
        })),
      );
    })();
  }, [view]);

  const sendToFriend = async (targetUserId: string) => {
    if (!videoId) return;
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    setSending(targetUserId);
    const { data: userData } = await supabase.auth.getUser();
    const me = userData?.user?.id;
    if (!me) {
      setSending(null);
      return;
    }
    const { error } = await supabase.from("messages").insert({
      sender_id: me,
      receiver_id: targetUserId,
      content: "",
      shared_video_id: videoId,
      is_read: false,
      likes: [],
    });
    setSending(null);
    if (!error) {
      setSentTo((prev) => new Set(prev).add(targetUserId));
    }
  };

  const filteredFollowing = following.filter((u) =>
    (u.displayName ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const closeModal = () => {
    setOpen(false);
    setView("main");
    setSentTo(new Set());
    setSearch("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/55 transition hover:bg-white/10 hover:text-white",
          className,
        )}
      >
        <Share2 className="h-4 w-4" />
        {t("share.share")}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closeModal}>
          <div
            className="w-full max-w-sm rounded-xl border border-white/[0.08] bg-[#0F0D24] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">
                {view === "friends" ? t("share.sendToFriend", "친구에게 보내기") : t("share.modalTitle")}
              </h3>
              <button
                type="button"
                onClick={view === "friends" ? () => setView("main") : closeModal}
                className="rounded-md p-1 text-white/50 hover:bg-white/5 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {view === "main" ? (
              <>
                {thumbnailUrl ? (
                  <div className="mb-3 overflow-hidden rounded-md border border-white/[0.06]">
                    <img src={thumbnailUrl} alt="" className="aspect-video w-full object-cover" />
                  </div>
                ) : null}
                <p className="mb-4 line-clamp-1 text-xs text-white/45">{title}</p>

                {/* Send to friend (Genova chat) */}
                {videoId && (
                  <button
                    type="button"
                    onClick={() => setView("friends")}
                    className="mb-3 flex w-full items-center gap-3 rounded-lg border border-[#7F77DD]/30 bg-[#534AB7]/15 px-4 py-3 text-left transition hover:border-[#7F77DD]/50 hover:bg-[#534AB7]/25"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#534AB7]/40">
                      <MessageCircle className="h-4 w-4 text-[#AFA9EC]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-white">
                        {t("share.sendToGenovaFriend", "Genova 친구에게 보내기")}
                      </p>
                      <p className="text-[11px] text-white/45">
                        {t("share.sendToGenovaFriendDesc", "팔로잉 사용자에게 채팅으로 전송")}
                      </p>
                    </div>
                  </button>
                )}

                {/* Copy link */}
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2">
                  <LinkIcon className="h-3.5 w-3.5 shrink-0 text-white/35" />
                  <span className="flex-1 truncate text-xs text-white/50">{url}</span>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="flex items-center gap-1 shrink-0 rounded-md bg-[#534AB7] px-3 py-1 text-xs font-medium text-white hover:bg-[#7F77DD] transition"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" /> {t("share.copied")}
                      </>
                    ) : (
                      t("share.copy")
                    )}
                  </button>
                </div>

                {/* Social share */}
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-xs font-medium text-white/70 hover:border-white/20 hover:bg-white/[0.05] hover:text-white transition"
                  >
                    <Twitter className="h-4 w-4" />
                    X (Twitter)
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-xs font-medium text-white/70 hover:border-white/20 hover:bg-white/[0.05] hover:text-white transition"
                  >
                    <Facebook className="h-4 w-4" />
                    {t("share.facebook")}
                  </a>
                  <a
                    href={`https://twitter.com/messages/compose?text=${encodeURIComponent(title + " " + url)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-xs font-medium text-white/70 hover:border-white/20 hover:bg-white/[0.05] hover:text-white transition"
                  >
                    <Send className="h-4 w-4" />
                    {t("share.dm", "DM")}
                  </a>
                  <button
                    type="button"
                    onClick={async () => {
                      if (navigator.share) {
                        try {
                          await navigator.share({ title, url });
                        } catch {}
                      } else {
                        copyLink();
                      }
                    }}
                    className="flex items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-xs font-medium text-white/70 hover:border-white/20 hover:bg-white/[0.05] hover:text-white transition"
                  >
                    <Share2 className="h-4 w-4" />
                    {t("share.more", "더보기")}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Search bar */}
                <div className="mb-3 flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2">
                  <Search className="h-3.5 w-3.5 shrink-0 text-white/35" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("share.searchFriend", "이름 검색")}
                    className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/30"
                  />
                </div>

                {/* Following list */}
                <div className="max-h-72 overflow-y-auto">
                  {filteredFollowing.length === 0 ? (
                    <p className="py-8 text-center text-xs text-white/35">
                      {following.length === 0
                        ? t("share.noFollowing", "팔로우한 친구가 없습니다")
                        : t("share.noMatch", "검색 결과가 없습니다")}
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {filteredFollowing.map((u) => {
                        const sent = sentTo.has(u.userId);
                        return (
                          <li key={u.userId}>
                            <div className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-white/[0.04]">
                              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/[0.05]">
                                <Image src={u.avatarUrl || "/default-avatar.png"} alt="" width={36} height={36} className="h-full w-full object-cover" />
                              </div>
                              <p className="flex-1 min-w-0 truncate text-[13px] font-medium text-white">
                                {u.displayName ?? "—"}
                              </p>
                              <button
                                type="button"
                                onClick={() => void sendToFriend(u.userId)}
                                disabled={sent || sending === u.userId}
                                className={cn(
                                  "shrink-0 rounded-full px-3 py-1 text-[11px] font-bold transition",
                                  sent
                                    ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                                    : "bg-[#534AB7] text-white hover:bg-[#7F77DD] disabled:opacity-50",
                                )}
                              >
                                {sent
                                  ? t("share.sent", "✓ 전송됨")
                                  : sending === u.userId
                                    ? "..."
                                    : t("share.send", "전송")}
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
