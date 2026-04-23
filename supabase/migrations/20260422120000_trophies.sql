-- Trophies: weekly genre leaderboards + competition awards
-- Notifications: extend type for trophy alerts

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in ('comment', 'follow', 'competition_result', 'trophy'));

create table if not exists public.trophies (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('weekly_genre', 'competition')),
  rank integer check (rank is null or (rank >= 1 and rank <= 3)),
  genre text,
  competition_id text references public.competitions (id) on delete set null,
  award text,
  week_start date,
  created_at timestamptz not null default now (),
  constraint trophies_weekly_shape check (
    type <> 'weekly_genre'
    or (
      rank between 1 and 3
      and genre is not null
      and week_start is not null
      and competition_id is null
      and award is null
    )
  ),
  constraint trophies_competition_shape check (
    type <> 'competition'
    or (
      award is not null
      and award in ('대상', '금상', '은상', '입선', '장려상')
      and week_start is null
      and rank is null
    )
  )
);

create unique index if not exists trophies_weekly_slot_unique
  on public.trophies (genre, week_start, rank)
  where type = 'weekly_genre';

create unique index if not exists trophies_competition_user_unique
  on public.trophies (competition_id, user_id)
  where type = 'competition';

create index if not exists trophies_user_created_at on public.trophies (user_id, created_at desc);

alter table public.trophies enable row level security;

drop policy if exists "trophies_select_public" on public.trophies;
create policy "trophies_select_public" on public.trophies for select using (true);

-- Writes are performed with the service role (bypasses RLS) from server actions.
