export type VideoPurpose = "personal" | "competition";

export type Genre = string;

export type Creator = {
  id: string;
  name: string;
  avatarUrl: string;
  bio: string;
  isPartner: boolean;
  awardCount: number;
};

export type Video = {
  id: string;
  title: string;
  thumbnailUrl: string;
  vimeoId: string;
  /** 메인 장르 slug (`short_film` 등) */
  genre: string;
  /** 서브 장르 slug; 메인에 따라 없을 수 있음 */
  subGenre: string | null;
  /** 업로드 목적 */
  purpose: VideoPurpose;
  /** 카탈로그 크리에이터 연결; 업로드 작품은 null 가능 */
  creatorId: string | null;
  isOriginal: boolean;
  isFinalist: boolean;
  award?: string | null;
  runtime: string;
  createdAt: string;
  visibility: "public" | "private";
  description: string;
  aiTools: string[];
  /** 해시 태그(저장 시 # 제외 문자열) */
  tags: string[];
  /** 단편 시리즈(`series`) 전용 */
  seriesName: string | null;
  episodeNumber: number | null;
  uploadedBy: string | null;
  /** Set when joined with creators */
  creatorName?: string;
  /** creators 조인 시 (목록·피드 아바타) */
  creatorAvatarUrl?: string | null;
  /** uploaded_by 프로필 조인 시 */
  uploaderDisplayName?: string | null;
  /** profiles 조인 시 (목록·피드 아바타) */
  uploaderAvatarUrl?: string | null;
  /** DB 조회수 (상세·프로필 목록) */
  viewCount?: number;
  /** 좋아요 수 (목록·상세에서 engagement 조인 시) */
  likeCount?: number;
  likedByMe?: boolean;
  savedByMe?: boolean;
};

export type VideoComment = {
  id: string;
  userId: string;
  videoId: string;
  parentId: string | null;
  content: string;
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
  genre: string;
  status: string;
  deadline: string;
  voteEnd: string;
  prizeInfo: string;
  sponsor: string;
};
