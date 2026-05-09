"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import { ChatDrawer } from "@/components/chat-drawer";
import { cn } from "@/lib/utils/cn";
import { ClientDocumentMeta } from "@/components/genova/client-document-meta";
import { GenreFilterProvider, useGenreFilter } from "./genre-filter-context";
import { GenreSidebar } from "./genre-sidebar";
import { LanguageProvider, useI18n } from "./language-provider";
import { Navbar } from "./navbar";
import { SiteFooter } from "@/components/site-shell";

function LayoutChrome({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const isBareAuthPage = pathname === "/auth" || pathname === "/login";
  const { selectedGenre, setSelectedGenre } = useGenreFilter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<{ userId: string; displayName: string; avatarUrl?: string } | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const genresDisabled = pathname === "/profile" || Boolean(pathname?.startsWith("/profile/"));
  const isProfilePage = pathname === "/profile" || Boolean(pathname?.startsWith("/profile/"));

  useEffect(() => {
    const openChatHandler = () => {
      setChatOpen(true);
    };
    const openMessageHandler = (event: Event) => {
      const customEvent = event as CustomEvent<{ userId: string; displayName: string; avatarUrl?: string }>;
      if (!customEvent.detail?.userId || !customEvent.detail?.displayName) return;
      setChatTarget(customEvent.detail);
      setChatOpen(true);
    };
    window.addEventListener("open-chat", openChatHandler);
    window.addEventListener("open-message", openMessageHandler);
    return () => {
      window.removeEventListener("open-chat", openChatHandler);
      window.removeEventListener("open-message", openMessageHandler);
    };
  }, []);

  if (isBareAuthPage) {
    return (
      <>
        <ClientDocumentMeta />
        {children}
      </>
    );
  }

  return (
    <>
      <ClientDocumentMeta />
      <ChatDrawer
        open={chatOpen}
        onClose={() => {
          setChatOpen(false);
          setChatTarget(null);
        }}
        initialTarget={chatTarget}
        onUnreadChange={setUnreadMessageCount}
      />
      <Navbar />
      <GenreSidebar
        selectedGenre={selectedGenre}
        onGenreChange={setSelectedGenre}
        genresDisabled={genresDisabled}
        sidebarOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
      />
      <div
        className={cn(
          "transition-all duration-300",
          isProfilePage ? "" : "pt-16",
          sidebarOpen ? "md:pl-60" : "md:pl-16",
          chatOpen ? "md:pr-80" : "md:pr-0",
        )}
      >
        {children}
        <SiteFooter />
      </div>
      <button
        type="button"
        onClick={() => setChatOpen((prev) => !prev)}
        className={cn(
          "group fixed bottom-20 z-[59] flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 hover:scale-110 active:scale-95",
          chatOpen ? "right-[calc(1.5rem+320px)]" : "right-6",
        )}
        style={{
          background: "linear-gradient(135deg, #534AB7 0%, #7B6FE8 100%)",
          boxShadow: chatOpen
            ? "0 4px 16px rgba(83,74,183,0.3)"
            : "0 8px 32px rgba(83,74,183,0.5), 0 0 0 1px rgba(127,119,221,0.2) inset",
        }}
        aria-label={t("layout.messages", "Messages")}
      >
        <span
          className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: "radial-gradient(circle at 30% 30%, rgba(175,169,236,0.4) 0%, transparent 70%)",
          }}
        />
        <MessageCircle className="relative h-5 w-5 text-white" />
        {unreadMessageCount > 0 && !chatOpen && (
          <span
            className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#AFA9EC] px-1 text-[10px] font-bold text-[#080618] ring-2 ring-[#080618]"
            style={{
              boxShadow: "0 0 12px rgba(175,169,236,0.6)",
            }}
          >
            {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={cn(
          "fixed bottom-6 z-50 hidden md:flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-[#0f0d24] text-white/50 shadow-lg transition-all duration-300 hover:border-[#7F77DD]/50 hover:bg-[#7F77DD]/15 hover:text-white",
          chatOpen ? "right-[calc(1.5rem+320px)]" : "right-6",
        )}
        aria-label={t("layout.scrollToTop", "Scroll to top")}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>
    </>
  );
}

export function LayoutWrapper({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <GenreFilterProvider>
        <LayoutChrome>{children}</LayoutChrome>
      </GenreFilterProvider>
    </LanguageProvider>
  );
}
