"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateProfileAction } from "@/app/actions/profile";
import { useI18n } from "@/components/genova/language-provider";
import type { Profile } from "@/lib/queries/profile-queries";
import { cn } from "@/lib/utils/cn";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { ArrowLeft, ChevronDown, X } from "lucide-react";

function determineMainPlatform(p: Profile): string {
  if (p.websiteUrl) return "website";
  if (p.twitterUrl) return "twitter";
  if (p.instagramUrl) return "instagram";
  if (p.youtubeUrl) return "youtube";
  if (p.tiktokUrl) return "tiktok";
  if (p.vimeoUrl) return "vimeo";
  return "";
}

function getMainPlatformUrl(p: Profile): string {
  switch (determineMainPlatform(p)) {
    case "website": return p.websiteUrl ?? "";
    case "twitter": return p.twitterUrl ?? "";
    case "instagram": return p.instagramUrl ?? "";
    case "youtube": return p.youtubeUrl ?? "";
    case "tiktok": return p.tiktokUrl ?? "";
    case "vimeo": return p.vimeoUrl ?? "";
    default: return "";
  }
}

export function ProfileSettingsClient({
  profile,
  userEmail,
  hasPassword,
  authProvider,
  handle,
  isModal,
  onClose,
}: {
  profile: Profile;
  userEmail: string | null;
  hasPassword: boolean;
  authProvider: string;
  handle: string;
  isModal?: boolean;
  onClose?: () => void;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [bannerUrl, setBannerUrl] = useState(profile.bannerUrl ?? "");
  const [mainGenre, setMainGenre] = useState(profile.mainGenre ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [accountExpanded, setAccountExpanded] = useState(false);
  const [mainPlatform, setMainPlatform] = useState(() => determineMainPlatform(profile));
  const [mainPlatformUrl, setMainPlatformUrl] = useState(() => getMainPlatformUrl(profile));

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handlePasswordReset = async () => {
    if (!userEmail) return;
    setResetSending(true);
    const supabase = createBrowserSupabaseClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setResetSending(false);
    if (!resetError) setResetSent(true);
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
    const socialUrls = {
      websiteUrl: mainPlatform === "website" ? (mainPlatformUrl.trim() || null) : null,
      twitterUrl: mainPlatform === "twitter" ? (mainPlatformUrl.trim() || null) : null,
      instagramUrl: mainPlatform === "instagram" ? (mainPlatformUrl.trim() || null) : null,
      youtubeUrl: mainPlatform === "youtube" ? (mainPlatformUrl.trim() || null) : null,
      tiktokUrl: mainPlatform === "tiktok" ? (mainPlatformUrl.trim() || null) : null,
      vimeoUrl: mainPlatform === "vimeo" ? (mainPlatformUrl.trim() || null) : null,
    };

    const res = await updateProfileAction({
      displayName: displayName.trim() || "User",
      bio,
      avatarUrl: avatarUrl.trim() ? avatarUrl.trim() : null,
      bannerUrl: bannerUrl.trim() ? bannerUrl.trim() : null,
      mainGenre: mainGenre.trim() ? mainGenre.trim() : null,
      country: country.trim() ? country.trim() : null,
      ...socialUrls,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    if (isModal && onClose) {
      router.refresh();
      onClose();
    } else {
      router.push(`/profile/${profile.id}`);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Page header — hidden in modal mode */}
      {!isModal && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(`/profile/${profile.id}`)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-white/55 transition hover:border-white/[0.12] hover:text-white"
            title={t("settings.back", "프로필로 돌아가기")}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-[18px] font-bold text-white">
            {t("settings.title", "프로필 편집")}
          </h1>
        </div>
      )}

      {/* Banner + Avatar inline */}
      <section className="space-y-2">
        <div className="grid grid-cols-[1fr_120px] items-stretch gap-3">
          {/* 배너 */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-white/55">
              {t("settings.banner", "배너")}
            </label>
            <div className="relative h-[120px] overflow-hidden rounded-lg border border-white/[0.06]">
              <img src={bannerUrl || "/default-banner.png"} alt="" className="h-full w-full object-cover" />
              <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                <label className="cursor-pointer rounded-md bg-[#0a0a0a]/80 px-2 py-0.5 text-[10px] font-semibold text-white/80 backdrop-blur-md transition hover:bg-[#534AB7] hover:text-white">
                  {t("settings.changeBanner", "변경")}
                  <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleBannerUpload(f); }} className="hidden" />
                </label>
                {bannerUrl && (
                  <button type="button" onClick={() => setBannerUrl("")} title={t("settings.resetBanner", "기본으로")} className="flex h-5 w-5 items-center justify-center rounded-full border border-white/[0.1] bg-[#0a0a0a]/80 text-white/65 backdrop-blur-md transition hover:border-white/30 hover:text-white">
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            </div>
            {uploadingBanner && <p className="mt-1 text-[10px] text-white/35">Uploading…</p>}
          </div>

          {/* 아바타 */}
          <div className="flex flex-col">
            <label className="mb-1.5 block text-[11px] font-semibold text-white/55">
              {t("settings.avatar", "프로필")}
            </label>
            <div className="relative flex flex-1 flex-col items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
              <div className="relative">
                <div className="group relative h-[72px] w-[72px] overflow-hidden rounded-full border border-white/[0.06] bg-white/[0.02] transition-transform duration-200 hover:scale-[2] hover:z-[200]">
                  <img src={avatarUrl || "/default-avatar.png"} alt="" className="h-full w-full object-cover" />
                </div>
                {avatarUrl && (
                  <button type="button" onClick={() => setAvatarUrl("")} title={t("settings.resetAvatar", "기본으로")} className="absolute -top-1 -right-1 z-[210] flex h-5 w-5 items-center justify-center rounded-full border border-white/[0.1] bg-[#0a0a0a]/90 text-white/65 transition hover:border-white/30 hover:text-white">
                    <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
              <label className="cursor-pointer rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-0.5 text-[10px] font-semibold text-white/80 transition hover:border-[#7F77DD]/40 hover:text-white">
                {t("settings.changeAvatar", "변경")}
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleAvatarUpload(f); }} className="hidden" />
              </label>
              {uploadingAvatar && <span className="text-[10px] text-white/35">Uploading…</span>}
            </div>
          </div>
        </div>
      </section>

      {/* Display Name */}
      <section>
        <label className="mb-1.5 block text-[11px] font-semibold text-white/55">
          {t("settings.displayName", "닉네임")}
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={t("settings.displayNamePlaceholder", "표시될 이름")}
          className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[13px] text-white placeholder:text-white/30 outline-none transition focus:border-[#7F77DD]/40"
        />
      </section>

      {/* Handle (read-only) */}
      <section>
        <label className="mb-1.5 block text-[11px] font-semibold text-white/55">
          {t("settings.handle", "아이디")}
        </label>
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
          <span className="text-[13px] text-white/45">@</span>
          <span className="flex-1 text-[13px] text-white/70">{handle}</span>
          <span className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/45">
            {t("settings.handleFixed", "고정")}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-white/35">
          {t("settings.handleNote", "아이디는 닉네임을 영문으로 변경하면 자동 업데이트됩니다")}
        </p>
      </section>

      {/* Bio */}
      <section>
        <label className="mb-1.5 block text-[11px] font-semibold text-white/55">
          {t("settings.bio", "소개")}
        </label>
        <div className="relative rounded-lg border border-white/[0.06] bg-white/[0.02] transition focus-within:border-[#7F77DD]/40">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder={t("settings.bioPlaceholder", "자기소개를 작성해주세요")}
            className="w-full resize-none rounded-lg bg-transparent px-3 py-1.5 pr-14 text-[13px] text-white placeholder:text-white/30 outline-none"
          />
          <span className="absolute bottom-1.5 right-2 text-[10px] tabular-nums text-white/35">
            {bio.length}/300
          </span>
        </div>
      </section>

      {/* Main Genre */}
      <section>
        <label className="mb-1.5 block text-[11px] font-semibold text-white/55">
          {t("settings.mainGenre", "메인 장르")}
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "film", label: t("genre.film", "영화") },
            { value: "animation", label: t("genre.animation", "애니메이션") },
            { value: "music", label: t("genre.music", "음악") },
            { value: "art", label: t("genre.art", "아트") },
            { value: "lifestyle", label: t("genre.lifestyle", "일상") },
          ].map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setMainGenre(g.value)}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition",
                mainGenre === g.value
                  ? "border-[#7F77DD]/40 bg-gradient-to-br from-[#7F77DD]/15 to-[#534AB7]/5 text-white"
                  : "border-white/[0.06] bg-white/[0.02] text-white/55 hover:border-white/[0.12] hover:text-white/85"
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
      </section>

      {/* More — collapsible */}
      <section className="border-t border-white/[0.06] pt-4">
        <button
          type="button"
          onClick={() => setAccountExpanded((prev) => !prev)}
          className="flex w-full items-center justify-between gap-2 text-left transition"
        >
          <div>
            <h2 className="text-[13px] font-bold text-white">
              {t("settings.more", "더보기")}
            </h2>
            <p className="mt-0.5 text-[11px] text-white/45">
              {t("settings.moreDescription", "계정 정보, 국가, 메인 플랫폼")}
            </p>
          </div>
          <ChevronDown className={cn("h-4 w-4 text-white/55 transition-transform", accountExpanded && "rotate-180")} />
        </button>

        {accountExpanded && (
          <div className="mt-4 space-y-3">
            {/* Country */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-white/55">
                {t("settings.country", "국가")}
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[13px] text-white outline-none transition focus:border-[#7F77DD]/40"
              >
                <option value="" className="bg-[#0a0a0a]">{t("settings.countrySelect", "선택")}</option>
                <option value="KR" className="bg-[#0a0a0a]">대한민국</option>
                <option value="US" className="bg-[#0a0a0a]">미국</option>
                <option value="JP" className="bg-[#0a0a0a]">일본</option>
                <option value="CN" className="bg-[#0a0a0a]">중국</option>
                <option value="UK" className="bg-[#0a0a0a]">영국</option>
                <option value="DE" className="bg-[#0a0a0a]">독일</option>
                <option value="FR" className="bg-[#0a0a0a]">프랑스</option>
                <option value="OTHER" className="bg-[#0a0a0a]">{t("settings.countryOther", "기타")}</option>
              </select>
            </div>

            {/* Main Platform + URL */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-white/55">
                {t("settings.mainPlatform", "메인 플랫폼")}
              </label>
              <div className="flex gap-2">
                <select
                  value={mainPlatform}
                  onChange={(e) => setMainPlatform(e.target.value)}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[13px] text-white outline-none transition focus:border-[#7F77DD]/40"
                >
                  <option value="" className="bg-[#0a0a0a]">{t("settings.platformSelect", "선택")}</option>
                  <option value="website" className="bg-[#0a0a0a]">Website</option>
                  <option value="twitter" className="bg-[#0a0a0a]">X (Twitter)</option>
                  <option value="instagram" className="bg-[#0a0a0a]">Instagram</option>
                  <option value="youtube" className="bg-[#0a0a0a]">YouTube</option>
                  <option value="tiktok" className="bg-[#0a0a0a]">TikTok</option>
                  <option value="vimeo" className="bg-[#0a0a0a]">Vimeo</option>
                </select>
                <input
                  type="url"
                  value={mainPlatformUrl}
                  onChange={(e) => setMainPlatformUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[13px] text-white placeholder:text-white/30 outline-none transition focus:border-[#7F77DD]/40"
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-white/55">
                {t("settings.email", "이메일")}
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[13px] text-white/70">
                  {userEmail ?? "—"}
                </div>
                {authProvider !== "email" && (
                  <span className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/55">
                    {authProvider}
                  </span>
                )}
              </div>
            </div>

            {/* Password reset */}
            {hasPassword ? (
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-white/55">
                  {t("settings.password", "비밀번호")}
                </label>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={resetSending || resetSent}
                  className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[12px] font-semibold text-white/80 transition hover:border-[#7F77DD]/40 hover:text-white disabled:opacity-50"
                >
                  {resetSending
                    ? t("settings.passwordSending", "전송 중...")
                    : resetSent
                      ? t("settings.passwordSent", "재설정 링크 전송됨")
                      : t("settings.passwordReset", "비밀번호 재설정 메일 받기")}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* Error/success messages */}
      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-[13px] text-red-300">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-[13px] text-emerald-300">
          {message}
        </p>
      )}

      {/* Save button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-[#534AB7] px-4 py-2 text-[13px] font-bold text-white transition hover:bg-[#6b5fd4] disabled:opacity-50"
        >
          {saving ? t("settings.saving", "저장 중...") : t("settings.save", "저장")}
        </button>
      </div>
    </form>
  );
}
