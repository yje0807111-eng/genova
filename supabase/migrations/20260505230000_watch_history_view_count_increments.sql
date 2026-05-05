-- 같은 유저가 같은 영상 조회수를 최대 3회까지만 올리기 위한 카운터
alter table public.watch_history
add column if not exists view_count_increments integer not null default 0;
