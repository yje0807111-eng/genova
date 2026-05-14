"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import type { Profile } from "@/lib/queries/profile-queries";
import { useI18n } from "@/components/genova/language-provider";

/**
 * Lazy-loaded settings form.  The form component is ~456 lines and only
 * runs for the profile owner who clicks the pencil button, so deferring
 * it keeps it out of the initial chunk for everyone else.
 *
 * `ssr: false` because the form uses browser-only APIs (file inputs,
 * `getBrowserSupabaseClient`); also avoids hydration overhead for a
 * component that only exists after a user click.
 */
const ProfileSettingsClient = dynamic(
  () =>
    import("@/components/profile/profile-settings-client").then((m) => m.ProfileSettingsClient),
  { ssr: false },
);

type Props = {
  open: boolean;
  onClose: () => void;
  profile: Profile;
  userEmail: string | null;
  hasPassword: boolean;
  authProvider: string;
  handle: string;
};

/**
 * Portal-rendered settings modal.  Owns the body-overflow lock so the
 * parent shell doesn't have to.  Wrapping `ProfileSettingsClient` in a
 * client island here means the only code that ships on every
 * profile-page render is this small wrapper — the form itself is
 * fetched lazily on first open.
 */
export function ProfileSettingsModal({
  open,
  onClose,
  profile,
  userEmail,
  hasPassword,
  authProvider,
  handle,
}: Props) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open || typeof window === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 pt-[10vh]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6 mb-[10vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-white">
            {t("settings.title", "프로필 편집")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.02] text-white/55 transition hover:border-white/[0.12] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ProfileSettingsClient
          profile={profile}
          userEmail={userEmail}
          hasPassword={hasPassword}
          authProvider={authProvider}
          handle={handle}
          isModal
          onClose={onClose}
        />
      </div>
    </div>,
    document.body,
  );
}
