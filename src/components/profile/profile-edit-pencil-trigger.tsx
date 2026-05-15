"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Pencil } from "lucide-react";
import { useI18n } from "@/components/genova/language-provider";
import type { Profile } from "@/lib/queries/profile-queries";

/**
 * Lazy-loaded modal wrapper + form.  Two levels of laziness here:
 *   1. `next/dynamic({ssr:false})` defers the modal-wrapper chunk
 *      (~98 LOC + createPortal + lucide X + body-overflow effect)
 *      until first render of the modal.
 *   2. The `{open && …}` gate below means the wrapper itself is
 *      never even mounted while the pencil is unclicked — so the
 *      dynamic chunk only fetches on the first open click.
 *   3. The wrapper THEN lazy-loads the heavier `<ProfileSettingsClient>`
 *      form (~456 LOC) inside itself, as before.
 *
 * Net: zero settings-modal code in the bundle until an owner clicks
 * the pencil.
 */
const ProfileSettingsModal = dynamic(
  () =>
    import("@/components/profile/profile-settings-modal").then(
      (m) => m.ProfileSettingsModal,
    ),
  { ssr: false },
);

/**
 * Owner-only edit-profile trigger.  Self-contained: owns its own
 * `open` state and mounts the modal on first click.  The non-owner
 * case never imports this file, so neither the wrapper nor the form
 * code ship on visitor bundles.
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
      {open ? (
        <ProfileSettingsModal
          open
          onClose={() => setOpen(false)}
          profile={profile}
          userEmail={userEmail}
          hasPassword={hasPassword}
          authProvider={authProvider}
          handle={handle}
        />
      ) : null}
    </>
  );
}
