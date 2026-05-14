"use client";

import { useRef, useState } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { updateProfileAction } from "@/app/actions/profile";
import { useI18n } from "@/components/genova/language-provider";

type Props = {
  userId: string;
  avatarUrl: string | null;
  displayName: string | null;
  editable: boolean;
};

export function ProfileAvatarUpload({ userId, avatarUrl, displayName, editable }: Props) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(avatarUrl);

  const onPick = () => {
    if (editable) inputRef.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editable) return;
    if (!file.type.startsWith("image/")) {
      alert(t("profile.avatarOnlyImages"));
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      alert(t("profile.avatarMaxSize"));
      return;
    }

    const supabase = getBrowserSupabaseClient();
    if (!supabase) {
      alert(t("profile.avatarConfigError"));
      return;
    }

    setUploading(true);
    try {
      const safe = file.name.replace(/[^\w.-]/g, "_");
      const path = `${userId}/${Date.now()}-${safe}`;
      const { error: upError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upError) {
        alert(upError.message);
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);
      setPreview(publicUrl);
      const res = await updateProfileAction({ avatarUrl: publicUrl });
      if (!res.ok) {
        alert(res.message);
        return;
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const face = (
    <>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element -- blob: URI initially, then persisted URL after upload; next/image not applicable to blob
        <img src={preview} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#534AB7] to-[#26215C] text-2xl font-bold text-[#EEEDFE]">
          {(displayName ?? "?").slice(0, 1)}
        </div>
      )}
      {uploading && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-white">
          {t("profile.avatarUploading")}
        </span>
      )}
    </>
  );

  return (
    <div className="relative shrink-0">
      {editable ? (
        <button
          type="button"
          onClick={onPick}
          disabled={uploading}
          className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-[#534AB7] bg-[#26215C] ring-offset-2 ring-offset-[#1A1535] transition hover:ring-2 hover:ring-[#7F77DD] sm:h-32 sm:w-32"
        >
          {face}
        </button>
      ) : (
        <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-[#534AB7] bg-[#26215C] sm:h-32 sm:w-32">
          {face}
        </div>
      )}
      {editable && <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void onFile(e)} />}
    </div>
  );
}
