"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MAIN_GENRE_LABELS } from "@/lib/constants/genres";
import { trackHashtagEvent } from "@/lib/hashtags/client-track";
import { EXPLORE_GENRE_KEYS } from "@/lib/search-ui";
import type { SearchGenreMatch, SearchProfile } from "@/lib/queries/search-queries";
import type { Video } from "@/lib/types";
import { HighlightText } from "@/components/ui/highlight-text";
import { useI18n } from "@/components/genova/language-provider";

type SuggestResponse = {
  videos: Video[];
  profiles: SearchProfile[];
  tags: string[];
  genre: SearchGenreMatch | null;
};

type ExploreResponse = {
  videos: Video[];
  profiles: SearchProfile[];
};

function SearchSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-10 rounded-lg bg-white/10" />
      ))}
    </div>
  );
}

export function SearchNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelEntered, setPanelEntered] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(false);
  const [exploreLoading, setExploreLoading] = useState(false);
  const [explore, setExplore] = useState<ExploreResponse | null>(null);
  const [suggest, setSuggest] = useState<SuggestResponse>({
    videos: [],
    profiles: [],
    tags: [],
    genre: null,
  });

  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (pathname !== "/search") return;
    const qFromUrl = (searchParams.get("q") ?? "").replace(/^#+/, "").trim();
    setQuery(qFromUrl);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!open || pathname !== "/search") return;
    const id = window.setTimeout(() => inputRef.current?.select(), 80);
    return () => window.clearTimeout(id);
  }, [open, pathname]);

  useEffect(() => {
    if (!open || debounced) return;
    const ac = new AbortController();
    setExploreLoading(true);
    void fetch("/api/search/explore", { signal: ac.signal })
      .then((r) => r.json())
      .then((d: ExploreResponse) => setExplore(d))
      .catch(() => setExplore({ videos: [], profiles: [] }))
      .finally(() => setExploreLoading(false));
    return () => ac.abort();
  }, [open, debounced]);

  useEffect(() => {
    if (!open || !debounced) {
      setSuggest({ videos: [], profiles: [], tags: [], genre: null });
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    void fetch(`/api/search/suggest?q=${encodeURIComponent(debounced)}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((d: SuggestResponse) => setSuggest(d))
      .catch(() => setSuggest({ videos: [], profiles: [], tags: [], genre: null }))
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [debounced, open]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeSearch]);

  useEffect(() => {
    if (!open) {
      setPanelEntered(false);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = requestAnimationFrame(() => setPanelEntered(true));
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const onBackdropPointerDown = (e: React.PointerEvent) => {
    if (e.target === overlayRef.current) closeSearch();
  };

  const goSearch = (qRaw?: string, tab?: "all" | "videos" | "creators" | "tags", hash?: string) => {
    const q = (qRaw ?? query).trim();
    if (!q) return;
    if (tab === "tags") trackHashtagEvent(q, "click");
    closeSearch();
    const p = new URLSearchParams();
    p.set("q", q.replace(/^#+/, ""));
    if (tab && tab !== "all") p.set("tab", tab);
    const qs = p.toString();
    router.push(`/search?${qs}${hash ?? ""}`);
  };

  const hasSuggest =
    suggest.videos.length +
      suggest.profiles.length +
      suggest.tags.length +
      (suggest.genre ? 1 : 0) >
    0;

  const heading = useMemo(
    () => (
      <div className="flex items-center gap-2 text-[#AFA9EC]">
        <svg className="h-6 w-6 text-[#EEEDFE]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span className="text-sm font-semibold tracking-wide">Search</span>
      </div>
    ),
    [],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full p-2 text-[#EEEDFE] transition hover:bg-white/10"
        aria-label="Open search"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>

      {mounted && open
        ? createPortal(
            <div role="presentation" className="pointer-events-none fixed inset-0 z-40">
              <div
                ref={overlayRef}
                onPointerDown={onBackdropPointerDown}
                className="pointer-events-auto fixed inset-0 bg-black/65 backdrop-blur-md transition-opacity duration-300 ease-out"
                aria-hidden
              />
              <div
                className={`pointer-events-none fixed inset-0 z-[41] flex justify-center px-4 py-8 transition-[opacity,transform] duration-300 ease-out ${
                  panelEntered ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
                }`}
              >
                <div
                  ref={panelRef}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="pointer-events-auto flex h-full max-h-[92dvh] min-h-0 w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl"
                  style={{
                    background: "linear-gradient(135deg, rgba(15,13,36,0.99) 0%, rgba(8,6,24,1) 100%)",
                    boxShadow: "0 0 0 1px rgba(127,119,221,0.08), 0 40px 80px rgba(0,0,0,0.8)",
                  }}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Search"
                >
              <div className="border-b border-white/10 px-6 py-8 sm:px-12">
                <div className="mb-4 flex items-center justify-between gap-3">
                  {heading}
                  <button
                    type="button"
                    onClick={closeSearch}
                    className="rounded-full p-2 text-[#AFA9EC] hover:bg-white/10 hover:text-[#EEEDFE]"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
                <div className="relative">
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        goSearch();
                      }
                      if (e.key === "Escape") {
                        closeSearch();
                      }
                    }}
                    placeholder={t("search.overlayPlaceholder")}
                    className="w-full rounded-2xl border border-white/[0.12] bg-[#0d0b20] py-5 pl-6 pr-28 text-2xl text-white outline-none transition placeholder:text-white/20 focus:border-[#7F77DD]/60 focus:ring-2 focus:ring-[#534AB7]/30"
                  />
                  <button
                    type="button"
                    onClick={() => goSearch()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                    style={{
                      background: "linear-gradient(135deg, #534AB7 0%, #7B6FE8 100%)",
                      boxShadow: "0 4px 16px rgba(83,74,183,0.4)",
                    }}
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8">
                {loading || exploreLoading ? (
                  debounced ? (
                    <SearchSkeleton />
                  ) : (
                    <div className="space-y-8">
                      <div>
                        <div className="mb-3 h-5 w-40 animate-pulse rounded bg-white/10" />
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="aspect-video animate-pulse rounded-lg bg-white/10" />
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                ) : debounced ? (
                  <div className="space-y-6">
                    {!hasSuggest && !loading ? (
                      <p className="text-center text-sm text-[#AFA9EC]">No results found</p>
                    ) : (
                      <>
                        {suggest.genre ? (
                          <section>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#AFA9EC]">Genre</p>
                            <Link
                              href={`/genre/${suggest.genre.slug}`}
                              onClick={() => {
                                setOpen(false);
                                setQuery("");
                              }}
                              className="inline-flex rounded-lg border border-[#7F77DD]/40 bg-[#534AB7]/25 px-4 py-2 text-sm font-semibold text-[#EEEDFE] transition hover:bg-[#534AB7]/40"
                            >
                              {suggest.genre.label} View All →
                            </Link>
                          </section>
                        ) : null}
                        {suggest.videos.length > 0 ? (
                          <section>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#AFA9EC]">Films</p>
                            <ul className="space-y-1">
                              {suggest.videos.map((v) => (
                                <li key={v.id}>
                                  <Link
                                    href={`/watch/${v.id}`}
                                    onClick={() => {
                                      setOpen(false);
                                      setQuery("");
                                    }}
                                    className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-[#EEEDFE] hover:bg-white/10"
                                  >
                                    <div className="h-12 w-20 shrink-0 overflow-hidden rounded-md bg-black/30">
                                      <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                                    </div>
                                    <span className="min-w-0 flex-1 truncate">
                                      <HighlightText text={v.title} query={debounced} />
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </section>
                        ) : null}
                        {suggest.profiles.length > 0 ? (
                          <section>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#AFA9EC]">
                              Creators
                            </p>
                            <ul className="space-y-1">
                              {suggest.profiles.map((p) => (
                                <li key={p.id}>
                                  <Link
                                    href={`/profile/${p.id}`}
                                    onClick={() => {
                                      setOpen(false);
                                      setQuery("");
                                    }}
                                    className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-white/10"
                                  >
                                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#26215C]">
                                      {p.avatarUrl ? (
                                        <img src={p.avatarUrl} alt="" className="h-full w-full object-cover" />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xs text-[#AFA9EC]">
                                          ?
                                        </div>
                                      )}
                                    </div>
                                    <span className="font-medium text-[#EEEDFE]">
                                      <HighlightText text={p.displayName ?? "User"} query={debounced} />
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </section>
                        ) : null}
                        {suggest.tags.length > 0 ? (
                          <section>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#AFA9EC]">Tags</p>
                            <div className="flex flex-wrap gap-2">
                              {suggest.tags.map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => goSearch(t, "tags", "#search-tags-section")}
                                  className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-[#EEEDFE] hover:bg-[#534AB7]/50"
                                >
                                  #{t}
                                </button>
                              ))}
                            </div>
                          </section>
                        ) : null}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => goSearch()}
                            className="w-full rounded-xl border border-[#7F77DD]/35 bg-[#1A1535] py-3 text-sm font-semibold text-[#EEEDFE] transition hover:border-[#7F77DD]/60 hover:bg-[#26215C]"
                          >
                            View All Results
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-10 pb-6">
                    <Link
                      href="/competition"
                      onClick={() => setOpen(false)}
                      className="block overflow-hidden rounded-2xl border border-[#534AB7]/40 bg-gradient-to-r from-[#534AB7]/40 via-[#3C3489]/50 to-[#1A1535] px-6 py-5 transition hover:border-[#7F77DD]/70"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#E8E4FF]/90">Genova Competition</p>
                      <p className="mt-1 text-lg font-bold text-[#EEEDFE]">Browse Competition Entries</p>
                      <p className="mt-2 text-sm text-[#AFA9EC]">Explore trending entries and past winners in one place.</p>
                      <span className="mt-3 inline-block text-sm font-semibold text-[#7F77DD]">Explore →</span>
                    </Link>

                    <section>
                      <h3 className="mb-4 text-lg font-bold text-[#EEEDFE]">Featured Today</h3>
                      {explore?.videos?.length ? (
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                          {explore.videos.map((v) => (
                            <Link
                              key={v.id}
                              href={`/watch/${v.id}`}
                              onClick={() => setOpen(false)}
                              className="group/card relative block overflow-hidden rounded-xl border border-white/[0.08] transition hover:scale-[1.03] hover:border-[#7F77DD]/40"
                            >
                              <div className="relative aspect-video w-full overflow-hidden">
                                <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105" />
                                <div className="absolute inset-x-0 bottom-0 z-[1]" style={{ height: "75%", background: "linear-gradient(to top, rgba(8,6,24,1) 0%, rgba(8,6,24,0.8) 40%, transparent 100%)" }} />
                                <div className="absolute bottom-0 left-0 right-0 z-[2] px-2.5 pb-2">
                                  <p className="line-clamp-1 text-[12px] font-bold text-white">{v.title}</p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-[#AFA9EC]">No recommendations yet.</p>
                      )}
                    </section>

                    <section>
                      <h3 className="mb-4 text-lg font-bold text-[#EEEDFE]">Trending Creators</h3>
                      {explore?.profiles?.length ? (
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                          {explore.profiles.map((p) => (
                            <Link
                              key={p.id}
                              href={`/profile/${p.id}`}
                              onClick={() => setOpen(false)}
                              className="flex flex-col items-center rounded-xl border border-white/[0.08] p-4 text-center transition hover:border-[#7F77DD]/30"
                              style={{ background: "rgba(255,255,255,0.02)" }}
                            >
                              <div className="mb-2 h-12 w-12 overflow-hidden rounded-full border border-white/10" style={{ boxShadow: "0 0 0 2px rgba(83,74,183,0.3)" }}>
                                {p.avatarUrl ? (
                                  <img src={p.avatarUrl} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-sm text-white/40 bg-[#26215C]">?</div>
                                )}
                              </div>
                              <p className="truncate text-sm font-bold text-white">{p.displayName ?? "Creator"}</p>
                              <p className="mt-0.5 text-[11px] text-white/35">{p.followerCount} followers</p>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-[#AFA9EC]">No creators yet.</p>
                      )}
                    </section>

                    <section>
                      <h3 className="mb-4 text-lg font-bold text-[#EEEDFE]">Browse by Genre</h3>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3">
                        {EXPLORE_GENRE_KEYS.map((key) => (
                          <Link
                            key={key}
                            href={`/genre/${key}`}
                            onClick={closeSearch}
                            className="relative overflow-hidden rounded-xl border border-white/[0.08] p-5 text-left transition hover:scale-[1.02] hover:border-[#7F77DD]/40"
                            style={{ background: "rgba(83,74,183,0.1)" }}
                          >
                            <span className="text-sm font-bold text-white">{MAIN_GENRE_LABELS[key]}</span>
                            <span className="mt-1 block text-[11px] text-white/35">Watch Films →</span>
                          </Link>
                        ))}
                      </div>
                    </section>
                  </div>
                )}
              </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
