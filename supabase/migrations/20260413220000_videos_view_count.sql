-- 조회수 (영상 상세 진입 시 RPC로 증가; RLS 우회)
alter table public.videos add column if not exists view_count integer not null default 0;

create index if not exists idx_videos_view_count on public.videos (view_count desc);

create or replace function public.increment_video_view_count (p_video_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.videos
  set view_count = view_count + 1
  where id = p_video_id;
end;
$$;

grant execute on function public.increment_video_view_count (text) to anon;
grant execute on function public.increment_video_view_count (text) to authenticated;
