"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ChevronLeft,
  Film,
  Home,
  LayoutGrid,
  LogOut,
  Music,
  Sparkles,
  Sun,
  Trophy,
  Wand2,
  Zap,
} from "lucide-react";
import { FEED_GENRE_LABELS } from "@/lib/constants/genres";
import { addWindowCustomListener } from "@/lib/dom/window-custom-events";
import { useI18n } from "@/components/genova/language-provider";
import type { GenreFilter } from "@/lib/genova-genre";
import { cn } from "@/lib/utils/cn";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export { genreFilterLabel, type GenreFilter } from "@/lib/genova-genre";

const POPULAR_GENRE_KEYS: GenreFilter[] = [
  "All",
  "film",
  "animation",
  "music",
  "daily",
  "art",
];

const GENRE_ICONS = {
  All: LayoutGrid,
  film: Film,
  animation: Sparkles,
  music: Music,
  daily: Sun,
  art: Wand2,
} as const satisfies Record<GenreFilter, LucideIcon>;

const MOCK_TRENDING_TAGS = [
  { tag: "AIFilm", count: "1.2K", trend: "up", isNew: false },
  { tag: "Runway", count: "890", trend: "up", isNew: false },
  { tag: "Cyberpunk", count: "654", trend: "up", isNew: true },
  { tag: "ShortFilm", count: "521", trend: "down", isNew: false },
  { tag: "Midjourney", count: "489", trend: "up", isNew: false },
  { tag: "Dreamlike", count: "412", trend: "up", isNew: true },
  { tag: "Kling", count: "387", trend: "up", isNew: false },
  { tag: "SciFi", count: "312", trend: "down", isNew: false },
  { tag: "Animation", count: "276", trend: "up", isNew: false },
  { tag: "ElevenLabs", count: "198", trend: "down", isNew: true },
] as const;

const SIDEBAR_NAV = [
  { labelKey: "nav.home", labelFb: "Home", href: "/", icon: Home, match: (p: string) => p === "/" },
  { labelKey: "nav.films", labelFb: "Films", href: "/films", icon: Film, match: (p: string) => p === "/films" || p.startsWith("/films/") },
  {
    labelKey: "nav.competition",
    labelFb: "Competition",
    href: "/competition",
    icon: Trophy,
    match: (p: string) => p === "/competition" || p.startsWith("/competition/"),
  },
] as const;

function GenreRow({
  genreKey,
  selected,
  onSelect,
  disabled,
}: {
  genreKey: GenreFilter;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const Icon = GENRE_ICONS[genreKey];
  const translatedLabel =
    genreKey === "All"
      ? t("common.all", "All")
      : genreKey in FEED_GENRE_LABELS
        ? FEED_GENRE_LABELS[genreKey as keyof typeof FEED_GENRE_LABELS]
        : genreKey;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (!disabled) onSelect();
      }}
      className={cn(
        "typo-sidebar-link flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
        selected ? "bg-primary/15 text-primary" : "text-foreground hover:bg-white/5",
        disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
      )}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
      <span className="min-w-0 truncate">{translatedLabel}</span>
    </button>
  );
}

export function GenreSidebar({
  selectedGenre,
  onGenreChange,
  genresDisabled,
  sidebarOpen,
  onToggle,
}: {
  selectedGenre?: GenreFilter;
  onGenreChange?: (g: GenreFilter) => void;
  /** When true, genre pills are disabled (e.g. on profile); nav/creator shortcuts still work. */
  genresDisabled?: boolean;
  sidebarOpen: boolean;
  onToggle: () => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const handleLogout = async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  };
  const pathname = usePathname();
  const isFilmsPage = pathname === "/films" || pathname.startsWith("/films/");
  const isCompetitionPage = pathname === "/competition" || pathname.startsWith("/competition/");
  const isProfilePage = pathname.startsWith("/profile/") || pathname.startsWith("/creator/");
  const isWatchPage = pathname.startsWith("/watch/");
  const [isProfileOwner, setIsProfileOwner] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [watchFrom, setWatchFrom] = useState<string>("home");
  const [lastUpdated, setLastUpdated] = useState(() => t("genreSidebar.justNow", "just now"));
  const [userId, setUserId] = useState<string | null>(null);
  const currentGenre = selectedGenre ?? "All";
  const handleGenreChange = onGenreChange ?? (() => {});
  const showFilmsSidebar = isFilmsPage || (isWatchPage && watchFrom === "films");
  const isExactFilmsPage = pathname === "/films";
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };
  const handleGenreSelect = (key: GenreFilter) => {
    localStorage.setItem("watchFrom", showFilmsSidebar ? "films" : "home");
    handleGenreChange(key);
    if (pathname !== "/") {
      router.push("/?genre=" + key);
    }
  };
  const genreLocked = Boolean(genresDisabled);

  useEffect(() => {
    setActiveSection(null);
  }, [pathname]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const syncUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    };
    void syncUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    return addWindowCustomListener<boolean>("profile-owner-status", (detail) => {
      setIsProfileOwner(detail);
    });
  }, []);

  useEffect(() => {
    if (isWatchPage) {
      const from = localStorage.getItem("watchFrom") ?? "home";
      setWatchFrom(from);
    }
  }, [isWatchPage]);

  useEffect(() => {
    const update = () => setLastUpdated(t("genreSidebar.justNow", "just now"));
    update();
    const interval = setInterval(() => {
      setLastUpdated(t("genreSidebar.oneMinAgo", "1 min ago"));
      setTimeout(() => {
        update();
      }, 100);
    }, 60000);
    return () => clearInterval(interval);
  }, [t]);

  const trendingTagsSection = sidebarOpen ? (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="typo-sidebar-heading text-white/38">{t("sidebar.trendingTags", "# TRENDING TAGS")}</h2>
        <span className="typo-sidebar-micro text-white/30">{lastUpdated}</span>
      </div>
      <ul className="space-y-1">
        {MOCK_TRENDING_TAGS.map((item, idx) => (
          <li key={item.tag}>
            <button
              type="button"
              onClick={() => router.push(`/search?q=%23${item.tag}`)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/5"
            >
              <span className="typo-stat-xs w-4 font-mono text-white/25">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span className="typo-sidebar-tag min-w-0 flex-1 truncate text-white/72 hover:text-white">
                #{item.tag}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                {item.isNew ? (
                  <span className="typo-stat-xs font-bold tracking-normal text-[#8b5cf6]">NEW</span>
                ) : (
                  <span className={cn(
                    "typo-sidebar-micro tracking-normal",
                    item.trend === "up" ? "text-emerald-400" : "text-red-400"
                  )}>
                    {item.trend === "up" ? "↑" : "↓"}
                  </span>
                )}
                <span className="typo-sidebar-tag text-white/38">{item.count}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  ) : null;

  return (
    <>
    <aside
      onWheel={(e) => e.stopPropagation()}
      style={{ overscrollBehavior: "contain" }}
      className={cn(
        "sidebar-scroll fixed left-0 top-16 z-40 hidden h-[calc(100dvh-4rem)] flex flex-col overflow-y-auto overflow-x-hidden border-r border-border bg-sidebar p-4 transition-all duration-300 md:flex",
        sidebarOpen ? "w-60" : "w-16",
        "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
      )}
    >
      <nav className="flex flex-col gap-0.5" aria-label="Main">
        {SIDEBAR_NAV.map(({ labelKey, labelFb, href, icon: Icon, match }) => {
          const active = match(pathname);
          const translatedLabel = t(labelKey, labelFb);
          if (href === "/") {
            return (
              <Link
                key={href}
                href={href}
                onClick={() => localStorage.setItem("watchFrom", "home")}
                className={cn(
                  "typo-sidebar-link flex rounded-lg px-3 py-2.5 text-white/72 transition-colors duration-200",
                  sidebarOpen
                    ? "items-center gap-3"
                    : "items-center justify-center",
                  active
                    ? "bg-primary/15 text-primary"
                    : "hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {sidebarOpen ? translatedLabel : null}
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              onClick={() => {
                if (href === "/films") {
                  localStorage.setItem("watchFrom", "films");
                }
              }}
              className={cn(
                "typo-sidebar-link flex rounded-lg px-3 py-2.5 text-white/72 transition-colors duration-200",
                sidebarOpen ? "items-center gap-3" : "items-center justify-center",
                active ? "bg-primary/15 text-primary" : "hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {sidebarOpen ? translatedLabel : null}
            </Link>
          );
        })}
      </nav>

      {sidebarOpen ? <div className="my-3 border-t border-white/[0.06]" aria-hidden /> : null}

      {sidebarOpen && !isProfilePage ? <h2 className="mb-2 typo-sidebar-heading text-white/38">
        {showFilmsSidebar ? t("sidebar.sections", "SECTIONS") : isCompetitionPage ? t("sidebar.sections", "SECTIONS") : t("sidebar.genres", "GENRES")}
      </h2> : null}
      {sidebarOpen && isProfilePage ? <h2 className="mb-2 typo-sidebar-heading text-white/38">{t("sidebar.profile", "PROFILE")}</h2> : null}

      {sidebarOpen && showFilmsSidebar ? (
        <>
          {isExactFilmsPage ? (
            <nav className="flex flex-col gap-0.5" aria-label="Films sections">
              {[
                { key: "continue", label: "Continue Watching", targetId: "films-continue", icon: Sparkles },
              ].map(({ key, label, targetId, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    scrollToSection(targetId);
                    setActiveSection(key);
                  }}
                  className={cn(
                    "typo-sidebar-link flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                    activeSection === key
                      ? "bg-primary/15 text-primary"
                      : "text-white/72 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span>{
                    label === "Series"
                      ? t("films.series", "Series")
                      : label === "Award Winners"
                        ? t("films.awardWinners", "Award Winners")
                        : label === "Continue Watching"
                          ? t("films.continueWatching", "Continue Watching")
                          : label
                  }</span>
                </button>
              ))}
            </nav>
          ) : null}

          <div className="my-3 border-t border-white/[0.06]" aria-hidden />
          <h2 className="mb-2 typo-sidebar-heading text-white/38">{t("sidebar.genres", "GENRES")}</h2>
          <nav className="flex flex-col gap-0.5" aria-label="Films genres">
            {[
              { key: "all", label: "All" },
              { key: "film", label: "Film" },
              { key: "animation", label: "Animation" },
              { key: "music", label: "Music" },
              { key: "daily", label: "Daily" },
              { key: "art", label: "Art" },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  localStorage.setItem("watchFrom", "films");
                  window.dispatchEvent(new CustomEvent("films-genre-select", { detail: key }));
                  if (window.location.pathname === "/films") {
                    setTimeout(() => {
                      const el = document.getElementById("films-genre-section");
                      if (el) {
                        const top = el.getBoundingClientRect().top + window.scrollY - 80;
                        window.scrollTo({ top, behavior: "smooth" });
                      }
                    }, 50);
                  }
                  setActiveSection("genre-" + key);
                }}
                className={cn(
                  "typo-sidebar-link flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                  activeSection === "genre-" + key
                    ? "bg-primary/15 text-primary"
                    : "text-white/72 hover:bg-white/5 hover:text-white"
                )}
              >
                <Film className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
                <span className="truncate">
                  {key === "all"
                    ? t("common.all", "All")
                    : key === "film"
                      ? t("nav.films", "Film")
                      : key === "animation"
                        ? t("genre.animation", "Animation")
                        : key === "music"
                          ? t("genre.music", "Music")
                          : key === "daily"
                            ? t("genre.daily", "Daily")
                            : key === "art"
                              ? t("genre.art", "Art")
                              : label}
                </span>
              </button>
            ))}
          </nav>

          <div className="my-4 border-t border-white/[0.06]" aria-hidden />
          {trendingTagsSection}
        </>

      ) : sidebarOpen && isProfilePage ? (
        <>
          <nav className="flex flex-col gap-0.5" aria-label="Profile sections">
            {[
              ...(isProfileOwner ? [
                { key: "works", label: "Works", icon: Film },
                { key: "awards", label: "Awards", icon: Trophy },
                { key: "saved", label: "Saved", icon: Sparkles },
                { key: "credits", label: "Credits", icon: Zap },
              ] : [
                { key: "videos", label: "Videos", icon: Film },
                { key: "competition", label: "Competition", icon: Trophy },
              ]),
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("profile-tab-change", { detail: key }));
                  setActiveSection(key);
                  setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }, 50);
                }}
                className={cn(
                  "typo-sidebar-link flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                  activeSection === key
                    ? "bg-primary/15 text-primary"
                    : "text-white/72 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span>{
                  label === "Works"
                    ? t("profile.works", "Works")
                    : label === "Awards"
                      ? t("profile.awards", "Awards")
                      : label === "Saved"
                        ? t("profile.saved", "Saved")
                        : label === "Credits"
                          ? t("profile.credits", "Credits")
                          : label === "Videos"
                            ? t("profile.videos", "Videos")
                            : label === "Competition"
                              ? t("nav.competition", "Competition")
                              : label
                }</span>
              </button>
            ))}
          </nav>

          <div className="my-4 border-t border-white/[0.06]" aria-hidden />
          {trendingTagsSection}
        </>

      ) : sidebarOpen && isCompetitionPage ? (
        <>
          <nav className="flex flex-col gap-0.5" aria-label="Competition sections">
            {[
              { key: "open", label: "Now Open", icon: Zap },
              { key: "upcoming", label: "Upcoming", icon: Sparkles },
              { key: "past", label: "Past", icon: Trophy },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  const el = document.getElementById("competition-" + key);
                  if (el) {
                    const top = el.getBoundingClientRect().top + window.scrollY - 80;
                    window.scrollTo({ top, behavior: "smooth" });
                  }
                  setActiveSection(key);
                }}
                className={cn(
                  "typo-sidebar-link flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                  activeSection === key
                    ? "bg-primary/15 text-primary"
                    : "text-white/72 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span>
                  {key === "open"
                    ? t("competition.nowOpen", "Now Open")
                    : key === "upcoming"
                      ? t("competition.upcoming", "Upcoming")
                      : key === "past"
                        ? t("competition.past", "Past")
                        : label}
                </span>
              </button>
            ))}
          </nav>

          <div className="my-4 border-t border-white/[0.06]" aria-hidden />
          {trendingTagsSection}
        </>

      ) : sidebarOpen ? (
        <>
          <nav className="flex flex-col gap-0.5" aria-label="Genres">
            {POPULAR_GENRE_KEYS.map((key) => (
              <GenreRow
                key={key}
                genreKey={key}
                selected={currentGenre === key}
                onSelect={() => handleGenreSelect(key)}
                disabled={genreLocked}
              />
            ))}

          </nav>

          <div className="my-4 border-t border-white/[0.06]" aria-hidden />
          {trendingTagsSection}
        </>
      ) : null}

      <div className="mt-auto border-t border-white/[0.06] pt-4">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "flex w-full items-center justify-center rounded-md border border-white/20 bg-[#0f0d24]/80 py-1.5 text-white/70 backdrop-blur-sm transition hover:border-white/40 hover:bg-white/10 hover:text-white",
          )}
          aria-label="Toggle sidebar"
        >
          <ChevronLeft
            size={16}
            className={cn(
              "transition-transform duration-300",
              sidebarOpen ? "" : "rotate-180",
            )}
          />
        </button>

        {sidebarOpen &&
          (userId ? (
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/25 transition hover:bg-white/5 hover:text-white/60"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              <span>Log out</span>
            </button>
          ) : (
            <Link
              href="/auth"
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/25 transition hover:bg-white/5 hover:text-white/60"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0 rotate-180" />
              <span>Log in</span>
            </Link>
          ))}
      </div>
    </aside>
    </>
  );
}
