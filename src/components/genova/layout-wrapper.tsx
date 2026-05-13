"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ChatDrawer } from "@/components/chat-drawer";
import { cn } from "@/lib/utils/cn";
import { ClientDocumentMeta } from "@/components/genova/client-document-meta";
import { GenreFilterProvider } from "./genre-filter-context";
import { LanguageProvider } from "./language-provider";
import { UploadProvider } from "@/components/upload/upload-context";
import { UploadModalProvider } from "@/components/upload/upload-modal-context";
import { EditModalProvider } from "@/components/upload/edit-modal-context";
import { UploadProgressWidget } from "@/components/upload/upload-progress-widget";
import { SlimSidebar } from "./slim-sidebar";
import { SiteFooter } from "@/components/site-shell";

function LayoutChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isBareShellPage =
    pathname === "/auth" || pathname === "/login" || pathname === "/landing";
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<{ userId: string; displayName: string; avatarUrl?: string } | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

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

  if (isBareShellPage) {
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
      <SlimSidebar onOpenChat={() => setChatOpen(true)} unreadMessageCount={unreadMessageCount} />
      <div
        className={cn(
          "transition-all duration-300",
          "md:pl-[84px]",
          chatOpen ? "md:pr-80" : "md:pr-0",
        )}
      >
        {children}
        <SiteFooter />
      </div>
    </>
  );
}

export function LayoutWrapper({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <GenreFilterProvider>
        <UploadProvider>
          <UploadModalProvider>
            <EditModalProvider>
              <LayoutChrome>{children}</LayoutChrome>
              <UploadProgressWidget />
            </EditModalProvider>
          </UploadModalProvider>
        </UploadProvider>
      </GenreFilterProvider>
    </LanguageProvider>
  );
}
