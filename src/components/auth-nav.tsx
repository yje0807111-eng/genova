"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { useUploadModal } from "@/components/upload/upload-modal-context";

export function AuthNav({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { open: openUploadModal } = useUploadModal();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      setUser(null);
      return;
    }

    const init = async () => {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      setUser(u ?? null);
      if (u) {
        const { count } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", u.id)
          .eq("is_read", false);
        setUnread(count ?? 0);
      } else {
        setUnread(0);
      }
    };
    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setUnread(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const onLogout = async () => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  };

  if (user === undefined) {
    return (
      <span className={`inline-block text-center text-xs text-[#AFA9EC] ${compact ? "min-w-[56px] px-2 py-2" : "min-w-[88px] rounded-full px-4 py-2"}`} aria-busy>
        …
      </span>
    );
  }

  if (user) {
    if (compact) {
      return (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => openUploadModal()}
            className="btn-primary px-[14px] py-[6px] text-[13px] font-semibold leading-none tracking-wide"
          >
            Upload
          </button>
          <Link
            href="/notifications"
            className="relative rounded-[2px] p-2 text-[rgba(255,255,255,0.7)] transition hover:bg-white/10 hover:text-white"
            aria-label="Notifications"
            title="Notifications"
          >
            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0m6 0H9" />
            </svg>
            {unread > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-[#7F77DD] px-1 text-[10px] font-bold text-white">
                {unread > 99 ? "99+" : unread}
              </span>
            ) : null}
          </Link>
          <Link
            href={`/profile/${user.id}`}
            className="rounded-[2px] p-2 text-[rgba(255,255,255,0.7)] transition hover:bg-white/10 hover:text-white"
            aria-label="My Profile"
            title="Profile"
          >
            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
        </div>
      );
    }
    return (
      <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-3">
        <button
          type="button"
          onClick={() => openUploadModal()}
          className="rounded-full bg-gradient-to-br from-[#534AB7] to-[#7F77DD] px-3 py-1.5 text-[10px] font-semibold text-[#EEEDFE] shadow-[0_0_14px_rgba(83,74,183,0.35)] transition hover:brightness-110 hover:shadow-[0_0_18px_rgba(127,119,221,0.5)] sm:py-2 sm:text-xs"
        >
          Upload
        </button>
        <Link
          href="/notifications"
          className="relative rounded-full p-2 text-[#EEEDFE] transition hover:bg-white/10"
          aria-label="Notifications"
          title="Notifications"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0m6 0H9" />
          </svg>
          {unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-[#7F77DD] px-1 text-[10px] font-bold text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
        </Link>
        <Link
          href={`/profile/${user.id}`}
          className="rounded-full p-2 text-[#EEEDFE] transition hover:bg-white/10"
          aria-label="My Profile"
          title="Profile"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </Link>
        <span className="hidden max-w-[140px] truncate text-xs text-[#E8E4FF] sm:inline" title={user.email ?? ""}>
          {user.email}
        </span>
        <button
          type="button"
          onClick={() => void onLogout()}
          className="rounded-full bg-[#534AB7] px-3 py-1.5 text-xs font-semibold text-[#EEEDFE] transition hover:bg-[#7F77DD] sm:px-4 sm:py-2 sm:text-sm"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/auth"
      className={`rounded-full bg-[#534AB7] font-semibold text-[#EEEDFE] transition hover:bg-[#7F77DD] ${compact ? "px-3 py-1.5 text-xs" : "px-4 py-2"}`}
    >
      Sign In
    </Link>
  );
}
