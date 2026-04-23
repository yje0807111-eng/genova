-- 한 공모전·작품당 사용자 1표 (중복 시 DB에서 차단)
create unique index if not exists votes_user_video_competition_unique
  on public.votes (user_id, video_id, competition_id);

alter table public.creators enable row level security;
alter table public.videos enable row level security;
alter table public.competitions enable row level security;
alter table public.votes enable row level security;

drop policy if exists "Public read creators" on public.creators;
create policy "Public read creators" on public.creators for select using (true);

drop policy if exists "Public read videos" on public.videos;
create policy "Public read videos" on public.videos for select using (true);

drop policy if exists "Public read competitions" on public.competitions;
create policy "Public read competitions" on public.competitions for select using (true);

drop policy if exists "Users read own votes" on public.votes;
create policy "Users read own votes" on public.votes for select using (auth.uid() = user_id);

drop policy if exists "Users insert own votes" on public.votes;
create policy "Users insert own votes" on public.votes for insert with check (auth.uid() = user_id);
