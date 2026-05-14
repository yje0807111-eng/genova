import { formatGenreDisplay } from "@/lib/constants/genres";
import { getServerLocale } from "@/lib/i18n/server";

/**
 * Server component — renders a genre label localized for the caller's
 * locale.  Converted from client to server in Phase B.2-6 since it only
 * reads the locale (no event handlers, no state).  Async because
 * `getServerLocale()` is async.
 */
export async function LocalizedGenreText({
  genre,
  subGenre,
  className,
}: {
  genre: string | null | undefined;
  subGenre?: string | null | undefined;
  className?: string;
}) {
  const locale = await getServerLocale();
  const text = formatGenreDisplay(genre, subGenre, locale);
  return className ? <span className={className}>{text}</span> : <>{text}</>;
}
