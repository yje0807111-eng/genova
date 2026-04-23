"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createVideoAction } from "@/app/actions/video";
import { AI_TOOL_CATEGORIES, buildAiToolsPayload, normalizeToolName } from "@/lib/constants/ai-tools";
import {
  FEED_GENRE_KEYS,
  FEED_GENRE_LABELS,
  FILMS_GENRE_KEYS,
  FILMS_GENRE_LABELS,
  needsSubGenre,
  SUB_GENRE_KEYS,
  SUB_GENRE_LABELS,
  type MainGenreKey,
  type SubGenreKey,
} from "@/lib/constants/genres";
import { MAX_VIDEO_TAGS, parseHashtagTagInput } from "@/lib/tags";
import { extractVimeoId } from "@/lib/vimeo";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

type Props = {
  userId: string;
  competitions: { id: string; title: string }[];
};

const inp =
  "w-full rounded-md border border-white/10 bg-[#0A0A18]/70 px-3 py-2 text-sm text-[#EEEDFE] placeholder:text-[#AFA9EC]/40 outline-none focus:border-[#7F77DD]/50 focus:ring-1 focus:ring-[#7F77DD]/30";
const lbl = "mb-1.5 block text-xs font-medium text-[#AFA9EC]/90";

type CatKey = (typeof AI_TOOL_CATEGORIES)[number]["key"];

export function UploadVideoForm({ userId, competitions }: Props) {
  const router = useRouter();
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [vimeoUrl, setVimeoUrl] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [mainGenre, setMainGenre] = useState<MainGenreKey>("short_film");
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

  const [description, setDescription] = useState("");
  const [runtimeMinutes, setRuntimeMinutes] = useState(5);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [purpose, setPurpose] = useState<"personal" | "competition">("personal");
  const [competitionId, setCompetitionId] = useState(competitions[0]?.id ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vimeoPreview = extractVimeoId(vimeoUrl);
  const showSubGenre = needsSubGenre(mainGenre);
  const isSeries = mainGenre === "series";
  const tagPreview = parseHashtagTagInput(tagInput);

  useEffect(() => {
    if (!isSeries) {
      setSeriesName("");
      setEpisodeNumber(1);
    }
  }, [isSeries]);

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
    setThumbnailPreview((prev) => {
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
    if (!vimeoPreview) {
      setError("Please check the Vimeo URL.");
      return;
    }
    if (!thumbnailFile) {
      setError("Please select a thumbnail.");
      return;
    }
    if (runtimeMinutes < 1) {
      setError("Please check the runtime.");
      return;
    }
    if (purpose === "competition" && !competitionId) {
      setError("Please select a competition.");
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

      const aiTools = buildAiToolsPayload(tools, otherText);

      const res = await createVideoAction({
        title: title.trim(),
        vimeoUrl,
        thumbnailUrl: publicUrl,
        genre: mainGenre,
        subGenre: showSubGenre ? subGenre : null,
        purpose,
        aiTools,
        tags,
        seriesName: isSeries ? seriesName.trim() : null,
        episodeNumber: isSeries ? episodeNumber : null,
        description,
        runtimeMinutes: Math.round(runtimeMinutes),
        visibility,
        submittedCompetitionId: purpose === "competition" ? competitionId : null,
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
    <form onSubmit={(e) => void submit(e)} className="mx-auto max-w-6xl space-y-6 pb-4">
      <input
        ref={thumbInputRef}
        id="uv-thumb-input"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onThumbChange}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-8">
        <div className="space-y-4 lg:col-span-3">
          <div>
            <label className={lbl} htmlFor="uv-title">
              Title
            </label>
            <input
              id="uv-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={inp}
              placeholder="Film title"
            />
          </div>
          <div>
            <label className={lbl} htmlFor="uv-vimeo">
              Vimeo URL
            </label>
            <input
              id="uv-vimeo"
              value={vimeoUrl}
              onChange={(e) => setVimeoUrl(e.target.value)}
              className={inp}
              placeholder="vimeo.com/..."
            />
          </div>
          <div>
            <label className={lbl} htmlFor="uv-desc">
              Description
            </label>
            <textarea
              id="uv-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inp} resize-y`}
              placeholder="Optional"
            />
          </div>

          <div>
            <label className={lbl} htmlFor="uv-tags">
              Tags (start with #, comma-separated · max {MAX_VIDEO_TAGS})
            </label>
            <input
              id="uv-tags"
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
                <label className={lbl} htmlFor="uv-series">
                  Series Name
                </label>
                <input
                  id="uv-series"
                  value={seriesName}
                  onChange={(e) => setSeriesName(e.target.value)}
                  className={inp}
                  placeholder="e.g. City Noise"
                />
              </div>
              <div>
                <label className={lbl} htmlFor="uv-ep">
                  Episode
                </label>
                <input
                  id="uv-ep"
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
              <label className={lbl} htmlFor="uv-run">
                min
              </label>
              <input
                id="uv-run"
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
                  name="vis"
                  checked={visibility === "public"}
                  onChange={() => setVisibility("public")}
                  className="h-3 w-3 border-[#AFA9EC] bg-[#0A0A18] text-[#534AB7]"
                />
                Public
              </label>
              <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-[#EEEDFE]">
                <input
                  type="radio"
                  name="vis"
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
            {!thumbnailPreview ? (
              <button
                type="button"
                onClick={openThumbPicker}
                className="flex min-h-[220px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#7F77DD]/35 bg-[#0A0A18]/40 px-3 py-8 text-xs text-[#AFA9EC] transition hover:border-[#7F77DD]/55 sm:min-h-[260px]"
              >
                <svg className="h-9 w-9 text-[#7F77DD]/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 16v-8m0 0-3 3m3-3 3 3M4 17h16" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Click to Upload</span>
              </button>
            ) : (
              <div className="relative overflow-hidden rounded-lg border border-white/10">
                <div className="aspect-video min-h-[220px] w-full bg-black/40 sm:min-h-[260px]">
                  <img src={thumbnailPreview} alt="" className="h-full w-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={openThumbPicker}
                  className="absolute right-2 top-2 rounded bg-black/65 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm"
                >
                  Change
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={lbl} htmlFor="uv-main">
                Genre
              </label>
              <select
                id="uv-main"
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
              </select>
            </div>
            {showSubGenre ? (
              <div>
                <label className={lbl} htmlFor="uv-sub">
                  Sub Genre
                </label>
                <select
                  id="uv-sub"
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

          <div className="space-y-1.5">
            <span className={lbl}>Upload Purpose</span>
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-[#EEEDFE]">
                <input
                  type="radio"
                  name="purpose"
                  checked={purpose === "personal"}
                  onChange={() => setPurpose("personal")}
                  className="h-3 w-3"
                />
                Personal Work
              </label>
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-[#EEEDFE]">
                <input
                  type="radio"
                  name="purpose"
                  checked={purpose === "competition"}
                  onChange={() => setPurpose("competition")}
                  className="h-3 w-3"
                />
                Competition Entry
              </label>
            </div>
          </div>

          {purpose === "competition" && (
            <div>
              <label className={lbl} htmlFor="uv-comp">
                Competition
              </label>
              {competitions.length > 0 ? (
                <select
                  id="uv-comp"
                  value={competitionId}
                  onChange={(e) => setCompetitionId(e.target.value)}
                  className={inp}
                >
                  {competitions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-amber-200/90">No active competitions.</p>
              )}
            </div>
          )}
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

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-[#534AB7] py-2.5 text-base font-semibold text-[#EEEDFE] transition hover:bg-[#7F77DD] disabled:opacity-50"
      >
        {loading ? "Processing..." : "Upload"}
      </button>
    </form>
  );
}
