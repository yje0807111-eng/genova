"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Globe, Instagram, LogOut, X as XIcon, Youtube } from "lucide-react";
import { updateProfileAction } from "@/app/actions/profile";
import { useI18n } from "@/components/genova/language-provider";
import type { Profile } from "@/lib/queries/profile-queries";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const TOOL_CATEGORIES = [
  {
    category: "Image",
    tools: [
      "Midjourney",
      "Nano Banana Pro",
      "Nano Banana 2",
      "ChatGPT Image 2",
      "Flux",
      "Stable Diffusion",
      "Ideogram",
      "Leonardo",
    ],
  },
  {
    category: "Video",
    tools: ["Sora 2", "Veo 3", "Runway Gen-4", "Kling 2.0", "Hailuo", "Luma Dream Machine", "Pika 2.0", "Higgsfield"],
  },
  {
    category: "Music",
    tools: ["Suno v5", "Udio", "Stable Audio", "Mubert"],
  },
  {
    category: "Voice",
    tools: ["ElevenLabs", "OpenAI Voice", "PlayHT"],
  },
  {
    category: "Editing",
    tools: ["CapCut", "DaVinci Resolve", "Adobe Premiere", "Topaz Video AI"],
  },
  {
    category: "Platforms",
    tools: ["ComfyUI", "Krea", "Freepik", "Magnific", "Higgsfield", "Hedra", "Viggle", "Domo AI", "Genmo", "Replicate", "Fal.ai"],
  },
];

const CATEGORY_COLOR: Record<string, { from: string; to: string; glow: string }> = {
  Image: { from: "#EC4899", to: "#F472B6", glow: "rgba(236,72,153,0.15)" },
  Video: { from: "#06B6D4", to: "#22D3EE", glow: "rgba(6,182,212,0.15)" },
  Music: { from: "#F59E0B", to: "#FBBF24", glow: "rgba(245,158,11,0.15)" },
  Voice: { from: "#10B981", to: "#34D399", glow: "rgba(16,185,129,0.15)" },
  Editing: { from: "#8B5CF6", to: "#A78BFA", glow: "rgba(139,92,246,0.15)" },
  Platforms: { from: "#6366F1", to: "#818CF8", glow: "rgba(99,102,241,0.15)" },
};

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
  const [tagline, setTagline] = useState(profile.tagline ?? "");
  const [pronouns, setPronouns] = useState(profile.pronouns ?? "");
  const [availableForCollab, setAvailableForCollab] = useState(profile.availableForCollab ?? false);
  const [pinnedVideoId, setPinnedVideoId] = useState(profile.pinnedVideoId ?? "");
  const [tiktokUrl, setTiktokUrl] = useState(profile.tiktokUrl ?? "");
  const [vimeoUrl, setVimeoUrl] = useState(profile.vimeoUrl ?? "");
  const [notifyLikes, setNotifyLikes] = useState(profile.notifyLikes ?? true);
  const [notifyComments, setNotifyComments] = useState(profile.notifyComments ?? true);
  const [notifyFollows, setNotifyFollows] = useState(profile.notifyFollows ?? true);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "creator" | "social" | "notifications">("profile");
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

  const inputClass =
    "w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-[#7F77DD]/50 focus:bg-white/[0.04]";
  const labelClass = "mb-1.5 block text-xs font-medium text-white/60";

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
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
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
      tagline: tagline.trim() ? tagline.trim() : null,
      pronouns: pronouns.trim() ? pronouns.trim() : null,
      availableForCollab,
      pinnedVideoId: pinnedVideoId.trim() ? pinnedVideoId.trim() : null,
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
    router.push(`/profile/${profile.id}`);
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
          <div
            className="rounded-2xl border border-white/[0.06] bg-[#0d0b20]/60 p-6 md:p-8"
          >
            <div className="mb-4 flex items-end justify-between border-b border-white/[0.06] pb-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]/60">{t("settings.pageEyebrow")}</p>
                <h1 className="mt-1 text-xl font-bold text-white">
                  {t("settings.editProfile", "Edit Profile")}
                </h1>
              </div>
              <Link
                href={`/profile/${profile.id}`}
                className="text-sm font-medium text-white/60 transition hover:text-white"
              >
                {t("settings.viewProfile", "View profile")} →
              </Link>
            </div>

            <div className="overflow-x-auto border-b border-white/[0.06]">
              <div className="flex min-w-max items-center gap-1">
                {[
                  { id: "profile", label: "Profile" },
                  { id: "creator", label: "Creator" },
                  { id: "social", label: "Social" },
                  { id: "notifications", label: "Notifications" },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`border-b-2 px-1 pb-3 text-sm font-medium transition ${isActive ? "border-[#534AB7] text-white" : "border-transparent text-white/40 hover:text-white"}`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 space-y-6">
              {activeTab === "profile" && (
                <div className="space-y-8">
                  <section className="space-y-4">
                    <h2 className="text-sm font-semibold text-white">{t("settings.sectionProfile")}</h2>
                    <div>
                      <label className={labelClass}>{t("settings.bannerLabel")}</label>
                    <div
                      className="relative h-28 w-full overflow-hidden rounded-lg border border-white/10"
                      style={{ background: "linear-gradient(135deg, #1a1535, #26215c, #0f0d1e)" }}
                    >
                      {bannerUrl ? (
                        <img src={bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(83,74,183,0.3),transparent_60%)]" />
                      )}
                      <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1 bg-black/45 opacity-0 transition hover:opacity-100">
                        <span className="text-xs font-semibold text-white">{t("settings.uploadBanner")}</span>
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
                    {uploadingBanner && <p className="mt-1 text-xs text-white/40">{t("settings.uploadingBanner")}</p>}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={avatarPreviewValid ? avatarUrl : "/placeholder-user.jpg"}
                        alt="Avatar"
                        className="h-16 w-16 rounded-full object-cover"
                        style={{ boxShadow: "0 0 0 2px #534AB7, 0 0 16px rgba(83,74,183,0.35)" }}
                      />
                      <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 opacity-0 transition hover:opacity-100">
                        <span className="text-[10px] font-semibold text-white">Edit</span>
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
                      <label className={labelClass}>{t("settings.displayNameField")}</label>
                      <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputClass} autoComplete="name" />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>{t("settings.taglineField", "Tagline")}</label>
                    <input
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className={inputClass}
                      maxLength={60}
                      placeholder="AI filmmaker exploring sci-fi narratives"
                    />
                    <p className="mt-1 text-right text-[11px] text-white/35">{tagline.length}/60</p>
                  </div>

                  <div>
                    <label className={labelClass}>{t("settings.pronounsField", "Pronouns")}</label>
                    <input
                      value={pronouns}
                      onChange={(e) => setPronouns(e.target.value)}
                      className={inputClass}
                      placeholder="he/him, she/her, they/them"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>{t("settings.bioField")}</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={5}
                      className={`${inputClass} resize-none`}
                      placeholder={t("settings.bioPlaceholderShort")}
                    />
                  </div>
                  </section>
                </div>
              )}

              {activeTab === "creator" && (
                <div className="space-y-8">
                  <section className="space-y-4">
                    <h2 className="text-sm font-semibold text-white">{t("settings.creatorInfoSection")}</h2>
                    <div>
                    <label className={labelClass}>{t("settings.countryField")}</label>
                    <div className="relative">
                      <select value={country} onChange={(e) => setCountry(e.target.value)} className={`${inputClass} appearance-none pr-10`}>
                        <option style={{ backgroundColor: "#0d0b20", color: "white" }} value="">{t("settings.countryPlaceholder")}</option>
                        <option style={{ backgroundColor: "#0d0b20", color: "white" }} value="United States">United States</option>
                        <option style={{ backgroundColor: "#0d0b20", color: "white" }} value="Korea">Korea</option>
                        <option style={{ backgroundColor: "#0d0b20", color: "white" }} value="Japan">Japan</option>
                        <option style={{ backgroundColor: "#0d0b20", color: "white" }} value="United Kingdom">United Kingdom</option>
                        <option style={{ backgroundColor: "#0d0b20", color: "white" }} value="France">France</option>
                        <option style={{ backgroundColor: "#0d0b20", color: "white" }} value="Germany">Germany</option>
                        <option style={{ backgroundColor: "#0d0b20", color: "white" }} value="Canada">Canada</option>
                        <option style={{ backgroundColor: "#0d0b20", color: "white" }} value="Australia">Australia</option>
                        <option style={{ backgroundColor: "#0d0b20", color: "white" }} value="Other">Other</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>{t("settings.mainGenreField")}</label>
                    <div className="relative">
                      <select value={mainGenre} onChange={(e) => setMainGenre(e.target.value)} className={`${inputClass} appearance-none pr-10`}>
                        <option style={{ backgroundColor: "#0d0b20", color: "white" }} value="">{t("settings.genrePlaceholder")}</option>
                        <option style={{ backgroundColor: "#0d0b20", color: "white" }} value="film">{t("settings.genreFilm")}</option>
                        <option style={{ backgroundColor: "#0d0b20", color: "white" }} value="animation">{t("settings.genreAnimation")}</option>
                        <option style={{ backgroundColor: "#0d0b20", color: "white" }} value="music">{t("settings.genreMusicVideo")}</option>
                        <option style={{ backgroundColor: "#0d0b20", color: "white" }} value="daily">{t("settings.genreDaily")}</option>
                        <option style={{ backgroundColor: "#0d0b20", color: "white" }} value="art">{t("settings.genreArt")}</option>
                        <option style={{ backgroundColor: "#0d0b20", color: "white" }} value="documentary">{t("settings.genreDocumentary")}</option>
                        <option style={{ backgroundColor: "#0d0b20", color: "white" }} value="horror">{t("settings.genreHorror")}</option>
                        <option style={{ backgroundColor: "#0d0b20", color: "white" }} value="sci_fi">{t("settings.genreScifi")}</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>{t("settings.languageUi")}</label>
                    <div className="relative">
                      <select
                        value={locale}
                        onChange={(e) => {
                          const v = e.target.value;
                          setLocale(v === "ko" ? "ko" : v === "ja" ? "ja" : "en");
                        }}
                        className={`${inputClass} appearance-none pr-10`}
                      >
                        <option style={{ backgroundColor: "#0d0b20", color: "white" }} value="en">English</option>
                        <option style={{ backgroundColor: "#0d0b20", color: "white" }} value="ko">Korean</option>
                        <option style={{ backgroundColor: "#0d0b20", color: "white" }} value="ja">Japanese</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm text-white">{t("settings.openToCollab", "Open to collaboration")}</p>
                      <p className="mt-0.5 text-xs text-white/40">{t("settings.openToCollabDesc", "Show a badge on your profile")}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAvailableForCollab((prev) => !prev)}
                      className="relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200"
                      style={{ background: availableForCollab ? "#534AB7" : "rgba(255,255,255,0.14)" }}
                    >
                      <span
                        className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-[left] duration-200"
                        style={{ left: availableForCollab ? "18px" : "2px" }}
                      />
                    </button>
                  </div>

                  <div>
                    <label className={labelClass}>{t("settings.pinnedVideoHeading", "Pinned video")}</label>
                    <input
                      value={pinnedVideoId}
                      onChange={(e) => setPinnedVideoId(e.target.value)}
                      className={inputClass}
                      placeholder={t("settings.pinnedVideoPlaceholder", "Paste video ID from /watch/[id]")}
                    />
                    <p className="mt-1 text-xs text-white/30">
                      {t("settings.pinnedVideoHint", "Copy the ID from your /watch/[id] URL.")}
                    </p>
                  </div>
                  </section>

                  <section className="space-y-4">
                    <h2 className="text-sm font-semibold text-white">{t("settings.aiToolsHeading")}</h2>
                    {TOOL_CATEGORIES.map((group) => (
                      <div key={group.category} className="space-y-2.5">
                        {(() => {
                          const color = CATEGORY_COLOR[group.category] ?? {
                            from: "#7F77DD",
                            to: "#AFA9EC",
                            glow: "rgba(127,119,221,0.15)",
                          };
                          const selectedCount = group.tools.filter((tool) => tools.includes(tool)).length;
                          return (
                            <div className="mb-2.5 flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full" style={{ background: color.from }} />
                              <p className="text-xs font-semibold text-white/70">{group.category}</p>
                              <span className="text-[10px] text-white/30">
                                {selectedCount > 0 ? `${selectedCount} selected` : ""}
                              </span>
                            </div>
                          );
                        })()}
                        <div className="flex flex-wrap gap-1.5">
                          {group.tools.map((tool) => {
                            const active = tools.includes(tool);
                            const color = CATEGORY_COLOR[group.category] ?? {
                              from: "#7F77DD",
                              to: "#AFA9EC",
                              glow: "rgba(127,119,221,0.15)",
                            };
                            return (
                              <button
                                key={tool}
                                type="button"
                                onClick={() => setTools((prev) => (active ? prev.filter((n) => n !== tool) : [...prev, tool]))}
                                className="rounded-lg border px-2.5 py-1.5 text-xs font-medium transition"
                                style={{
                                  borderColor: active ? `${color.from}80` : "rgba(255,255,255,0.06)",
                                  background: active
                                    ? `linear-gradient(135deg, ${color.from}20 0%, ${color.to}10 100%)`
                                    : "rgba(255,255,255,0.02)",
                                  color: active ? "#FFFFFF" : "rgba(255,255,255,0.4)",
                                  boxShadow: active ? `0 0 12px ${color.glow}` : "none",
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
                      <div className="mb-1.5 flex items-center gap-2">
                        <label className="text-xs font-medium text-white/60">Other tools</label>
                        <span className="text-[10px] text-white/30">Add a tool not listed above</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          value={toolInput}
                          onChange={(e) => setToolInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addTool();
                            }
                          }}
                          className={inputClass}
                          placeholder={t("settings.toolInputPlaceholder")}
                        />
                        <button
                          type="button"
                          onClick={addTool}
                          className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/[0.06]"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                    {tools.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs text-white/40">Selected ({tools.length})</p>
                        <div className="flex flex-wrap gap-1.5">
                          {tools.map((tool) => (
                            <span
                              key={tool}
                              className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1 text-xs text-white/70"
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
                      </div>
                    )}
                  </section>
                </div>
              )}

              {activeTab === "social" && (
                <div className="space-y-8">
                  <section className="space-y-4">
                    <h2 className="text-sm font-semibold text-white">{t("settings.socialHeading")}</h2>
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
                      <label className={labelClass}>
                        <span className="mr-2 inline-flex items-center text-white/50">{icon}</span>
                        {label}
                      </label>
                      <input value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} placeholder={placeholder} />
                    </div>
                  ))}
                  </section>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="space-y-8">
                  <section className="space-y-4">
                    <h2 className="text-sm font-semibold text-white">{t("settings.notificationsHeading")}</h2>
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
                    <div key={label} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm text-white">{label}</p>
                        <p className="mt-0.5 text-xs text-white/40">{desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onChange(!value)}
                        className="relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200"
                        style={{ background: value ? "#534AB7" : "rgba(255,255,255,0.14)" }}
                      >
                        <span
                          className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-[left] duration-200"
                          style={{ left: value ? "18px" : "2px" }}
                        />
                      </button>
                    </div>
                  ))}
                  </section>
                </div>
              )}
            </div>

            <div className="mt-8 space-y-4">
              {error && <p className="text-sm text-red-400">{error}</p>}
              {message && <p className="text-sm text-emerald-400">{message}</p>}
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-[#534AB7] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7F77DD] disabled:opacity-50"
              >
                {saving ? t("settings.saving", "Saving…") : t("settings.saveChanges", "Save changes")}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] px-4 py-2.5 text-sm text-white/50 transition hover:border-red-500/30 hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                {t("profile.logoutAction")}
              </button>
            </div>
          </div>
        </form>
      </div>
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-white/[0.06] bg-[#0d0b20]/95 p-6">
            <h2 className="text-sm font-semibold text-white">{t("profile.logoutTitle")}</h2>
            <p className="mt-1 text-sm text-white/40">{t("profile.logoutConfirm")}</p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 rounded-lg border border-white/[0.08] px-4 py-2.5 text-sm text-white/50 transition hover:border-white/20 hover:text-white"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={() => void confirmLogout()}
                className="flex-1 rounded-lg bg-[#534AB7] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7F77DD]"
              >
                {t("profile.logoutAction")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
