"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  X,
  Minus,
  Plus,
  Upload as UploadIcon,
  FileVideo,
  Trash2,
  Lock,
  AlertTriangle,
  Trophy,
} from "lucide-react";
import { updateVideoAction, deleteVideoAction } from "@/app/actions/video";
import { useI18n } from "@/components/genova/language-provider";
import { mainGenreLabel, type MainGenreKey } from "@/lib/constants/genres";
import { cn } from "@/lib/utils/cn";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

type VideoData = {
  id: string;
  title: string;
  thumbnail_url: string;
  backdrop_url?: string | null;
  mux_playback_id?: string | null;
  mux_asset_id?: string | null;
  mux_upload_id?: string | null;
  genre: string;
  additional_genres?: string[] | null;
  purpose: string;
  ai_tools: string[];
  tags: string[];
  series_name: string | null;
  episode_number: number | null;
  description: string;
  runtime: string;
  duration_seconds?: number | null;
  visibility: string;
  genre_changed_at?: string | null;
  submitted_competition_id?: string | null;
};

interface Props {
  video: VideoData;
  userId: string;
  competitions: { id: string; title: string }[];
  activeCompetitionId?: string;
  onSubmitted?: () => void;
}

function parseRuntimeMinutes(runtime: string | null | undefined): number {
  if (!runtime) return 0;
  const [m, s] = runtime.split(":").map(Number);
  return (m || 0) + (s || 0) / 60;
}

export function EditVideoFormSimple({ video, userId, competitions, activeCompetitionId, onSubmitted }: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();

  const [title, setTitle] = useState(video.title ?? "");
  const [genre, setGenre] = useState<MainGenreKey>((video.genre as MainGenreKey) ?? "film");
  const [visibility, setVisibility] = useState<"public" | "private">(
    (video.visibility as "public" | "private") ?? "public",
  );
  const [purpose] = useState<"personal" | "competition">(
    (video.purpose as "personal" | "competition") ?? "personal",
  );
  const [competitionId, setCompetitionId] = useState<string>(
    video.submitted_competition_id ?? activeCompetitionId ?? competitions[0]?.id ?? "",
  );

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(video.thumbnail_url ?? null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [description, setDescription] = useState(video.description ?? "");
  const [tags, setTags] = useState<string[]>(video.tags ?? []);
  const [tagInput, setTagInput] = useState("");

  const [seriesOpen, setSeriesOpen] = useState(false);
  const [isSeriesMode, setIsSeriesMode] = useState(Boolean(video.series_name));
  const [seriesName, setSeriesName] = useState(video.series_name ?? "");
  const [episodeNumber, setEpisodeNumber] = useState<number>(video.episode_number ?? 1);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const genreLocked = Boolean(video.genre_changed_at);

  const canSave =
    Boolean(title.trim()) &&
    !isSaving &&
    (!isSeriesMode || Boolean(seriesName.trim()));

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return;
    if (f.size > 6 * 1024 * 1024) {
      toast.error(t("upload.errImageSize"));
      return;
    }
    setThumbnailPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
    setThumbnailFile(f);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    setIsSaving(true);
    try {
      let thumbnailUrl = video.thumbnail_url;

      if (thumbnailFile) {
        const supabase = getBrowserSupabaseClient();
        if (supabase) {
          const safe = thumbnailFile.name.replace(/[^\w.-]/g, "_");
          const path = `${userId}/${Date.now()}-${safe}`;
          const { error: upErr } = await supabase.storage
            .from("thumbnails")
            .upload(path, thumbnailFile, { upsert: true });
          if (upErr) {
            toast.error(upErr.message);
            return;
          }
          const {
            data: { publicUrl },
          } = supabase.storage.from("thumbnails").getPublicUrl(path);
          thumbnailUrl = publicUrl;
        }
      }

      const result = await updateVideoAction(video.id, {
        title: title.trim(),
        thumbnailUrl,
        backdropUrl: video.backdrop_url ?? null,
        genre,
        additionalGenres: (video.additional_genres ?? []) as string[],
        // `purpose` lives client-side only on edit — `updateVideoAction`
        // doesn't accept it (the DB column isn't mutated on edit).
        // It's still used locally below to gate `submittedCompetitionId`.
        aiTools: video.ai_tools ?? [],
        tags,
        seriesName: isSeriesMode ? seriesName.trim() : null,
        episodeNumber: isSeriesMode ? episodeNumber : null,
        description: description.trim(),
        runtimeMinutes: parseRuntimeMinutes(video.runtime),
        visibility,
        submittedCompetitionId: purpose === "competition" ? competitionId : null,
        muxPlaybackId: video.mux_playback_id ?? null,
        muxAssetId: video.mux_asset_id ?? null,
        muxUploadId: video.mux_upload_id ?? null,
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(t("editVideo.successSave", "Saved"));
      if (onSubmitted) {
        router.refresh();
        onSubmitted();
      } else {
        router.push(`/watch/${video.id}`);
        router.refresh();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteVideoAction(video.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(t("editVideo.successDelete", "Deleted"));
      if (onSubmitted) {
        router.refresh();
        onSubmitted();
      } else {
        router.push("/");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form
      onSubmit={(e) => void handleSave(e)}
      className="mx-auto w-full max-w-[720px] space-y-8 px-6 py-12"
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
          e.preventDefault();
        }
      }}
    >
      {/* 1. Video preview + Thumbnail */}
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div>
          <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.18em] text-white/70">
            {t("editVideo.video", "Video")}
          </label>
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/[0.08] bg-black">
            {video.mux_playback_id ? (
              <img
                src={`https://image.mux.com/${video.mux_playback_id}/thumbnail.jpg?width=640&time=2`}
                alt={video.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-white/30">
                <FileVideo className="h-8 w-8" />
              </div>
            )}
          </div>
          <p className="mt-2 text-[11px] text-white/40">
            {t("editVideo.videoLocked", "Video cannot be changed")}
          </p>
        </div>

        <div>
          <label className="mb-2 flex items-center justify-between text-[12px] font-bold uppercase tracking-[0.18em] text-white/70">
            <span>{t("editVideo.thumbnail", "Thumbnail")}</span>
          </label>
          {thumbnailPreview ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/[0.08]">
              {/* eslint-disable-next-line @next/next/no-img-element -- blob: URI or persisted URL after upload; next/image not applicable to blob */}
              <img src={thumbnailPreview} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  if (thumbnailPreview?.startsWith("blob:")) URL.revokeObjectURL(thumbnailPreview);
                  setThumbnailPreview(null);
                  setThumbnailFile(null);
                }}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white/80 backdrop-blur-sm transition hover:bg-black/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02] transition hover:border-white/[0.2] hover:bg-white/[0.04]">
              <UploadIcon className="h-5 w-5 text-white/40" />
              <span className="text-center text-[11px] text-white/45">
                {t("editVideo.thumbnailHint", "Click to upload")}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} />
            </label>
          )}
        </div>
      </div>

      {/* 2. Title */}
      <div>
        <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.18em] text-white/70">
          {t("editVideo.title", "Title")} <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[15px] text-white placeholder:text-white/30 outline-none transition focus:border-[#7F77DD]/50 focus:ring-1 focus:ring-[#7F77DD]/30"
        />
      </div>

      {/* 3. Genre */}
      <div>
        <label className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-white/70">
          <span>{t("editVideo.genre", "Genre")} <span className="text-red-400">*</span></span>
          {genreLocked && (
            <span className="inline-flex items-center gap-1 text-[10px] font-normal normal-case tracking-normal text-white/40">
              <Lock className="h-3 w-3" />
              {t("editVideo.genreLocked", "Locked")}
            </span>
          )}
        </label>
        <div className="flex flex-wrap gap-2">
          {(["film", "animation", "music", "art", "daily"] as MainGenreKey[]).map((k) => {
            const active = genre === k;
            return (
              <button
                key={k}
                type="button"
                disabled={genreLocked}
                onClick={() => !genreLocked && setGenre(k)}
                className={cn(
                  "rounded-full border px-4 py-2 text-[13px] font-semibold transition-all duration-200",
                  active
                    ? "border-[#7F77DD]/40 bg-gradient-to-br from-[#7F77DD]/20 to-[#534AB7]/10 text-white"
                    : "border-white/[0.08] bg-white/[0.02] text-white/40 hover:border-white/[0.15] hover:text-white/60",
                  genreLocked && "opacity-50 cursor-not-allowed",
                )}
              >
                {mainGenreLabel(k, locale)}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Purpose */}
      <div>
        <label className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-white/70">
          <span>{t("uploadSimple.purpose")}</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-normal normal-case tracking-normal text-white/40">
            <Lock className="h-3 w-3" />
            {t("editVideo.purposeLocked", "Locked")}
          </span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border px-4 py-4 text-center",
              purpose === "personal"
                ? "border-[#7F77DD]/40 bg-gradient-to-br from-[#7F77DD]/15 to-[#534AB7]/8 text-white"
                : "border-white/[0.08] bg-white/[0.02] text-white/40 opacity-40 cursor-not-allowed",
            )}
          >
            <UploadIcon className="h-5 w-5" strokeWidth={1.5} />
            <div>
              <p className="text-[13px] font-semibold">{t("uploadSimple.purposePersonal")}</p>
              <p className="mt-0.5 text-[11px] opacity-60">{t("uploadSimple.purposePersonalDesc")}</p>
            </div>
          </button>

          <button
            type="button"
            disabled
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border px-4 py-4 text-center",
              purpose === "competition"
                ? "border-amber-500/40 bg-gradient-to-br from-amber-500/15 to-amber-600/8 text-amber-200"
                : "border-white/[0.08] bg-white/[0.02] text-white/40 opacity-40 cursor-not-allowed",
            )}
          >
            <Trophy className="h-5 w-5" strokeWidth={1.5} />
            <div>
              <p className="text-[13px] font-semibold">{t("uploadSimple.purposeCompetition")}</p>
              <p className="mt-0.5 text-[11px] opacity-60">{t("uploadSimple.purposeCompetitionDesc")}</p>
            </div>
          </button>
        </div>

        {purpose === "competition" && competitions.length > 0 && (
          <div className="mt-3">
            <select
              value={competitionId}
              onChange={(e) => setCompetitionId(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[14px] text-white outline-none transition focus:border-[#7F77DD]/50"
            >
              {competitions.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#080618]">
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 5. Visibility */}
      <div>
        <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.18em] text-white/70">
          {t("editVideo.visibility", "Visibility")}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setVisibility("public")}
            className={cn(
              "rounded-xl border px-4 py-3 text-[13px] font-bold transition",
              visibility === "public"
                ? "border-[#7F77DD]/40 bg-gradient-to-br from-[#7F77DD]/15 to-[#534AB7]/8 text-white"
                : "border-white/[0.08] bg-white/[0.02] text-white/55 hover:border-white/[0.15]",
            )}
          >
            🌐 {t("editVideo.visibilityPublic", "Public")}
          </button>
          <button
            type="button"
            onClick={() => setVisibility("private")}
            className={cn(
              "rounded-xl border px-4 py-3 text-[13px] font-bold transition",
              visibility === "private"
                ? "border-white/[0.2] bg-white/[0.06] text-white"
                : "border-white/[0.08] bg-white/[0.02] text-white/55 hover:border-white/[0.15]",
            )}
          >
            🔒 {t("editVideo.visibilityPrivate", "Private")}
          </button>
        </div>
      </div>

      {/* 6. Details (collapsible) */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
        <button
          type="button"
          onClick={() => setDetailsOpen((prev) => !prev)}
          className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-white/[0.02]"
        >
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-white">
              {t("upload.details.title", "상세 정보")}
            </span>
            <span className="text-[11px] text-white/40">
              {t("upload.details.hint", "설명, 해시태그 (선택)")}
            </span>
          </div>
          {detailsOpen ? (
            <ChevronUp className="h-4 w-4 text-white/55" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/55" />
          )}
        </button>

        {detailsOpen && (
          <div className="space-y-5 border-t border-white/[0.04] px-4 py-5">
            <div>
              <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.18em] text-white/70">
                {t("upload.description", "설명")}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={2000}
                className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[14px] text-white placeholder:text-white/30 outline-none transition focus:border-[#7F77DD]/40 focus:bg-white/[0.04]"
              />
            </div>

            <div>
              <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.18em] text-white/70">
                {t("upload.tags", "해시태그")}
              </label>
              <div className="flex flex-wrap gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 focus-within:border-[#7F77DD]/40">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.06] px-2.5 py-1 text-[12px] font-semibold text-white"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                      className="text-white/40 hover:text-white/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
                      e.preventDefault();
                      const newTag = tagInput.trim().replace(/^#/, "");
                      if (newTag && !tags.includes(newTag) && tags.length < 10) {
                        setTags((prev) => [...prev, newTag]);
                      }
                      setTagInput("");
                    }
                  }}
                  placeholder={tags.length === 0 ? t("upload.tagsPlaceholder", "Enter 또는 쉼표로 추가") : ""}
                  className="flex-1 min-w-[120px] bg-transparent text-[13px] text-white placeholder:text-white/30 outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 7. Series (collapsible) */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
        <button
          type="button"
          onClick={() => setSeriesOpen((prev) => !prev)}
          className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-white/[0.02]"
        >
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-white">
              {t("upload.series.title", "시리즈")}
            </span>
            <span className="text-[11px] text-white/40">
              {t("upload.series.hint", "연속물의 일부인 경우")}
            </span>
          </div>
          {seriesOpen ? (
            <ChevronUp className="h-4 w-4 text-white/55" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/55" />
          )}
        </button>

        {seriesOpen && (
          <div className="space-y-5 border-t border-white/[0.04] px-4 py-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-white">
                  {t("upload.series.mode", "시리즈 모드")}
                </span>
                <span className="text-[11px] text-white/40">
                  {t("upload.series.modeHint", "시리즈로 묶어서 등록")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsSeriesMode((prev) => !prev)}
                className={cn(
                  "relative h-6 w-11 rounded-full transition",
                  isSeriesMode ? "bg-[#534AB7]" : "bg-white/[0.08]",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                    isSeriesMode ? "translate-x-5" : "translate-x-0.5",
                  )}
                />
              </button>
            </div>

            {isSeriesMode && (
              <>
                <div>
                  <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.18em] text-white/70">
                    {t("upload.series.name", "시리즈 이름")} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={seriesName}
                    onChange={(e) => setSeriesName(e.target.value)}
                    maxLength={100}
                    placeholder={t("upload.series.namePlaceholder", "예: Mars Diary")}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[14px] text-white placeholder:text-white/30 outline-none transition focus:border-[#7F77DD]/40 focus:bg-white/[0.04]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.18em] text-white/70">
                    {t("upload.series.episode", "에피소드 번호")} <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEpisodeNumber((prev) => Math.max(1, prev - 1))}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-white/70 transition hover:border-white/[0.15] hover:text-white"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      value={episodeNumber}
                      onChange={(e) => setEpisodeNumber(Math.max(1, parseInt(e.target.value) || 1))}
                      min={1}
                      className="w-20 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-center text-[14px] font-bold tabular-nums text-white outline-none transition focus:border-[#7F77DD]/40"
                    />
                    <button
                      type="button"
                      onClick={() => setEpisodeNumber((prev) => prev + 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-white/70 transition hover:border-white/[0.15] hover:text-white"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 8. Save + Delete */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/[0.06] px-4 py-2.5 text-[12px] font-bold text-red-400 transition hover:border-red-500/50 hover:bg-red-500/[0.1]"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t("editVideo.delete", "Delete")}
        </button>
        <button
          type="submit"
          disabled={!canSave}
          className={cn(
            "shrink-0 rounded-xl px-8 py-3 text-[14px] font-bold transition-all duration-200",
            canSave
              ? "bg-white text-[#080618] hover:bg-white/90"
              : "cursor-not-allowed bg-white/[0.06] text-white/30",
          )}
        >
          {isSaving ? t("editVideo.saving", "Saving...") : t("editVideo.save", "Save")}
        </button>
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="w-full max-w-[400px] rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-[16px] font-bold">
                {t("editVideo.confirmDeleteTitle", "Delete this video?")}
              </h3>
            </div>
            <p className="mb-5 text-[13px] text-white/55">
              {t("editVideo.confirmDeleteDesc", "This cannot be undone. All comments and likes will also be removed.")}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-[13px] font-bold text-white/80 transition hover:bg-white/[0.06]"
              >
                {t("editVideo.confirmDeleteCancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                className="rounded-xl bg-red-500 px-4 py-2 text-[13px] font-bold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting
                  ? t("editVideo.confirmDeleteDeleting", "Deleting...")
                  : t("editVideo.confirmDeleteConfirm", "Delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
