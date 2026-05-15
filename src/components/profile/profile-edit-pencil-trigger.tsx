"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import { ProfileSettingsModal } from "@/components/profile/profile-settings-modal";
import type { Profile } from "@/lib/queries/profile-queries";

/**
 * Owner-only edit-profile trigger.  Self-contained: owns its own
 * `open` state and mounts the heavy `<ProfileSettingsModal>` itself,
 * so the surrounding profile header can render server-side
 * (C-2 server slot pattern).  The non-owner case never imports
 * this file, so the modal code stays out of visitor bundles too.
 *
 * Props mirror what `<ProfileSettingsModal>` needs: profile + auth
 * shape used inside the modal for the Account / Security / Email
 * tabs.  Handle is passed for the username display row.
 */
export function ProfileEditPencilTrigger({
  profile,
  userEmail,
  hasPassword,
  authProvider,
  handle,
}: {
  profile: Profile;
  userEmail: string | null;
  hasPassword: boolean;
  authProvider: string;
  handle: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={t("settings.editProfile", "Edit profile")}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02] text-white/55 transition hover:border-[#7F77DD]/40 hover:text-white"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <ProfileSettingsModal
        open={open}
        onClose={() => setOpen(false)}
        profile={profile}
        userEmail={userEmail}
        hasPassword={hasPassword}
        authProvider={authProvider}
        handle={handle}
      />
    </>
  );
}
