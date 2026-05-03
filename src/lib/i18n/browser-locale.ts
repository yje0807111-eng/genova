import type { Locale } from "@/lib/i18n/translations";

/** BCP 47 tag for `Intl` / `toLocaleDateString`. */
export function intlDateLocale(locale: Locale): string {
  switch (locale) {
    case "ko":
      return "ko-KR";
    case "ja":
      return "ja-JP";
    default:
      return "en-US";
  }
}
