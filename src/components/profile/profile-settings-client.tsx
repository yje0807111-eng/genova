"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Globe, Instagram, LogOut, X as XIcon, Youtube } from "lucide-react";
import { updateProfileAction } from "@/app/actions/profile";
import { useI18n } from "@/components/genova/language-provider";
import type { Profile } from "@/lib/queries/profile-queries";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const TOOL_CATEGORIES = [
  {
    category: "Image",
    tools: ["Midjourney", "Stable Diffusion", "Leonardo", "ComfyUI", "Ideogram", "Flux"],
  },
  {
    category: "Video",
    tools: ["Runway", "Kling", "Sora", "Pika", "Luma", "HeyGen", "D-ID"],
  },
  {
    category: "Music & Voice",
    tools: ["ElevenLabs", "Suno", "Udio", "Mubert", "Bark"],
  },
];

export function ProfileSettingsClient({ profile }: { profile: Profile }) {
  const router = useRouter();
  const { locale, setLocale, t } = useI18n();
  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [tools, setTools] = useState<string[]>(profile.tools ?? []);
  const [toolInput, setToolInput] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState(profile.websiteUrl ?? "");
  const [twitterUrl, setTwitterUrl] = useState(profile.twitterUrl ?? "");
  const [instagramUrl, setInstagramUrl] = useState(profile.instagramUrl ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(profile.youtubeUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState(profile.bannerUrl ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [mainGenre, setMainGenre] = useState(profile.mainGenre ?? "");
  const [tiktokUrl, setTiktokUrl] = useState(profile.tiktokUrl ?? "");
  const [vimeoUrl, setVimeoUrl] = useState(profile.vimeoUrl ?? "");
  const [notifyLikes, setNotifyLikes] = useState(profile.notifyLikes ?? true);
  const [notifyComments, setNotifyComments] = useState(profile.notifyComments ?? true);
  const [notifyFollows, setNotifyFollows] = useState(profile.notifyFollows ?? true);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const avatarPreview = avatarUrl.trim();
  const avatarPreviewValid = (() => {
    if (!avatarPreview) return false;
    try {
      new URL(avatarPreview);
      return true;
    } catch {
      return false;
    }
  })();

  const addTool = () => {
    const next = toolInput.trim();
    if (!next) return;
    if (tools.includes(next)) {
      setToolInput("");
      return;
    }
    setTools((prev) => [...prev, next]);
    setToolInput("");
  };

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true);
    setError(null);
    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUploadingAvatar(false);
      return;
    }

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploadingAvatar(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    setAvatarUrl(data.publicUrl);
    setUploadingAvatar(false);
  };

  const handleBannerUpload = async (file: File) => {
    setUploadingBanner(true);
    setError(null);
    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUploadingBanner(false);
      return;
    }
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/banner.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
    if (uploadError) {
      setError(uploadError.message);
      setUploadingBanner(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    setBannerUrl(data.publicUrl);
    setUploadingBanner(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    const res = await updateProfileAction({
      displayName: displayName.trim() || "User",
      bio,
      tools,
      avatarUrl: avatarUrl.trim() ? avatarUrl.trim() : null,
      bannerUrl: bannerUrl.trim() ? bannerUrl.trim() : null,
      country: country.trim() ? country.trim() : null,
      mainGenre: mainGenre.trim() ? mainGenre.trim() : null,
      websiteUrl: websiteUrl.trim() ? websiteUrl.trim() : null,
      twitterUrl: twitterUrl.trim() ? twitterUrl.trim() : null,
      instagramUrl: instagramUrl.trim() ? instagramUrl.trim() : null,
      youtubeUrl: youtubeUrl.trim() ? youtubeUrl.trim() : null,
      tiktokUrl: tiktokUrl.trim() ? tiktokUrl.trim() : null,
      vimeoUrl: vimeoUrl.trim() ? vimeoUrl.trim() : null,
      notifyLikes,
      notifyComments,
      notifyFollows,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    if (res.ok) {
      router.push(`/profile/${profile.id}`);
    }
  };

  const handleLogout = () => setShowLogoutModal(true);

  const confirmLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  };

  return (
    <>
    <div className="w-full pb-16">
      <form onSubmit={onSubmit}>
        {/* 외부 큰 박스 */}
        <div
          className="rounded-2xl border border-white/[0.08] p-5"
          style={{
            background: "linear-gradient(135deg, rgba(20,17,50,0.98) 0%, rgba(10,8,28,0.99) 100%)",
            boxShadow: "0 0 0 1px rgba(127,119,221,0.08), inset 0 1px 0 rgba(127,119,221,0.05)",
          }}
        >
          {/* 헤더 */}
          <div className="mb-4 flex items-end justify-between border-b border-white/[0.06] pb-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]/60">{t("settings.pageEyebrow")}</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
                {t("settings.editProfile", "Edit Profile")}
              </h1>
            </div>
            <Link
              href={`/profile/${profile.id}`}
              className="text-sm font-medium text-[#7F77DD] transition hover:text-[#AFA9EC]"
            >
              {t("settings.viewProfile", "View profile")} →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
            {/* 왼쪽 — 프로필 기본 정보 */}
            <div className="space-y-3">
              <div
                className="rounded-xl border border-white/[0.08] p-3"
                style={{ background: "rgba(83,74,183,0.08)", borderColor: "rgba(127,119,221,0.12)" }}
              >
                <h2 className="mb-3 border-b border-[#7F77DD]/20 pb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC]">
                  {t("settings.sectionProfile")}
                </h2>

                {/* 배너 */}
                <div className="mb-3">
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-white/40">
                    {t("settings.bannerLabel")}
                  </label>
                  <div
                    className="relative h-20 w-full overflow-hidden rounded-xl border border-white/[0.08]"
                    style={{ background: "linear-gradient(135deg, #1a1535, #26215c, #0f0d1e)" }}
                  >
                    {bannerUrl ? (
                      <img src={bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(83,74,183,0.3),transparent_60%)]" />
                    )}
                    <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1 bg-black/40 opacity-0 transition hover:opacity-100">
                      <span className="text-[11px] font-bold text-white">{t("settings.uploadBanner")}</span>
                      <span className="text-[10px] text-white/50">{t("settings.bannerSizeHint")}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void handleBannerUpload(f);
                        }}
                      />
                    </label>
                  </div>
                  {uploadingBanner && <p className="mt-1 text-[10px] text-white/40">{t("settings.uploadingBanner")}</p>}
                </div>

                {/* 아바타 */}
                <div className="mb-3 flex items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={avatarPreviewValid ? avatarUrl : "/placeholder-user.jpg"}
                      alt="Avatar"
                      className="h-16 w-16 rounded-full object-cover"
                      style={{ boxShadow: "0 0 0 2px #534AB7, 0 0 16px rgba(83,74,183,0.4)" }}
                    />
                    <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 opacity-0 transition hover:opacity-100">
                      <span className="text-[10px] font-bold text-white">Edit</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void handleAvatarUpload(f);
                        }}
                      />
                    </label>
                  </div>
                  <div className="flex-1">
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-white/40">
                      {t("settings.displayNameField")}
                    </label>
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.12] bg-[#0d0b20] px-3 py-2 text-sm text-white outline-none transition focus:border-[#7F77DD]/60 focus:ring-1 focus:ring-[#7F77DD]/30"
                      autoComplete="name"
                    />
                  </div>
                </div>

                {/* 바이오 */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-white/40">
                    {t("settings.bioField")}
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-white/[0.12] bg-[#0d0b20] px-3 py-2 text-sm text-white outline-none transition focus:border-[#7F77DD]/60 focus:ring-1 focus:ring-[#7F77DD]/30"
                    placeholder={t("settings.bioPlaceholderShort")}
                  />
                </div>
              </div>

              {/* Creator Info */}
              <div
                className="rounded-xl border border-white/[0.08] p-3"
                style={{ background: "rgba(255,255,255,0.025)" }}
              >
                <h2 className="mb-3 border-b border-[#7F77DD]/20 pb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC]">
                  {t("settings.creatorInfoSection")}
                </h2>
                <div className="space-y-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-white/40">
                      {t("settings.countryField")}
                    </label>
                    <input
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.12] bg-[#0d0b20] px-3 py-2 text-sm text-white outline-none transition focus:border-[#7F77DD]/60"
                      placeholder={t("settings.countryPlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-white/40">
                      {t("settings.mainGenreField")}
                    </label>
                    <select
                      value={mainGenre}
                      onChange={(e) => setMainGenre(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.12] bg-[#0d0b20] px-3 py-2 text-sm text-white outline-none transition focus:border-[#7F77DD]/60"
                    >
                      <option value="">{t("settings.genrePlaceholder")}</option>
                      <option value="film">{t("settings.genreFilm")}</option>
                      <option value="animation">{t("settings.genreAnimation")}</option>
                      <option value="music">{t("settings.genreMusicVideo")}</option>
                      <option value="daily">{t("settings.genreDaily")}</option>
                      <option value="art">{t("settings.genreArt")}</option>
                      <option value="documentary">{t("settings.genreDocumentary")}</option>
                      <option value="horror">{t("settings.genreHorror")}</option>
                      <option value="sci_fi">{t("settings.genreScifi")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-white/40">
                      {t("settings.languageUi")}
                    </label>
                    <select
                      value={locale}
                      onChange={(e) => {
                        const v = e.target.value;
                        setLocale(v === "ko" ? "ko" : v === "ja" ? "ja" : "en");
                      }}
                      className="w-full rounded-xl border border-white/[0.12] bg-[#0d0b20] px-3 py-2 text-sm text-white outline-none transition focus:border-[#7F77DD]/60"
                    >
                      <option value="en">English</option>
                      <option value="ko">Korean</option>
                      <option value="ja">Japanese</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 가운데 — AI Tools */}
            <div>
              <div
                className="rounded-xl border border-white/[0.08] p-3"
                style={{ background: "rgba(83,74,183,0.06)", borderColor: "rgba(127,119,221,0.1)" }}
              >
                <h2 className="mb-3 border-b border-[#7F77DD]/20 pb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC]">
                  {t("settings.aiToolsHeading")}
                </h2>
                <div className="space-y-3">
                  {TOOL_CATEGORIES.map((group) => (
                    <div key={group.category}>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/25">{group.category}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {group.tools.map((tool) => {
                          const active = tools.includes(tool);
                          return (
                            <button
                              key={tool}
                              type="button"
                              onClick={() =>
                                setTools((prev) => (active ? prev.filter((n) => n !== tool) : [...prev, tool]))
                              }
                              className="rounded-full border px-3 py-1 text-xs font-medium transition"
                              style={{
                                borderColor: active ? "rgba(127,119,221,0.5)" : "rgba(255,255,255,0.06)",
                                background: active ? "rgba(83,74,183,0.35)" : "rgba(255,255,255,0.02)",
                                color: active ? "#AFA9EC" : "rgba(255,255,255,0.35)",
                              }}
                            >
                              {tool}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/25">
                      {t("settings.customToolsLabel")}
                    </p>
                    <input
                      value={toolInput}
                      onChange={(e) => setToolInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTool();
                        }
                      }}
                      className="w-full rounded-xl border border-white/[0.12] bg-[#0d0b20] px-3 py-2 text-sm text-white outline-none transition focus:border-[#7F77DD]/60"
                      placeholder={t("settings.toolInputPlaceholder")}
                    />
                  </div>

                  {tools.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {tools.map((tool) => (
                        <span
                          key={tool}
                          className="flex items-center gap-1.5 rounded-full border border-[#7F77DD]/30 bg-[#534AB7]/20 px-3 py-1 text-xs text-[#AFA9EC]"
                        >
                          {tool}
                          <button
                            type="button"
                            onClick={() => setTools((prev) => prev.filter((i) => i !== tool))}
                            className="text-white/40 hover:text-white"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 오른쪽 — 소셜 + 알림 */}
            <div className="space-y-3">
              {/* 소셜 링크 */}
              <div
                className="rounded-xl border border-white/[0.08] p-3"
                style={{ background: "rgba(255,255,255,0.025)" }}
              >
                <h2 className="mb-3 border-b border-[#7F77DD]/20 pb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC]">
                  {t("settings.socialHeading")}
                </h2>
                <div className="space-y-2">
                  {[
                    {
                      icon: <Globe className="h-3 w-3" />,
                      label: "Website",
                      value: websiteUrl,
                      onChange: setWebsiteUrl,
                      placeholder: "https://yoursite.com",
                    },
                    {
                      icon: <XIcon className="h-3 w-3" />,
                      label: "X / Twitter",
                      value: twitterUrl,
                      onChange: setTwitterUrl,
                      placeholder: "https://x.com/username",
                    },
                    {
                      icon: <Instagram className="h-3 w-3" />,
                      label: "Instagram",
                      value: instagramUrl,
                      onChange: setInstagramUrl,
                      placeholder: "https://instagram.com/username",
                    },
                    {
                      icon: <Youtube className="h-3 w-3" />,
                      label: "YouTube",
                      value: youtubeUrl,
                      onChange: setYoutubeUrl,
                      placeholder: "https://youtube.com/@channel",
                    },
                    {
                      icon: (
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
                        </svg>
                      ),
                      label: "TikTok",
                      value: tiktokUrl,
                      onChange: setTiktokUrl,
                      placeholder: "https://tiktok.com/@username",
                    },
                    {
                      icon: (
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.53 3.67-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.25.38-.51 1.07-.78 4.18-1.82 6.97-3.02 8.37-3.6 3.98-1.66 4.81-1.95 5.35-1.96.12 0 .38.03.55.17.14.12.18.28.2.45-.02.07-.02.13-.02.22z" />
                        </svg>
                      ),
                      label: "Vimeo",
                      value: vimeoUrl,
                      onChange: setVimeoUrl,
                      placeholder: "https://vimeo.com/username",
                    },
                  ].map(({ icon, label, value, onChange, placeholder }) => (
                    <div key={label}>
                      <label className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/40">
                        {icon} {label}
                      </label>
                      <input
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full rounded-xl border border-white/[0.12] bg-[#0d0b20] px-3 py-2 text-sm text-white outline-none transition focus:border-[#7F77DD]/60"
                        placeholder={placeholder}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 알림 설정 */}
              <div
                className="rounded-xl border border-white/[0.08] p-3"
                style={{ background: "rgba(255,255,255,0.025)" }}
              >
                <h2 className="mb-3 border-b border-[#7F77DD]/20 pb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC]">
                  {t("settings.notificationsHeading")}
                </h2>
                <div className="space-y-2">
                  {[
                    {
                      label: t("settings.notifLikes"),
                      desc: t("settings.notifLikesDesc"),
                      value: notifyLikes,
                      onChange: setNotifyLikes,
                    },
                    {
                      label: t("settings.notifComments"),
                      desc: t("settings.notifCommentsDesc"),
                      value: notifyComments,
                      onChange: setNotifyComments,
                    },
                    {
                      label: t("settings.notifFollowers"),
                      desc: t("settings.notifFollowersDesc"),
                      value: notifyFollows,
                      onChange: setNotifyFollows,
                    },
                  ].map(({ label, desc, value, onChange }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                    >
                      <div>
                        <p className="text-xs font-semibold text-white">{label}</p>
                        <p className="text-[10px] text-white/30">{desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onChange(!value)}
                        className="relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200"
                        style={{ background: value ? "#534AB7" : "rgba(255,255,255,0.1)" }}
                      >
                        <span
                          className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-[left] duration-200"
                          style={{ left: value ? "18px" : "2px" }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}
              {message && <p className="text-sm text-emerald-400">{message}</p>}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #534AB7 0%, #7B6FE8 100%)",
                  boxShadow: "0 4px 20px rgba(83,74,183,0.4)",
                }}
              >
                {saving ? t("settings.saving", "Saving…") : t("settings.saveChanges", "Save changes")}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] py-3 text-sm font-medium text-white/40 transition hover:border-red-500/30 hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
    {showLogoutModal && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div
          className="w-full max-w-sm rounded-2xl border border-white/[0.08] p-6"
          style={{
            background: "linear-gradient(135deg, rgba(20,17,50,0.99) 0%, rgba(10,8,28,1) 100%)",
            boxShadow: "0 0 0 1px rgba(127,119,221,0.1), 0 40px 80px rgba(0,0,0,0.6)",
          }}
        >
          <h2 className="text-lg font-black text-white">로그아웃</h2>
          <p className="mt-1 text-sm text-white/40">정말 로그아웃 하시겠습니까?</p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => setShowLogoutModal(false)}
              className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-semibold text-white/50 transition hover:border-white/20 hover:text-white"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => void confirmLogout()}
              className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
                boxShadow: "0 4px 16px rgba(220,38,38,0.3)",
              }}
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
