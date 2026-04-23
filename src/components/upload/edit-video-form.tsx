"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { updateVideoAction } from "@/app/actions/video";
import {
  AI_TOOL_CATEGORIES,
  buildAiToolsPayload,
  normalizeToolName,
  parseAiToolsFromVideo,
} from "@/lib/constants/ai-tools";
import {
  FEED_GENRE_KEYS,
  FEED_GENRE_LABELS,
  FILMS_GENRE_KEYS,
  FILMS_GENRE_LABELS,
  LEGACY_MISC_GENRE_KEYS,
  MAIN_GENRE_KEYS,
  MAIN_GENRE_LABELS,
  needsSubGenre,
  SUB_GENRE_KEYS,
  SUB_GENRE_LABELS,
  type MainGenreKey,
  type SubGenreKey,
} from "@/lib/constants/genres";
import { MAX_VIDEO_TAGS, parseHashtagTagInput } from "@/lib/tags";
import { parseRuntimeMinutes } from "@/lib/video-runtime";
import type { Video } from "@/lib/types";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

const inp =
  "w-full rounded-md border border-white/10 bg-[#0A0A18]/70 px-3 py-2 text-sm text-[#EEEDFE] placeholder:text-[#AFA9EC]/40 outline-none focus:border-[#7F77DD]/50 focus:ring-1 focus:ring-[#7F77DD]/30";
const inpReadonly =
  "w-full cursor-not-allowed rounded-md border border-white/10 bg-[#0A0A18]/50 px-3 py-2 text-sm text-[#AFA9EC]/90";
const lbl = "mb-1.5 block text-xs font-medium text-[#AFA9EC]/90";

type CatKey = (typeof AI_TOOL_CATEGORIES)[number]["key"];

function initialMainGenre(v: Video): MainGenreKey {
  return MAIN_GENRE_KEYS.includes(v.genre as MainGenreKey) ? (v.genre as MainGenreKey) : "short_film";
}

function initialSubGenre(v: Video): SubGenreKey {
  const s = v.subGenre;
  if (s && SUB_GENRE_KEYS.includes(s as SubGenreKey)) return s as SubGenreKey;
  return "drama";
}

function tagInputFromVideo(tags: string[]): string {
  if (!tags.length) return "";
  return tags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(", ");
}

type Props = {
  video: Video;
  userId: string;
};

export function EditVideoForm({ video, userId }: Props) {
  const router = useRouter();
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const parsed = parseAiToolsFromVideo(video.aiTools ?? []);

  const [title, setTitle] = useState(video.title);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [blobPreview, setBlobPreview] = useState<string | null>(null);
  const existingThumb = video.thumbnailUrl;

  const [mainGenre, setMainGenre] = useState<MainGenreKey>(() => initialMainGenre(video));
  const [subGenre, setSubGenre] = useState<SubGenreKey>(() => initialSubGenre(video));
  const [tools, setTools] = useState<string[]>(() => parsed.tools);
  const [otherText, setOtherText] = useState<Partial<Record<CatKey, string>>>(() => parsed.otherText);
  const [otherOpen, setOtherOpen] = useState<Record<CatKey, boolean>>(() => parsed.otherOpen);

  const [tagInput, setTagInput] = useState(() => tagInputFromVideo(video.tags ?? []));
  const [seriesName, setSeriesName] = useState(video.seriesName ?? "");
  const [episodeNumber, setEpisodeNumber] = useState(video.episodeNumber ?? 1);

  const [description, setDescription] = useState(video.description ?? "");
  const [runtimeMinutes, setRuntimeMinutes] = useState(() => parseRuntimeMinutes(video.runtime));
  const [visibility, setVisibility] = useState<"public" | "private">(video.visibility);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showSubGenre = needsSubGenre(mainGenre);
  const isSeries = mainGenre === "series";
  const tagPreview = parseHashtagTagInput(tagInput);
  const thumbDisplay = blobPreview ?? existingThumb;
  const vimeoDisplayUrl = `https://vimeo.com/${video.vimeoId}`;
  const purposeLabel = video.purpose === "competition" ? "Competition Entry" : "Personal Work";

  useEffect(() => {
    if (!isSeries) {
      setSeriesName("");
      setEpisodeNumber(1);
    }
  }, [isSeries]);

  useEffect(() => {
    return () => {
      if (blobPreview) URL.revokeObjectURL(blobPreview);
    };
  }, [blobPreview]);

  const toggleTool = (t: string) => {
    const c = normalizeToolName(t);
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
      setError("Please select an image file.");
      return;
    }
    if (f.size > 6 * 1024 * 1024) {
      setError("Maximum file size is 6MB.");
      return;
    }
    setBlobPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
    setThumbnailFile(f);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }
    if (runtimeMinutes < 1) {
      setError("Please check the runtime.");
      return;
    }
    if (showSubGenre && !subGenre) {
      setError("Please select a sub genre.");
      return;
    }
    if (isSeries) {
      if (!seriesName.trim()) {
        setError("Please enter a series name.");
        return;
      }
      if (!episodeNumber || episodeNumber < 1) {
        setError("Please enter an episode number.");
        return;
      }
    }

    const tags = parseHashtagTagInput(tagInput);
    if (tags.length > MAX_VIDEO_TAGS) {
      setError(`You can add up to ${MAX_VIDEO_TAGS} tags.`);
      return;
    }

    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setError("Please check your Supabase configuration.");
      return;
    }

    setLoading(true);
    try {
      let thumbnailUrl = existingThumb;
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
        thumbnailUrl = publicUrl;
      }

      const aiTools = buildAiToolsPayload(tools, otherText);

      const res = await updateVideoAction(video.id, {
        title: title.trim(),
        thumbnailUrl,
        genre: mainGenre,
        subGenre: showSubGenre ? subGenre : null,
        aiTools,
        tags,
        seriesName: isSeries ? seriesName.trim() : null,
        episodeNumber: isSeries ? episodeNumber : null,
        description,
        runtimeMinutes: Math.round(runtimeMinutes),
        visibility,
      });

      if (!res.ok) {
        setError(res.message);
        return;
      }

      router.push(`/watch/${video.id}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="mx-auto max-w-6xl space-y-6 pb-4">
      <input
        ref={thumbInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onThumbChange}
        aria-label="Thumbnail file"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8">
        <div className="space-y-4 lg:col-span-3">
          <div>
            <label className={lbl} htmlFor="ev-title">
              Title
            </label>
            <input
              id="ev-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={inp}
              placeholder="Film title"
            />
          </div>

          <div>
            <label className={lbl} htmlFor="ev-vimeo">
              Vimeo URL <span className="text-[#AFA9EC]/60">(Read only)</span>
            </label>
            <input id="ev-vimeo" readOnly value={vimeoDisplayUrl} className={inpReadonly} />
          </div>

          <div>
            <label className={lbl} htmlFor="ev-desc">
              Description
            </label>
            <textarea
              id="ev-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inp} resize-y`}
              placeholder="Optional"
            />
          </div>

          <div>
            <label className={lbl} htmlFor="ev-tags">
              Tags (start with #, comma-separated · max {MAX_VIDEO_TAGS})
            </label>
            <input
              id="ev-tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className={inp}
              placeholder="#AIFilm, #ShortFilm, #Runway"
            />
            {tagPreview.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {tagPreview.map((t) => (
                  <span key={t} className="rounded-full bg-[#534AB7]/50 px-2.5 py-0.5 text-xs text-[#EEEDFE]">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {isSeries && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={lbl} htmlFor="ev-series">
                  Series Name
                </label>
                <input
                  id="ev-series"
                  value={seriesName}
                  onChange={(e) => setSeriesName(e.target.value)}
                  className={inp}
                  placeholder="e.g. City Noise"
                />
              </div>
              <div>
                <label className={lbl} htmlFor="ev-ep">
                  Episode
                </label>
                <input
                  id="ev-ep"
                  type="number"
                  min={1}
                  value={episodeNumber}
                  onChange={(e) => setEpisodeNumber(Number(e.target.value))}
                  className={inp}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[4.5rem]">
              <label className={lbl} htmlFor="ev-run">
                min
              </label>
              <input
                id="ev-run"
                type="number"
                min={1}
                value={runtimeMinutes}
                onChange={(e) => setRuntimeMinutes(Number(e.target.value))}
                className={inp}
              />
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-3 pb-0.5">
              <span className="text-xs text-[#AFA9EC]/80">Visibility</span>
              <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-[#EEEDFE]">
                <input
                  type="radio"
                  name="vis-ev"
                  checked={visibility === "public"}
                  onChange={() => setVisibility("public")}
                  className="h-3 w-3 border-[#AFA9EC] bg-[#0A0A18] text-[#534AB7]"
                />
                Public
              </label>
              <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-[#EEEDFE]">
                <input
                  type="radio"
                  name="vis-ev"
                  checked={visibility === "private"}
                  onChange={() => setVisibility("private")}
                  className="h-3 w-3 border-[#AFA9EC] bg-[#0A0A18] text-[#534AB7]"
                />
                Private
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div>
            <span className={lbl}>Thumbnail</span>
            {thumbDisplay ? (
              <div className="relative overflow-hidden rounded-lg border border-white/10">
                <div className="aspect-video min-h-[220px] w-full bg-black/40 sm:min-h-[260px]">
                  <img src={thumbDisplay} alt="" className="h-full w-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={openThumbPicker}
                  className="absolute right-2 top-2 rounded bg-black/65 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm"
                >
                  {thumbnailFile ? "Select Again" : "Change"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={openThumbPicker}
                className="flex min-h-[220px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#7F77DD]/35 bg-[#0A0A18]/40 px-3 py-8 text-xs text-[#AFA9EC] transition hover:border-[#7F77DD]/55 sm:min-h-[260px]"
              >
                <span>Click to Upload Thumbnail</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={lbl} htmlFor="ev-main">
                Genre
              </label>
              <select
                id="ev-main"
                value={mainGenre}
                onChange={(e) => setMainGenre(e.target.value as MainGenreKey)}
                className={inp}
              >
                <optgroup label="Feed Genres">
                  {FEED_GENRE_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {FEED_GENRE_LABELS[k]}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Films Genres">
                  {FILMS_GENRE_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {FILMS_GENRE_LABELS[k]}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Legacy">
                  {LEGACY_MISC_GENRE_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {MAIN_GENRE_LABELS[k]}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            {showSubGenre ? (
              <div>
                <label className={lbl} htmlFor="ev-sub">
                  Sub Genre
                </label>
                <select
                  id="ev-sub"
                  value={subGenre}
                  onChange={(e) => setSubGenre(e.target.value as SubGenreKey)}
                  className={inp}
                >
                  {SUB_GENRE_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {SUB_GENRE_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div />
            )}
          </div>

          <div>
            <span className={lbl}>Upload Purpose</span>
            <p className="rounded-md border border-white/10 bg-[#0A0A18]/50 px-3 py-2 text-sm text-[#AFA9EC]">
              {purposeLabel}
              <span className="ml-2 text-xs text-[#AFA9EC]/60">(Read only)</span>
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-[#1A1535]/40 p-4 sm:p-5">
        {AI_TOOL_CATEGORIES.map((cat) => {
          const otherActive = otherOpen[cat.key] || Boolean(otherText[cat.key]?.trim());
          return (
            <div key={cat.key} className="mb-4 last:mb-0">
              <p className="mb-2 text-xs font-semibold text-[#AFA9EC]/90">{cat.label}</p>
              <div className="flex flex-wrap gap-2">
                {cat.tools.map((opt) => {
                  const canon = normalizeToolName(opt);
                  const on = tools.some((t) => normalizeToolName(t) === canon);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleTool(canon)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        on
                          ? "bg-[#534AB7] text-[#EEEDFE] ring-1 ring-[#7F77DD]/60"
                          : "bg-[#0A0A18]/80 text-[#AFA9EC] ring-1 ring-white/10 hover:ring-white/20"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => toggleOtherOpen(cat.key)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    otherActive
                      ? "bg-[#7F77DD]/40 text-[#EEEDFE] ring-1 ring-[#7F77DD]/70"
                      : "bg-[#0A0A18]/80 text-[#AFA9EC] ring-1 ring-dashed ring-white/20 hover:ring-white/35"
                  }`}
                >
                  Other
                </button>
              </div>
              {(otherOpen[cat.key] || Boolean(otherText[cat.key]?.trim())) && (
                <input
                  type="text"
                  value={otherText[cat.key] ?? ""}
                  onChange={(e) =>
                    setOtherText((o) => ({
                      ...o,
                      [cat.key]: e.target.value,
                    }))
                  }
                  className={`${inp} mt-1.5`}
                  placeholder="Custom input"
                />
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="rounded-md bg-red-950/40 px-3 py-2 text-sm text-red-200">{error}</p>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={`/watch/${video.id}`}
          className="inline-flex items-center justify-center rounded-md border border-white/20 bg-transparent px-5 py-2.5 text-center text-base font-semibold text-[#EEEDFE] transition hover:bg-white/5"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-w-[8rem] items-center justify-center rounded-md bg-[#534AB7] px-5 py-2.5 text-base font-semibold text-[#EEEDFE] transition hover:bg-[#7F77DD] disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
