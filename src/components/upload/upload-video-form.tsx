"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { updateAiToolPrefsAction, updateSavedHashtagsAction } from "@/app/actions/profile";
import { createVideoAction } from "@/app/actions/video";
import { AI_TOOL_CATEGORIES, normalizeToolName } from "@/lib/constants/ai-tools";
import {
  FEED_GENRE_KEYS,
  needsSubGenre,
  subGenreLabel,
  mainGenreLabel,
  SUB_GENRE_KEYS,
  type MainGenreKey,
  type SubGenreKey,
} from "@/lib/constants/genres";
import { useI18n } from "@/components/genova/language-provider";
import { MAX_VIDEO_TAGS } from "@/lib/tags";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

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
const lbl = "mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-white/40";

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
        className="flex h-10 w-10 shrink-0 items-center justify-center text-white/40 transition hover:bg-white/[0.05] hover:text-white"
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
        className="flex h-10 w-10 shrink-0 items-center justify-center text-white/40 transition hover:bg-white/[0.05] hover:text-white"
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
          background: open ? "rgba(83,74,183,0.15)" : "#0d0b20",
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

function SelectedVideoUploader({
  file,
  uploadUrl,
  onUploadStart,
  onProgress,
  onSuccess,
  onReset,
  status,
  duration,
}: {
  file: File;
  uploadUrl: string;
  onUploadStart: () => void;
  onProgress: (pct: number) => void;
  onSuccess: () => void;
  onReset: () => void;
  status: "idle" | "uploading" | "processing" | "ready";
  duration: number | null;
}) {
  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (started) return;
    setStarted(true);
    onUploadStart();

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const pct = Math.round((event.loaded / event.total) * 100);
        setProgress(pct);
        onProgress(pct);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) onSuccess();
    };
    xhr.send(file);
  }, []);

  return (
    <div className="space-y-3 rounded-xl border border-white/[0.08] p-3">
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 shrink-0 text-[#7F77DD]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path
            d="M15 10l4.553-2.277A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="min-w-0 flex-1 truncate text-xs text-white/60">{file.name}</p>
        {status === "idle" && (
          <button type="button" onClick={onReset} className="text-white/30 hover:text-white/60">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {status === "uploading" && (
        <div className="space-y-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, background: "linear-gradient(90deg, #534AB7, #7B6FE8)" }}
            />
          </div>
          <p className="text-[11px] text-[#AFA9EC]">Uploading... {progress}%</p>
        </div>
      )}

      {status === "processing" && (
        <div className="space-y-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full w-full animate-pulse rounded-full" style={{ background: "linear-gradient(90deg, #534AB7, #7B6FE8)" }} />
          </div>
          <p className="text-[11px] text-amber-400">Processing...</p>
        </div>
      )}

      {status === "ready" && (
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
          <p className="text-[11px] text-emerald-400">
            Ready to publish
            {duration &&
              ` · ${String(Math.floor(duration / 60)).padStart(2, "0")}:${String(Math.round(duration % 60)).padStart(2, "0")}`}
          </p>
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
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const muxUploadIdRef = useRef<string | null>(null);

  const [title, setTitle] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [mainGenre, setMainGenre] = useState<MainGenreKey>("film");
  const [subGenre, setSubGenre] = useState<SubGenreKey>("drama");
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
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [purpose, setPurpose] = useState<"personal" | "competition">(
    purposeFromUrl === "competition" ? "competition" : "personal",
  );
  const [competitionId, setCompetitionId] = useState<string>(competitionIdFromUrl ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [muxUploadUrl, setMuxUploadUrl] = useState<string | null>(null);
  const [muxUploadId, setMuxUploadId] = useState<string | null>(null);
  const [muxPlaybackId, setMuxPlaybackId] = useState<string | null>(null);
  const [muxAssetId, setMuxAssetId] = useState<string | null>(null);
  const [muxUploadStatus, setMuxUploadStatus] = useState<"idle" | "uploading" | "processing" | "ready">("idle");
  const [muxDuration, setMuxDuration] = useState<number | null>(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const showSubGenre = needsSubGenre(mainGenre);

  useEffect(() => {
    if (!isSeriesMode) {
      setSeriesName("");
      setEpisodeNumber(1);
    }
  }, [isSeriesMode]);

  useEffect(() => {
    if (!isSeriesMode) return;
    fetch("/api/user-series")
      .then((r) => r.json())
      .then((data) => setExistingSeries(data))
      .catch(() => {});
  }, [isSeriesMode]);

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
    const next = hiddenTools.filter((h) => !catTools.includes(h));
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

  const onVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelectedVideoFile(f);
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
    setError(null);
    if (!title.trim()) {
      setError(t("upload.errTitle"));
      return;
    }
    if (!thumbnailFile) {
      setError(t("upload.errThumbnail"));
      return;
    }
    if (runtimeMinutes * 60 + runtimeSeconds < 1) {
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

      const aiTools = tools;

      const res = await createVideoAction({
        title: title.trim(),
        vimeoUrl: null,
        thumbnailUrl: finalThumbnailUrl,
        genre: mainGenre,
        subGenre: showSubGenre ? subGenre : null,
        purpose,
        aiTools,
        tags,
        seriesName: isSeriesMode ? seriesName.trim() : null,
        episodeNumber: isSeriesMode ? episodeNumber : null,
        description,
        runtimeMinutes: runtimeMinutes + runtimeSeconds / 60,
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

      router.push(`/watch/${res.videoId}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

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
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/*"
        className="sr-only"
        onChange={(e) => void onVideoChange(e)}
      />

      <form onSubmit={(e) => void submit(e)}>
        {isDraggingOver && (
          <div
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 pointer-events-none"
            style={{ background: "rgba(8,6,24,0.85)", backdropFilter: "blur(8px)" }}
          >
            <div
              className="rounded-2xl border-2 border-dashed border-[#7F77DD]/60 p-16 text-center"
              style={{ background: "rgba(83,74,183,0.15)" }}
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
              <p className="text-xl font-bold text-white">Drop here</p>
              <p className="mt-2 text-sm text-white/40">Video → Video Source · Image → Thumbnail</p>
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

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.1fr_1.8fr_1.3fr]">
          {/* ── 왼쪽: 비디오 입력 패널 ── */}
          <div className="space-y-3">
            <div
              className="rounded-2xl border border-white/[0.08] p-3"
              style={{ background: "rgba(83,74,183,0.08)", borderColor: "rgba(127,119,221,0.12)" }}
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
                        <p className="text-sm font-medium text-white/40">{t("upload.clickUploadVideo")}</p>
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

              {/* 플랫폼 혜택 */}
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-4">
                {[
                  { icon: "🎬", title: t("upload.benefitQualityTitle"), desc: t("upload.benefitQualityDesc") },
                  { icon: "🌍", title: t("upload.benefitReachTitle"), desc: t("upload.benefitReachDesc") },
                  { icon: "🏆", title: t("upload.benefitCompTitle"), desc: t("upload.benefitCompDesc") },
                ].map(({ icon, title: benefitTitle, desc }) => (
                  <div
                    key={benefitTitle}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center"
                  >
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-sm"
                      style={{ background: "rgba(83,74,183,0.25)", border: "1px solid rgba(127,119,221,0.2)" }}
                    >
                      {icon}
                    </span>
                    <p className="text-[11px] font-semibold text-white/60">{benefitTitle}</p>
                    <p className="text-[10px] leading-tight text-white/25">{desc}</p>
                  </div>
                ))}
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
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className={lbl} htmlFor="uv-tags">
                      {t("upload.tagsWithMax").replace("{max}", String(MAX_VIDEO_TAGS))}
                    </label>
                    <span className="text-[10px] text-white/25">{tags.length}/{MAX_VIDEO_TAGS}</span>
                  </div>

                  <div
                    className="flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-xl border border-white/[0.12] bg-[#0d0b20] px-3 py-2 transition focus-within:border-[#7F77DD]/60"
                    onClick={() => document.getElementById("uv-tags")?.focus()}
                  >
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 rounded-full border border-[#7F77DD]/30 bg-[#534AB7]/20 px-2.5 py-0.5 text-xs text-[#AFA9EC]"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-white/30 transition hover:text-white/70"
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
                      className="min-w-[120px] flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/20"
                      disabled={tags.length >= MAX_VIDEO_TAGS}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-white/20">쉼표(,) 또는 Enter로 추가</p>

                  {recentTags.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/25">
                        이전 영상 태그
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {recentTags
                          .filter((t) => !tags.includes(t))
                          .map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => addTag(tag)}
                              className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-0.5 text-xs text-white/40 transition hover:border-[#7F77DD]/30 hover:bg-[#534AB7]/15 hover:text-[#AFA9EC]"
                            >
                              + #{tag}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-3">
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/25">
                      즐겨찾기 태그
                    </p>
                    {mySavedHashtags.length === 0 ? (
                      <p className="text-[10px] text-white/20">태그 위에 ★ 버튼으로 저장하세요</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {mySavedHashtags.map((tag) => (
                          <div key={tag} className="group relative flex items-center">
                            <button
                              type="button"
                              onClick={() => addTag(tag)}
                              className="flex items-center gap-1 rounded-full border border-[#7F77DD]/20 bg-[#534AB7]/10 px-2.5 py-0.5 pr-6 text-xs text-[#AFA9EC]/60 transition hover:border-[#7F77DD]/40 hover:text-[#AFA9EC]"
                            >
                              ★ #{tag}
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeSavedHashtag(tag)}
                              className="absolute right-1.5 hidden text-[10px] text-white/20 transition group-hover:block hover:text-red-400"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {tags
                        .filter((t) => !mySavedHashtags.includes(t))
                        .map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => void saveHashtag(tag)}
                            className="rounded-full border border-white/[0.06] px-2 py-0.5 text-[10px] text-white/25 transition hover:border-[#7F77DD]/30 hover:text-[#AFA9EC]"
                          >
                            ☆ #{tag} 저장
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI 툴 */}
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
              <div className="space-y-4">
                {AI_TOOL_CATEGORIES.map((cat) => {
                  const visibleDefaults = cat.tools.filter((t) => !hiddenTools.includes(t));
                  const hiddenCount = cat.tools.filter((t) => hiddenTools.includes(t)).length;
                  const catCustomTools = customTools[cat.key] ?? [];

                  return (
                    <div key={cat.key}>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">
                          {t(`upload.aiCategory.${cat.key}`)}
                        </p>
                        {hiddenCount > 0 && (
                          <button
                            type="button"
                            onClick={() => void restoreHiddenTools(cat.key)}
                            className="text-[10px] text-[#7F77DD]/50 transition hover:text-[#7F77DD]"
                          >
                            {hiddenCount}개 복원
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
                                className="rounded-full border px-3 py-1 pr-6 text-xs font-medium transition"
                                style={{
                                  borderColor: on ? "rgba(127,119,221,0.5)" : "rgba(255,255,255,0.06)",
                                  background: on ? "rgba(83,74,183,0.35)" : "rgba(255,255,255,0.02)",
                                  color: on ? "#AFA9EC" : "rgba(255,255,255,0.35)",
                                }}
                              >
                                {opt}
                              </button>
                              <button
                                type="button"
                                onClick={() => void hideDefaultTool(opt)}
                                className="absolute right-1.5 top-1/2 hidden h-3.5 w-3.5 -translate-y-1/2 items-center justify-center rounded-full text-white/30 transition group-hover:flex hover:text-red-400"
                                title="숨기기"
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
                                className="rounded-full border px-3 py-1 pr-6 text-xs font-medium transition"
                                style={{
                                  borderColor: on ? "rgba(127,119,221,0.5)" : "rgba(127,119,221,0.2)",
                                  background: on ? "rgba(83,74,183,0.35)" : "rgba(83,74,183,0.08)",
                                  color: on ? "#AFA9EC" : "rgba(175,169,236,0.5)",
                                }}
                              >
                                {tool}
                              </button>
                              <button
                                type="button"
                                onClick={() => void removeCustomTool(cat.key, tool)}
                                className="absolute right-1.5 top-1/2 hidden h-3.5 w-3.5 -translate-y-1/2 items-center justify-center rounded-full text-white/30 transition group-hover:flex hover:text-red-400"
                                title="삭제"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-2 flex gap-2">
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
                          placeholder="직접 추가..."
                          className="flex-1 rounded-xl border border-white/[0.08] bg-[#0d0b20] px-3 py-1.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#7F77DD]/40"
                        />
                        <button
                          type="button"
                          onClick={() => void addCustomTool(cat.key)}
                          className="rounded-xl border border-[#7F77DD]/30 bg-[#534AB7]/20 px-3 py-1.5 text-xs font-semibold text-[#AFA9EC] transition hover:bg-[#534AB7]/40"
                        >
                          + 추가
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── 오른쪽: Settings + 썸네일 ── */}
          <div className="space-y-3">
            {/* 썸네일 */}
            <div
              className="rounded-2xl border border-white/[0.08] p-3"
              style={{ background: "rgba(255,255,255,0.025)" }}
            >
              <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD] border-b border-[#7F77DD]/15 pb-2">
                {t("upload.sectionPosterThumb")}
              </h2>
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
                    <p className="text-sm font-medium text-white/40">{t("upload.uploadThumbnailPrompt")}</p>
                    <p className="text-[11px] text-white/20">{t("upload.thumbnailFormats")}</p>
                  </div>
                </button>
              ) : (
                <div className="relative overflow-hidden rounded-xl border border-white/[0.08]">
                  <div className="aspect-video w-full bg-black">
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

            {/* Settings */}
            <div
              className="rounded-2xl border border-white/[0.08] p-3"
              style={{ background: "rgba(83,74,183,0.08)", borderColor: "rgba(127,119,221,0.12)" }}
            >
              <h2
                className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC] border-b border-[#7F77DD]/20 pb-2"
                style={{ letterSpacing: "0.18em" }}
              >
                {t("upload.sectionSettingsPanel")}
              </h2>
              <div className="space-y-3">
                {/* 장르 */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={lbl}>{t("upload.labelGenre")}</label>
                    <CustomSelect
                      value={mainGenre}
                      onChange={(v) => setMainGenre(v as MainGenreKey)}
                      options={FEED_GENRE_KEYS.map((k) => ({ value: k, label: mainGenreLabel(k, locale) }))}
                    />
                  </div>
                  {showSubGenre ? (
                    <div>
                      <label className={lbl}>{t("upload.labelSubGenreShort")}</label>
                      <CustomSelect
                        value={subGenre}
                        onChange={(v) => setSubGenre(v as SubGenreKey)}
                        options={SUB_GENRE_KEYS.map((k) => ({ value: k, label: subGenreLabel(k, locale) }))}
                      />
                    </div>
                  ) : (
                    <div />
                  )}
                </div>

                {/* 런타임 */}
                {muxUploadStatus === "ready" && muxDuration && (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 px-3 py-2">
                    <p className="text-[11px] text-emerald-400/70">Runtime (auto-detected)</p>
                    <p className="text-sm font-bold text-emerald-400">
                      {String(Math.floor(muxDuration / 60)).padStart(2, "0")}:{String(Math.round(muxDuration % 60)).padStart(2, "0")}
                    </p>
                  </div>
                )}
                {muxUploadStatus !== "ready" && (
                  <div>
                    <label className={lbl}>{t("upload.runtimeMinutes")}</label>
                    <NumberInput value={runtimeMinutes} onChange={setRuntimeMinutes} min={1} />
                    <p className="mt-1 text-[10px] text-white/25">Upload video to auto-detect</p>
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
                  <div className="grid grid-cols-2 gap-2">
                    {(["personal", "competition"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        disabled={!!competitionIdFromUrl}
                        onClick={() => setPurpose(v)}
                        className="relative flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium transition"
                        style={{
                          borderColor: purpose === v ? "rgba(127,119,221,0.5)" : "rgba(255,255,255,0.06)",
                          background: purpose === v ? "rgba(83,74,183,0.35)" : "rgba(255,255,255,0.02)",
                          color: purpose === v ? "#AFA9EC" : "rgba(255,255,255,0.3)",
                          cursor: !!competitionIdFromUrl ? "not-allowed" : "pointer",
                          opacity: !!competitionIdFromUrl && purpose !== v ? 0.4 : 1,
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
                </div>

                {/* 공모전 선택 */}
                {purpose === "competition" && (
                  <div>
                    <label className={lbl}>{t("upload.selectCompetition")}</label>
                    {competitionIdFromUrl ? (
                      <div
                        className="flex items-center justify-between rounded-xl border px-4 py-2 text-sm"
                        style={{
                          borderColor: "rgba(127,119,221,0.3)",
                          background: "rgba(83,74,183,0.15)",
                          color: "#AFA9EC",
                          cursor: "not-allowed",
                        }}
                      >
                        <span>{competitions.find((c) => c.id === competitionIdFromUrl)?.title ?? competitionIdFromUrl}</span>
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#7F77DD]/50" fill="none" stroke="currentColor" strokeWidth={2}>
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
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

            {/* 에러 */}
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div>
            )}

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3.5 text-base font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #534AB7 0%, #7B6FE8 100%)",
                boxShadow: "0 4px 24px rgba(83,74,183,0.6), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            >
              {loading ? t("upload.submitBusy") : t("upload.submitCta")}
            </button>
          </div>
        </div>
        </div>
      </form>
    </div>
  );
}
