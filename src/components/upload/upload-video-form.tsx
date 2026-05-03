"use client";

import MuxUploader from "@mux/mux-uploader-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createVideoAction } from "@/app/actions/video";
import { AI_TOOL_CATEGORIES, buildAiToolsPayload, normalizeToolName } from "@/lib/constants/ai-tools";
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
import { MAX_VIDEO_TAGS, parseHashtagTagInput } from "@/lib/tags";
import { extractVimeoId } from "@/lib/vimeo";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

type Props = {
  userId: string;
  competitions: { id: string; title: string }[];
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

export function UploadVideoForm({ userId, competitions }: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const muxUploadIdRef = useRef<string | null>(null);

  const [title, setTitle] = useState("");
  const [vimeoUrl, setVimeoUrl] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [mainGenre, setMainGenre] = useState<MainGenreKey>("film");
  const [subGenre, setSubGenre] = useState<SubGenreKey>("drama");
  const [tools, setTools] = useState<string[]>([]);
  const [otherText, setOtherText] = useState<Partial<Record<CatKey, string>>>({});
  const [otherOpen, setOtherOpen] = useState<Record<CatKey, boolean>>({
    image: false,
    video: false,
    music: false,
  });

  const [tagInput, setTagInput] = useState("");
  const [seriesName, setSeriesName] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [isSeriesMode, setIsSeriesMode] = useState(Boolean(seriesName));
  const [existingSeries, setExistingSeries] = useState<{ name: string; nextEpisode: number }[]>([]);
  const [isNewSeries, setIsNewSeries] = useState(false);

  const [description, setDescription] = useState("");
  const [runtimeMinutes, setRuntimeMinutes] = useState(5);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [purpose, setPurpose] = useState<"personal" | "competition">("personal");
  const [competitionId, setCompetitionId] = useState(competitions[0]?.id ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [thumbnailFromUrl, setThumbnailFromUrl] = useState<string | null>(null);

  const [muxUploadUrl, setMuxUploadUrl] = useState<string | null>(null);
  const [muxUploadId, setMuxUploadId] = useState<string | null>(null);
  const [muxPlaybackId, setMuxPlaybackId] = useState<string | null>(null);
  const [muxAssetId, setMuxAssetId] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<"mux" | "vimeo">("mux");
  const [muxUploadStatus, setMuxUploadStatus] = useState<"idle" | "uploading" | "processing" | "ready">("idle");
  const [muxDuration, setMuxDuration] = useState<number | null>(null);

  const vimeoPreview = extractVimeoId(vimeoUrl);
  const showSubGenre = needsSubGenre(mainGenre);
  const tagPreview = parseHashtagTagInput(tagInput);

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
    if (!vimeoPreview) return;

    const fetchVimeoData = async () => {
      try {
        const res = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${vimeoPreview}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.title) {
          setTitle((prev) => (prev.trim() ? prev : data.title));
        }

        if (data.thumbnail_url) {
          setThumbnailFile((f) => {
            if (f) return f;
            setThumbnailPreview(data.thumbnail_url);
            setThumbnailFromUrl(data.thumbnail_url);
            return f;
          });
        }
      } catch {
        // oEmbed 실패 시 무시
      }
    };

    void fetchVimeoData();
  }, [vimeoPreview]);

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
            setRuntimeMinutes(Math.ceil(data.duration / 60));
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

  const toggleOtherOpen = (key: CatKey) => {
    setOtherOpen((o) => ({ ...o, [key]: !o[key] }));
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
    setThumbnailFromUrl(null);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError(t("upload.errTitle"));
      return;
    }
    if (uploadMode === "vimeo" && !vimeoPreview) {
      setError(t("upload.errVimeo"));
      return;
    }
    if (!thumbnailFile && !thumbnailFromUrl) {
      setError(t("upload.errThumbnail"));
      return;
    }
    if (runtimeMinutes < 1) {
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

    const tags = parseHashtagTagInput(tagInput);
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
      let finalThumbnailUrl = thumbnailFromUrl ?? "";
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

      const aiTools = buildAiToolsPayload(tools, otherText);

      const res = await createVideoAction({
        title: title.trim(),
        vimeoUrl: uploadMode === "vimeo" ? vimeoUrl : null,
        thumbnailUrl: finalThumbnailUrl,
        genre: mainGenre,
        subGenre: showSubGenre ? subGenre : null,
        purpose,
        aiTools,
        tags,
        seriesName: isSeriesMode ? seriesName.trim() : null,
        episodeNumber: isSeriesMode ? episodeNumber : null,
        description,
        runtimeMinutes: Math.round(runtimeMinutes),
        visibility,
        submittedCompetitionId: purpose === "competition" ? competitionId : null,
        muxPlaybackId: uploadMode === "mux" ? muxPlaybackId : null,
        muxAssetId: uploadMode === "mux" ? muxAssetId : null,
        muxUploadId: uploadMode === "mux" ? muxUploadId : null,
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

      <form onSubmit={(e) => void submit(e)}>
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
                {/* 업로드 모드 토글 */}
                <div className="grid grid-cols-2 gap-2">
                  {(["mux", "vimeo"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setUploadMode(mode)}
                      className="relative flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium transition"
                      style={{
                        borderColor: uploadMode === mode ? "rgba(127,119,221,0.5)" : "rgba(255,255,255,0.06)",
                        background: uploadMode === mode ? "rgba(83,74,183,0.35)" : "rgba(255,255,255,0.02)",
                        color: uploadMode === mode ? "#AFA9EC" : "rgba(255,255,255,0.55)",
                      }}
                    >
                      {mode === "mux" ? t("upload.modeDirect") : t("upload.modeVimeo")}
                    </button>
                  ))}
                </div>

                {uploadMode === "mux" ? (
                  <div className="space-y-3">
                    {!muxUploadUrl ? (
                      <button
                        type="button"
                        onClick={() => void initMuxUpload()}
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
                    ) : (
                      <div className="space-y-2">
                        <MuxUploader
                          endpoint={muxUploadUrl}
                          onUploadStart={() => setMuxUploadStatus("uploading")}
                          onSuccess={() => {
                            setMuxUploadStatus("processing");
                            const id = muxUploadIdRef.current;
                            if (id) void pollMuxAsset(id);
                          }}
                          style={{ width: "100%" }}
                        />
                        {muxUploadStatus === "uploading" && (
                          <p className="text-[11px] text-[#AFA9EC]">{t("upload.statusUploading")}</p>
                        )}
                        {muxUploadStatus === "processing" && (
                          <p className="text-[11px] text-amber-400">{t("upload.statusProcessing")}</p>
                        )}
                        {muxUploadStatus === "ready" && (
                          <p className="text-[11px] text-emerald-400">
                            {t("upload.readyPublish")}
                            {muxDuration &&
                              ` · ${t("upload.readyMinutes").replace("{n}", String(Math.ceil(muxDuration / 60)))}`}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className={lbl}>{t("upload.labelVimeo")}</label>
                      <input
                        id="uv-vimeo"
                        value={vimeoUrl}
                        onChange={(e) => setVimeoUrl(e.target.value)}
                        className={inp}
                        placeholder={t("upload.placeholderVimeo")}
                      />
                      {vimeoPreview && (
                        <p className="mt-1.5 text-[11px] text-emerald-400">
                          {t("upload.videoIdLabel")} {vimeoPreview}
                          {thumbnailFromUrl && !thumbnailFile && (
                            <span className="ml-2 text-[#AFA9EC]">{t("upload.thumbAutoFilled")}</span>
                          )}
                          {title && <span className="ml-2 text-[#AFA9EC]">{t("upload.titleAutoFilled")}</span>}
                        </p>
                      )}
                    </div>
                    {vimeoPreview ? (
                      <div className="overflow-hidden rounded-xl border border-white/[0.08]">
                        <div className="aspect-video w-full bg-black">
                          <iframe
                            title={t("upload.vimeoPreviewTitle")}
                            src={`https://player.vimeo.com/video/${vimeoPreview}?title=0&byline=0&portrait=0`}
                            className="h-full w-full"
                            allow="autoplay; fullscreen"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-[140px] w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#7F77DD]/20 bg-white/[0.02]">
                        <svg className="h-8 w-8 text-[#7F77DD]/30" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M21 3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h18zm-1 2H4v8h16V5zM8 17h8v2H8v-2z" />
                        </svg>
                        <p className="text-xs text-white/25">{t("upload.vimeoPasteHint")}</p>
                      </div>
                    )}
                  </div>
                )}
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
                  <label className={lbl} htmlFor="uv-tags">
                    {t("upload.tagsWithMax").replace("{max}", String(MAX_VIDEO_TAGS))}
                  </label>
                  <input
                    id="uv-tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    className={inp}
                    placeholder={t("upload.placeholderTags")}
                  />
                  {tagPreview.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {tagPreview.map((tagName) => (
                        <span
                          key={tagName}
                          className="rounded-full border border-[#7F77DD]/30 bg-[#534AB7]/20 px-2.5 py-0.5 text-xs text-[#AFA9EC]"
                        >
                          #{tagName}
                        </span>
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
              <div className="space-y-3">
                {AI_TOOL_CATEGORIES.map((cat) => {
                  const otherActive = otherOpen[cat.key] || Boolean(otherText[cat.key]?.trim());
                  return (
                    <div key={cat.key}>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/25">
                        {t(`upload.aiCategory.${cat.key}`)}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.tools.map((opt) => {
                          const canon = normalizeToolName(opt);
                          const on = tools.some((sel) => normalizeToolName(sel) === canon);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => toggleTool(canon)}
                              className="rounded-full border px-3 py-1 text-xs font-medium transition"
                              style={{
                                borderColor: on ? "rgba(127,119,221,0.5)" : "rgba(255,255,255,0.06)",
                                background: on ? "rgba(83,74,183,0.35)" : "rgba(255,255,255,0.02)",
                                color: on ? "#AFA9EC" : "rgba(255,255,255,0.35)",
                              }}
                            >
                              {opt}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => toggleOtherOpen(cat.key)}
                          className="rounded-full border border-dashed px-3 py-1 text-xs font-medium transition"
                          style={{
                            borderColor: otherActive ? "rgba(127,119,221,0.5)" : "rgba(255,255,255,0.06)",
                            background: otherActive ? "rgba(83,74,183,0.35)" : "transparent",
                            color: otherActive ? "#AFA9EC" : "rgba(255,255,255,0.25)",
                          }}
                        >
                          {t("upload.otherTool")}
                        </button>
                      </div>
                      {(otherOpen[cat.key] || Boolean(otherText[cat.key]?.trim())) && (
                        <input
                          type="text"
                          value={otherText[cat.key] ?? ""}
                          onChange={(e) => setOtherText((o) => ({ ...o, [cat.key]: e.target.value }))}
                          className={`${inp} mt-2`}
                          placeholder={t("upload.customToolPlaceholder")}
                        />
                      )}
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
                <div>
                  <label className={lbl}>{t("upload.runtimeMinutes")}</label>
                  <NumberInput value={runtimeMinutes} onChange={setRuntimeMinutes} min={1} />
                </div>

                <div>
                  <p className={lbl}>{t("upload.seriesToggleLabel")}</p>
                  <button
                    type="button"
                    onClick={() => setIsSeriesMode(!isSeriesMode)}
                    className="relative flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium transition"
                    style={{
                      borderColor: isSeriesMode ? "rgba(127,119,221,0.5)" : "rgba(255,255,255,0.06)",
                      background: isSeriesMode ? "rgba(83,74,183,0.35)" : "rgba(255,255,255,0.02)",
                      color: isSeriesMode ? "#AFA9EC" : "rgba(255,255,255,0.55)",
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
                        onClick={() => setVisibility(v)}
                        className="relative flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium transition"
                        style={{
                          borderColor: visibility === v ? "rgba(127,119,221,0.5)" : "rgba(255,255,255,0.06)",
                          background: visibility === v ? "rgba(83,74,183,0.35)" : "rgba(255,255,255,0.02)",
                          color: visibility === v ? "#AFA9EC" : "rgba(255,255,255,0.55)",
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
                </div>

                {/* 공모전 선택 */}
                {purpose === "competition" && (
                  <div>
                    <label className={lbl}>{t("upload.selectCompetition")}</label>
                    {competitions.length > 0 ? (
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
