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
    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5">
      <span className="text-xs text-muted-foreground">
        {t("profile.selectVideosTo", "Select videos, then:")}
      </span>
      <button
        type="button"
        onClick={() => setBulkAction(bulkAction === "private" ? null : "private")}
        className={cn(
          "flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs transition",
          bulkAction === "private"
            ? "border-primary bg-primary/20 text-primary"
            : showBulkHint
              ? "border-amber-400/50 text-white/70 hover:bg-white/5 hover:text-white ring-1 ring-amber-400/30"
              : "border-border text-white/70 hover:bg-white/5 hover:text-white",
        )}
      >
        <EyeOff className="h-3 w-3" />
        {t("profile.setPrivate", "Make private")}
      </button>
      <button
        type="button"
        onClick={() => setBulkAction(bulkAction === "public" ? null : "public")}
        className={cn(
          "flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs transition",
          bulkAction === "public"
            ? "border-primary bg-primary/20 text-primary"
            : showBulkHint
              ? "border-amber-400/50 text-white/70 hover:bg-white/5 hover:text-white ring-1 ring-amber-400/30"
              : "border-border text-white/70 hover:bg-white/5 hover:text-white",
        )}
      >
        <Eye className="h-3 w-3" />
        {t("profile.setPublic", "Make public")}
      </button>
      {showBulkHint ? (
        <span className="flex items-center gap-1.5 animate-pulse text-xs text-amber-400">
          <ArrowLeft className="h-3 w-3" />
          {t("profile.selectBulkActionFirst", "Choose a public/private action first")}
        </span>
      ) : null}
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onSelectAllToggle}
          className="text-xs text-muted-foreground transition hover:text-white"
        >
          {allDisplayedSelected
            ? t("profile.deselectAll", "Deselect all")
            : t("profile.selectAll", "Select all")}
        </button>
        <button
          type="button"
          disabled={bulkSaving}
          onClick={onApply}
          className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-white transition hover:bg-primary/90"
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
          className="rounded-md border border-border px-3 py-1 text-xs text-white/70 transition hover:bg-white/5 hover:text-white"
        >
          {t("common.cancel", "Cancel")}
        </button>
      </div>
    </div>
  );
}
