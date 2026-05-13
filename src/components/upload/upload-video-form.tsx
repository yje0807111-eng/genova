"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { updateAiToolPrefsAction, updateSavedHashtagsAction } from "@/app/actions/profile";
import { createVideoAction } from "@/app/actions/video";
import { AI_TOOL_CATEGORIES, normalizeToolName } from "@/lib/constants/ai-tools";
import {
  FEED_GENRE_KEYS,
  defaultSubGenreForMain,
  getSubGenreOptions,
  needsSubGenre,
  mainGenreLabel,
  type MainGenreKey,
} from "@/lib/constants/genres";
import { useI18n } from "@/components/genova/language-provider";
import { MAX_VIDEO_TAGS } from "@/lib/tags";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { SelectedVideoUploader } from "@/components/upload/selected-video-uploader";

type Props = {
  userId: string;
  competitions: { id: string; title: string }[];
  userCustomTools?: string[];
  userHiddenTools?: string[];
  savedHashtags?: string[];
  recentTags?: string[];
};

const inp =
  "w-full rounded-xl border border-white/[0.12] bg-[#0d0b20] px-4 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition focus:border-[#7F77DD]/60 focus:ring-1 focus:ring-[#7F77DD]/30 focus:bg-[#110e28]";
const lbl = "mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-white/35";

type CatKey = (typeof AI_TOOL_CATEGORIES)[number]["key"];

function NumberInput({
  value,
  onChange,
  min = 1,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  label?: string;
}) {
  return (
    <div
      className="flex items-center gap-0 overflow-hidden rounded-xl border"
      style={{ borderColor: "rgba(127,119,221,0.2)", background: "#0d0b20" }}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-10 w-10 shrink-0 items-center justify-center text-white/35 transition hover:bg-white/[0.05] hover:text-white"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M5 12h14" strokeLinecap="round" />
        </svg>
      </button>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value)))}
        className="w-full border-0 bg-transparent py-2 text-center text-sm font-bold text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="flex h-10 w-10 shrink-0 items-center justify-center text-white/35 transition hover:bg-white/[0.05] hover:text-white"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-xl border px-4 py-2 text-sm transition"
        style={{
          borderColor: open ? "rgba(127,119,221,0.5)" : "rgba(255,255,255,0.08)",
          background: open ? "var(--tint-accent-15)" : "#0d0b20",
          color: selected ? "white" : "rgba(255,255,255,0.25)",
        }}
      >
        <span>{selected?.label ?? placeholder ?? t("common.select")}</span>
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0 text-white/30 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border py-1"
          style={{
            background: "linear-gradient(135deg, rgba(20,17,50,0.98) 0%, rgba(10,8,28,0.99) 100%)",
            borderColor: "rgba(127,119,221,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-4 py-2 text-sm transition hover:bg-white/[0.05]"
              style={{
                color: value === opt.value ? "#AFA9EC" : "rgba(255,255,255,0.6)",
                background: value === opt.value ? "rgba(83,74,183,0.2)" : "transparent",
              }}
            >
              <span>{opt.label}</span>
              {value === opt.value && (
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#7F77DD]" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function UploadVideoForm({
  userId,
  competitions,
  userCustomTools = [],
  userHiddenTools = [],
  savedHashtags = [],
  recentTags = [],
}: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const competitionIdFromUrl = searchParams.get("competition");
  const purposeFromUrl = searchParams.get("purpose");
  const isCompetitionLocked = purposeFromUrl === "competition" && Boolean(competitionIdFromUrl);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const backdropInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const muxUploadIdRef = useRef<string | null>(null);
  const submitSucceededRef = useRef(false);
  const muxAssetIdCleanupRef = useRef<string | null>(null);
  const muxCleanupDoneRef = useRef(false);

  const [title, setTitle] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [backdropFile, setBackdropFile] = useState<File | null>(null);
  const [backdropPreview, setBackdropPreview] = useState<string | null>(null);
  const [mainGenre, setMainGenre] = useState<MainGenreKey>("film");
  const [additionalGenres, setAdditionalGenres] = useState<MainGenreKey[]>([]);
  const [subGenre, setSubGenre] = useState<string>(defaultSubGenreForMain("film") ?? "");
  const [tools, setTools] = useState<string[]>([]);
  const [customTools, setCustomTools] = useState<Partial<Record<CatKey, string[]>>>(() => {
    return { image: userCustomTools, video: [], music: [], platform: [] };
  });
  const [hiddenTools, setHiddenTools] = useState<string[]>(userHiddenTools);
  const [customInput, setCustomInput] = useState<Partial<Record<CatKey, string>>>({});

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [mySavedHashtags, setMySavedHashtags] = useState<string[]>(savedHashtags);
  const [seriesName, setSeriesName] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [isSeriesMode, setIsSeriesMode] = useState(Boolean(seriesName));
  const [existingSeries, setExistingSeries] = useState<{ name: string; nextEpisode: number }[]>([]);
  const [isNewSeries, setIsNewSeries] = useState(false);

  const [description, setDescription] = useState("");
  const [runtimeMinutes, setRuntimeMinutes] = useState(5);
  const [runtimeSeconds, setRuntimeSeconds] = useState(0);
  const [detectedDurationSeconds, setDetectedDurationSeconds] = useState(0);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [purpose, setPurpose] = useState<"personal" | "competition">(
    purposeFromUrl === "competition" ? "competition" : "personal",
  );
  const [competitionId, setCompetitionId] = useState<string>(competitionIdFromUrl ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [stepTransitioning, setStepTransitioning] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [muxUploadUrl, setMuxUploadUrl] = useState<string | null>(null);
  const [muxUploadId, setMuxUploadId] = useState<string | null>(null);
  const [muxPlaybackId, setMuxPlaybackId] = useState<string | null>(null);
  const [muxAssetId, setMuxAssetId] = useState<string | null>(null);
  const [muxUploadStatus, setMuxUploadStatus] = useState<"idle" | "uploading" | "processing" | "ready">("idle");
  const [muxDuration, setMuxDuration] = useState<number | null>(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  useEffect(() => {
    muxAssetIdCleanupRef.current = muxAssetId;
  }, [muxAssetId]);

  const showSubGenre = needsSubGenre(mainGenre);
  const subGenreOptions = getSubGenreOptions(mainGenre, locale);
  const additionalGenreOptions = FEED_GENRE_KEYS.filter((k) => k !== mainGenre);

  // deps: isSeriesMode — 시리즈 모드가 꺼지면 시리즈 입력 초기화
  useEffect(() => {
    if (!isSeriesMode) {
      setSeriesName("");
      setEpisodeNumber(1);
    }
  }, [isSeriesMode]);

  // deps: mainGenre — 메인 장르 변경 시 보조 장르에서 동일 항목 제거
  useEffect(() => {
    setAdditionalGenres((prev) => prev.filter((g) => g !== mainGenre));
  }, [mainGenre]);

  // deps: showSubGenre/subGenre/subGenreOptions — 서브장르 필요 여부 및 유효값 동기화
  useEffect(() => {
    if (!showSubGenre) {
      setSubGenre("");
      return;
    }
    if (!subGenreOptions.some((opt) => opt.value === subGenre)) {
      setSubGenre(subGenreOptions[0]?.value ?? "");
    }
  }, [showSubGenre, subGenre, subGenreOptions]);

  // deps: isSeriesMode — 시리즈 모드일 때만 사용자 시리즈 목록 로드
  useEffect(() => {
    if (!isSeriesMode) return;
    fetch("/api/user-series")
      .then((r) => r.json())
      .then((data) => setExistingSeries(data))
      .catch(() => {});
  }, [isSeriesMode]);

  // deps: t — DnD 전역 이벤트 리스너 등록/해제, 오류 메시지 로캘 반영
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(true);
    };
    const handleDragLeave = (e: DragEvent) => {
      if (e.relatedTarget === null) setIsDraggingOver(false);
    };
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      const files = Array.from(e.dataTransfer?.files ?? []);

      for (const file of files) {
        if (file.type.startsWith("video/")) {
          setSelectedVideoFile(file);
          detectVideoDuration(file);
          try {
            const res = await fetch("/api/mux/upload", { method: "POST" });
            const data = await res.json();
            setMuxUploadUrl(data.uploadUrl);
            setMuxUploadId(data.uploadId);
            muxUploadIdRef.current = data.uploadId ?? null;
            setError(null);
          } catch {
            setError(t("upload.errInitUpload"));
          }
        } else if (file.type.startsWith("image/")) {
          // 이미지 → 썸네일
          if (file.size > 6 * 1024 * 1024) {
            setError(t("upload.errImageSize"));
            continue;
          }
          setThumbnailPreview((prev) => {
            if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
            return URL.createObjectURL(file);
          });
          setThumbnailFile(file);
          setError(null);
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
  }, [t]);

  // deps: step — Step 자동 진행/submit 추적용 로그
  useEffect(() => {
    console.log("[UPLOAD_DEBUG] step changed", {
      step,
      timestamp: Date.now(),
    });
  }, [step]);

  // deps: isCompetitionLocked/purpose — 공모전 진입 시 업로드 목적을 competition으로 고정
  useEffect(() => {
    if (isCompetitionLocked && purpose !== "competition") {
      setPurpose("competition");
    }
  }, [isCompetitionLocked, purpose]);

  // deps: isCompetitionLocked/competitionId/competitionIdFromUrl — 공모전 진입 시 competitionId를 URL 값으로 고정
  useEffect(() => {
    if (isCompetitionLocked && competitionIdFromUrl && competitionId !== competitionIdFromUrl) {
      setCompetitionId(competitionIdFromUrl);
    }
  }, [isCompetitionLocked, competitionId, competitionIdFromUrl]);

  const initMuxUpload = async () => {
    try {
      const res = await fetch("/api/mux/upload", { method: "POST" });
      const data = await res.json();
      setMuxUploadUrl(data.uploadUrl);
      setMuxUploadId(data.uploadId);
      muxUploadIdRef.current = data.uploadId ?? null;
      setError(null);
    } catch {
      setError(t("upload.errInitUpload"));
    }
  };

  const detectVideoDuration = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      const durationSeconds = Math.max(0, Math.round(probe.duration || 0));
      URL.revokeObjectURL(objectUrl);
      setDetectedDurationSeconds(durationSeconds);
      if (durationSeconds > 0) {
        setRuntimeMinutes(Math.floor(durationSeconds / 60));
        setRuntimeSeconds(durationSeconds % 60);
      }
      console.log("[UPLOAD_DEBUG] duration auto-detected", durationSeconds);
    };
    probe.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setDetectedDurationSeconds(0);
      console.log("[UPLOAD_DEBUG] duration auto-detected", 0);
    };
    probe.src = objectUrl;
  };

  const pollMuxAsset = async (uploadId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/mux/asset?uploadId=${uploadId}`);
        const data = await res.json();
        if (data.status === "ready") {
          setMuxPlaybackId(data.playbackId);
          setMuxAssetId(data.assetId);
          setMuxUploadStatus("ready");
          if (data.duration) {
            setMuxDuration(data.duration);
            setRuntimeMinutes(Math.floor(data.duration / 60));
            setRuntimeSeconds(Math.round(data.duration % 60));
          }
          clearInterval(interval);
        } else if (data.status === "waiting" || data.status === "preparing") {
          setMuxUploadStatus("processing");
        }
      } catch {
        clearInterval(interval);
      }
    }, 3000);
  };

  const toggleTool = (toolName: string) => {
    const c = normalizeToolName(toolName);
    setTools((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const addCustomTool = async (key: CatKey) => {
    const val = customInput[key]?.trim();
    if (!val) return;
    const existing = customTools[key] ?? [];
    if (existing.includes(val)) return;
    const next = { ...customTools, [key]: [...existing, val] };
    setCustomTools(next);
    setCustomInput((prev) => ({ ...prev, [key]: "" }));
    const allCustom = Object.values(next).flat();
    await updateAiToolPrefsAction({ customTools: allCustom });
  };

  const removeCustomTool = async (key: CatKey, tool: string) => {
    const next = { ...customTools, [key]: (customTools[key] ?? []).filter((t) => t !== tool) };
    setCustomTools(next);
    setTools((prev) => prev.filter((t) => t !== tool));
    const allCustom = Object.values(next).flat();
    await updateAiToolPrefsAction({ customTools: allCustom });
  };

  const hideDefaultTool = async (tool: string) => {
    const next = [...hiddenTools, tool];
    setHiddenTools(next);
    setTools((prev) => prev.filter((t) => t !== tool));
    await updateAiToolPrefsAction({ hiddenTools: next });
  };

  const restoreHiddenTools = async (key: CatKey) => {
    const catTools = AI_TOOL_CATEGORIES.find((c) => c.key === key)?.tools ?? [];
    const catToolSet = new Set<string>(catTools as readonly string[]);
    const next = hiddenTools.filter((h) => !catToolSet.has(h));
    setHiddenTools(next);
    await updateAiToolPrefsAction({ hiddenTools: next });
  };

  const addTag = (tag: string) => {
    const cleaned = tag.trim().replace(/^#+/, "");
    if (!cleaned || tags.includes(cleaned)) return;
    if (tags.length >= MAX_VIDEO_TAGS) return;
    setTags((prev) => [...prev, cleaned]);
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const saveHashtag = async (tag: string) => {
    if (mySavedHashtags.includes(tag)) return;
    const next = [...mySavedHashtags, tag];
    setMySavedHashtags(next);
    await updateSavedHashtagsAction(next);
  };

  const removeSavedHashtag = async (tag: string) => {
    const next = mySavedHashtags.filter((t) => t !== tag);
    setMySavedHashtags(next);
    await updateSavedHashtagsAction(next);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const openThumbPicker = () => thumbInputRef.current?.click();
  const openBackdropPicker = () => backdropInputRef.current?.click();

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

  const onBackdropChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError(t("upload.errImageFile"));
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      setError(t("upload.errImageSize"));
      return;
    }
    setBackdropPreview((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
    setBackdropFile(f);
    setError(null);
  };

  const onVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelectedVideoFile(f);
    detectVideoDuration(f);
    setError(null);
    try {
      const res = await fetch("/api/mux/upload", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMuxUploadUrl(data.uploadUrl);
      setMuxUploadId(data.uploadId);
      muxUploadIdRef.current = data.uploadId ?? null;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("upload.errInitUpload"));
      setSelectedVideoFile(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[UPLOAD_DEBUG] submit called", {
      step,
      purpose,
      competitionId,
      timestamp: Date.now(),
    });
    if (step !== 3) {
      return;
    }
    if (stepTransitioning) {
      console.log("[UPLOAD_DEBUG] submit blocked by transition", { timestamp: Date.now() });
      return;
    }
    setError(null);
    if (!title.trim()) {
      setError(t("upload.errTitle"));
      return;
    }
    if (!thumbnailFile) {
      setError(t("upload.errThumbnail"));
      return;
    }
    const finalDurationSeconds = detectedDurationSeconds || (muxDuration ? Math.round(muxDuration) : 0);
    if (finalDurationSeconds < 1) {
      setError(t("upload.errRuntime"));
      return;
    }
    if (purpose === "competition" && !competitionId) {
      setError(t("upload.errCompetition"));
      return;
    }
    if (showSubGenre && !subGenre) {
      setError(t("upload.errSubGenre"));
      return;
    }
    if (isSeriesMode) {
      if (!seriesName.trim()) {
        setError(t("upload.errSeriesName"));
        return;
      }
      if (!episodeNumber || episodeNumber < 1) {
        setError(t("upload.errEpisode"));
        return;
      }
    }

    if (tags.length > MAX_VIDEO_TAGS) {
      setError(t("upload.errTagMax").replace("{n}", String(MAX_VIDEO_TAGS)));
      return;
    }

    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setError(t("upload.errSupabase"));
      return;
    }

    setLoading(true);
    try {
      let finalThumbnailUrl = "";
      if (thumbnailFile) {
        const safe = thumbnailFile.name.replace(/[^\w.-]/g, "_");
        const path = `${userId}/${Date.now()}-${safe}`;
        const { error: upErr } = await supabase.storage.from("thumbnails").upload(path, thumbnailFile, { upsert: true });
        if (upErr) {
          setError(upErr.message);
          return;
        }
        const {
          data: { publicUrl },
        } = supabase.storage.from("thumbnails").getPublicUrl(path);
        finalThumbnailUrl = publicUrl;
      }

      let finalBackdropUrl: string | null = null;
      if (backdropFile) {
        const safe = backdropFile.name.replace(/[^\w.-]/g, "_");
        const path = `${userId}/backdrop-${Date.now()}-${safe}`;
        const { error: upErr } = await supabase.storage.from("thumbnails").upload(path, backdropFile, { upsert: true });
        if (upErr) {
          setError(upErr.message);
          return;
        }
        const {
          data: { publicUrl },
        } = supabase.storage.from("thumbnails").getPublicUrl(path);
        finalBackdropUrl = publicUrl;
      }

      const aiTools = tools;

      console.log("[UPLOAD_DEBUG] action calling", {
        step,
        trigger: "manual_submit",
        timestamp: Date.now(),
      });
      const res = await createVideoAction({
        title: title.trim(),
        thumbnailUrl: finalThumbnailUrl,
        backdropUrl: finalBackdropUrl,
        genre: mainGenre,
        additionalGenres,
        subGenre: showSubGenre ? subGenre : null,
        purpose,
        aiTools,
        tags,
        seriesName: isSeriesMode ? seriesName.trim() : null,
        episodeNumber: isSeriesMode ? episodeNumber : null,
        description,
        runtimeMinutes: finalDurationSeconds / 60,
        visibility,
        submittedCompetitionId: purpose === "competition" ? competitionId : null,
        muxPlaybackId: muxPlaybackId,
        muxAssetId: muxAssetId,
        muxUploadId: muxUploadId,
      });

      if (!res.ok) {
        setError(res.message);
        return;
      }

      submitSucceededRef.current = true;
      router.push(`/watch/${res.videoId}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const tryCleanupOrphanMuxAsset = () => {
      if (submitSucceededRef.current || muxCleanupDoneRef.current) return;
      const assetId = muxAssetIdCleanupRef.current;
      if (!assetId) return;
      muxCleanupDoneRef.current = true;
      void fetch("/api/mux/asset/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId }),
        keepalive: true,
      });
    };

    const onBeforeUnload = () => {
      tryCleanupOrphanMuxAsset();
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      tryCleanupOrphanMuxAsset();
    };
  }, []);

  return (
    <div className="min-h-screen px-2 py-6">
      <input
        ref={thumbInputRef}
        id="uv-thumb-input"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onThumbChange}
      />
      <input
        ref={backdropInputRef}
        id="uv-backdrop-input"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onBackdropChange}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/*"
        className="sr-only"
        onChange={(e) => void onVideoChange(e)}
      />

      <form
        onSubmit={(e) => void submit(e)}
        onKeyDown={(e) => {
          if (
            e.key === "Enter" &&
            (e.target as HTMLElement).tagName === "INPUT" &&
            step !== 3
          ) {
            e.preventDefault();
          }
        }}
      >
        {isDraggingOver && (
          <div
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 pointer-events-none"
            style={{ background: "rgba(10,10,10,0.85)", backdropFilter: "blur(8px)" }}
          >
            <div
              className="rounded-2xl border-2 border-dashed border-[#7F77DD]/60 p-16 text-center"
              style={{ background: "var(--tint-accent-15)" }}
            >
              <svg
                className="mx-auto mb-4 h-16 w-16 text-[#7F77DD]/60"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M12 16v-8m0 0-3 3m3-3 3 3M4 17h16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-xl font-bold text-white">{t("upload.dropHere")}</p>
              <p className="mt-2 text-sm text-white/35">{t("upload.dropHint")}</p>
            </div>
          </div>
        )}
        {/* 큰 외부 박스 */}
        <div
          className="rounded-2xl border border-white/[0.08] p-4"
          style={{
            background: "linear-gradient(135deg, rgba(20,17,50,0.98) 0%, rgba(10,8,28,0.99) 100%)",
            boxShadow: "0 0 0 1px rgba(127,119,221,0.08), inset 0 1px 0 rgba(127,119,221,0.05)",
            width: "100%",
            maxWidth: "100%",
          }}
        >
          {/* 내부 헤더 */}
          <div className="mb-4 flex items-end justify-between border-b border-white/[0.06] pb-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]/60">{t("upload.heroEyebrow")}</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-white">{t("upload.heroTitle")}</h1>
            </div>
            <p className="text-sm text-white/25">{t("upload.heroSubtitle")}</p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-6 flex items-center gap-3">
            {[
              { num: 1, label: "Source & Info" },
              { num: 2, label: "AI Tools & Tags" },
              { num: 3, label: "Settings" },
            ].map((s, idx, arr) => {
              const active = step === s.num;
              const done = step > s.num;
              return (
                <div key={s.num} className="flex flex-1 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => done && setStep(s.num as 1 | 2 | 3)}
                    disabled={!done && !active}
                    className="flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300"
                    style={{
                      background: active
                        ? "linear-gradient(135deg, rgba(127,119,221,0.18) 0%, rgba(83,74,183,0.08) 100%)"
                        : done
                          ? "rgba(127,119,221,0.06)"
                          : "rgba(255,255,255,0.02)",
                      border: active
                        ? "1px solid rgba(127,119,221,0.45)"
                        : done
                          ? "1px solid rgba(127,119,221,0.2)"
                          : "1px solid rgba(255,255,255,0.06)",
                      cursor: done ? "pointer" : active ? "default" : "not-allowed",
                      boxShadow: active ? "0 0 16px rgba(127,119,221,0.18)" : "none",
                    }}
                  >
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black tabular-nums"
                      style={{
                        background: active
                          ? "linear-gradient(135deg, #7F77DD 0%, #534AB7 100%)"
                          : done
                            ? "rgba(127,119,221,0.3)"
                            : "rgba(255,255,255,0.05)",
                        color: active ? "#ffffff" : done ? "#AFA9EC" : "rgba(255,255,255,0.3)",
                        boxShadow: active ? "0 0 12px rgba(127,119,221,0.5)" : "none",
                      }}
                    >
                      {done ? "✓" : s.num}
                    </div>
                    <div className="min-w-0 text-left">
                      <p
                        className="text-[9px] font-black uppercase tracking-[0.2em]"
                        style={{
                          color: active ? "#AFA9EC" : done ? "rgba(175,169,236,0.7)" : "rgba(255,255,255,0.3)",
                        }}
                      >
                        Step {String(s.num).padStart(2, "0")}
                      </p>
                      <p
                        className="truncate text-[12px] font-bold"
                        style={{
                          color: active ? "white" : done ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)",
                        }}
                      >
                        {s.label}
                      </p>
                    </div>
                  </button>
                  {idx < arr.length - 1 && (
                    <div
                      className="hidden h-px w-6 sm:block"
                      style={{
                        background: done ? "rgba(127,119,221,0.4)" : "rgba(255,255,255,0.08)",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {isCompetitionLocked && (
            <div
              className="mb-4 flex items-center gap-3 rounded-lg border p-4"
              style={{
                borderColor: "rgba(127,119,221,0.3)",
                background: "rgba(127,119,221,0.06)",
              }}
            >
              <span className="text-sm text-[#7F77DD]">✦</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{t("upload.competitionModeTitle")}</p>
                <p className="mt-0.5 text-xs text-white/55">
                  {t("upload.competitionModeHint")}
                </p>
              </div>
            </div>
          )}

          {/* Step 1 — Source, film title/description, thumbnail */}
          <div style={{ display: step === 1 ? "grid" : "none" }} className="grid-cols-1 gap-3 lg:grid-cols-[1fr_1.2fr_1fr]">
          {/* ── 왼쪽: 비디오 입력 패널 ── */}
          <div className="space-y-3">
            <div
              className="rounded-2xl border border-white/[0.08] p-3"
              style={{ background: "rgba(83,74,183,0.08)", borderColor: "var(--tint-purple-12)" }}
            >
              <h2
                className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC] border-b border-[#7F77DD]/20 pb-2"
                style={{ letterSpacing: "0.18em" }}
              >
                {t("upload.sectionVideoSource")}
              </h2>

              <div className="space-y-3">
                <div className="space-y-3">
                  {!muxUploadUrl ? (
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="flex h-[140px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#7F77DD]/25 bg-white/[0.02] transition hover:border-[#7F77DD]/50 hover:bg-white/[0.04]"
                    >
                      <svg className="h-8 w-8 text-[#7F77DD]/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 16v-8m0 0-3 3m3-3 3 3M4 17h16" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="text-center">
                        <p className="text-sm font-medium text-white/35">{t("upload.clickUploadVideo")}</p>
                        <p className="text-[11px] text-white/20">{t("upload.videoFormatsHint")}</p>
                      </div>
                    </button>
                  ) : selectedVideoFile ? (
                    <SelectedVideoUploader
                      file={selectedVideoFile}
                      uploadUrl={muxUploadUrl}
                      onUploadStart={() => setMuxUploadStatus("uploading")}
                      onProgress={() => {}}
                      onSuccess={() => {
                        setMuxUploadStatus("processing");
                        const id = muxUploadIdRef.current;
                        if (id) void pollMuxAsset(id);
                      }}
                      onReset={() => {
                        setSelectedVideoFile(null);
                        setMuxUploadUrl(null);
                        setMuxUploadId(null);
                        setMuxUploadStatus("idle");
                      }}
                      status={muxUploadStatus}
                      duration={muxDuration}
                    />
                  ) : null}
                </div>
              </div>

            </div>
          </div>

          {/* ── 가운데: Film Details ── */}
          <div className="space-y-4">
            <div
              className="rounded-2xl border border-white/[0.08] p-3"
              style={{ background: "rgba(255,255,255,0.025)", borderColor: "rgba(255,255,255,0.07)" }}
            >
              <h2
                className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC] border-b border-[#7F77DD]/20 pb-2"
                style={{ letterSpacing: "0.18em" }}
              >
                {t("upload.sectionFilmDetails")}
              </h2>
              <div className="space-y-3">
                <div>
                  <label className={lbl} htmlFor="uv-title">
                    {t("upload.labelTitle")}
                  </label>
                  <input
                    id="uv-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className={inp}
                    placeholder={t("upload.placeholderFilmTitle")}
                  />
                </div>
                <div>
                  <label className={lbl} htmlFor="uv-desc">
                    {t("upload.labelDescription")}
                  </label>
                  <textarea
                    id="uv-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className={`${inp} resize-none`}
                    placeholder={t("upload.placeholderFilmDescription")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── 오른쪽 Step 1: 썸네일만 ── */}
          <div className="space-y-3">
            {/* 썸네일 */}
            <div
              className="rounded-2xl border border-white/[0.08] p-3"
              style={{ background: "rgba(255,255,255,0.025)" }}
            >
              <div className="mb-3 border-b border-[#7F77DD]/15 pb-2">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]">
                  {t("upload.sectionPosterThumb")}
                </h2>
                <p className="mt-1.5 text-[10px] text-white/30 leading-relaxed">
                  ✦ Recommended: <span className="text-white/50 font-semibold">3:4 portrait</span> (1080×1440) for card display<br />
                  Pro tip: include your film title in the thumbnail for best visibility on feeds.
                </p>
              </div>
              {!thumbnailPreview ? (
                <button
                  type="button"
                  onClick={openThumbPicker}
                  className="flex min-h-[160px] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#7F77DD]/20 bg-white/[0.02] transition hover:border-[#7F77DD]/40 hover:bg-white/[0.04]"
                >
                  <svg
                    className="h-8 w-8 text-[#7F77DD]/35"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M12 16v-8m0 0-3 3m3-3 3 3M4 17h16" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white/35">{t("upload.uploadThumbnailPrompt")}</p>
                    <p className="text-[11px] text-white/20">{t("upload.thumbnailFormats")}</p>
                  </div>
                </button>
              ) : (
                <div className="relative mx-auto overflow-hidden rounded-xl border border-white/[0.08]" style={{ maxWidth: "240px" }}>
                  <div className="aspect-[3/4] w-full bg-black">
                    <img src={thumbnailPreview} alt="" className="h-full w-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={openThumbPicker}
                    className="absolute right-2 top-2 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/90"
                  >
                    {t("upload.change")}
                  </button>
                </div>
              )}
            </div>

            {/* Hero Backdrop (Optional) */}
            <div
              className="rounded-2xl border border-white/[0.08] p-3"
              style={{ background: "rgba(255,255,255,0.025)" }}
            >
              <div className="mb-3 border-b border-[#7F77DD]/15 pb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]">
                    {t("upload.heroBackdropHeading")}
                  </h2>
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.15em]"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.35)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {t("upload.optionalMark")}
                  </span>
                </div>
                <p className="mt-1.5 text-[10px] text-white/30 leading-relaxed">
                  {t("upload.backdropHintIntro")}
                  <span className="font-semibold text-white/50">{t("upload.backdropNoTextRecommended")}</span>
                  <br />
                  {t("upload.backdropHeroUsageHint")}
                </p>
              </div>
              {!backdropPreview ? (
                <button
                  type="button"
                  onClick={openBackdropPicker}
                  className="flex min-h-[120px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#7F77DD]/15 bg-white/[0.015] transition hover:border-[#7F77DD]/35 hover:bg-white/[0.03]"
                >
                  <svg
                    className="h-7 w-7 text-[#7F77DD]/30"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" />
                    <circle cx="9" cy="9" r="1.5" />
                  </svg>
                  <p className="text-[11px] font-medium text-white/35">{t("upload.uploadCinematicBackdrop")}</p>
                </button>
              ) : (
                <div className="relative overflow-hidden rounded-xl border border-white/[0.08]">
                  <div className="w-full bg-black" style={{ aspectRatio: "16/5.5" }}>
                    <img src={backdropPreview} alt="" className="h-full w-full object-cover" />
                  </div>
                  <button
                    type="button"
                    onClick={openBackdropPicker}
                    className="absolute right-2 top-2 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/90"
                  >
                    {t("upload.change")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (backdropPreview?.startsWith("blob:")) URL.revokeObjectURL(backdropPreview);
                      setBackdropPreview(null);
                      setBackdropFile(null);
                    }}
                    className="absolute right-2 top-12 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-red-300 backdrop-blur-sm transition hover:bg-black/90"
                  >
                    {t("upload.backdropRemove")}
                  </button>
                </div>
              )}
            </div>

            {/* Preview Toggle */}
            {(thumbnailPreview || backdropPreview) && (
              <div
                className="rounded-2xl border border-white/[0.08] overflow-hidden"
                style={{ background: "rgba(255,255,255,0.025)" }}
              >
                <button
                  type="button"
                  onClick={() => setPreviewOpen((v) => !v)}
                  className="flex w-full items-center justify-between px-3 py-2.5 transition hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2">
                    <svg className="h-3.5 w-3.5 text-[#7F77DD]/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC]">
                      Live Preview
                    </span>
                  </div>
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5 text-white/35 transition-transform duration-300"
                    style={{ transform: previewOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {previewOpen && (
                  <div className="space-y-3 border-t border-white/[0.06] p-3">
                    {/* 카드 미리보기 (포스터) */}
                    <div>
                      <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-white/35">
                        ✦ As card on feed
                      </p>
                      <div
                        className="relative mx-auto overflow-hidden rounded-xl border border-white/[0.08]"
                        style={{ maxWidth: "180px", aspectRatio: "3/4" }}
                      >
                        {thumbnailPreview ? (
                          <img src={thumbnailPreview} alt="" className="absolute inset-0 h-full w-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1547] to-[#1a1a1a]" />
                        )}
                        <div
                          className="absolute inset-0"
                          style={{
                            background: "linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0.5) 40%, transparent 75%)",
                          }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-2.5">
                          <h3 className="line-clamp-2 text-[11px] font-black text-white" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>
                            {title || "Your film title"}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* 히어로 미리보기 (백드롭) */}
                    <div>
                      <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-white/35">
                        ✦ As homepage hero
                      </p>
                      <div
                        className="relative w-full overflow-hidden rounded-xl border border-white/[0.08]"
                        style={{ aspectRatio: "16/5.5" }}
                      >
                        {(backdropPreview || thumbnailPreview) ? (
                          <img
                            src={backdropPreview || thumbnailPreview || ""}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                            style={{ filter: "brightness(1.15)" }}
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1547] to-[#1a1a1a]" />
                        )}
                        {/* 페이드 — 백드롭 없으면 강하게 */}
                        <div
                          className="absolute inset-0"
                          style={{
                            background: backdropPreview
                              ? "linear-gradient(to right, rgba(8,6,20,0.95) 0%, rgba(8,6,20,0.5) 50%, rgba(8,6,20,0) 85%)"
                              : "linear-gradient(to right, rgba(8,6,20,0.98) 0%, rgba(8,6,20,0.95) 30%, rgba(8,6,20,0.4) 75%, rgba(8,6,20,0.1) 90%)",
                          }}
                        />
                        <div className="absolute inset-0 flex items-center pl-4">
                          <h3
                            className="line-clamp-1 text-[14px] font-black text-white"
                            style={{ letterSpacing: "-0.02em", textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
                          >
                            {title || "Your film title"}
                          </h3>
                        </div>
                      </div>
                      {!backdropPreview && (
                        <p className="mt-1 text-[9px] text-white/30">
                          ⚠ Without backdrop, thumbnail is used with stronger fade.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          </div>

          <div style={{ display: step === 2 ? "grid" : "none" }} className="grid-cols-1 gap-3 lg:grid-cols-[1fr_1.2fr]">
            <div className="space-y-4">
              <div
                className="rounded-2xl border border-white/[0.08] p-3"
                style={{ background: "rgba(255,255,255,0.025)", borderColor: "rgba(255,255,255,0.07)" }}
              >
                <div className="mb-3 flex items-center justify-between border-b border-[#7F77DD]/20 pb-2">
                  <h2
                    className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC]"
                    style={{ letterSpacing: "0.18em" }}
                  >
                    {t("upload.sectionTags")}
                  </h2>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-black tabular-nums transition-all"
                    style={{
                      background: tags.length > 0 ? "rgba(127,119,221,0.2)" : "rgba(255,255,255,0.04)",
                      color: tags.length > 0 ? "#AFA9EC" : "rgba(255,255,255,0.3)",
                      border: tags.length > 0 ? "1px solid rgba(127,119,221,0.35)" : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {tags.length}/{MAX_VIDEO_TAGS}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="space-y-3">
                    {/* 메인 입력 */}
                    <div>
                      <label className={lbl} htmlFor="uv-tags">
                        {t("upload.tagsWithMax").replace("{max}", String(MAX_VIDEO_TAGS))}
                      </label>

                      <div
                        className="mt-1.5 flex min-h-[58px] flex-wrap items-center gap-1.5 rounded-xl px-3.5 py-2.5 transition-all duration-300 cursor-text focus-within:scale-[1.005]"
                        onClick={() => document.getElementById("uv-tags")?.focus()}
                        style={{
                          background: "linear-gradient(135deg, rgba(20,17,50,0.6) 0%, rgba(13,11,32,0.7) 100%)",
                          border: tags.length > 0
                            ? "1px solid rgba(127,119,221,0.4)"
                            : "1px solid rgba(255,255,255,0.08)",
                          boxShadow: tags.length > 0
                            ? "0 0 20px var(--tint-purple-12), inset 0 1px 0 rgba(127,119,221,0.08)"
                            : "inset 0 1px 0 rgba(255,255,255,0.03)",
                        }}
                      >
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold transition-all"
                            style={{
                              background: "linear-gradient(135deg, rgba(127,119,221,0.4) 0%, rgba(83,74,183,0.25) 100%)",
                              border: "1px solid rgba(127,119,221,0.55)",
                              color: "#ffffff",
                              boxShadow: "0 0 8px rgba(127,119,221,0.25)",
                            }}
                          >
                            #{tag}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeTag(tag);
                              }}
                              className="ml-0.5 text-white/55 transition hover:text-white"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <input
                          id="uv-tags"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleTagKeyDown}
                          placeholder={tags.length === 0 ? t("upload.placeholderTags") : ""}
                          className="min-w-[140px] flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/25"
                          disabled={tags.length >= MAX_VIDEO_TAGS}
                        />
                      </div>
                      <p className="mt-1.5 text-[10px] text-white/25">{t("upload.tagsInputHint")}</p>
                    </div>

                    {/* 추천 + 즐겨찾기 통합 박스 */}
                    {(recentTags.length > 0 || true) && (
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3 space-y-3">
                        {recentTags.length > 0 && (
                          <div>
                            <div className="mb-2 flex items-center gap-2">
                              <svg className="h-3 w-3 text-white/35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="9" strokeLinecap="round" />
                                <path d="M12 8v4l3 2" strokeLinecap="round" />
                              </svg>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">
                                {t("upload.recentVideoTags")}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {recentTags
                                .filter((rt) => !tags.includes(rt))
                                .map((tag) => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => addTag(tag)}
                                    className="rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-[11px] font-bold text-white/45 transition hover:border-[#7F77DD]/40 hover:bg-[#534AB7]/15 hover:text-[#AFA9EC]"
                                  >
                                    + #{tag}
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}

                        <div className={recentTags.length > 0 ? "border-t border-white/[0.05] pt-3" : ""}>
                          <div className="mb-2 flex items-center gap-2">
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="#FFD478">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">
                              {t("upload.favoriteTags")}
                            </span>
                          </div>
                          {mySavedHashtags.length === 0 ? (
                            <p className="text-[10px] text-white/25">{t("upload.favoriteTagsHint")}</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {mySavedHashtags.map((tag) => (
                                <div key={tag} className="group relative flex items-center">
                                  <button
                                    type="button"
                                    onClick={() => addTag(tag)}
                                    className="flex items-center gap-1 rounded-full px-2.5 py-1 pr-6 text-[11px] font-bold transition"
                                    style={{
                                      border: "1px solid rgba(255,212,120,0.25)",
                                      background: "rgba(255,212,120,0.06)",
                                      color: "rgba(255,212,120,0.85)",
                                    }}
                                    onMouseEnter={(e) => {
                                      const el = e.currentTarget as HTMLElement;
                                      el.style.borderColor = "rgba(255,212,120,0.5)";
                                      el.style.background = "rgba(255,212,120,0.12)";
                                      el.style.color = "#FFD478";
                                    }}
                                    onMouseLeave={(e) => {
                                      const el = e.currentTarget as HTMLElement;
                                      el.style.borderColor = "rgba(255,212,120,0.25)";
                                      el.style.background = "rgba(255,212,120,0.06)";
                                      el.style.color = "rgba(255,212,120,0.85)";
                                    }}
                                  >
                                    ★ #{tag}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void removeSavedHashtag(tag)}
                                    className="absolute right-1.5 hidden text-[10px] text-white/30 transition group-hover:block hover:text-red-400"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 현재 태그를 즐겨찾기로 저장 */}
                    {tags.length > 0 && tags.filter((tg) => !mySavedHashtags.includes(tg)).length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/25">
                          Save to favorites:
                        </span>
                        {tags
                          .filter((tg) => !mySavedHashtags.includes(tg))
                          .map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => void saveHashtag(tag)}
                              className="rounded-full border border-white/[0.06] px-2 py-0.5 text-[10px] text-white/35 transition hover:border-[#FFD478]/40 hover:text-[#FFD478]"
                            >
                              ☆ #{tag}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div
                className="rounded-2xl border border-white/[0.08] p-3"
                style={{ background: "rgba(83,74,183,0.06)", borderColor: "rgba(127,119,221,0.1)" }}
              >
                <h2
                  className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC] border-b border-[#7F77DD]/20 pb-2"
                  style={{ letterSpacing: "0.18em" }}
                >
                  {t("upload.sectionAiToolsUsed")}
                </h2>
                <div className="space-y-2.5">
                  {AI_TOOL_CATEGORIES.map((cat) => {
                    const visibleDefaults = cat.tools.filter((toolName) => !hiddenTools.includes(toolName));
                    const hiddenCount = cat.tools.filter((toolName) => hiddenTools.includes(toolName)).length;
                    const catCustomTools = customTools[cat.key] ?? [];
                    const allCatTools = [...visibleDefaults, ...catCustomTools];
                    const selectedInCat = allCatTools.filter((tt) =>
                      tools.some((sel) => normalizeToolName(sel) === normalizeToolName(tt)),
                    ).length;
                    const catIcon =
                      cat.key === "image" ? "🎨"
                      : cat.key === "video" ? "🎬"
                      : cat.key === "music" ? "🎵"
                      : "⚡";

                    return (
                      <div
                        key={cat.key}
                        className="rounded-xl p-3 transition-all duration-300"
                        style={{
                          background: selectedInCat > 0 ? "rgba(127,119,221,0.07)" : "rgba(127,119,221,0.03)",
                          border: selectedInCat > 0 ? "1px solid rgba(127,119,221,0.22)" : "1px solid rgba(127,119,221,0.1)",
                        }}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px]">{catIcon}</span>
                            <p className="text-[12px] font-bold tracking-tight text-white/85">
                              {t(`upload.aiCategory.${cat.key}`)}
                            </p>
                            {selectedInCat > 0 && (
                              <span
                                className="rounded-full px-2 py-0.5 text-[9px] font-black tabular-nums"
                                style={{
                                  background: "rgba(127,119,221,0.3)",
                                  color: "#D5D1FF",
                                  border: "1px solid rgba(127,119,221,0.4)",
                                }}
                              >
                                {selectedInCat}
                              </span>
                            )}
                          </div>
                          {hiddenCount > 0 && (
                            <button
                              type="button"
                              onClick={() => void restoreHiddenTools(cat.key)}
                              className="text-[10px] text-[#7F77DD]/50 transition hover:text-[#7F77DD]"
                            >
                              {t("upload.restoreHiddenTools").replace("{n}", String(hiddenCount))}
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {visibleDefaults.map((opt) => {
                            const canon = normalizeToolName(opt);
                            const on = tools.some((sel) => normalizeToolName(sel) === canon);
                            return (
                              <div key={opt} className="group relative">
                                <button
                                  type="button"
                                  onClick={() => toggleTool(canon)}
                                  className="rounded-full border px-3 py-1.5 pr-6 text-[11px] font-bold transition-all duration-200"
                                  style={{
                                    borderColor: on ? "rgba(127,119,221,0.7)" : "rgba(255,255,255,0.08)",
                                    background: on
                                      ? "linear-gradient(135deg, rgba(127,119,221,0.4) 0%, rgba(83,74,183,0.25) 100%)"
                                      : "rgba(255,255,255,0.02)",
                                    color: on ? "#ffffff" : "rgba(255,255,255,0.4)",
                                    boxShadow: on
                                      ? "0 0 12px rgba(127,119,221,0.3), inset 0 1px 0 rgba(175,169,236,0.2)"
                                      : "none",
                                  }}
                                >
                                  {opt}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void hideDefaultTool(opt)}
                                  className="absolute right-1.5 top-1/2 hidden h-3.5 w-3.5 -translate-y-1/2 items-center justify-center rounded-full text-white/30 transition group-hover:flex hover:text-red-400"
                                  title={t("upload.hideTool")}
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}

                          {catCustomTools.map((tool) => {
                            const on = tools.includes(tool);
                            return (
                              <div key={tool} className="group relative">
                                <button
                                  type="button"
                                  onClick={() => toggleTool(tool)}
                                  className="rounded-full border px-3 py-1.5 pr-6 text-[11px] font-bold transition-all duration-200"
                                  style={{
                                    borderColor: on ? "rgba(127,119,221,0.7)" : "rgba(127,119,221,0.25)",
                                    background: on
                                      ? "linear-gradient(135deg, rgba(127,119,221,0.4) 0%, rgba(83,74,183,0.25) 100%)"
                                      : "rgba(83,74,183,0.06)",
                                    color: on ? "#ffffff" : "rgba(175,169,236,0.55)",
                                    boxShadow: on
                                      ? "0 0 12px rgba(127,119,221,0.3), inset 0 1px 0 rgba(175,169,236,0.2)"
                                      : "none",
                                  }}
                                >
                                  {tool}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void removeCustomTool(cat.key, tool)}
                                  className="absolute right-1.5 top-1/2 hidden h-3.5 w-3.5 -translate-y-1/2 items-center justify-center rounded-full text-white/30 transition group-hover:flex hover:text-red-400"
                                  title={t("upload.deleteTool")}
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-2.5 flex gap-1.5 border-t border-white/[0.05] pt-2.5">
                          <input
                            type="text"
                            value={customInput[cat.key] ?? ""}
                            onChange={(e) => setCustomInput((prev) => ({ ...prev, [cat.key]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                void addCustomTool(cat.key);
                              }
                            }}
                            placeholder={t("upload.addCustomPlaceholder")}
                            className="flex-1 rounded-lg border border-white/[0.06] bg-transparent px-2.5 py-1 text-[11px] text-white placeholder:text-white/20 outline-none focus:border-[#7F77DD]/40"
                          />
                          <button
                            type="button"
                            onClick={() => void addCustomTool(cat.key)}
                            className="rounded-lg border border-[#7F77DD]/25 bg-[#534AB7]/15 px-3 py-1 text-[11px] font-bold text-[#AFA9EC] transition hover:bg-[#534AB7]/30"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 — Settings */}
          <div style={{ display: step === 3 ? "block" : "none" }}>
            <div
              className="rounded-2xl border border-white/[0.08] p-3"
              style={{ background: "rgba(83,74,183,0.08)", borderColor: "var(--tint-purple-12)" }}
            >
              <h2
                className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC] border-b border-[#7F77DD]/20 pb-2"
                style={{ letterSpacing: "0.18em" }}
              >
                {t("upload.sectionSettingsPanel")}
              </h2>
              <div className="space-y-3">
                {/* Genre selection — Main → Sub → Additional */}
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 space-y-4">
                  {/* 1) Main Genre */}
                  <div>
                    <label className={lbl}>{t("upload.labelGenre", "Main Genre")}</label>
                    <p className="mb-2.5 text-[10px] text-white/35">{t("upload.primaryGenreHint", "The first selected genre is used as the main genre.")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {FEED_GENRE_KEYS.map((k) => {
                        const selected = mainGenre === k;
                        return (
                          <button
                            key={k}
                            type="button"
                            onClick={() => setMainGenre(k)}
                            className="rounded-full border px-3 py-1.5 text-[12px] font-bold transition-all duration-200"
                            style={{
                              borderColor: selected ? "rgba(127,119,221,0.7)" : "rgba(255,255,255,0.08)",
                              background: selected
                                ? "linear-gradient(135deg, rgba(127,119,221,0.4) 0%, rgba(83,74,183,0.25) 100%)"
                                : "rgba(255,255,255,0.02)",
                              color: selected ? "#ffffff" : "rgba(255,255,255,0.4)",
                              boxShadow: selected
                                ? "0 0 12px rgba(127,119,221,0.3), inset 0 1px 0 rgba(175,169,236,0.2)"
                                : "none",
                            }}
                          >
                            {mainGenreLabel(k, locale)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2) Sub Genre (조건부) */}
                  {showSubGenre && (
                    <div className="border-t border-white/[0.05] pt-3.5">
                      <label className={lbl}>{t("upload.labelSubGenreShort", "Sub Genre")}</label>
                      <p className="mb-2.5 text-[10px] text-white/35">{t("upload.subGenreHint", "Choose one detailed sub genre under the main genre.")}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {subGenreOptions.map((opt) => {
                          const selected = subGenre === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setSubGenre(opt.value)}
                              className="rounded-full border px-3 py-1.5 text-[12px] font-bold transition-all duration-200"
                              style={{
                                borderColor: selected ? "rgba(127,119,221,0.7)" : "rgba(255,255,255,0.08)",
                                background: selected
                                  ? "linear-gradient(135deg, rgba(127,119,221,0.4) 0%, rgba(83,74,183,0.25) 100%)"
                                  : "rgba(255,255,255,0.02)",
                                color: selected ? "#ffffff" : "rgba(255,255,255,0.4)",
                                boxShadow: selected
                                  ? "0 0 12px rgba(127,119,221,0.3), inset 0 1px 0 rgba(175,169,236,0.2)"
                                  : "none",
                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3) Additional Genres (보조) */}
                  <div className="border-t border-white/[0.05] pt-3.5">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-white/35">
                        {t("upload.additionalGenres", "Detail Genres")}
                      </span>
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.15em]"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          color: "rgba(255,255,255,0.35)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        Optional
                      </span>
                    </div>
                    <p className="mb-2.5 text-[10px] text-white/35">{t("upload.additionalGenresHint", "You can add multiple extra genres.")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {additionalGenreOptions.map((k) => {
                        const selected = additionalGenres.includes(k);
                        return (
                          <button
                            key={k}
                            type="button"
                            onClick={() => {
                              setAdditionalGenres((prev) =>
                                prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
                              );
                            }}
                            className="rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all duration-200"
                            style={{
                              borderColor: selected ? "rgba(127,119,221,0.5)" : "rgba(255,255,255,0.06)",
                              background: selected ? "rgba(83,74,183,0.22)" : "rgba(255,255,255,0.02)",
                              color: selected ? "#AFA9EC" : "rgba(255,255,255,0.35)",
                            }}
                          >
                            {mainGenreLabel(k, locale)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 런타임 (자동 인식, 읽기 전용) */}
                {(detectedDurationSeconds > 0 || (muxDuration && muxDuration > 0)) && (
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm">
                    <span className="text-white/35">{t("upload.runtimeVideoLength")}</span>{" "}
                    <span className="font-mono font-semibold text-white">
                      {(() => {
                        const seconds = detectedDurationSeconds || Math.round(muxDuration ?? 0);
                        const m = Math.floor(seconds / 60);
                        const s = seconds % 60;
                        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
                      })()}
                    </span>
                  </div>
                )}

                <div>
                  <p className={lbl}>{t("upload.seriesToggleLabel")}</p>
                  <button
                    type="button"
                    disabled={!!competitionIdFromUrl}
                    onClick={() => setIsSeriesMode(!isSeriesMode)}
                    className="relative flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium transition"
                    style={{
                      borderColor: isSeriesMode ? "rgba(127,119,221,0.5)" : "rgba(255,255,255,0.06)",
                      background: isSeriesMode ? "rgba(83,74,183,0.35)" : "rgba(255,255,255,0.02)",
                      color: isSeriesMode ? "#AFA9EC" : "rgba(255,255,255,0.55)",
                      cursor: competitionIdFromUrl ? "not-allowed" : "pointer",
                      opacity: competitionIdFromUrl ? 0.5 : 1,
                    }}
                  >
                    <span>{t("upload.partOfSeries")}</span>
                    <span
                      className="relative h-4 w-8 rounded-full transition-colors"
                      style={{ background: isSeriesMode ? "#534AB7" : "rgba(255,255,255,0.1)" }}
                    >
                      <span
                        className="absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-[left]"
                        style={{ left: isSeriesMode ? "18px" : "2px" }}
                      />
                    </span>
                  </button>
                </div>

                {isSeriesMode && (
                  <div className="space-y-2">
                    {existingSeries.length > 0 && !isNewSeries ? (
                      <>
                        <div>
                          <label className={lbl}>{t("upload.selectSeries")}</label>
                          <CustomSelect
                            value={seriesName}
                            onChange={(v) => {
                              const selected = existingSeries.find((s) => s.name === v);
                              if (selected) {
                                setSeriesName(selected.name);
                                setEpisodeNumber(selected.nextEpisode);
                              }
                            }}
                            options={existingSeries.map((s) => ({
                              value: s.name,
                              label: t("upload.seriesNextEp")
                                .replace("{name}", s.name)
                                .replace("{n}", String(s.nextEpisode)),
                            }))}
                            placeholder={t("upload.selectSeriesPlaceholder")}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewSeries(true);
                            setSeriesName("");
                            setEpisodeNumber(1);
                          }}
                          className="text-[11px] text-[#7F77DD] hover:text-[#AFA9EC] transition"
                        >
                          {t("upload.createNewSeries")}
                        </button>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className={lbl}>{t("upload.seriesNameLabel")}</label>
                          <input
                            value={seriesName}
                            onChange={(e) => setSeriesName(e.target.value)}
                            className={inp}
                            placeholder={t("upload.seriesNamePlaceholder")}
                          />
                        </div>
                        {existingSeries.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsNewSeries(false);
                              setSeriesName("");
                            }}
                            className="text-[11px] text-[#7F77DD] hover:text-[#AFA9EC] transition"
                          >
                            {t("upload.selectExistingSeries")}
                          </button>
                        )}
                      </>
                    )}
                    <div>
                      <label className={lbl}>{t("upload.episodeNumberLabel")}</label>
                      <NumberInput value={episodeNumber} onChange={setEpisodeNumber} min={1} />
                    </div>
                  </div>
                )}

                {/* 공개/비공개 */}
                <div>
                  <p className={lbl}>{t("upload.visibilityLabel")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(["public", "private"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        disabled={v === "private" && !!competitionIdFromUrl}
                        onClick={() => setVisibility(v)}
                        className="relative flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium transition"
                        style={{
                          borderColor: visibility === v ? "rgba(127,119,221,0.5)" : "rgba(255,255,255,0.06)",
                          background: visibility === v ? "rgba(83,74,183,0.35)" : "rgba(255,255,255,0.02)",
                          color: visibility === v ? "#AFA9EC" : "rgba(255,255,255,0.55)",
                          cursor: v === "private" && !!competitionIdFromUrl ? "not-allowed" : "pointer",
                          opacity: v === "private" && !!competitionIdFromUrl ? 0.4 : 1,
                        }}
                      >
                        <span>{v === "public" ? "🌐" : "🔒"}</span>
                        <span>{v === "public" ? t("upload.visPublic") : t("upload.visPrivate")}</span>
                        {visibility === v && (
                          <span className="absolute right-2.5 h-1.5 w-1.5 rounded-full bg-[#7F77DD]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 목적 */}
                <div>
                  <p className={lbl}>{t("upload.labelPurpose")}</p>
                  {isCompetitionLocked ? (
                    <div className="flex items-center gap-3 rounded-lg border border-[#7F77DD]/30 bg-[#7F77DD]/[0.06] p-4">
                      <span className="text-sm text-[#7F77DD]">✦</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{t("upload.competitionModeTitle")}</p>
                        <p className="mt-0.5 text-xs text-white/55">
                          {t("upload.competitionModeHint")}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {(["personal", "competition"] as const).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setPurpose(v)}
                          className="relative flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium transition"
                          style={{
                            borderColor: purpose === v ? "rgba(127,119,221,0.5)" : "rgba(255,255,255,0.06)",
                            background: purpose === v ? "rgba(83,74,183,0.35)" : "rgba(255,255,255,0.02)",
                            color: purpose === v ? "#AFA9EC" : "rgba(255,255,255,0.3)",
                          }}
                        >
                          <span>{v === "personal" ? "✦" : "🏆"}</span>
                          <span>{v === "personal" ? t("upload.personal") : t("upload.competition")}</span>
                          {purpose === v && (
                            <span className="absolute right-2.5 h-1.5 w-1.5 rounded-full bg-[#7F77DD]" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 공모전 선택 */}
                {purpose === "competition" && (
                  <div>
                    <label className={lbl}>{t("upload.selectCompetition")}</label>
                    {isCompetitionLocked ? (
                      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                        <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/35">
                          {t("upload.competitionSelectLabel")}
                        </p>
                        <p className="text-sm font-semibold text-white">
                          {competitions.find((c) => c.id === competitionId)?.title ?? competitions.find((c) => c.id === competitionIdFromUrl)?.title ?? t("nav.competition")}
                        </p>
                        <p className="mt-1 text-xs text-white/50">{t("upload.competitionLockedFromPage")}</p>
                      </div>
                    ) : competitions.length > 0 ? (
                      <CustomSelect
                        value={competitionId}
                        onChange={setCompetitionId}
                        options={competitions.map((c) => ({ value: c.id, label: c.title }))}
                        placeholder={t("upload.selectCompetitionPlaceholder")}
                      />
                    ) : (
                      <p className="text-xs text-amber-400/70">{t("upload.noOpenCompetitionsShort")}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation + 에러 */}
          <div className="mt-5 space-y-3">
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div>
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
                disabled={step === 1}
                className="flex items-center gap-2 rounded-xl px-6 py-3 text-[13px] font-bold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-30"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Previous
              </button>

              {step < 3 ? (
                <button
                  key="next-btn"
                  type="button"
                  onClick={() => {
                    console.log("[UPLOAD_DEBUG] Next clicked", {
                      currentStep: step,
                      timestamp: Date.now(),
                    });
                    setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s));
                    setStepTransitioning(true);
                    setTimeout(() => setStepTransitioning(false), 500);
                  }}
                  className="flex items-center gap-2 rounded-xl px-8 py-3 text-[13px] font-bold text-white transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: "linear-gradient(135deg, #534AB7 0%, #7B6FE8 100%)",
                    boxShadow: "0 4px 16px rgba(83,74,183,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                  }}
                >
                  Next
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ) : (
                <button
                  key="submit-btn"
                  type="submit"
                  disabled={loading || stepTransitioning}
                  className="flex items-center gap-2 rounded-xl px-10 py-3 text-[14px] font-bold text-white transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #534AB7 0%, #7B6FE8 100%)",
                    boxShadow: "0 4px 24px rgba(83,74,183,0.6), inset 0 1px 0 rgba(255,255,255,0.15)",
                  }}
                >
                  {loading ? t("upload.submitBusy") : t("upload.submitCta")}
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
