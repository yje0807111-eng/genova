import { MAIN_GENRE_LABELS, type MainGenreKey } from "@/lib/constants/genres";

const RANK_LABEL: Record<number, string> = {
  1: "Gold",
  2: "Silver",
  3: "Bronze",
};

export function weeklyRankLabel(rank: number): string {
  return RANK_LABEL[rank] ?? `#${rank}`;
}

export function genreLabel(genre: string): string {
  return MAIN_GENRE_LABELS[genre as MainGenreKey] ?? genre;
}

export function formatWeekRange(weekStartIso: string): string {
  const start = new Date(`${weekStartIso}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function weeklyTrophyAccent(rank: number): string {
  if (rank === 1) return "#FFD700";
  if (rank === 2) return "#C0C0C0";
  if (rank === 3) return "#CD7F32";
  return "#AFA9EC";
}

/** Competition award display colors (대상 = special purple). */
export function competitionAwardAccent(award: string): string {
  switch (award) {
    case "대상":
      return "#9B8CFF";
    case "금상":
      return "#FFD700";
    case "은상":
      return "#C0C0C0";
    case "입선":
      return "#7F77DD";
    case "장려상":
      return "#CD7F32";
    default:
      return "#AFA9EC";
  }
}
