"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { updateVideoAction } from "@/app/actions/video";
import { AI_TOOL_CATEGORIES, buildAiToolsPayload, normalizeToolName } from "@/lib/constants/ai-tools";
import {
  FEED_GENRE_KEYS,
  needsSubGenre,
  mainGenreLabel,
  subGenreLabel,
  SUB_GENRE_KEYS,
  type MainGenreKey,
  type SubGenreKey,
} from "@/lib/constants/genres";
import { useI18n } from "@/components/genova/language-provider";
import { MAX_VIDEO_TAGS, parseHashtagTagInput } from "@/lib/tags";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

type Props = {
  userId: string;
  video: {
    id: string;
    title: string;
    vimeo_id: string;
    thumbnail_url: string;
    genre: string;
    sub_genre: string | null;
    purpose: string;
    ai_tools: string[];
    tags: string[];
    series_name: string | null;
    episode_number: number | null;
    description: string;
    runtime: string;
    visibility: string;
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

  const [title, setTitle] = useState(video.title);
  const [vimeoUrl, setVimeoUrl] = useState(`https://vimeo.com/${video.vimeo_id}`);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(video.thumbnail_url);
  const [mainGenre, setMainGenre] = useState<MainGenreKey>(video.genre as MainGenreKey);
  const [subGenre, setSubGenre] = useState<SubGenreKey>((video.sub_genre ?? "drama") as SubGenreKey);
  const [tools, setTools] = useState<string[]>(video.ai_tools ?? []);
  const [otherText, setOtherText] = useState<Partial<Record<CatKey, string>>>({});
  const [otherOpen, setOtherOpen] = useState<Record<CatKey, boolean>>({
    image: false,
    video: false,
    music: false,
  });
  const [tagInput, setTagInput] = useState(video.tags?.map((t) => `#${t}`).join(", ") ?? "");
  const [seriesName, setSeriesName] = useState(video.series_name ?? "");
  const [episodeNumber, setEpisodeNumber] = useState(video.episode_number ?? 1);
  const [isSeriesMode, setIsSeriesMode] = useState(Boolean(seriesName));
  const [description, setDescription] = useState(video.description ?? "");
  const [runtimeMinutes, setRuntimeMinutes] = useState(video.runtime ? parseInt(video.runtime.split(":")[0]) : 5);
  const [visibility, setVisibility] = useState<"public" | "private">(video.visibility as "public" | "private");
  const [purpose, setPurpose] = useState<"personal" | "competition">(video.purpose as "personal" | "competition");
  const [competitionId, setCompetitionId] = useState(competitions[0]?.id ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [existingSeries, setExistingSeries] = useState<{ name: string; nextEpisode: number }[]>([]);
  const [isNewSeries, setIsNewSeries] = useState(false);

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
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError(t("upload.errTitle"));
      return;
    }
    if (runtimeMinutes < 1) {
      setError(t("upload.errRuntime"));
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

      const aiTools = buildAiToolsPayload(tools, otherText);

      const res = await updateVideoAction(
        video.id,
        {
          title: title.trim(),
          vimeoUrl,
          thumbnailUrl: thumbnailFile ? publicUrl : video.thumbnail_url,
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

  return (
    <div className="w-full">
      <input
        ref={thumbInputRef}
        id="uv-thumb-input"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onThumbChange}
      />

      <form onSubmit={(e) => void submit(e)}>
        <div
          className="rounded-2xl border border-white/[0.08] p-3"
          style={{
            background: "linear-gradient(135deg, rgba(20,17,50,0.98) 0%, rgba(10,8,28,0.99) 100%)",
            boxShadow: "0 0 0 1px rgba(127,119,221,0.08), inset 0 1px 0 rgba(127,119,221,0.05)",
          }}
        >
          {/* 헤더 */}
          <div className="mb-3 flex items-end justify-between border-b border-white/[0.06] pb-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7F77DD]/60">{t("upload.editEyebrow")}</p>
              <h1 className="mt-0.5 text-xl font-black tracking-tight text-white">{t("upload.editTitle")}</h1>
            </div>
            <p className="text-sm text-white/25">{t("upload.editSubtitle")}</p>
          </div>

          <div className="space-y-3">
            {/* 상단 — 썸네일 + Film Details */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_2fr]">
              {/* 썸네일 */}
              <div
                className="rounded-xl border border-white/[0.08] p-2.5"
                style={{ background: "rgba(255,255,255,0.025)" }}
              >
                <h2 className="mb-2 border-b border-[#7F77DD]/20 pb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC]">
                  {t("upload.sectionPosterThumb")}
                </h2>
                <div className="relative overflow-hidden rounded-xl border border-white/[0.08]">
                  <div className="aspect-video w-full bg-black">
                    <img
                      src={thumbnailPreview ?? "/placeholder-user.jpg"}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={openThumbPicker}
                    className="absolute right-2 top-2 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/90"
                  >
                    {t("upload.change")}
                  </button>
                </div>
              </div>

              {/* Film Details */}
              <div
                className="rounded-xl border border-white/[0.08] p-2.5"
                style={{ background: "rgba(255,255,255,0.025)" }}
              >
                <h2 className="mb-2 border-b border-[#7F77DD]/20 pb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC]">
                  {t("upload.sectionFilmDetails")}
                </h2>
                <div className="space-y-2">
                  <div>
                    <label className={lbl}>{t("upload.labelTitle")}</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className={inp}
                      placeholder={t("upload.placeholderTitle")}
                    />
                  </div>
                  <div>
                    <label className={lbl}>{t("upload.vimeoUrlOptional")}</label>
                    <input
                      value={vimeoUrl}
                      onChange={(e) => setVimeoUrl(e.target.value)}
                      className={inp}
                      placeholder="https://vimeo.com/..."
                    />
                  </div>
                  <div>
                    <label className={lbl}>{t("upload.labelDescription")}</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className={`${inp} resize-none`}
                      placeholder={t("upload.placeholderDescriptionOptional")}
                    />
                  </div>
                  <div>
                    <label className={lbl}>{t("upload.tagsWithMax").replace("{max}", String(MAX_VIDEO_TAGS))}</label>
                    <input
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
            </div>

            {/* 하단 — AI Tools + Settings */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_0.7fr]">
              {/* AI Tools */}
              <div
                className="rounded-xl border border-white/[0.08] p-2.5"
                style={{ background: "rgba(83,74,183,0.06)", borderColor: "rgba(127,119,221,0.1)" }}
              >
                <h2 className="mb-2 border-b border-[#7F77DD]/20 pb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC]">
                  {t("upload.sectionAiToolsUsed")}
                </h2>
                <div className="space-y-2">
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

              {/* Settings */}
              <div className="space-y-1.5">
                <div
                  className="rounded-xl border border-white/[0.08] p-2.5"
                  style={{ background: "rgba(83,74,183,0.08)", borderColor: "rgba(127,119,221,0.12)" }}
                >
                  <h2 className="mb-2 border-b border-[#7F77DD]/20 pb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#AFA9EC]">
                    {t("upload.sectionSettingsPanel")}
                  </h2>
                  <div className="space-y-1.5">
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
                              className="text-[11px] text-[#7F77DD] transition hover:text-[#AFA9EC]"
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
                                className="text-[11px] text-[#7F77DD] transition hover:text-[#AFA9EC]"
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

                    <div>
                      <p className={lbl}>{t("upload.visibilityLabel")}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(["public", "private"] as const).map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setVisibility(v)}
                            className="relative flex items-center justify-center gap-1.5 rounded-xl border py-1.5 text-sm font-medium transition"
                            style={{
                              borderColor: visibility === v ? "rgba(127,119,221,0.5)" : "rgba(255,255,255,0.06)",
                              background: visibility === v ? "rgba(83,74,183,0.35)" : "rgba(255,255,255,0.02)",
                              color: visibility === v ? "#AFA9EC" : "rgba(255,255,255,0.55)",
                            }}
                          >
                            <span>{v === "public" ? "🌐" : "🔒"}</span>
                            <span>{v === "public" ? t("upload.public") : t("upload.private")}</span>
                            {visibility === v && (
                              <span className="absolute right-2.5 h-1.5 w-1.5 rounded-full bg-[#7F77DD]" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className={lbl}>{t("upload.uploadPurposeLabel")}</p>
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
                              color: purpose === v ? "#AFA9EC" : "rgba(255,255,255,0.55)",
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

                    {purpose === "competition" && competitions.length > 0 && (
                      <div>
                        <label className={lbl}>{t("upload.selectCompetition")}</label>
                        <CustomSelect
                          value={competitionId}
                          onChange={setCompetitionId}
                          options={competitions.map((c) => ({ value: c.id, label: c.title }))}
                          placeholder={t("upload.selectCompetitionPlaceholder")}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #534AB7 0%, #7B6FE8 100%)",
                    boxShadow: "0 4px 20px rgba(83,74,183,0.4)",
                  }}
                >
                  {loading ? t("settings.saving") : t("upload.editSaveCta")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
