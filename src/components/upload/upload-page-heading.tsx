import { getServerLocale, getServerT } from "@/lib/i18n/server";

/**
 * Server component — Phase B.2-6.  Pure text headings; no client APIs.
 */
export async function UploadPageHeading({ variant }: { variant: "upload" | "edit" }) {
  const locale = await getServerLocale();
  const t = getServerT(locale);
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
