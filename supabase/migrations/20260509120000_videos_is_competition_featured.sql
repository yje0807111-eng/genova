-- 공모전 상세에서 관리자가 노출할 추천 출품 표시
alter table public.videos
add column if not exists is_competition_featured boolean not null default false;

create index if not exists idx_videos_competition_featured
on public.videos (submitted_competition_id)
where is_competition_featured = true;
