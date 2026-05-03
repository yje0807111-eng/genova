import type { Locale } from "@/lib/i18n/translations";

/** Short relative label for uploads / cards (e.g. “2일 전”). */
export function formatUploadedRelative(iso: string | Date, locale: Locale = "en"): string {
  const t = typeof iso === "string" ? new Date(iso).getTime() : iso.getTime();
  if (Number.isNaN(t)) return "";
  const sec = Math.floor((Date.now() - t) / 1000);
  const loc = locale === "ko" ? "ko" : locale === "ja" ? "ja" : "en";

  if (sec < 45) {
    if (locale === "ko") return "방금 전";
    if (locale === "ja") return "たった今";
    return "just now";
  }

  const min = Math.floor(sec / 60);
  if (min < 60) {
    return new Intl.RelativeTimeFormat(loc, { numeric: "auto" }).format(-min, "minute");
  }

  const hr = Math.floor(min / 60);
  if (hr < 24) {
    return new Intl.RelativeTimeFormat(loc, { numeric: "auto" }).format(-hr, "hour");
  }

  const day = Math.floor(hr / 24);
  if (day < 7) {
    return new Intl.RelativeTimeFormat(loc, { numeric: "auto" }).format(-day, "day");
  }

  const week = Math.floor(day / 7);
  if (week < 5) {
    return new Intl.RelativeTimeFormat(loc, { numeric: "auto" }).format(-week, "week");
  }

  return new Intl.DateTimeFormat(loc, { month: "short", day: "numeric", year: "numeric" }).format(t);
}
