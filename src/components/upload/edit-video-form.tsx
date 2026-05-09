"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { deleteVideoAction, updateVideoAction } from "@/app/actions/video";
import { AI_TOOL_CATEGORIES, buildAiToolsPayload, normalizeToolName } from "@/lib/constants/ai-tools";
import {
  FEED_GENRE_KEYS,
  defaultSubGenreForMain,
  getSubGenreOptions,
  needsSubGenre,
  mainGenreLabel,
  type MainGenreKey,
} from "@/lib/constants/genres";
import { useI18n } from "@/components/genova/language-provider";
import { MAX_VIDEO_TAGS, parseHashtagTagInput } from "@/lib/tags";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

type Props = {
  userId: string;
  video: {
    id: string;
    title: string;
    thumbnail_url: string;
    backdrop_url?: string | null;
    mux_playback_id?: string | null;
    mux_asset_id?: string | null;
    mux_upload_id?: string | null;
    genre: string;
    additional_genres?: string[] | null;
    sub_genre: string | null;
    purpose: string;
    ai_tools: string[];
    tags: string[];
    series_name: string | null;
    episode_number: number | null;
    description: string;
    runtime: string;
    duration_seconds?: number | null;
    durationSeconds?: number | null;
    visibility: string;
    genre_changed_at?: string | null;
  };
  competitions: { id: string; title: string }[];
};

const inp =
  "w-full rounded-xl border border-white/[0.12] bg-[#0d0b20] px-4 py-2 text-sm text-white placeholder:text-white/20 outline-none transition focus:border-[#7F77DD]/60 focus:ring-1 focus:ring-[#7F77DD]/30 focus:bg-[#110e28]";
const lbl = "mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-white/40";
type CatKey = (typeof AI_TOOL_CATEGORIES)[number]["key"];

function NumberInput({
  value,
  onChange,
  min = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <div
      className="flex items-center overflow-hidden rounded-xl border"
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

export function EditVideoForm({ userId, video, competitions }: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const backdropInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(video.title);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(video.thumbnail_url);
  const [backdropFile, setBackdropFile] = useState<File | null>(null);
  const [backdropPreview, setBackdropPreview] = useState<string | null>(video.backdrop_url ?? null);
  const [mainGenre, setMainGenre] = useState<MainGenreKey>(video.genre as MainGenreKey);
  const [additionalGenres, setAdditionalGenres] = useState<MainGenreKey[]>(
    (video.additional_genres ?? []).filter((g): g is MainGenreKey => FEED_GENRE_KEYS.includes(g as MainGenreKey))
  );
  const [subGenre, setSubGenre] = useState<string>(video.sub_genre ?? defaultSubGenreForMain(video.genre) ?? "");
  const [tools, setTools] = useState<string[]>(video.ai_tools ?? []);
  const [otherText, setOtherText] = useState<Partial<Record<CatKey, string>>>({});
  const [otherOpen, setOtherOpen] = useState<Record<CatKey, boolean>>({
    image: false,
    video: false,
    music: false,
    platform: false,
  });
  const [tagInput, setTagInput] = useState(video.tags?.map((t) => `#${t}`).join(", ") ?? "");
  const [seriesName, setSeriesName] = useState(video.series_name ?? "");
  const [episodeNumber, setEpisodeNumber] = useState(video.episode_number ?? 1);
  const [isSeriesMode, setIsSeriesMode] = useState(Boolean(seriesName));
  const [description, setDescription] = useState(video.description ?? "");
  const [runtimeMinutes, setRuntimeMinutes] = useState(() => {
    if (!video.runtime) {
      const fallbackSeconds = video.duration_seconds ?? video.durationSeconds ?? 0;
      return Math.max(1, Math.round(fallbackSeconds / 60));
    }
    const [m, s] = video.runtime.split(":").map(Number);
    return (m || 0) + (s || 0) / 60;
  });
  const [visibility, setVisibility] = useState<"public" | "private">(video.visibility as "public" | "private");
  const [purpose, setPurpose] = useState<"personal" | "competition">(video.purpose as "personal" | "competition");
  const [competitionId, setCompetitionId] = useState(competitions[0]?.id ?? "");

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [stepTransitioning, setStepTransitioning] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [existingSeries, setExistingSeries] = useState<{ name: string; nextEpisode: number }[]>([]);
  const [isNewSeries, setIsNewSeries] = useState(false);

  const showSubGenre = needsSubGenre(mainGenre);
  const subGenreOptions = getSubGenreOptions(mainGenre, locale);
  const additionalGenreOptions = FEED_GENRE_KEYS.filter((k) => k !== mainGenre);
  const tagPreview = parseHashtagTagInput(tagInput);
  const isGenreLocked = !!video.genre_changed_at;

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

  // deps: step — Step 자동 진행/submit 추적용 로그
  useEffect(() => {
    console.log("[UPLOAD_DEBUG] step changed", {
      step,
      timestamp: Date.now(),
    });
  }, [step]);

  const toggleTool = (toolName: string) => {
    const c = normalizeToolName(toolName);
    setTools((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const toggleOtherOpen = (key: CatKey) => {
    setOtherOpen((o) => ({ ...o, [key]: !o[key] }));
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
      let publicUrl = video.thumbnail_url;
      if (thumbnailFile) {
        const safe = thumbnailFile.name.replace(/[^\w.-]/g, "_");
        const path = `${userId}/${Date.now()}-${safe}`;
        const { error: upErr } = await supabase.storage.from("thumbnails").upload(path, thumbnailFile, { upsert: true });
        if (upErr) {
          setError(upErr.message);
          return;
        }
        const {
          data: { publicUrl: uploadedPublicUrl },
        } = supabase.storage.from("thumbnails").getPublicUrl(path);
        publicUrl = uploadedPublicUrl;
      }

      let finalBackdropUrl: string | null = video.backdrop_url ?? null;
      if (backdropFile) {
        const safe = backdropFile.name.replace(/[^\w.-]/g, "_");
        const path = `${userId}/backdrop-${Date.now()}-${safe}`;
        const { error: upErr } = await supabase.storage.from("thumbnails").upload(path, backdropFile, { upsert: true });
        if (upErr) {
          setError(upErr.message);
          return;
        }
        const {
          data: { publicUrl: uploadedBackdropUrl },
        } = supabase.storage.from("thumbnails").getPublicUrl(path);
        finalBackdropUrl = uploadedBackdropUrl;
      }

      const aiTools = buildAiToolsPayload(tools, otherText);

      console.log("[UPLOAD_DEBUG] action calling", {
        step,
        trigger: "manual_submit",
        timestamp: Date.now(),
      });
      const res = await updateVideoAction(
        video.id,
        {
          title: title.trim(),
          thumbnailUrl: thumbnailFile ? publicUrl : video.thumbnail_url,
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
          runtimeMinutes: Math.round(runtimeMinutes),
          visibility,
          submittedCompetitionId: purpose === "competition" ? competitionId : null,
          muxPlaybackId: video.mux_playback_id ?? null,
          muxAssetId: video.mux_asset_id ?? null,
          muxUploadId: video.mux_upload_id ?? null,
        } as never,
      );

      if (!res.ok) {
        setError(res.message);
        return;
      }

      router.push(`/watch/${video.id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = confirm("정말로 이 영상을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.");
    if (!confirmed) return;

    setDeleting(true);
    setError(null);
    try {
      const result = await deleteVideoAction(video.id);
      if (result.ok) {
        router.push("/films");
        router.refresh();
        return;
      }
      setError(result.message || "삭제 실패");
    } finally {
      setDeleting(false);
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
        ref={backdropInputRef}
        id="uv-backdrop-input"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onBackdropChange}
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
        <div
          className="rounded-2xl border border-white/[0.08] p-4"
          style={{
            background: "linear-gradient(135deg, rgba(20,17,50,0.98) 0%, rgba(10,8,28,0.99) 100%)",
            boxShadow: "0 0 0 1px rgba(127,119,221,0.08), inset 0 1px 0 rgba(127,119,221,0.05)",
          }}
        >
          <div className="mb-4 flex items-end justify-between border-b border-white/[0.06] pb-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]/60">{t("upload.editEyebrow")}</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-white">{t("upload.editTitle")}</h1>
            </div>
            <p className="text-sm text-white/25">{t("upload.editSubtitle")}</p>
          </div>

          <div className="mb-6 flex items-center gap-3">
            {[
              { num: 1, label: "Info" },
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
                      }}
                    >
                      {done ? "✓" : s.num}
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: active ? "#AFA9EC" : "rgba(255,255,255,0.3)" }}>
                        Step {String(s.num).padStart(2, "0")}
                      </p>
                      <p className="truncate text-[12px] font-bold" style={{ color: active ? "white" : "rgba(255,255,255,0.6)" }}>
                        {s.label}
                      </p>
                    </div>
                  </button>
                  {idx < arr.length - 1 && <div className="hidden h-px w-6 sm:block" style={{ background: "rgba(255,255,255,0.08)" }} />}
                </div>
              );
            })}
          </div>

          <div style={{ display: step === 1 ? "grid" : "none" }} className="grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/[0.08] p-3" style={{ background: "rgba(255,255,255,0.025)", borderColor: "rgba(255,255,255,0.07)" }}>
                <h2 className="mb-3 border-b border-[#7F77DD]/20 pb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC]">
                  {t("upload.sectionFilmDetails")}
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className={lbl}>{t("upload.labelTitle")}</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inp} placeholder={t("upload.placeholderTitle")} />
                  </div>
                  <div>
                    <label className={lbl}>{t("upload.labelDescription")}</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className={`${inp} resize-none`} placeholder={t("upload.placeholderFilmDescription")} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-white/[0.08] p-3" style={{ background: "rgba(255,255,255,0.025)" }}>
                <div className="mb-3 border-b border-[#7F77DD]/15 pb-2">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]">{t("upload.sectionPosterThumb")}</h2>
                  <p className="mt-1.5 text-[10px] text-white/30 leading-relaxed">
                    ✦ Recommended: <span className="text-white/50 font-semibold">3:4 portrait</span> (1080×1440) for card display<br />
                    Pro tip: include your film title in the thumbnail for best visibility on feeds.
                  </p>
                </div>
                <div className="relative mx-auto overflow-hidden rounded-xl border border-white/[0.08]" style={{ maxWidth: "240px" }}>
                  <div className="aspect-[3/4] w-full bg-black">
                    <img src={thumbnailPreview ?? "/placeholder-user.jpg"} alt="" className="h-full w-full object-cover" />
                  </div>
                  <button type="button" onClick={openThumbPicker} className="absolute right-2 top-2 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/90">
                    {t("upload.change")}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.08] p-3" style={{ background: "rgba(255,255,255,0.025)" }}>
                <div className="mb-3 border-b border-[#7F77DD]/15 pb-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]">Hero Backdrop</h2>
                    <span className="rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.15em]" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      Optional
                    </span>
                  </div>
                  <p className="mt-1.5 text-[10px] text-white/30 leading-relaxed">
                    ✦ 16:9 wide cinematic shot · <span className="text-white/50 font-semibold">no text recommended</span><br />
                    Used when your film is featured in the homepage hero. If empty, the thumbnail is used.
                  </p>
                </div>
                {!backdropPreview ? (
                  <button type="button" onClick={openBackdropPicker} className="flex min-h-[120px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#7F77DD]/15 bg-white/[0.015] transition hover:border-[#7F77DD]/35 hover:bg-white/[0.03]">
                    <svg className="h-7 w-7 text-[#7F77DD]/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
                      <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" />
                      <circle cx="9" cy="9" r="1.5" />
                    </svg>
                    <p className="text-[11px] font-medium text-white/35">Upload cinematic backdrop</p>
                  </button>
                ) : (
                  <div className="relative overflow-hidden rounded-xl border border-white/[0.08]">
                    <div className="w-full bg-black" style={{ aspectRatio: "16/5.5" }}>
                      <img src={backdropPreview} alt="" className="h-full w-full object-cover" />
                    </div>
                    <button type="button" onClick={openBackdropPicker} className="absolute right-2 top-2 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/90">
                      {t("upload.change")}
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
                    className="h-3.5 w-3.5 text-white/40 transition-transform duration-300"
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
                          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1547] to-[#0f0d24]" />
                        )}
                        <div
                          className="absolute inset-0"
                          style={{
                            background: "linear-gradient(to top, rgba(8,6,24,1) 0%, rgba(8,6,24,0.5) 40%, transparent 75%)",
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
                          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1547] to-[#0f0d24]" />
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
              <div className="rounded-2xl border border-white/[0.08] p-3" style={{ background: "rgba(255,255,255,0.025)", borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="mb-3 flex items-center justify-between border-b border-[#7F77DD]/20 pb-2">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC]">{t("upload.sectionTags")}</h2>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-black tabular-nums transition-all" style={{
                    background: tagPreview.length > 0 ? "rgba(127,119,221,0.2)" : "rgba(255,255,255,0.04)",
                    color: tagPreview.length > 0 ? "#AFA9EC" : "rgba(255,255,255,0.3)",
                    border: tagPreview.length > 0 ? "1px solid rgba(127,119,221,0.35)" : "1px solid rgba(255,255,255,0.06)",
                  }}>
                    {tagPreview.length}/{MAX_VIDEO_TAGS}
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className={lbl}>
                        {t("upload.tagsWithMax").replace("{max}", String(MAX_VIDEO_TAGS))}
                      </label>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-black tabular-nums"
                        style={{
                          background: tagPreview.length > 0 ? "rgba(127,119,221,0.2)" : "rgba(255,255,255,0.04)",
                          color: tagPreview.length > 0 ? "#AFA9EC" : "rgba(255,255,255,0.3)",
                          border: tagPreview.length > 0 ? "1px solid rgba(127,119,221,0.35)" : "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        {tagPreview.length}/{MAX_VIDEO_TAGS}
                      </span>
                    </div>
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all duration-300"
                      placeholder={t("upload.placeholderTags")}
                      style={{
                        background: "linear-gradient(135deg, rgba(20,17,50,0.6) 0%, rgba(13,11,32,0.7) 100%)",
                        border: tagPreview.length > 0
                          ? "1px solid rgba(127,119,221,0.4)"
                          : "1px solid rgba(255,255,255,0.08)",
                        boxShadow: tagPreview.length > 0
                          ? "0 0 16px rgba(127,119,221,0.12), inset 0 1px 0 rgba(127,119,221,0.08)"
                          : "inset 0 1px 0 rgba(255,255,255,0.03)",
                      }}
                    />
                    <p className="mt-1.5 text-[10px] text-white/25">{t("upload.tagsInputHint", "쉼표(,) 또는 Enter로 추가")}</p>
                    {tagPreview.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {tagPreview.map((tagName) => (
                          <span
                            key={tagName}
                            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold"
                            style={{
                              background: "linear-gradient(135deg, rgba(127,119,221,0.4) 0%, rgba(83,74,183,0.25) 100%)",
                              border: "1px solid rgba(127,119,221,0.55)",
                              color: "#ffffff",
                              boxShadow: "0 0 8px rgba(127,119,221,0.25)",
                            }}
                          >
                            #{tagName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/[0.08] p-3" style={{ background: "rgba(83,74,183,0.06)", borderColor: "rgba(127,119,221,0.1)" }}>
                <h2 className="mb-3 border-b border-[#7F77DD]/20 pb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC]">
                  {t("upload.sectionAiToolsUsed")}
                </h2>
                <div className="space-y-2.5">
                  {AI_TOOL_CATEGORIES.map((cat) => {
                    const selectedInCat = cat.tools.filter((tt) => tools.some((sel) => normalizeToolName(sel) === normalizeToolName(tt))).length;
                    const otherActive = otherOpen[cat.key] || Boolean(otherText[cat.key]?.trim());
                    const catIcon = cat.key === "image" ? "🎨" : cat.key === "video" ? "🎬" : cat.key === "music" ? "🎵" : "⚡";
                    return (
                      <div key={cat.key} className="rounded-xl p-3 transition-all duration-300" style={{
                        background: selectedInCat > 0 || otherActive ? "rgba(127,119,221,0.07)" : "rgba(127,119,221,0.03)",
                        border: selectedInCat > 0 || otherActive ? "1px solid rgba(127,119,221,0.22)" : "1px solid rgba(127,119,221,0.1)",
                      }}>
                        <div className="mb-3 flex items-center gap-2">
                          <span className="text-[14px]">{catIcon}</span>
                          <p className="text-[12px] font-bold tracking-tight text-white/85">{t(`upload.aiCategory.${cat.key}`)}</p>
                          {selectedInCat > 0 && <span className="rounded-full border border-[#7F77DD]/40 bg-[#7F77DD]/30 px-2 py-0.5 text-[9px] font-black text-[#D5D1FF]">{selectedInCat}</span>}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {cat.tools.map((opt) => {
                            const canon = normalizeToolName(opt);
                            const on = tools.some((sel) => normalizeToolName(sel) === canon);
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => toggleTool(canon)}
                                className="rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all duration-200"
                                style={{
                                  borderColor: on ? "rgba(127,119,221,0.7)" : "rgba(255,255,255,0.08)",
                                  background: on ? "linear-gradient(135deg, rgba(127,119,221,0.4) 0%, rgba(83,74,183,0.25) 100%)" : "rgba(255,255,255,0.02)",
                                  color: on ? "#ffffff" : "rgba(255,255,255,0.4)",
                                  boxShadow: on ? "0 0 12px rgba(127,119,221,0.3)" : "none",
                                }}
                              >
                                {opt}
                              </button>
                            );
                          })}
                          <button type="button" onClick={() => toggleOtherOpen(cat.key)} className="rounded-full border border-dashed px-3 py-1.5 text-[11px] font-bold transition-all duration-200" style={{
                            borderColor: otherActive ? "rgba(127,119,221,0.7)" : "rgba(255,255,255,0.08)",
                            background: otherActive ? "rgba(83,74,183,0.2)" : "rgba(255,255,255,0.02)",
                            color: otherActive ? "#AFA9EC" : "rgba(255,255,255,0.35)",
                          }}>
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
          </div>

          <div style={{ display: step === 3 ? "block" : "none" }}>
            <div className="rounded-2xl border border-white/[0.08] p-3" style={{ background: "rgba(83,74,183,0.08)", borderColor: "rgba(127,119,221,0.12)" }}>
              <h2 className="mb-3 border-b border-[#7F77DD]/20 pb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC]">
                {t("upload.sectionSettingsPanel")}
              </h2>
              <div className="space-y-3">
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 space-y-4">
                  {isGenreLocked && (
                    <div
                      className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2"
                      style={{ background: "rgba(255,212,120,0.06)", border: "1px solid rgba(255,212,120,0.2)" }}
                    >
                      <svg className="h-3.5 w-3.5 text-[#FFD478]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <p className="text-[11px] font-semibold text-[#FFD478]/90">
                        장르는 이미 변경됐어요. 추가 변경은 운영자에게 문의해주세요.
                      </p>
                    </div>
                  )}
                  <div>
                    <label className={lbl}>{t("upload.labelGenre", "Main Genre")}</label>
                    <p className="mb-2.5 text-[10px] text-white/35">{t("upload.primaryGenreHint", "The first selected genre is used as the main genre.")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {FEED_GENRE_KEYS.map((k) => {
                        const selected = mainGenre === k;
                        return (
                          <button key={k} type="button" onClick={() => setMainGenre(k)} disabled={isGenreLocked} className="rounded-full border px-3 py-1.5 text-[12px] font-bold transition-all duration-200" style={{
                            borderColor: selected ? "rgba(127,119,221,0.7)" : "rgba(255,255,255,0.08)",
                            background: selected ? "linear-gradient(135deg, rgba(127,119,221,0.4) 0%, rgba(83,74,183,0.25) 100%)" : "rgba(255,255,255,0.02)",
                            color: selected ? "#ffffff" : "rgba(255,255,255,0.4)",
                            opacity: isGenreLocked ? 0.5 : 1,
                            cursor: isGenreLocked ? "not-allowed" : "pointer",
                          }}>
                            {mainGenreLabel(k, locale)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {showSubGenre && (
                    <div className="border-t border-white/[0.05] pt-3.5">
                      <label className={lbl}>{t("upload.labelSubGenreShort", "Sub Genre")}</label>
                      <p className="mb-2.5 text-[10px] text-white/35">{t("upload.subGenreHint", "Choose one detailed sub genre under the main genre.")}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {subGenreOptions.map((opt) => {
                          const selected = subGenre === opt.value;
                          return (
                            <button key={opt.value} type="button" onClick={() => setSubGenre(opt.value)} disabled={isGenreLocked} className="rounded-full border px-3 py-1.5 text-[12px] font-bold transition-all duration-200" style={{
                              borderColor: selected ? "rgba(127,119,221,0.7)" : "rgba(255,255,255,0.08)",
                              background: selected ? "linear-gradient(135deg, rgba(127,119,221,0.4) 0%, rgba(83,74,183,0.25) 100%)" : "rgba(255,255,255,0.02)",
                              color: selected ? "#ffffff" : "rgba(255,255,255,0.4)",
                              opacity: isGenreLocked ? 0.5 : 1,
                              cursor: isGenreLocked ? "not-allowed" : "pointer",
                            }}>
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-white/[0.05] pt-3.5">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">
                        {t("upload.additionalGenres", "Detail Genres")}
                      </span>
                      <span className="rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.15em]" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        Optional
                      </span>
                    </div>
                    <p className="mb-2.5 text-[10px] text-white/35">{t("upload.additionalGenresHint", "You can add multiple extra genres.")}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {additionalGenreOptions.map((k) => {
                        const selected = additionalGenres.includes(k);
                        return (
                          <button key={k} type="button" onClick={() => setAdditionalGenres((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]))} disabled={isGenreLocked} className="rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all duration-200" style={{
                            borderColor: selected ? "rgba(127,119,221,0.5)" : "rgba(255,255,255,0.06)",
                            background: selected ? "rgba(83,74,183,0.22)" : "rgba(255,255,255,0.02)",
                            color: selected ? "#AFA9EC" : "rgba(255,255,255,0.35)",
                            opacity: isGenreLocked ? 0.5 : 1,
                            cursor: isGenreLocked ? "not-allowed" : "pointer",
                          }}>
                            {mainGenreLabel(k, locale)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className={lbl}>Runtime</label>
                  {(() => {
                    const runtimeDisplay =
                      video.runtime ||
                      (() => {
                        const seconds = video.duration_seconds ?? video.durationSeconds ?? 0;
                        if (seconds < 1) return "—";
                        const m = Math.floor(seconds / 60);
                        const s = Math.round(seconds % 60);
                        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
                      })();
                    return (
                  <div
                    className="flex items-center justify-between rounded-xl px-4 py-2.5 text-sm"
                    style={{
                      background: "rgba(16,185,129,0.05)",
                      border: "1px solid rgba(16,185,129,0.2)",
                    }}
                  >
                    <span className="text-[11px] uppercase tracking-widest text-emerald-400/70">Auto-detected</span>
                    <span className="font-bold tabular-nums text-emerald-400">{runtimeDisplay}</span>
                  </div>
                    );
                  })()}
                  <p className="mt-1 text-[10px] text-white/25">
                    To change the runtime, please re-upload the video.
                  </p>
                </div>

                <div>
                  <p className={lbl}>{t("upload.seriesToggleLabel")}</p>
                  <button type="button" onClick={() => setIsSeriesMode(!isSeriesMode)} className="relative flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium transition" style={{
                    borderColor: isSeriesMode ? "rgba(127,119,221,0.5)" : "rgba(255,255,255,0.06)",
                    background: isSeriesMode ? "rgba(83,74,183,0.35)" : "rgba(255,255,255,0.02)",
                    color: isSeriesMode ? "#AFA9EC" : "rgba(255,255,255,0.55)",
                  }}>
                    <span>{t("upload.partOfSeries")}</span>
                    <span className="relative h-4 w-8 rounded-full transition-colors" style={{ background: isSeriesMode ? "#534AB7" : "rgba(255,255,255,0.1)" }}>
                      <span className="absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-[left]" style={{ left: isSeriesMode ? "18px" : "2px" }} />
                    </span>
                  </button>
                </div>

                {isSeriesMode && (
                  <div className="space-y-2">
                    {existingSeries.length > 0 && !isNewSeries ? (
                      <>
                        <div>
                          <label className={lbl}>{t("upload.selectSeries")}</label>
                          <CustomSelect value={seriesName} onChange={(v) => {
                            const sel = existingSeries.find((s) => s.name === v);
                            if (sel) {
                              setSeriesName(sel.name);
                              setEpisodeNumber(sel.nextEpisode);
                            }
                          }} options={existingSeries.map((s) => ({ value: s.name, label: t("upload.seriesNextEp").replace("{name}", s.name).replace("{n}", String(s.nextEpisode)) }))} placeholder={t("upload.selectSeriesPlaceholder")} />
                        </div>
                        <button type="button" onClick={() => { setIsNewSeries(true); setSeriesName(""); setEpisodeNumber(1); }} className="text-[11px] text-[#7F77DD] transition hover:text-[#AFA9EC]">{t("upload.createNewSeries")}</button>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className={lbl}>{t("upload.seriesNameLabel")}</label>
                          <input value={seriesName} onChange={(e) => setSeriesName(e.target.value)} className={inp} placeholder={t("upload.seriesNamePlaceholder")} />
                        </div>
                        {existingSeries.length > 0 && (
                          <button type="button" onClick={() => { setIsNewSeries(false); setSeriesName(""); }} className="text-[11px] text-[#7F77DD] transition hover:text-[#AFA9EC]">{t("upload.selectExistingSeries")}</button>
                        )}
                      </>
                    )}
                    <div>
                      <label className={lbl}>{t("upload.episodeNumberLabel")}</label>
                      <NumberInput value={episodeNumber} onChange={setEpisodeNumber} min={1} />
                    </div>
                  </div>
                )}

                <div>
                  <p className={lbl}>{t("upload.visibilityLabel")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(["public", "private"] as const).map((v) => (
                      <button key={v} type="button" onClick={() => setVisibility(v)} className="relative flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium transition" style={{
                        borderColor: visibility === v ? "rgba(127,119,221,0.5)" : "rgba(255,255,255,0.06)",
                        background: visibility === v ? "rgba(83,74,183,0.35)" : "rgba(255,255,255,0.02)",
                        color: visibility === v ? "#AFA9EC" : "rgba(255,255,255,0.55)",
                      }}>
                        <span>{v === "public" ? "🌐" : "🔒"}</span>
                        <span>{v === "public" ? t("upload.visPublic") : t("upload.visPrivate")}</span>
                        {visibility === v && <span className="absolute right-2.5 h-1.5 w-1.5 rounded-full bg-[#7F77DD]" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className={lbl}>{t("upload.labelPurpose")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(["personal", "competition"] as const).map((v) => (
                      <button key={v} type="button" onClick={() => setPurpose(v)} className="relative flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium transition" style={{
                        borderColor: purpose === v ? "rgba(127,119,221,0.5)" : "rgba(255,255,255,0.06)",
                        background: purpose === v ? "rgba(83,74,183,0.35)" : "rgba(255,255,255,0.02)",
                        color: purpose === v ? "#AFA9EC" : "rgba(255,255,255,0.3)",
                      }}>
                        <span>{v === "personal" ? "✦" : "🏆"}</span>
                        <span>{v === "personal" ? t("upload.personal") : t("upload.competition")}</span>
                        {purpose === v && <span className="absolute right-2.5 h-1.5 w-1.5 rounded-full bg-[#7F77DD]" />}
                      </button>
                    ))}
                  </div>
                </div>

                {purpose === "competition" && competitions.length > 0 && (
                  <div>
                    <label className={lbl}>{t("upload.selectCompetition")}</label>
                    <CustomSelect value={competitionId} onChange={setCompetitionId} options={competitions.map((c) => ({ value: c.id, label: c.title }))} placeholder={t("upload.selectCompetitionPlaceholder")} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {error && <div className="rounded-xl border border-red-500/20 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div>}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
                disabled={step === 1}
                className="flex items-center gap-2 rounded-xl px-6 py-3 text-[13px] font-bold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-30"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
              >
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
                  style={{ background: "linear-gradient(135deg, #534AB7 0%, #7B6FE8 100%)", boxShadow: "0 4px 16px rgba(83,74,183,0.4), inset 0 1px 0 rgba(255,255,255,0.15)" }}
                >
                  Next
                </button>
              ) : (
                <button
                  key="submit-btn"
                  type="submit"
                  disabled={loading || stepTransitioning}
                  className="flex items-center gap-2 rounded-xl px-10 py-3 text-[14px] font-bold text-white transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #534AB7 0%, #7B6FE8 100%)", boxShadow: "0 4px 24px rgba(83,74,183,0.6), inset 0 1px 0 rgba(255,255,255,0.15)" }}
                >
                  {loading ? t("settings.saving") : t("upload.editSaveCta")}
                </button>
              )}
            </div>
          </div>

          <div className="mt-12 rounded-xl border border-red-500/20 bg-red-500/[0.03] p-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm text-red-400">⚠</span>
              <p className="text-sm font-bold uppercase tracking-wider text-red-400">위험 구역</p>
            </div>
            <p className="mb-4 text-xs text-white/50">
              영상을 삭제하면 복구할 수 없습니다. 모든 댓글, 좋아요, 시청 기록이 함께 삭제됩니다.
            </p>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? "삭제 중..." : "영상 삭제"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
