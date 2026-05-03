"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/genova/language-provider";
import { AuthNav } from "@/components/auth-nav";
import { ChatDrawer } from "@/components/chat-drawer";

type ChatTarget = {
  userId: string;
  displayName: string;
  avatarUrl?: string;
};

function NavItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`group relative pb-1 text-[14px] font-normal transition ${
        active ? "text-white" : "text-[rgba(255,255,255,0.7)] hover:text-white"
      }`}
    >
      {label}
      <span
        className={`absolute -bottom-0.5 left-0 h-[2px] bg-[#534AB7] transition-all duration-200 ${
          active ? "w-full" : "w-0 group-hover:w-full"
        }`}
      />
    </Link>
  );
}

export function SiteHeader() {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<ChatTarget | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMobileOpen(false);
    setSearch("");
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<ChatTarget>;
      if (!customEvent.detail?.userId || !customEvent.detail?.displayName) return;
      setChatTarget(customEvent.detail);
      setIsChatOpen(true);
    };
    window.addEventListener("open-message", handler);
    return () => window.removeEventListener("open-message", handler);
  }, []);

  useEffect(() => {
    const openChatHandler = () => {
      setIsChatOpen(true);
    };
    window.addEventListener("open-chat", openChatHandler);
    return () => window.removeEventListener("open-chat", openChatHandler);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (searchRef.current && target && !searchRef.current.contains(target)) {
        setSearchOpen(false);
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const id = window.setTimeout(() => searchInputRef.current?.focus(), 40);
    return () => window.clearTimeout(id);
  }, [searchOpen]);

  const onSearchSubmit = () => {
    const q = search.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header
      style={{ opacity: 1, animation: "none" }}
      className={`sticky top-0 z-50 h-14 border-b border-[rgba(255,255,255,0.06)] backdrop-blur-[20px] transition-all duration-300 ${
        scrolled
          ? "bg-[rgba(8,6,24,0.85)]"
          : "bg-gradient-to-b from-[rgba(8,6,24,0.95)] to-transparent border-transparent"
      }`}
    >
      <div className="mx-auto grid h-14 w-full grid-cols-[1fr_auto_1fr] items-center gap-4 px-6">
        <div className="flex min-w-0 items-center gap-5">
        <Link href="/" className="flex min-w-0 items-center gap-3 transition hover:brightness-110">
          <Image src="/genova-logo.png" alt="Genova symbol" width={28} height={28} className="h-7 w-7 shrink-0" />
          <span className="flex min-w-0 items-baseline gap-1.5 text-[18px] font-bold tracking-wide text-white">
            <span>
              Genova
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-4 md:flex">
            <NavItem href="/films" label={t("nav.films", "Films")} active={pathname.startsWith("/films")} />
            <NavItem href="/shorts" label={t("nav.shorts", "Shorts")} active={pathname.startsWith("/shorts")} />
            <NavItem href="/competition" label={t("nav.competition", "Competition")} active={pathname.startsWith("/competition")} />
            <NavItem href="/creator/c1" label={t("nav.creators", "Creators")} active={pathname.startsWith("/creator")} />
          </nav>
        </div>
        <div />
        <div className="hidden items-center justify-end gap-1.5 md:flex">
          <div ref={searchRef} className="flex items-center">
            <div
              className={`overflow-hidden transition-all duration-300 ease-out ${
                searchOpen ? "w-[220px] opacity-100 mr-1.5" : "w-0 opacity-0 mr-0"
              }`}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onSearchSubmit();
                }}
                className="relative"
              >
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.7)]">
                  <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                </span>
                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("common.searchAiFilms", "Search AI films...")}
                  className="h-8 w-[220px] rounded-[20px] border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.08)] pl-9 pr-3 text-sm text-white outline-none placeholder:text-[rgba(255,255,255,0.45)] focus:border-[#534AB7]"
                />
              </form>
            </div>
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className="rounded-[2px] p-2 text-[rgba(255,255,255,0.7)] transition hover:text-white"
              aria-label={t("common.search", "Search")}
            >
              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
          </div>
          <AuthNav compact />
        </div>
        <div className="flex items-center justify-end gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[2px] text-[#EEEDFE] hover:bg-white/10"
            aria-label={t("common.toggleMenu", "Toggle menu")}
          >
            <span className="text-lg leading-none">{mobileOpen ? "×" : "☰"}</span>
          </button>
        </div>
      </div>
      {mobileOpen ? (
        <div
          className="border-t border-white/10 bg-[rgba(8,6,24,0.95)] px-4 py-3 md:hidden"
        >
          <nav className="flex flex-col gap-3">
            <NavItem href="/films" label={t("nav.films", "Films")} active={pathname.startsWith("/films")} />
            <NavItem href="/shorts" label={t("nav.shorts", "Shorts")} active={pathname.startsWith("/shorts")} />
            <NavItem href="/competition" label={t("nav.competition", "Competition")} active={pathname.startsWith("/competition")} />
            <NavItem href="/creator/c1" label={t("nav.creators", "Creators")} active={pathname.startsWith("/creator")} />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearchSubmit();
              }}
              className="relative pt-2"
            >
              <span className="pointer-events-none absolute left-3 top-[calc(50%+0.25rem)] -translate-y-1/2 text-[rgba(255,255,255,0.7)]">
                <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("common.searchAiFilms", "Search AI films...")}
                className="h-8 w-full rounded-[20px] border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.08)] pl-9 pr-3 text-sm text-white outline-none placeholder:text-[rgba(255,255,255,0.45)] focus:border-[#534AB7]"
              />
            </form>
            <div className="pt-1">
              <AuthNav compact />
            </div>
          </nav>
        </div>
      ) : null}
      <ChatDrawer
        open={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setChatTarget(null);
        }}
        initialTarget={chatTarget}
      />
    </header>
  );
}

export function SiteFooter() {
  const { t } = useI18n();
  const pathname = usePathname();
  if (pathname.startsWith("/shorts")) {
    return null;
  }

  return (
    <footer className="relative mt-0 overflow-hidden bg-[#030211]">
      <div className="section-blob left-1/2 -top-64 -translate-x-1/2 opacity-50" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03]">
        <Image src="/genova-logo.png" alt="" width={288} height={288} className="h-72 w-72" aria-hidden />
      </div>
      <div className="section-content mx-auto max-w-6xl space-y-6 px-6 py-8 text-sm text-[#AFA9EC]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[#EEEDFE]">
            <Image src="/genova-logo.png" alt="Genova symbol" width={36} height={36} className="h-9 w-9" />
            <span className="font-display text-[18px] font-bold tracking-[-0.05em] text-[#ebe8ff]">Genova</span>
          </div>
          <p className="text-sm text-[#AFA9EC]">{t("footer.tagline", "The Home of AI Filmmakers")}</p>
        </div>
        <div className="flex flex-wrap gap-5 text-sm">
          <Link href="/films" className="hover:text-[#EEEDFE]">{t("nav.films", "Films")}</Link>
          <Link href="/competition" className="hover:text-[#EEEDFE]">{t("nav.competition", "Competition")}</Link>
          <Link href="/creator/c1" className="hover:text-[#EEEDFE]">{t("nav.creators", "Creators")}</Link>
          <Link href="#" className="hover:text-[#EEEDFE]">{t("footer.terms", "Terms of Service")}</Link>
          <Link href="#" className="hover:text-[#EEEDFE]">{t("footer.privacy", "Privacy Policy")}</Link>
        </div>
        <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#8F89CD]">© 2026 Genova</p>
          <div className="flex items-center gap-3 text-[#AFA9EC]">
            <Link
              href="https://www.youtube.com"
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
              className="rounded-full border border-white/15 p-1.5 transition hover:border-[#7F77DD]/55 hover:text-[#EEEDFE]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8M9.6 15.6V8.4l6.2 3.6z" />
              </svg>
            </Link>
            <Link
              href="https://www.instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="rounded-full border border-white/15 p-1.5 transition hover:border-[#7F77DD]/55 hover:text-[#EEEDFE]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                <circle cx="12" cy="12" r="4.2" />
                <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
              </svg>
            </Link>
            <Link
              href="https://x.com"
              target="_blank"
              rel="noreferrer"
              aria-label="X"
              className="rounded-full border border-white/15 p-1.5 transition hover:border-[#7F77DD]/55 hover:text-[#EEEDFE]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M18.9 2H22l-6.7 7.7L23.2 22h-6.2l-4.9-6.5L6.5 22H3.4l7.2-8.2L1.1 2h6.4l4.4 5.9zm-1.1 18h1.7L6.6 3.9H4.7z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
