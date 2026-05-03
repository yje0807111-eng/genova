"use client";

import { formatGenreDisplay } from "@/lib/constants/genres";
import { useI18n } from "@/components/genova/language-provider";

export function LocalizedGenreText({
  genre,
  subGenre,
  className,
}: {
  genre: string | null | undefined;
  subGenre?: string | null | undefined;
  className?: string;
}) {
  const { locale } = useI18n();
  const text = formatGenreDisplay(genre, subGenre, locale);
  return className ? <span className={className}>{text}</span> : <>{text}</>;
}
