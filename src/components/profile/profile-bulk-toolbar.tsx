"use client";

import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/genova/language-provider";
import { updateVideoVisibilityAction } from "@/app/actions/video";
import type { Video } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  bulkAction: "private" | "public" | null;
  setBulkAction: (a: "private" | "public" | null) => void;
  selectedVideoIds: string[];
  setSelectedVideoIds: (ids: string[]) => void;
  showBulkHint: boolean;
  bulkSaving: boolean;
  setBulkSaving: (b: boolean) => void;
  setEditMode: (b: boolean) => void;
  /** IDs of the videos currently visible in the page (used for select-all). */
  displayedVideoIds: string[];
  setLocalWorks: React.Dispatch<React.SetStateAction<Video[]>>;
};

/**
 * Owner-only bulk-edit toolbar: make-public / make-private / apply /
 * cancel.  Lazy-loaded from the profile shell because it only renders
 * for the profile owner who has clicked the edit-mode pencil — most
 * visits never need this code.
 *
 * Owns the apply-handler logic (server action + optimistic
 * `setLocalWorks`); the shell only owns the surrounding state shape.
 */
export function ProfileBulkToolbar({
  bulkAction,
  setBulkAction,
  selectedVideoIds,
  setSelectedVideoIds,
  showBulkHint,
  bulkSaving,
  setBulkSaving,
  setEditMode,
  displayedVideoIds,
  setLocalWorks,
}: Props) {
  const router = useRouter();
  const { t } = useI18n();

  const allDisplayedSelected =
    displayedVideoIds.length > 0 &&
    displayedVideoIds.every((id) => selectedVideoIds.includes(id));

  const onSelectAllToggle = () => {
    setSelectedVideoIds(allDisplayedSelected ? [] : displayedVideoIds);
  };

  const onApply = async () => {
    if (!bulkAction || selectedVideoIds.length === 0) {
      setEditMode(false);
      setBulkAction(null);
      setSelectedVideoIds([]);
      return;
    }
    setBulkSaving(true);
    await Promise.all(
      selectedVideoIds.map((id) =>
        updateVideoVisibilityAction(id, bulkAction === "private" ? "private" : "public"),
      ),
    );
    if (bulkAction === "private") {
      setLocalWorks((prev) =>
        prev.map((v) => (selectedVideoIds.includes(v.id) ? { ...v, visibility: "private" } : v)),
      );
    } else if (bulkAction === "public") {
      setLocalWorks((prev) =>
        prev.map((v) => (selectedVideoIds.includes(v.id) ? { ...v, visibility: "public" } : v)),
      );
    }
    setBulkSaving(false);
    setEditMode(false);
    setBulkAction(null);
    setSelectedVideoIds([]);
    router.refresh();
    setTimeout(() => router.refresh(), 500);
  };

  const onCancel = () => {
    setEditMode(false);
    setBulkAction(null);
    setSelectedVideoIds([]);
  };

  return (
    <div
      className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-[#7F77DD]/20 px-4 py-3 backdrop-blur-xl"
      style={{
        background:
          "linear-gradient(160deg, rgba(20,16,40,0.85) 0%, rgba(10,10,10,0.92) 100%)",
        boxShadow:
          "0 8px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(127,119,221,0.14)",
      }}
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
        {t("profile.selectVideosTo", "Select videos, then:")}
      </span>

      {/* Segmented public/private control */}
      <div
        className={cn(
          "flex items-center gap-1 rounded-full border p-1 transition",
          showBulkHint
            ? "border-amber-400/50 ring-1 ring-amber-400/25"
            : "border-white/[0.08] bg-white/[0.03]",
        )}
      >
        <button
          type="button"
          onClick={() => setBulkAction(bulkAction === "public" ? null : "public")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all duration-200",
            bulkAction === "public"
              ? "text-white shadow-[0_2px_10px_rgba(83,74,183,0.4)]"
              : "text-white/55 hover:text-white/85",
          )}
          style={
            bulkAction === "public"
              ? {
                  background:
                    "linear-gradient(135deg, #6B5FD4 0%, #534AB7 100%)",
                }
              : undefined
          }
        >
          <Eye className="h-3.5 w-3.5" />
          {t("profile.setPublic", "Make public")}
        </button>
        <button
          type="button"
          onClick={() => setBulkAction(bulkAction === "private" ? null : "private")}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all duration-200",
            bulkAction === "private"
              ? "text-white shadow-[0_2px_10px_rgba(83,74,183,0.4)]"
              : "text-white/55 hover:text-white/85",
          )}
          style={
            bulkAction === "private"
              ? {
                  background:
                    "linear-gradient(135deg, #6B5FD4 0%, #534AB7 100%)",
                }
              : undefined
          }
        >
          <EyeOff className="h-3.5 w-3.5" />
          {t("profile.setPrivate", "Make private")}
        </button>
      </div>

      {showBulkHint ? (
        <span className="flex animate-pulse items-center gap-1.5 text-[12px] font-medium text-amber-300">
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("profile.selectBulkActionFirst", "Choose a public/private action first")}
        </span>
      ) : null}

      <div className="ml-auto flex items-center gap-2.5">
        <button
          type="button"
          onClick={onSelectAllToggle}
          className="rounded-full px-3 py-1.5 text-[12px] font-medium text-white/45 transition hover:bg-white/[0.05] hover:text-white/80"
        >
          {allDisplayedSelected
            ? t("profile.deselectAll", "Deselect all")
            : t("profile.selectAll", "Select all")}
        </button>
        <button
          type="button"
          disabled={bulkSaving}
          onClick={onApply}
          className="rounded-full px-4 py-1.5 text-[12px] font-bold text-white transition-all duration-200 hover:brightness-110 disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #6B5FD4 0%, #534AB7 70%, #3F36A3 100%)",
            boxShadow: "0 2px 12px rgba(83,74,183,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
          }}
        >
          {bulkSaving
            ? t("settings.saving", "Saving…")
            : selectedVideoIds.length > 0
              ? `${t("profile.apply", "Apply")} (${selectedVideoIds.length})`
              : t("profile.bulkConfirm")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3.5 py-1.5 text-[12px] font-semibold text-white/60 backdrop-blur-md transition hover:border-white/20 hover:text-white"
        >
          {t("common.cancel", "Cancel")}
        </button>
      </div>
    </div>
  );
}
