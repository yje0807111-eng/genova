"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  ChevronLeft,
  Compass,
  Film,
  Hash,
  Home,
  LayoutGrid,
  LogOut,
  Music,
  Palette,
  Sparkles,
  Sun,
  Trophy,
  Zap,
} from "lucide-react";
import { FEED_GENRE_LABELS } from "@/lib/constants/genres";
import { addWindowCustomListener } from "@/lib/dom/window-custom-events";
import { trackHashtagEvent } from "@/lib/hashtags/client-track";
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
  art: Palette,
} as const satisfies Record<GenreFilter, LucideIcon>;

const SIDEBAR_NAV = [
  { labelKey: "sidebar.home", labelFb: "Home", href: "/", icon: Home, match: (p: string) => p === "/" },
  { labelKey: "sidebar.films", labelFb: "Films", href: "/films", icon: Film, match: (p: string) => p === "/films" || p.startsWith("/films/") },
  {
    labelKey: "sidebar.competition",
    labelFb: "Competition",
    href: "/competition",
    icon: Trophy,
    match: (p: string) =>
      p === "/competition" ||
      p.startsWith("/competition/") ||
      p === "/business" ||
      p.startsWith("/business/"),
  },
  { labelKey: "sidebar.discover", labelFb: "Discover", href: "/search", icon: Compass, match: (p: string) => p === "/search" || p.startsWith("/search?") },
] as const;

const SIDEBAR_ACTIVE_ITEM_STYLE = {
  background: "linear-gradient(90deg, rgba(83,74,183,0.35) 0%, rgba(63,54,163,0.12) 60%, rgba(43,34,143,0.03) 100%)",
  borderTop: "1px solid rgba(127,119,221,0.07)",
  borderBottom: "1px solid rgba(127,119,221,0.05)",
  borderLeft: "1px solid rgba(127,119,221,0.15)",
  animation: "sidebarGlow 3s ease-in-out infinite",
} as const;

function SidebarActiveShimmerLayer() {
  return (
    <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg" aria-hidden>
      <span
        className="absolute inset-y-0 w-1/3 rounded-lg"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(127,119,221,0.04), transparent)",
          animation: "sidebarShimmer 3s ease-in-out infinite",
        }}
      />
    </span>
  );
}

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
        "relative overflow-hidden typo-sidebar-link flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200",
        selected ? "text-white" : "text-white/50 hover:bg-white/5",
        disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
      )}
      style={selected ? SIDEBAR_ACTIVE_ITEM_STYLE : {}}
    >
      {selected && <SidebarActiveShimmerLayer />}
      <Icon
        className={cn(
          "relative z-[1] h-4 w-4 shrink-0",
          selected ? "text-[#AFA9EC]" : "text-white/40",
        )}
        aria-hidden
      />
      <span className="relative z-[1] min-w-0 truncate">{translatedLabel}</span>
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
  const pathname = usePathname();
  const isFilmsPage = pathname === "/films" || pathname.startsWith("/films/");
  const isCompetitionPage =
    pathname === "/competition" ||
    pathname.startsWith("/competition/") ||
    pathname === "/business" ||
    pathname.startsWith("/business/");
  const isProfilePage = pathname.startsWith("/profile/") || pathname.startsWith("/creator/");
  const isWatchPage = pathname.startsWith("/watch/");
  const [isProfileOwner, setIsProfileOwner] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [watchFrom, setWatchFrom] = useState<string>("home");
  const [userId, setUserId] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [hashtagRanks, setHashtagRanks] = useState<Array<{ tag: string; score: number }>>([]);
  const handleLogout = () => setShowLogoutModal(true);
  const confirmLogout = async () => {
    setShowLogoutModal(false);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  };
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
    const isDiscoverPage = pathname === "/search" || pathname.startsWith("/genre/");
    if (isDiscoverPage) {
      if (key === "All") {
        router.push("/search");
      } else {
        router.push(`/genre/${key}`);
      }
      return;
    }
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
    let alive = true;
    void fetch("/api/hashtags/ranking")
      .then((r) => r.json())
      .then((d: { tags?: Array<{ tag: string; score: number }> }) => {
        if (!alive) return;
        setHashtagRanks((d.tags ?? []).slice(0, 8));
      })
      .catch(() => {
        if (!alive) return;
        setHashtagRanks([]);
      });
    return () => {
      alive = false;
    };
  }, [pathname]);

  return (
    <>
    <style>{`
      @keyframes sidebarShimmer {
        0% { opacity: 0; transform: translateX(-150%); }
        30% { opacity: 1; }
        70% { opacity: 1; }
        100% { opacity: 0; transform: translateX(350%); }
      }
      @keyframes sidebarGlow {
        0% { box-shadow: 0 0 4px rgba(127,119,221,0.06), inset 0 0 4px rgba(83,74,183,0.04); }
        50% { box-shadow: 0 0 8px rgba(127,119,221,0.12), inset 0 0 6px rgba(83,74,183,0.08); }
        100% { box-shadow: 0 0 4px rgba(127,119,221,0.06), inset 0 0 4px rgba(83,74,183,0.04); }
      }
    `}</style>
    <aside
      onWheel={(e) => e.stopPropagation()}
      style={{
        overscrollBehavior: "contain",
        background: "linear-gradient(180deg, rgba(22,14,42,0.99) 0%, rgba(16,11,34,1) 30%, rgba(11,8,26,1) 65%, rgba(8,6,20,1) 100%)",
        borderRight: "1px solid rgba(83,74,183,0.12)",
      }}
      className={cn(
        "sidebar-scroll fixed left-0 top-0 z-[55] hidden h-screen flex flex-col overflow-y-auto overflow-x-hidden bg-sidebar p-4 transition-all duration-300 md:flex",
        sidebarOpen ? "w-60" : "w-16",
        "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
      )}
    >
      {/* 로고 */}
      <Link
        href="/"
        className={cn(
          "group mb-6 flex cursor-pointer items-center gap-2 pt-3 transition-all",
          sidebarOpen ? "px-2" : "justify-center px-0",
        )}
      >
        <img
          src="/genova-logo.png"
          alt="Genova"
          className={cn(
            "shrink-0 object-contain transition-all duration-300 [filter:drop-shadow(0_0_12px_rgba(127,119,221,0.35))] group-hover:[filter:drop-shadow(0_0_18px_rgba(127,119,221,0.52))]",
            sidebarOpen ? "h-9 w-9" : "h-[52px] w-[52px]",
          )}
        />
        {sidebarOpen && (
          <>
            <span
              className="text-[22px] font-black tracking-tight"
              style={{
                backgroundImage: "linear-gradient(135deg, #ffffff 0%, #e8e4ff 50%, #AFA9EC 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Genova
            </span>
            <span
              className="rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em]"
              style={{
                background: "rgba(127,119,221,0.12)",
                border: "1px solid rgba(127,119,221,0.2)",
                color: "#AFA9EC",
              }}
            >
              BETA
            </span>
          </>
        )}
      </Link>
      <div className="mt-4">
      <nav className="mt-4 flex flex-col gap-0.5" aria-label="Main">
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
                  "relative overflow-hidden typo-sidebar-link flex rounded-lg px-3 py-3 transition-colors duration-200",
                  sidebarOpen
                    ? "items-center gap-3"
                    : "items-center justify-center",
                  active
                    ? "text-white"
                    : "text-white/50 hover:bg-white/5 hover:text-white",
                )}
                style={active ? SIDEBAR_ACTIVE_ITEM_STYLE : {}}
              >
                {active && <SidebarActiveShimmerLayer />}
                <Icon className="relative z-[1] h-4 w-4 shrink-0" aria-hidden />
                {sidebarOpen ? <span className="relative z-[1]">{translatedLabel}</span> : null}
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
                "relative overflow-hidden typo-sidebar-link flex rounded-lg px-3 py-3 transition-colors duration-200",
                sidebarOpen ? "items-center gap-3" : "items-center justify-center",
                active ? "text-white" : "text-white/50 hover:bg-white/5 hover:text-white",
              )}
              style={active ? SIDEBAR_ACTIVE_ITEM_STYLE : {}}
            >
              {active && <SidebarActiveShimmerLayer />}
              <Icon className="relative z-[1] h-4 w-4 shrink-0" aria-hidden />
              {sidebarOpen ? <span className="relative z-[1]">{translatedLabel}</span> : null}
            </Link>
          );
        })}
      </nav>

      {sidebarOpen ? <div className="my-3 border-t border-white/[0.03]" aria-hidden /> : null}

      {sidebarOpen && !isProfilePage ? <h2 className="mb-2 mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
        {showFilmsSidebar
          ? t("sidebar.sectionLabel", "SECTIONS")
          : isCompetitionPage
            ? t("sidebar.sectionLabel", "SECTIONS")
            : t("sidebar.genreLabel", "GENRES")}
      </h2> : null}
      {sidebarOpen && isProfilePage ? <h2 className="mb-2 mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{t("sidebar.profile", "PROFILE")}</h2> : null}

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
                    "relative overflow-hidden typo-sidebar-link flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    activeSection === key
                      ? "text-white"
                      : "text-white/50 hover:bg-white/5 hover:text-white"
                  )}
                  style={activeSection === key ? SIDEBAR_ACTIVE_ITEM_STYLE : {}}
                >
                  {activeSection === key && <SidebarActiveShimmerLayer />}
                  <Icon className="relative z-[1] h-4 w-4 shrink-0" aria-hidden />
                  <span className="relative z-[1]">{
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

          <div className="my-3 border-t border-white/[0.03]" aria-hidden />
          <h2 className="mb-2 mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{t("sidebar.genreLabel", "GENRES")}</h2>
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
                  "relative overflow-hidden typo-sidebar-link flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                  activeSection === "genre-" + key
                    ? "text-white"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                )}
                style={activeSection === "genre-" + key ? SIDEBAR_ACTIVE_ITEM_STYLE : {}}
              >
                {activeSection === "genre-" + key && <SidebarActiveShimmerLayer />}
                {(() => {
                  const iconMap: Record<string, LucideIcon> = {
                    all: LayoutGrid,
                    film: Film,
                    animation: Sparkles,
                    music: Music,
                    daily: Sun,
                    art: Palette,
                  };
                  const GenreIcon = iconMap[key] ?? Film;
                  return (
                    <GenreIcon
                      className={cn(
                        "relative z-[1] h-4 w-4 shrink-0",
                        activeSection === "genre-" + key ? "text-[#AFA9EC]" : "text-white/40",
                      )}
                      aria-hidden
                    />
                  );
                })()}
                <span className="relative z-[1] truncate">
                  {key === "all"
                    ? t("sidebar.genreAll", "All")
                    : key === "film"
                      ? t("sidebar.genreFilm", "Film")
                      : key === "animation"
                        ? t("sidebar.genreAnimation", "Animation")
                        : key === "music"
                          ? t("sidebar.genreMusic", "Music")
                          : key === "daily"
                            ? t("sidebar.genreDaily", "Daily")
                            : key === "art"
                              ? t("sidebar.genreArt", "Art")
                              : label}
                </span>
              </button>
            ))}
          </nav>

          <div className="my-4 border-t border-white/[0.03]" aria-hidden />
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
                  "relative overflow-hidden typo-sidebar-link flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                  activeSection === key
                    ? "text-white"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                )}
                style={activeSection === key ? SIDEBAR_ACTIVE_ITEM_STYLE : {}}
              >
                {activeSection === key && <SidebarActiveShimmerLayer />}
                <Icon className="relative z-[1] h-4 w-4 shrink-0" aria-hidden />
                <span className="relative z-[1]">{
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

          <div className="my-4 border-t border-white/[0.03]" aria-hidden />
        </>

      ) : sidebarOpen && isCompetitionPage ? (
        <>
          <nav className="flex flex-col gap-0.5" aria-label="Competition sections">
            {[
              { key: "open", label: "Now Open", icon: Zap },
              { key: "upcoming", label: "Upcoming", icon: Sparkles },
              { key: "past", label: "Past", icon: Trophy },
              {
                key: "business",
                label: "공모전 의뢰",
                href: "/business",
                icon: Briefcase,
                match: (p: string) => p === "/business" || p.startsWith("/business/"),
              },
            ].map(({ key, label, href, icon: Icon, match }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (href && match && match(pathname)) {
                    setActiveSection(key);
                    return;
                  }
                  if (href) {
                    router.push(href);
                    setActiveSection(key);
                    return;
                  }
                  const el = document.getElementById("competition-" + key);
                  if (el) {
                    const top = el.getBoundingClientRect().top + window.scrollY - 80;
                    window.scrollTo({ top, behavior: "smooth" });
                  }
                  setActiveSection(key);
                }}
                className={cn(
                  "relative overflow-hidden typo-sidebar-link flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                  activeSection === key
                    ? "text-white"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                )}
                style={activeSection === key ? SIDEBAR_ACTIVE_ITEM_STYLE : {}}
              >
                {activeSection === key && <SidebarActiveShimmerLayer />}
                <Icon className="relative z-[1] h-4 w-4 shrink-0" aria-hidden />
                <span className="relative z-[1]">
                  {key === "open"
                    ? t("sidebar.nowOpen", "Now Open")
                    : key === "upcoming"
                      ? t("sidebar.upcoming", "Upcoming")
                      : key === "past"
                        ? t("sidebar.closed", "Closed")
                        : key === "business"
                          ? t("sidebar.businessRequest", "공모전 의뢰")
                        : label}
                </span>
              </button>
            ))}
          </nav>

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

          <div className="my-4 border-t border-white/[0.03]" aria-hidden />
          {hashtagRanks.length > 0 ? (
            <>
              <h2 className="mb-2 typo-sidebar-heading text-white/38">{t("sidebar.trendingTags", "# TRENDING TAGS")}</h2>
              <nav className="flex flex-col gap-0.5" aria-label="Trending hashtags">
                {hashtagRanks.map((item, idx) => (
                  <Link
                    key={item.tag}
                    href={`/search?q=${encodeURIComponent(item.tag)}&tab=tags#search-tags-section`}
                    onClick={() => {
                      trackHashtagEvent(item.tag, "click");
                      setTimeout(() => {
                        const el = document.getElementById("search-tags-section");
                        if (el) {
                          const top = el.getBoundingClientRect().top + window.scrollY - 80;
                          window.scrollTo({ top, behavior: "smooth" });
                        }
                      }, 400);
                    }}
                    className="typo-sidebar-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-white/72 transition-colors duration-200 hover:bg-white/5 hover:text-white"
                  >
                    <span className="w-4 text-[11px] font-semibold text-white/40">{idx + 1}</span>
                    <Hash className="h-3.5 w-3.5 shrink-0 text-[#7F77DD]/70" />
                    <span className="min-w-0 flex-1 truncate">#{item.tag}</span>
                  </Link>
                ))}
              </nav>
              <div className="my-4 border-t border-white/[0.03]" aria-hidden />
            </>
          ) : null}
        </>
      ) : null}

      </div>
      <div className="mt-auto border-t border-white/[0.03] pt-4">
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
              onClick={handleLogout}
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-white/25 transition hover:bg-white/5 hover:text-white/60"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              <span>{t("profile.logoutTitle")}</span>
            </button>
          ) : (
            <Link
              href="/auth"
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-white/25 transition hover:bg-white/5 hover:text-white/60"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0 rotate-180" />
              <span>{t("common.signIn")}</span>
            </Link>
          ))}
      </div>
    </aside>
    {showLogoutModal && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div
          className="w-full max-w-sm rounded-2xl border border-white/[0.08] p-6"
          style={{
            background: "linear-gradient(135deg, rgba(20,17,50,0.99) 0%, rgba(10,8,28,1) 100%)",
            boxShadow: "0 0 0 1px rgba(127,119,221,0.1), 0 40px 80px rgba(0,0,0,0.6)",
          }}
        >
          <h2 className="text-lg font-black text-white">{t("profile.logoutTitle")}</h2>
          <p className="mt-1 text-sm text-white/40">{t("profile.logoutConfirm")}</p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => setShowLogoutModal(false)}
              className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-sm font-semibold text-white/50 transition hover:border-white/20 hover:text-white"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={() => void confirmLogout()}
              className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
                boxShadow: "0 4px 16px rgba(220,38,38,0.3)",
              }}
            >
              {t("profile.logoutAction")}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
