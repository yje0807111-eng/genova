"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Home, Trophy, Upload, User } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { useUploadModal } from "@/components/upload/upload-modal-context";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils/cn";

// 모바일 전용 하단 고정 내비 (SlimSidebar 는 md+ 에서만 노출되므로
// 폰에서 페이지 이동 수단이 전혀 없던 문제 해소). 핵심 5개만 노출.
export function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { open: openUploadModal } = useUploadModal();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => setUserId(s?.user?.id ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const profileHref = userId ? `/profile/${userId}` : "/auth";

  const itemCls = (active: boolean) =>
    cn(
      "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors",
      active ? "text-[#C7C2F0]" : "text-white/45 hover:text-white/70",
    );

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[60] flex border-t border-white/[0.07] bg-[rgba(10,10,10,0.96)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      aria-label="Mobile navigation"
    >
      <Link href="/" className={itemCls(pathname === "/")}>
        <Home className="h-5 w-5" aria-hidden />
        {t("sidebar.home", "Home")}
      </Link>
      <Link
        href="/competition"
        className={itemCls(pathname === "/competition" || pathname.startsWith("/competition/"))}
      >
        <Trophy className="h-5 w-5" aria-hidden />
        {t("sidebar.competition", "Contest")}
      </Link>
      <button type="button" onClick={() => openUploadModal()} className={itemCls(false)}>
        <Upload className="h-5 w-5" aria-hidden />
        {t("nav.upload", "Upload")}
      </button>
      <Link href="/notifications" className={itemCls(pathname === "/notifications")}>
        <Bell className="h-5 w-5" aria-hidden />
        {t("sidebar.notifications", "Alerts")}
      </Link>
      <Link
        href={profileHref}
        className={itemCls(pathname === "/profile" || pathname.startsWith("/profile/"))}
      >
        <User className="h-5 w-5" aria-hidden />
        {t("nav.profile", "Profile")}
      </Link>
    </nav>
  );
}
