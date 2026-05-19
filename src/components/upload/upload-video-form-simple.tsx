"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  mainGenreLabel,
  type MainGenreKey,
} from "@/lib/constants/genres";
import { useI18n } from "@/components/genova/language-provider";
import { Trophy, Upload, X, FileVideo, ChevronDown, ChevronUp, Minus, Plus, Lock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useUpload } from "@/components/upload/upload-context";

type Props = {
  userId: string;
  competitions: { id: string; title: string }[];
  activeCompetitionId?: string;
  prefilledCompetitionId?: string | null;
  onSubmitted?: () => void;
};

const lbl = "mb-2 block text-[12px] font-bold uppercase tracking-[0.18em] text-white/70";

export function UploadVideoFormSimple({
  competitions,
  activeCompetitionId,
  prefilledCompetitionId,
  onSubmitted,
}: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { addJob } = useUpload();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [genre, setGenre] = useState<MainGenreKey>("film");
  const [purpose, setPurpose] = useState<"personal" | "competition">(
    prefilledCompetitionId ? "competition" : "personal",
  );
  const [competitionId, setCompetitionId] = useState<string>(
    prefilledCompetitionId ?? activeCompetitionId ?? competitions[0]?.id ?? "",
  );

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // 제작 워크플로우(선택) — 업로드 시 부산물로 입력(영상별 탭 노출).
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [wfSteps, setWfSteps] = useState("");
  const [wfPrompts, setWfPrompts] = useState("");
  const [wfModels, setWfModels] = useState("");

  const [seriesOpen, setSeriesOpen] = useState(false);
  const [isSeriesMode, setIsSeriesMode] = useState(false);
  const [seriesName, setSeriesName] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState<number>(1);
  // 내 프로필에 이미 올라간 시리즈 목록 (드롭다운 선택용).
  const [mySeries, setMySeries] = useState<
    { name: string; lastEpisode: number }[]
  >([]);
  // "" = 새 시리즈 직접 입력 / 그 외 = 기존 시리즈명 선택.
  const [seriesChoice, setSeriesChoice] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  // Phase 3-2: "본인 제작" attestation checkbox.  When ticked AND the
  // uploaded clip is ≥30s, the Server Action issues one lottery ticket
  // (see issue_lottery_ticket() in Phase 2A).
  const [originalAttestation, setOriginalAttestation] = useState(false);

  const canSubmit =
    Boolean(title.trim()) &&
    Boolean(videoFile) &&
    !isSubmitting &&
    (!isSeriesMode || Boolean(seriesName.trim()));

  // 내 기존 시리즈 목록 1회 로드 (드롭다운 + 에피소드 자동채움).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/my-series")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        if (Array.isArray(d?.series)) setMySeries(d.series);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // 드롭다운 선택 → 기존 시리즈면 이름 고정 + 에피소드 자동(마지막+1),
  // "새 시리즈"면 입력 초기화.
  const handleSeriesChoice = (val: string) => {
    setSeriesChoice(val);
    if (!val) {
      setSeriesName("");
      setEpisodeNumber(1);
      return;
    }
    const s = mySeries.find((x) => x.name === val);
    if (s) {
      setSeriesName(s.name);
      setEpisodeNumber(s.lastEpisode + 1);
    }
  };

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(true);
    };
    const handleDragLeave = (e: DragEvent) => {
      if (e.relatedTarget === null) setIsDraggingOver(false);
    };
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      const files = Array.from(e.dataTransfer?.files ?? []);
      for (const file of files) {
        if (file.type.startsWith("video/")) {
          setVideoFile(file);
          setError(null);
          break;
        }
      }
    };
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);
    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, []);

  const onThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError(t("upload.errImageFile"));
      return;
    }
    if (f.size > 6 * 1024 * 1024) {
      setError(t("upload.errImageSize"));
      return;
    }
    setThumbnailPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
    setThumbnailFile(f);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !videoFile) return;

    setIsSubmitting(true);

    addJob({
      title: title.trim(),
      videoFile,
      thumbnailFile,
      metadata: {
        genre,
        purpose,
        competitionId: purpose === "competition"
          ? (prefilledCompetitionId ?? competitionId ?? activeCompetitionId ?? null)
          : null,
        description: description.trim(),
        tags,
        workflow: (() => {
          const steps = wfSteps.split("\n").map((s) => s.trim()).filter(Boolean);
          const prompts = wfPrompts.trim();
          const models = wfModels.trim();
          if (steps.length === 0 && !prompts && !models) {
            return null;
          }
          return {
            ...(steps.length ? { steps } : {}),
            ...(prompts ? { prompts } : {}),
            ...(models ? { models } : {}),
          };
        })(),
        seriesName: isSeriesMode ? seriesName.trim() : null,
        episodeNumber: isSeriesMode ? episodeNumber : null,
        originalAttestation,
      },
    });

    // 진행 상황은 우측 하단 UploadProgressWidget 이 지속적으로
    // 보여주므로 시작/완료 toast 는 중복이라 제거.
    if (onSubmitted) {
      onSubmitted();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen">
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            setVideoFile(f);
            setError(null);
          }
        }}
      />
      <input
        ref={thumbInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onThumbChange}
      />

      {isDraggingOver && (
        <div
          className="pointer-events-none fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4"
          style={{ background: "rgba(10,10,10,0.85)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="rounded-2xl border-2 border-dashed border-[#7F77DD]/60 p-16 text-center"
            style={{ background: "var(--tint-accent-15)" }}
          >
            <Upload className="mx-auto mb-4 h-16 w-16 text-[#7F77DD]/60" strokeWidth={1.5} />
            <p className="text-xl font-bold text-white">{t("uploadSimple.dropHere")}</p>
            <p className="mt-2 text-sm text-white/35">{t("uploadSimple.videoFormats")}</p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-[720px] space-y-6 px-6 py-2"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
            e.preventDefault();
          }
        }}
      >
        {/* 1. Video + Thumbnail side by side */}
        <section className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <div>
            <label className={lbl}>
              {t("uploadSimple.clickUpload", "Video")} <span className="text-red-400">*</span>
            </label>
            {videoFile ? (
              <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                <FileVideo className="h-10 w-10 text-[#AFA9EC]/60" strokeWidth={1.5} />
                <p className="max-w-[80%] truncate text-center text-[14px] font-medium text-white/70">
                  {videoFile.name}
                </p>
                <p className="text-[11px] text-white/30">
                  {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
                <button
                  type="button"
                  onClick={() => setVideoFile(null)}
                  className="mt-1 rounded-lg border border-white/[0.08] px-3 py-1.5 text-[11px] text-white/40 transition hover:border-white/[0.2] hover:text-white/70"
                >
                  {t("uploadSimple.changeVideo", "영상 변경")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-white/[0.1] bg-white/[0.02] transition hover:border-[#7F77DD]/40 hover:bg-white/[0.04]"
              >
                <Upload className="h-10 w-10 text-white/20" strokeWidth={1.5} />
                <div className="text-center">
                  <p className="text-[15px] font-medium text-white/40">{t("uploadSimple.clickUpload")}</p>
                  <p className="mt-1 text-xs text-white/20">{t("uploadSimple.videoFormats")}</p>
                </div>
              </button>
            )}
          </div>

          <div>
            <label className="mb-2 flex items-center justify-between text-[12px] font-bold uppercase tracking-[0.18em] text-white/70">
              <span>{t("uploadSimple.thumbnail")}</span>
              <span className="text-[10px] font-normal normal-case tracking-normal text-white/40">
                {t("uploadSimple.optional")}
              </span>
            </label>
            {!thumbnailPreview ? (
              <button
                type="button"
                onClick={() => thumbInputRef.current?.click()}
                className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02] transition hover:border-white/[0.2] hover:bg-white/[0.04]"
              >
                <Upload className="h-5 w-5 text-white/40" strokeWidth={1.5} />
                <span className="text-center text-[11px] leading-relaxed text-white/45">
                  {t("uploadSimple.thumbnailHint")}
                  <br />
                  <span className="text-[10px] text-white/30">{t("uploadSimple.optional")}</span>
                </span>
              </button>
            ) : (
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/[0.08]">
                {/* eslint-disable-next-line @next/next/no-img-element -- blob: URI from file input preview, next/image not applicable */}
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
            )}
          </div>
        </section>

        {/* 2. Title */}
        <section>
          <label className={lbl} htmlFor="simple-title">
            {t("uploadSimple.title")} <span className="text-red-400">*</span>
          </label>
          <input
            id="simple-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[15px] text-white placeholder:text-white/20 outline-none transition focus:border-[#7F77DD]/50 focus:ring-1 focus:ring-[#7F77DD]/30"
            placeholder={t("uploadSimple.titlePlaceholder")}
          />
        </section>

        {/* 4. Genre */}
        <section>
          <label className={lbl}>{t("uploadSimple.genre")} <span className="text-red-400">*</span></label>
          <div className="flex flex-wrap gap-2">
            {(["film", "animation", "music", "art", "daily"] as MainGenreKey[]).map((k) => {
              const active = genre === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setGenre(k)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-[13px] font-semibold transition-all duration-200",
                    active
                      ? "border-[#7F77DD]/40 bg-gradient-to-br from-[#7F77DD]/20 to-[#534AB7]/10 text-white"
                      : "border-white/[0.08] bg-white/[0.02] text-white/40 hover:border-white/[0.15] hover:text-white/60",
                  )}
                >
                  {mainGenreLabel(k, locale)}
                </button>
              );
            })}
          </div>
        </section>

        {/* 5. Purpose */}
        <section>
          <label className={lbl}>{t("uploadSimple.purpose")}</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={Boolean(prefilledCompetitionId)}
              onClick={() => !prefilledCompetitionId && setPurpose("personal")}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border px-4 py-4 text-center transition-all duration-200",
                purpose === "personal"
                  ? "border-[#7F77DD]/40 bg-gradient-to-br from-[#7F77DD]/15 to-[#534AB7]/8 text-white"
                  : "border-white/[0.08] bg-white/[0.02] text-white/40 hover:border-white/[0.15]",
                prefilledCompetitionId && "opacity-40 cursor-not-allowed",
              )}
            >
              <Upload className="h-5 w-5" strokeWidth={1.5} />
              <div>
                <p className="text-[13px] font-semibold">{t("uploadSimple.purposePersonal")}</p>
                <p className="mt-0.5 text-[11px] opacity-60">{t("uploadSimple.purposePersonalDesc")}</p>
              </div>
            </button>

            <button
              type="button"
              disabled={Boolean(prefilledCompetitionId)}
              onClick={() => !prefilledCompetitionId && setPurpose("competition")}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border px-4 py-4 text-center transition-all duration-200",
                purpose === "competition"
                  ? "border-amber-500/40 bg-gradient-to-br from-amber-500/15 to-amber-600/8 text-amber-200"
                  : "border-white/[0.08] bg-white/[0.02] text-white/40 hover:border-white/[0.15]",
              )}
            >
              <Trophy className="h-5 w-5" strokeWidth={1.5} />
              <div>
                <p className="text-[13px] font-semibold">
                  {t("uploadSimple.purposeCompetition")}
                  {prefilledCompetitionId && (
                    <span className="ml-1.5 inline-flex items-center gap-1 text-[10px] font-normal text-amber-300/70">
                      <Lock className="h-2.5 w-2.5" />
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[11px] opacity-60">{t("uploadSimple.purposeCompetitionDesc")}</p>
              </div>
            </button>
          </div>

          {purpose === "competition" && competitions.length > 0 && (
            <div className="mt-3">
              {prefilledCompetitionId ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-400/30 bg-amber-400/[0.06] px-4 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                    <span className="line-clamp-1 text-[13px] font-bold text-white">
                      {competitions.find((c) => c.id === prefilledCompetitionId)?.title ?? t("upload.competition.unknown", "공모전")}
                    </span>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-300/70">
                    <Lock className="h-2.5 w-2.5" />
                    {t("upload.competition.locked", "자동 선택됨")}
                  </span>
                </div>
              ) : (
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
              )}
            </div>
          )}
        </section>

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
                  placeholder={t("upload.descriptionPlaceholder", "작품에 대한 간단한 설명을 입력하세요")}
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

        {/* 6.5 제작 워크플로우 (collapsible) */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
          <button
            type="button"
            onClick={() => setWorkflowOpen((prev) => !prev)}
            className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-white/[0.02]"
          >
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-white">
                {t("upload.workflow.title", "제작 워크플로우")}
              </span>
              <span className="text-[11px] text-white/40">
                {t("upload.workflow.hint", "어떻게 만들었는지 — 단계·프롬프트·모델 (선택)")}
              </span>
            </div>
            {workflowOpen ? (
              <ChevronUp className="h-4 w-4 text-white/55" />
            ) : (
              <ChevronDown className="h-4 w-4 text-white/55" />
            )}
          </button>
          {workflowOpen && (
            <div className="space-y-5 border-t border-white/[0.04] px-4 py-5">
              <div>
                <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.18em] text-white/70">
                  {t("upload.workflow.steps", "제작 단계")}
                </label>
                <textarea
                  value={wfSteps}
                  onChange={(e) => setWfSteps(e.target.value)}
                  rows={5}
                  placeholder={t(
                    "upload.workflow.stepsPlaceholder",
                    "한 줄에 한 단계씩 (예: 1) Midjourney 키프레임 → 2) Runway 모션 → 3) Topaz 업스케일)",
                  )}
                  className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[14px] text-white placeholder:text-white/30 outline-none transition focus:border-[#7F77DD]/40 focus:bg-white/[0.04]"
                />
              </div>
              <div>
                <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.18em] text-white/70">
                  {t("upload.workflow.prompts", "핵심 프롬프트")}
                </label>
                <textarea
                  value={wfPrompts}
                  onChange={(e) => setWfPrompts(e.target.value)}
                  rows={3}
                  placeholder={t("upload.workflow.promptsPlaceholder", "주요 프롬프트나 노하우 (선택)")}
                  className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[14px] text-white placeholder:text-white/30 outline-none transition focus:border-[#7F77DD]/40 focus:bg-white/[0.04]"
                />
              </div>
              <div>
                <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.18em] text-white/70">
                  {t("upload.workflow.models", "사용한 AI 모델")}
                </label>
                <textarea
                  value={wfModels}
                  onChange={(e) => setWfModels(e.target.value)}
                  rows={4}
                  placeholder={t(
                    "upload.workflow.modelsPlaceholder",
                    "이미지) 미드저니\n동영상) 클링3.0\n음향) 수노\n사이트) 힉스필드",
                  )}
                  className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[14px] text-white placeholder:text-white/30 outline-none transition focus:border-[#7F77DD]/40 focus:bg-white/[0.04]"
                />
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
                  role="switch"
                  aria-checked={isSeriesMode}
                  onClick={() => setIsSeriesMode((prev) => !prev)}
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                    isSeriesMode ? "bg-[#534AB7]" : "bg-white/[0.08]",
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform",
                      isSeriesMode ? "translate-x-5" : "translate-x-0",
                    )}
                  />
                </button>
              </div>

              {isSeriesMode && (
                <>
                  {mySeries.length > 0 && (
                    <div>
                      <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.18em] text-white/70">
                        {t("upload.series.pick", "시리즈 선택")}
                      </label>
                      <div className="relative">
                        <select
                          value={seriesChoice}
                          onChange={(e) => handleSeriesChoice(e.target.value)}
                          style={{ colorScheme: "dark" }}
                          className="w-full cursor-pointer appearance-none rounded-xl border border-white/[0.08] bg-white/[0.02] py-3 pl-4 pr-10 text-[14px] text-white outline-none transition hover:bg-white/[0.04] focus:border-[#7F77DD]/40 focus:bg-white/[0.04]"
                        >
                          <option
                            value=""
                            style={{ background: "#141019", color: "#fff" }}
                          >
                            {t("upload.series.newSeries", "+ 새 시리즈 만들기")}
                          </option>
                          {mySeries.map((s) => (
                            <option
                              key={s.name}
                              value={s.name}
                              style={{ background: "#141019", color: "#fff" }}
                            >
                              {s.name} (
                              {t("upload.series.lastEp", "최신 EP {n}").replace(
                                "{n}",
                                String(s.lastEpisode),
                              )}
                              )
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                      </div>
                    </div>
                  )}

                  {seriesChoice ? (
                    <div>
                      <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.18em] text-white/70">
                        {t("upload.series.name", "시리즈 이름")}
                      </label>
                      <div className="rounded-xl border border-[#7F77DD]/25 bg-[#7F77DD]/[0.08] px-4 py-3 text-[14px] font-bold text-[#C7C2F0]">
                        {seriesName}
                      </div>
                    </div>
                  ) : (
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
                  )}

                  <div>
                    <label className="mb-2 block text-[12px] font-bold uppercase tracking-[0.18em] text-white/70">
                      {t("upload.series.episode", "에피소드 번호")} <span className="text-red-400">*</span>
                    </label>
                    {seriesChoice ? (
                      <p className="mb-2 text-[11px] text-[#AFA9EC]/75">
                        {t(
                          "upload.series.autoEp",
                          "선택한 시리즈의 다음 화로 자동 설정됐어요. 필요하면 바꿀 수 있어요.",
                        )}
                      </p>
                    ) : null}
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

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* 7.5. Lottery attestation (Phase 3-2) — feeds
            originalAttestation through to createVideoAction.
            Unchecked = no ticket attempt; the post-upload toast
            (toast.success in handleSubmit chain) renders the
            lottery result returned by the action. */}
        <section className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={originalAttestation}
              onChange={(e) => setOriginalAttestation(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-white/20 bg-transparent text-[#7F77DD] focus:ring-[#7F77DD]/40"
            />
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-white">
                {t("lottery.attestationLabel", "This is my own original work")}
              </span>
              <span className="mt-0.5 block text-[11px] text-white/45">
                {t(
                  "lottery.attestationHelp",
                  "Checked clips at least 30s long earn one lottery ticket per upload",
                )}
              </span>
            </span>
          </label>
        </section>

        {/* 8. Submit row */}
        <section className="flex items-center justify-between gap-4">
          <p className="text-[12px] text-white/25">{t("uploadSimple.editLater")}</p>
          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              "shrink-0 rounded-xl px-8 py-3 text-[14px] font-bold transition-all duration-200",
              canSubmit
                ? "bg-white text-[#080618] hover:bg-white/90"
                : "cursor-not-allowed bg-white/[0.06] text-white/30",
            )}
          >
            {isSubmitting ? t("uploadSimple.submitting") : t("uploadSimple.submit")}
          </button>
        </section>
      </form>
    </div>
  );
}
