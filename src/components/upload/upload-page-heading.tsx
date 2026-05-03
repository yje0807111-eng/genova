"use client";

import { useI18n } from "@/components/genova/language-provider";

export function UploadPageHeading({ variant }: { variant: "upload" | "edit" }) {
  const { t } = useI18n();
  if (variant === "upload") {
    return (
      <div className="space-y-2">
        <p className="eyebrow">{t("upload.eyebrow")}</p>
        <h1 className="page-title text-3xl sm:text-4xl">{t("upload.pageTitle")}</h1>
        <p className="page-subtitle">{t("upload.pageSubtitle")}</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <p className="eyebrow">{t("upload.editEyebrow")}</p>
      <h1 className="page-title text-3xl sm:text-4xl">{t("upload.editTitle")}</h1>
      <p className="page-subtitle">{t("upload.editSubtitle")}</p>
    </div>
  );
}
