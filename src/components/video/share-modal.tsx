"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Facebook, Link as LinkIcon, MessageCircle, Search, Send, Share2, Twitter, X } from "lucide-react";
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
        <div
          className="anim-scrim fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="anim-modal relative w-full max-w-[420px] overflow-hidden rounded-2xl bg-[#0a0a0a] p-6 shadow-2xl ring-1 ring-white/[0.08]"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="pointer-events-none absolute -top-20 left-1/2 h-40 w-56 -translate-x-1/2 rounded-full opacity-60"
              style={{
                background:
                  "radial-gradient(circle, rgba(83,74,183,0.22) 0%, transparent 70%)",
                filter: "blur(30px)",
              }}
              aria-hidden
            />

            <div className="relative mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {view === "friends" && (
                  <button
                    type="button"
                    onClick={() => setView("main")}
                    aria-label="Back"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-white/55 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                <h3 className="text-[15px] font-bold tracking-tight text-white">
                  {view === "friends"
                    ? t("share.sendToFriend", "친구에게 보내기")
                    : t("share.modalTitle")}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/55 transition hover:border-white/20 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {view === "main" ? (
              <div className="relative">
                {thumbnailUrl ? (
                  <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-xl ring-1 ring-white/[0.06]">
                    <Image
                      src={thumbnailUrl}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 480px"
                      className="object-cover"
                    />
                    <div
                      className="absolute inset-x-0 bottom-0 h-2/3"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(10,10,10,0.9) 0%, transparent 100%)",
                      }}
                    />
                    <p className="absolute inset-x-0 bottom-0 line-clamp-1 px-3 pb-2.5 text-[13px] font-bold text-white">
                      {title}
                    </p>
                  </div>
                ) : (
                  <p className="mb-4 line-clamp-1 text-[13px] font-semibold text-white/70">
                    {title}
                  </p>
                )}

                {/* Send to friend (Genova chat) */}
                {videoId && (
                  <button
                    type="button"
                    onClick={() => setView("friends")}
                    className="group mb-3 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left ring-1 ring-[#7F77DD]/25 transition hover:ring-[#7F77DD]/45"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(127,119,221,0.16) 0%, rgba(255,255,255,0.02) 70%)",
                    }}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#534AB7]/40 ring-1 ring-[#7F77DD]/30">
                      <MessageCircle className="h-4 w-4 text-[#C7C2F0]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-white">
                        {t("share.sendToGenovaFriend", "Genova 친구에게 보내기")}
                      </p>
                      <p className="text-[11px] text-white/45">
                        {t("share.sendToGenovaFriendDesc", "팔로잉 사용자에게 채팅으로 전송")}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white/55" />
                  </button>
                )}

                {/* Copy link */}
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-white/[0.03] py-1.5 pl-3 pr-1.5 ring-1 ring-white/[0.06]">
                  <LinkIcon className="h-3.5 w-3.5 shrink-0 text-white/30" />
                  <span className="flex-1 truncate text-[12px] text-white/45">
                    {url}
                  </span>
                  <button
                    type="button"
                    onClick={copyLink}
                    className={cn(
                      "flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] font-bold transition",
                      copied
                        ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                        : "btn-primary text-white",
                    )}
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
                  {[
                    {
                      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
                      icon: <Twitter className="h-4 w-4" />,
                      label: "X (Twitter)",
                    },
                    {
                      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
                      icon: <Facebook className="h-4 w-4" />,
                      label: t("share.facebook"),
                    },
                    {
                      href: `https://twitter.com/messages/compose?text=${encodeURIComponent(title + " " + url)}`,
                      icon: <Send className="h-4 w-4" />,
                      label: t("share.dm", "DM"),
                    },
                  ].map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2.5 text-[12px] font-semibold text-white/65 ring-1 ring-white/[0.06] transition hover:bg-white/[0.06] hover:text-white hover:ring-white/15"
                    >
                      {s.icon}
                      {s.label}
                    </a>
                  ))}
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
                    className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2.5 text-[12px] font-semibold text-white/65 ring-1 ring-white/[0.06] transition hover:bg-white/[0.06] hover:text-white hover:ring-white/15"
                  >
                    <Share2 className="h-4 w-4" />
                    {t("share.more", "더보기")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* Search bar */}
                <div className="mb-3 flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/[0.06]">
                  <Search className="h-3.5 w-3.5 shrink-0 text-white/30" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("share.searchFriend", "이름 검색")}
                    className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/30"
                  />
                </div>

                {/* Following list */}
                <div className="max-h-72 overflow-y-auto pr-0.5">
                  {filteredFollowing.length === 0 ? (
                    <p className="py-10 text-center text-[12px] text-white/35">
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
                            <div className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/[0.04]">
                              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/[0.05] ring-1 ring-white/[0.08]">
                                <Image
                                  src={u.avatarUrl || "/default-avatar.png"}
                                  alt=""
                                  width={36}
                                  height={36}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-white">
                                {u.displayName ?? "—"}
                              </p>
                              <button
                                type="button"
                                onClick={() => void sendToFriend(u.userId)}
                                disabled={sent || sending === u.userId}
                                className={cn(
                                  "shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition",
                                  sent
                                    ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30"
                                    : "btn-primary text-white disabled:opacity-50",
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
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
