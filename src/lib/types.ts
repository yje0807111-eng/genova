export type VideoPurpose = "personal" | "competition";

export type Genre = string;

export type Creator = {
  id: string;
  name: string;
  avatarUrl: string;
  bio: string;
  isPartner: boolean;
  awardCount: number;
  /** Present when loaded from catalog queries that join follower stats */
  followerCount?: number;
};

export type Video = {
  id: string;
  title: string;
  thumbnailUrl: string;
  backdropUrl?: string | null;
  /** Mux playback ID when video was uploaded via Mux direct upload */
  muxPlaybackId?: string | null;
  /** Main genre slug (e.g. `short_film`) */
  genre: string;
  /** Additional main genres selected by creator (first selected genre remains `genre`) */
  additionalGenres?: string[];
  /** Upload purpose (portfolio vs competition) */
  purpose: VideoPurpose;
  /** Catalog creator link; null for uploads not tied to a creator row */
  creatorId: string | null;
  isOriginal: boolean;
  isFinalist: boolean;
  /** 관리자 지정: 공모전 상세 등에서 강조 노출 */
  isCompetitionFeatured?: boolean;
  award?: string | null;
  runtime: string;
  createdAt: string;
  visibility: "public" | "private";
  description: string;
  aiTools: string[];
  /** Hashtags stored without leading # */
  tags: string[];
  /** Series grouping when `genre` is series-style content */
  seriesName: string | null;
  episodeNumber: number | null;
  uploadedBy: string | null;
  /** Populated when joined with creators */
  creatorName?: string;
  /** Avatar from creators join (lists / feed) */
  creatorAvatarUrl?: string | null;
  /** Display name from uploaded_by profile join */
  uploaderDisplayName?: string | null;
  /** Avatar from profiles join (lists / feed) */
  uploaderAvatarUrl?: string | null;
  /** View count from DB (detail / profile lists) */
  viewCount?: number;
  /** Like count when engagement is joined */
  likeCount?: number;
  likedByMe?: boolean;
  savedByMe?: boolean;
  /** Save count when engagement is merged */
  saveCount?: number;
};

export type VideoComment = {
  id: string;
  userId: string;
  videoId: string;
  parentId: string | null;
  content: string;
  isPinned?: boolean;
  pinOrder?: number | null;
  createdAt: string;
  displayName: string | null;
  avatarUrl: string | null;
  likeCount: number;
  likedByMe: boolean;
  replies: VideoComment[];
};

export type Competition = {
  id: string;
  title: string;
  titleEn?: string | null;
  titleKo?: string | null;
  titleJa?: string | null;
  genre: string;
  status: string;
  deadline: string;
  voteEnd: string;
  prizeInfo: string;
  prizeInfoEn?: string | null;
  prizeInfoKo?: string | null;
  prizeInfoJa?: string | null;
  sponsor: string;
  thumbnailUrl?: string | null;
  rules?: string | null;
  judgingCriteria?: string | null;
  eligibility?: string | null;
  submissionGuidelines?: string | null;
  announcement?: string | null;
  templateUrl?: string | null;
  sponsorLogoUrl?: string | null;
  currency?: string | null;
  exchangeRateUsdKrw?: number | null;
  exchangeRateUsdJpy?: number | null;
  /** 관리자: /competition 목록 등에서 추천 공모전으로 노출 */
  isFeatured?: boolean | null;
};
