"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/genova/language-provider";
import { AI_TOOL_CATEGORIES, getOrphanTools, normalizeToolName } from "@/lib/constants/ai-tools";
import { formatGenreDisplay } from "@/lib/constants/genres";
import { addWindowCustomListener } from "@/lib/dom/window-custom-events";
import { changeEmailAction, changePasswordAction, followUserAction, unfollowUserAction, updateProfileAction } from "@/app/actions/profile";
import type { TrophyRow } from "@/lib/queries/trophies-queries";
import type { Profile, UserAward } from "@/lib/queries/profile-queries";
import {
  buildSeriesGroups,
  filterAwardVideos,
  filterCompetitionVideos,
  type ProfileSortKey,
  sortProfileVideos,
} from "@/lib/profile-works-filters";
import type { Video } from "@/lib/types";
import { ProfileToolsDisplay } from "@/components/profile/profile-tools-display";
import { ProfileVideoGrid } from "@/components/profile/profile-video-grid";
import { ProfileAwardsTab } from "@/components/profile/profile-awards-tab";
import { ProfileWorksGrid } from "@/components/profile/profile-works-grid";
import { AnimateIn } from "@/components/animate-in";

const ProfileAvatarUpload = dynamic(
  () => import("@/components/profile/profile-avatar-upload").then((m) => m.ProfileAvatarUpload),
  { ssr: false },
);

const tierLabel: Record<Profile["subscriptionTier"], string> = {
  free: "Free",
  basic: "Basic",
  pro: "Pro",
};

type WorkSubTab = "all" | "awards" | "competition" | "series";
type MainTab = "works" | "saved" | "awards" | "credits";

const WORK_SUB_TABS: { key: WorkSubTab; label: string }[] = [
  { key: "all", label: "all" },
  { key: "awards", label: "awards" },
  { key: "competition", label: "competition" },
  { key: "series", label: "series" },
];

const SORTS: { key: ProfileSortKey; label: string }[] = [
  { key: "recent", label: "recent" },
  { key: "views", label: "views" },
  { key: "likes", label: "likes" },
];

/** Works / Awards / Saved / Credits — segmented control styling */
function profileMainTabClass(active: boolean): string {
  return [
    "rounded-lg px-4 py-2.5 text-sm font-semibold transition",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7F77DD]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
    active
      ? "bg-[#534AB7]/55 text-[#F8F7FF] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] ring-1 ring-[#7F77DD]/50"
      : "text-[#AFA9EC] hover:bg-white/[0.08] hover:text-[#EEEDFE]",
  ].join(" ");
}

function dedupeTools(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of list.map(normalizeToolName)) {
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function WorkVideoCard({ video }: { video: Video }) {
  const { t, locale } = useI18n();
  const [imgFailed, setImgFailed] = useState(false);
  const src = video.thumbnailUrl?.trim();

  return (
    <Link
      href={`/watch/${video.id}`}
      className="video-card-hover group block overflow-hidden rounded-xl border border-white/10 bg-[#131028] shadow-sm transition hover:border-[#7F77DD] hover:shadow-md"
    >
      <div className="relative aspect-video w-full bg-[#26215C]">
        {src && !imgFailed ? (
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover transition duration-200 group-hover:opacity-95"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-[#2a2458] to-[#1A1535] px-2 text-center">
            <span className="typo-sidebar-tag text-[#AFA9EC]/80">{t("feed.noThumbnail")}</span>
          </div>
        )}
      </div>
      <div className="space-y-1 p-3">
        <p className="typo-card-title line-clamp-2 text-[#EEEDFE]">{video.title}</p>
        <p className="typo-card-meta text-[#AFA9EC]">{formatGenreDisplay(video.genre, video.subGenre, locale)}</p>
        <p className="typo-card-meta text-[#E8E4FF]">
          ♥ <span className="font-medium tabular-nums">{video.likeCount ?? 0}</span>
        </p>
      </div>
    </Link>
  );
}

function VisitorWorkGrid({ videos, emptyText }: { videos: Video[]; emptyText: string }) {
  if (videos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/15 bg-[#1A1535]/60 px-6 py-12 text-center text-sm text-[#AFA9EC]">
        {emptyText}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {videos.map((v) => (
        <WorkVideoCard key={v.id} video={v} />
      ))}
    </div>
  );
}

function ProfileFollowButton({
  targetUserId,
  initialFollowing,
  onFollowersDelta,
}: {
  targetUserId: string;
  initialFollowing: boolean;
  onFollowersDelta?: (delta: number) => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setFollowing(initialFollowing);
  }, [initialFollowing]);

  const onToggle = async () => {
    setPending(true);
    try {
      if (following) {
        const res = await unfollowUserAction(targetUserId);
        if (res.ok) {
          setFollowing(false);
          onFollowersDelta?.(-1);
          router.refresh();
        } else {
          alert(res.message);
        }
      } else {
        const res = await followUserAction(targetUserId);
        if (res.ok) {
          setFollowing(true);
          if (!("alreadyFollowing" in res && res.alreadyFollowing)) {
            onFollowersDelta?.(1);
          }
          router.refresh();
        } else {
          alert(res.message);
        }
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void onToggle()}
      className={`shrink-0 rounded-full px-6 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
        following
          ? "border-2 border-[#7F77DD] bg-transparent text-[#EEEDFE] hover:bg-[#534AB7]/30"
          : "bg-[#534AB7] text-[#EEEDFE] hover:bg-[#7F77DD]"
      }`}
    >
      {pending ? "..." : following ? t("profile.following") : t("profile.follow")}
    </button>
  );
}

export function ProfilePageClient({
  profile: initialProfile,
  works,
  awards,
  trophies = [],
  saved = [],
  followers,
  following,
  isOwner,
  userEmail = "",
  showFollow,
  initialFollowing,
}: {
  profile: Profile;
  works: Video[];
  awards: UserAward[];
  trophies?: TrophyRow[];
  saved?: Video[];
  followers: number;
  following: number;
  isOwner: boolean;
  userEmail?: string;
  showFollow: boolean;
  initialFollowing: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(initialProfile.displayName ?? "");
  const [bio, setBio] = useState(initialProfile.bio);
  const [tools, setTools] = useState<string[]>(() => dedupeTools(initialProfile.tools));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  const [mainTab, setMainTab] = useState<MainTab>("works");
  const [workSubTab, setWorkSubTab] = useState<WorkSubTab>("all");
  const [sort, setSort] = useState<ProfileSortKey>("recent");
  const [followerCount, setFollowerCount] = useState(followers);

  useEffect(() => setFollowerCount(followers), [followers]);

  useEffect(() => {
    return addWindowCustomListener<MainTab>("profile-tab-change", (tab) => {
      if (["works", "awards", "saved", "credits"].includes(tab)) {
        setMainTab(tab);
      }
    });
  }, []);

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  useEffect(() => {
    if (!editing) {
      setDisplayName(initialProfile.displayName ?? "");
      setBio(initialProfile.bio);
      setTools(dedupeTools(initialProfile.tools));
    }
  }, [initialProfile, editing]);

  const toggleTool = (t: string) => {
    const c = normalizeToolName(t);
    setTools((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const awardBadges = useMemo(() => awards.slice(0, 8), [awards]);
  const orphanEditTools = useMemo(() => getOrphanTools(tools), [tools]);

  const sortedAll = useMemo(() => sortProfileVideos(works, sort), [works, sort]);
  const awardVideos = useMemo(() => sortProfileVideos(filterAwardVideos(works), sort), [works, sort]);
  const competitionVideos = useMemo(() => sortProfileVideos(filterCompetitionVideos(works), sort), [works, sort]);
  const seriesGroups = useMemo(() => buildSeriesGroups(works, sort), [works, sort]);

  const emptyBySub: Record<WorkSubTab, string> = {
    all: t("profile.noPublicWorksYet"),
    awards: t("profile.noAwardsYet"),
    competition: t("profile.noCompetitionEntriesYet"),
    series: t("profile.noSeriesYet"),
  };

  const saveProfile = async () => {
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const nextTools = dedupeTools(tools);
      const res = await updateProfileAction({
        displayName: displayName.trim() || "User",
        bio,
        tools: nextTools,
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }

      const notes: string[] = [];
      if (newEmail.trim() && newEmail.trim() !== userEmail.trim()) {
        const eRes = await changeEmailAction(newEmail.trim());
        if (!eRes.ok) {
          setError(eRes.message);
          return;
        }
        notes.push("Email change request sent. Please check your inbox.");
        setNewEmail("");
      }

      if (pw.length > 0 || pw2.length > 0) {
        if (pw.length < 6) {
          setError("Password must be at least 6 characters.");
          return;
        }
        if (pw !== pw2) {
          setError("Password confirmation does not match.");
          return;
        }
        const pRes = await changePasswordAction(pw);
        if (!pRes.ok) {
          setError(pRes.message);
          return;
        }
        setPw("");
        setPw2("");
        notes.push("Password updated successfully.");
      }

      if (notes.length > 0) setInfo(notes.join(" "));

      setProfile((p) => ({
        ...p,
        displayName: displayName.trim() || "User",
        bio,
        tools: nextTools,
      }));
      setTools(nextTools);
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setDisplayName(profile.displayName ?? "");
    setBio(profile.bio);
    setTools(dedupeTools(profile.tools));
    setNewEmail("");
    setPw("");
    setPw2("");
    setEditing(false);
    setError(null);
    setInfo(null);
  };

  const renderWorkBody = () => {
    if (isOwner) {
      if (workSubTab === "all") return <ProfileWorksGrid videos={sortedAll} emptyLabel={emptyBySub.all} />;
      if (workSubTab === "awards") return <ProfileWorksGrid videos={awardVideos} emptyLabel={emptyBySub.awards} />;
      if (workSubTab === "competition") return <ProfileWorksGrid videos={competitionVideos} emptyLabel={emptyBySub.competition} />;
      if (seriesGroups.length === 0) {
        return (
          <div className="rounded-xl border border-dashed border-white/15 bg-[#1A1535]/60 px-6 py-12 text-center text-sm text-[#AFA9EC]">
            {emptyBySub.series}
          </div>
        );
      }
      return (
        <div className="space-y-10">
          {seriesGroups.map((g) => (
            <div key={g.name}>
              <h3 className="mb-4 text-lg font-semibold text-[#EEEDFE]">{g.name}</h3>
              <ProfileWorksGrid videos={g.videos} emptyLabel={t("profile.noFilmsInSeriesYet")} />
            </div>
          ))}
        </div>
      );
    }

    if (workSubTab === "all") return <VisitorWorkGrid videos={sortedAll} emptyText={emptyBySub.all} />;
    if (workSubTab === "awards") return <VisitorWorkGrid videos={awardVideos} emptyText={emptyBySub.awards} />;
    if (workSubTab === "competition") return <VisitorWorkGrid videos={competitionVideos} emptyText={emptyBySub.competition} />;
    if (seriesGroups.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-white/15 bg-[#1A1535]/60 px-6 py-12 text-center text-sm text-[#AFA9EC]">
          {emptyBySub.series}
        </div>
      );
    }
    return (
      <div className="space-y-10">
        {seriesGroups.map((g) => (
          <div key={g.name}>
            <h3 className="mb-4 text-lg font-semibold text-[#EEEDFE]">{g.name}</h3>
            <VisitorWorkGrid videos={g.videos} emptyText={t("profile.noFilmsInSeriesYet")} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-10">
      <AnimateIn delay={0.05}>
      <section className="rounded-2xl border border-white/10 bg-[#1A1535] p-6 sm:p-8" aria-labelledby="profile-display-name">
        <div className="relative mb-6 h-44 overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-r from-[#111111] via-[#1a1a1a] to-[#0a0a0a] sm:h-56">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(127,119,221,0.35),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(83,74,183,0.35),transparent_58%)]" />
        </div>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <ProfileAvatarUpload
            userId={profile.id}
            avatarUrl={profile.avatarUrl}
            displayName={profile.displayName}
            editable={isOwner && editing}
          />
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                {isOwner && editing ? (
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full max-w-md rounded-lg bg-[#26215C] px-3 py-2 text-2xl font-bold text-[#EEEDFE] ring-1 ring-white/10 focus:ring-[#7F77DD]"
                    placeholder={t("settings.displayName")}
                  />
                ) : (
                  <h1 id="profile-display-name" className="text-2xl font-bold text-[#EEEDFE] sm:text-3xl">
                    {profile.displayName ?? "Profile"}
                  </h1>
                )}
                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#AFA9EC]">
                  <span>
                    {t("profile.followers")}{" "}
                    <strong className="font-semibold text-[#EEEDFE] tabular-nums">{isOwner ? followers : followerCount}</strong>
                  </span>
                  <span className="text-white/30">·</span>
                  <span>
                    {t("profile.followingCountLabel")}{" "}
                    <strong className="font-semibold text-[#EEEDFE] tabular-nums">{following}</strong>
                  </span>
                  <span className="text-white/30">·</span>
                  <span className="rounded-full bg-[#534AB7]/50 px-2 py-0.5 text-xs text-[#EEEDFE]">{tierLabel[profile.subscriptionTier]}</span>
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {isOwner ? (
                  editing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void saveProfile()}
                        disabled={saving}
                        className="rounded-[6px] bg-[#534AB7] px-4 py-2 text-sm font-semibold text-[#EEEDFE] disabled:opacity-60"
                      >
                        {saving ? t("settings.saving") : t("settings.saveChanges")}
                      </button>
                      <button type="button" onClick={cancelEdit} className="rounded-[6px] border border-white/20 bg-transparent px-4 py-2 text-sm text-[#EEEDFE]">
                        {t("common.cancel")}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(true);
                        setError(null);
                        setInfo(null);
                      }}
                      className="rounded-[6px] bg-[#534AB7] px-4 py-2 text-sm font-semibold text-[#EEEDFE] hover:bg-[#655cd0]"
                    >
                      {t("settings.editProfile")}
                    </button>
                  )
                ) : showFollow ? (
                  <ProfileFollowButton
                    targetUserId={profile.id}
                    initialFollowing={initialFollowing}
                    onFollowersDelta={(d) => setFollowerCount((c) => Math.max(0, c + d))}
                  />
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {profile.isGenovaPartner ? (
                <span className="rounded-full bg-[#FFD873] px-3 py-1 text-xs font-semibold text-[#1A1535]">{t("profile.genovaOriginalPartner", "Genova Original Partner")}</span>
              ) : null}
              {(awards.length > 0 || profile.totalAwards > 0) && (
                <span className="rounded-full border border-[#7F77DD]/60 bg-[#26215C] px-3 py-1 text-xs text-[#E8E4FF]">
                  {t("profile.competitionAwards")} {Math.max(awards.length, profile.totalAwards)}
                </span>
              )}
            </div>

            {isOwner && editing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full rounded-lg bg-[#26215C] p-3 text-sm text-[#EEEDFE] ring-1 ring-white/10 focus:ring-[#7F77DD]"
                placeholder={t("profile.writeBio")}
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#AFA9EC]">{profile.bio || t("profile.noBioYet")}</p>
            )}

            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[#AFA9EC]">{t("settings.aiTools")}</p>
              {isOwner && editing ? (
                <div className="space-y-5 rounded-xl border border-white/10 bg-[#0A0A18]/50 p-4">
                  {AI_TOOL_CATEGORIES.map((cat) => (
                    <div key={cat.key}>
                      <p className="mb-2 text-sm font-semibold text-[#EEEDFE]">{cat.label}</p>
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {cat.tools.map((opt) => {
                          const id = `tool-${cat.key}-${opt}`;
                          const checked = tools.includes(opt);
                          return (
                            <li key={opt}>
                              <label
                                htmlFor={id}
                                className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#26215C] px-3 py-2 text-sm text-[#EEEDFE] ring-1 ring-white/10 hover:ring-[#7F77DD]"
                              >
                                <input
                                  id={id}
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleTool(opt)}
                                  className="h-4 w-4 rounded border-[#AFA9EC] bg-[#26215C] text-[#534AB7] focus:ring-[#7F77DD]"
                                />
                                <span>{opt}</span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                  {orphanEditTools.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-[#AFA9EC]">Other (previously selected)</p>
                      <ul className="flex flex-wrap gap-2">
                        {orphanEditTools.map((o) => (
                          <li key={o}>
                            <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#26215C] px-3 py-2 text-xs text-[#EEEDFE] ring-1 ring-amber-500/30">
                              <input type="checkbox" checked={tools.includes(o)} onChange={() => toggleTool(o)} className="h-4 w-4 rounded" />
                              {o}
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <ProfileToolsDisplay tools={profile.tools} />
              )}
            </div>

            {isOwner && editing && (
              <div className="space-y-4 rounded-xl border border-white/10 bg-[#0A0A18]/50 p-4">
                <h3 className="text-sm font-bold text-[#EEEDFE]">{t("profile.account")}</h3>
                <p className="text-xs text-[#AFA9EC]">
                  {t("profile.currentEmail")}: {userEmail}
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-[#AFA9EC]" htmlFor="profile-new-email">
                      {t("profile.newEmail")}
                    </label>
                    <input
                      id="profile-new-email"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder={t("profile.newEmailPlaceholder")}
                      className="w-full rounded-lg bg-[#26215C] p-2.5 text-sm text-[#EEEDFE] ring-1 ring-white/10 focus:ring-[#7F77DD]"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-[#AFA9EC]">{t("profile.changePassword")}</span>
                    <input
                      type="password"
                      value={pw}
                      onChange={(e) => setPw(e.target.value)}
                      placeholder={t("profile.newPassword")}
                      autoComplete="new-password"
                      className="w-full rounded-lg bg-[#26215C] p-2.5 text-sm text-[#EEEDFE] ring-1 ring-white/10 focus:ring-[#7F77DD]"
                    />
                    <input
                      type="password"
                      value={pw2}
                      onChange={(e) => setPw2(e.target.value)}
                      placeholder={t("profile.confirmNewPassword")}
                      autoComplete="new-password"
                      className="w-full rounded-lg bg-[#26215C] p-2.5 text-sm text-[#EEEDFE] ring-1 ring-white/10 focus:ring-[#7F77DD]"
                    />
                  </div>
                </div>
                <p className="text-xs text-[#AFA9EC]">{t("profile.saveToApplyAccountChanges")}</p>
              </div>
            )}

            {awardBadges.length > 0 ? (
              <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
                {awardBadges.map((a) => (
                  <span
                    key={a.id}
                    className="rounded-lg bg-[#0A0A18] px-3 py-2 text-xs text-[#E8E4FF] ring-1 ring-[#534AB7]/50"
                  >
                    {a.awardTitle}
                    {a.competitionTitle ? ` · ${a.competitionTitle}` : ""}
                  </span>
                ))}
              </div>
            ) : null}

            {error && <p className="text-sm text-red-300">{error}</p>}
            {info && <p className="text-sm text-emerald-300">{info}</p>}
          </div>
        </div>
      </section>
      </AnimateIn>

      <AnimateIn delay={0.15}>
        <div
          className="inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-white/12 bg-[linear-gradient(180deg,rgba(16,14,36,0.95)_0%,rgba(10,10,10,0.98)_100%)] p-1 shadow-[inset_0_1px_0_rgba(127,119,221,0.12)]"
          role="tablist"
          aria-label="Profile content"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mainTab === "works"}
            onClick={() => setMainTab("works")}
            className={profileMainTabClass(mainTab === "works")}
          >
            {t("profile.works")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mainTab === "awards"}
            onClick={() => setMainTab("awards")}
            className={profileMainTabClass(mainTab === "awards")}
          >
            {t("profile.awards")}
          </button>
          {isOwner ? (
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === "saved"}
              onClick={() => setMainTab("saved")}
              className={profileMainTabClass(mainTab === "saved")}
            >
              {t("profile.saved")}
            </button>
          ) : null}
          {isOwner ? (
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === "credits"}
              onClick={() => setMainTab("credits")}
              className={profileMainTabClass(mainTab === "credits")}
            >
              {t("profile.credits")}
            </button>
          ) : null}
        </div>
      </AnimateIn>

      {mainTab === "works" && (
        <AnimateIn delay={0.2}>
        <section id="profile-section-works" className="space-y-4" aria-labelledby="works-heading">
          <h2 id="works-heading" className="text-xl font-bold text-[#EEEDFE]">
            {t("profile.works")}
          </h2>

          <div className="flex flex-wrap gap-1 border-b border-white/15" role="tablist" aria-label="Work categories">
            {WORK_SUB_TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={workSubTab === key}
                onClick={() => setWorkSubTab(key)}
                className={`tab-underline text-sm font-semibold ${
                  workSubTab === key ? "border-b-[#7F77DD] text-[#EEEDFE]" : ""
                }`}
              >
                {label === "all"
                  ? t("profile.allWorks")
                  : label === "awards"
                    ? t("profile.awards")
                    : label === "competition"
                      ? t("profile.competitionEntries")
                      : t("profile.series")}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1 border-b border-white/10" role="group" aria-label="Sort options">
              {SORTS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSort(key)}
                  className={`tab-underline text-xs font-medium ${
                    sort === key ? "border-b-[#7F77DD] text-[#EEEDFE]" : ""
                  }`}
                >
                  {label === "recent"
                    ? t("profile.sortNewest")
                    : label === "views"
                      ? t("profile.sortMostViewed")
                      : t("profile.sortMostLiked")}
                </button>
              ))}
            </div>

          <div className="pt-2">{renderWorkBody()}</div>
        </section>
        </AnimateIn>
      )}

      {mainTab === "awards" && (
        <AnimateIn delay={0.2}>
          <div id="profile-section-awards">
          <ProfileAwardsTab awards={awards} trophies={trophies} />
          </div>
        </AnimateIn>
      )}

      {isOwner && mainTab === "saved" && (
        <AnimateIn delay={0.25}>
        <section id="profile-section-saved" className="space-y-4" aria-labelledby="saved-heading">
          <h2 id="saved-heading" className="text-xl font-bold text-[#EEEDFE]">
            {t("profile.savedFilms")}
          </h2>
          <ProfileVideoGrid videos={saved} emptyLabel={t("profile.noSavedFilmsYet")} />
        </section>
        </AnimateIn>
      )}

      {isOwner && mainTab === "credits" && (
        <AnimateIn delay={0.2}>
          <section id="profile-section-credits" className="space-y-5" aria-labelledby="credits-heading">
            <h2 id="credits-heading" className="text-xl font-bold text-[#EEEDFE]">
              {t("profile.creditsPoints")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-[linear-gradient(165deg,rgba(19,16,40,0.9)_0%,rgba(10,10,10,0.95)_100%)] p-5 shadow-[inset_0_1px_0_rgba(127,119,221,0.1)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7F77DD]">{t("profile.credits")}</p>
                <p className="mt-2 font-display text-3xl font-bold tabular-nums text-[#F8F7FF]">
                  {new Intl.NumberFormat("en-US").format(profile.credits)}
                </p>
                <p className="mt-1 text-xs text-[#AFA9EC]">{t("profile.creditsHint")}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[linear-gradient(165deg,rgba(19,16,40,0.9)_0%,rgba(10,10,10,0.95)_100%)] p-5 shadow-[inset_0_1px_0_rgba(127,119,221,0.1)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7F77DD]">{t("profile.points", "Points")}</p>
                <p className="mt-2 font-display text-3xl font-bold tabular-nums text-[#F8F7FF]">
                  {new Intl.NumberFormat("en-US").format(profile.points)}
                </p>
                <p className="mt-1 text-xs text-[#AFA9EC]">{t("profile.pointsHint")}</p>
              </div>
            </div>
            <Link
              href="/credits"
              className="inline-flex items-center justify-center rounded-lg bg-[#534AB7] px-5 py-2.5 text-sm font-semibold text-[#EEEDFE] transition hover:bg-[#7F77DD]"
            >
              {t("profile.goToCreditsPage")}
            </Link>
          </section>
        </AnimateIn>
      )}
    </div>
  );
}

/** @deprecated Name compatibility alias - use `ProfilePageClient` */
export const PublicProfileClient = ProfilePageClient;
