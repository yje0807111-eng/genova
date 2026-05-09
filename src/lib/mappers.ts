import type { Competition, Creator, Video } from "@/lib/types";

type CreatorRow = {
  id: string;
  name: string;
  avatar_url: string;
  bio: string;
  is_partner: boolean;
  award_count: number;
};

type VideoRow = {
  id: string;
  title: string;
  thumbnail_url: string;
  backdrop_url?: string | null;
  vimeo_id: string | null;
  mux_playback_id?: string | null;
  mux_asset_id?: string | null;
  mux_upload_id?: string | null;
  genre: string;
  additional_genres?: string[] | null;
  sub_genre?: string | null;
  purpose?: string | null;
  creator_id: string | null;
  is_original: boolean;
  is_finalist: boolean;
  is_competition_featured?: boolean | null;
  award: string | null;
  runtime: string;
  created_at: string;
  uploaded_by?: string | null;
  visibility?: string;
  description?: string | null;
  ai_tools?: string[] | null;
  tags?: string[] | null;
  series_name?: string | null;
  episode_number?: number | null;
  view_count?: number | null;
  creators?: CreatorRow | CreatorRow[] | null;
  profiles?:
    | { display_name: string | null; avatar_url?: string | null }
    | { display_name: string | null; avatar_url?: string | null }[]
    | null;
};

type CompetitionRow = {
  id: string;
  title: string;
  title_en?: string | null;
  title_ko?: string | null;
  title_ja?: string | null;
  genre: string;
  status: string;
  deadline: string;
  vote_end: string;
  prize_info: string;
  prize_info_en?: string | null;
  prize_info_ko?: string | null;
  prize_info_ja?: string | null;
  sponsor: string;
  is_featured?: boolean | null;
};

export function mapCreator(row: CreatorRow): Creator {
  return {
    id: row.id,
    name: row.name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    isPartner: row.is_partner,
    awardCount: row.award_count,
  };
}

export function mapVideo(row: VideoRow): Video {
  const nested = row.creators;
  const creator =
    nested && !Array.isArray(nested)
      ? nested
      : Array.isArray(nested) && nested[0]
        ? nested[0]
        : null;

  const prof = row.profiles;
  const profileRow =
    prof && !Array.isArray(prof) ? prof : Array.isArray(prof) && prof[0] ? prof[0] : null;

  const vis = row.visibility === "private" ? "private" : "public";
  const purpose = row.purpose === "competition" ? "competition" : "personal";

  return {
    id: row.id,
    title: row.title,
    thumbnailUrl: row.thumbnail_url,
    backdropUrl: row.backdrop_url ?? null,
    vimeoId: row.vimeo_id ?? null,
    muxPlaybackId: row.mux_playback_id ?? null,
    genre: row.genre,
    additionalGenres: Array.isArray(row.additional_genres) ? row.additional_genres : [],
    subGenre: row.sub_genre ?? null,
    purpose,
    creatorId: row.creator_id,
    isOriginal: row.is_original,
    isFinalist: row.is_finalist,
    isCompetitionFeatured: Boolean(row.is_competition_featured),
    award: row.award,
    runtime: row.runtime,
    createdAt: row.created_at,
    visibility: vis,
    description: row.description ?? "",
    aiTools: row.ai_tools ?? [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    seriesName: row.series_name ?? null,
    episodeNumber: typeof row.episode_number === "number" ? row.episode_number : null,
    viewCount: typeof row.view_count === "number" ? row.view_count : 0,
    uploadedBy: row.uploaded_by ?? null,
    creatorName: creator?.name,
    creatorAvatarUrl: creator?.avatar_url ?? null,
    uploaderDisplayName: profileRow?.display_name ?? null,
    uploaderAvatarUrl: profileRow?.avatar_url ?? null,
  };
}

export function mapCompetition(row: CompetitionRow): Competition {
  return {
    id: row.id,
    title: row.title,
    titleEn: row.title_en ?? null,
    titleKo: row.title_ko ?? null,
    titleJa: row.title_ja ?? null,
    genre: row.genre,
    status: row.status,
    deadline: row.deadline,
    voteEnd: row.vote_end,
    prizeInfo: row.prize_info,
    prizeInfoEn: row.prize_info_en ?? null,
    prizeInfoKo: row.prize_info_ko ?? null,
    prizeInfoJa: row.prize_info_ja ?? null,
    sponsor: row.sponsor,
    isFeatured: Boolean(row.is_featured),
  };
}
