"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ChatDrawer } from "@/components/chat-drawer";
import { cn } from "@/lib/utils/cn";
import { ClientDocumentMeta } from "@/components/genova/client-document-meta";
import { GenreFilterProvider } from "./genre-filter-context";
import { type Locale } from "@/lib/i18n/translations";
import { LanguageProvider } from "./language-provider";
import { UploadProvider } from "@/components/upload/upload-context";
import { UploadModalProvider } from "@/components/upload/upload-modal-context";
import { EditModalProvider } from "@/components/upload/edit-modal-context";
import { LotteryGuideModalProvider } from "@/components/lottery/lottery-guide-modal";
import { BusinessApplyModalProvider } from "@/components/business/business-apply-modal-context";
import { UploadProgressWidget } from "@/components/upload/upload-progress-widget";
import { SlimSidebar } from "./slim-sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";
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
      <SlimSidebar
        onOpenChat={() => {
          // 토글: 열려 있으면 닫고(타깃도 정리), 아니면 열기.
          if (chatOpen) {
            setChatOpen(false);
            setChatTarget(null);
          } else {
            setChatOpen(true);
          }
        }}
        unreadMessageCount={unreadMessageCount}
      />
      <MobileBottomNav />
      <div
        className={cn(
          "transition-all duration-300",
          "pb-[calc(60px+env(safe-area-inset-bottom))] md:pb-0",
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

export function LayoutWrapper({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  return (
    <LanguageProvider initialLocale={initialLocale}>
      <GenreFilterProvider>
        <UploadProvider>
          <UploadModalProvider>
            <EditModalProvider>
              <LotteryGuideModalProvider>
                <BusinessApplyModalProvider>
                  <LayoutChrome>{children}</LayoutChrome>
                  <UploadProgressWidget />
                </BusinessApplyModalProvider>
              </LotteryGuideModalProvider>
            </EditModalProvider>
          </UploadModalProvider>
        </UploadProvider>
      </GenreFilterProvider>
    </LanguageProvider>
  );
}
