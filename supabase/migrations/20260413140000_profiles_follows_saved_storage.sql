-- 회원 프로필(인증 사용자). 기존 public.creators 는 카탈로그 크리에이터용 시드 데이터로 유지합니다.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text default ''::text,
  tools text[] not null default '{}'::text[],
  subscription_tier text not null default 'free'::text check (subscription_tier in ('free', 'basic', 'pro')),
  is_genova_partner boolean not null default false,
  total_awards integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.follows (
  id uuid primary key default gen_random_uuid (),
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.saved_videos (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  video_id text not null references public.videos (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, video_id)
);

create table if not exists public.user_awards (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references public.profiles (id) on delete cascade,
  competition_title text,
  award_title text not null,
  awarded_at date,
  created_at timestamptz not null default now()
);

alter table public.videos add column if not exists uploaded_by uuid references auth.users (id) on delete set null;

create index if not exists idx_follows_follower on public.follows (follower_id);
create index if not exists idx_follows_following on public.follows (following_id);
create index if not exists idx_saved_videos_user on public.saved_videos (user_id);
create index if not exists idx_videos_uploaded_by on public.videos (uploaded_by);

-- 신규 가입 시 프로필 자동 생성
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(coalesce(new.email, ''), '@', 1),
      '사용자'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users for each row
execute function public.handle_new_user ();

alter table public.profiles enable row level security;
alter table public.follows enable row level security;
alter table public.saved_videos enable row level security;
alter table public.user_awards enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid () = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid () = id);

drop policy if exists "follows_select_all" on public.follows;
create policy "follows_select_all" on public.follows for select using (true);

drop policy if exists "follows_insert_self" on public.follows;
create policy "follows_insert_self" on public.follows for insert with check (auth.uid () = follower_id);

drop policy if exists "follows_delete_self" on public.follows;
create policy "follows_delete_self" on public.follows for delete using (auth.uid () = follower_id);

drop policy if exists "saved_select_own" on public.saved_videos;
create policy "saved_select_own" on public.saved_videos for select using (auth.uid () = user_id);

drop policy if exists "saved_insert_own" on public.saved_videos;
create policy "saved_insert_own" on public.saved_videos for insert with check (auth.uid () = user_id);

drop policy if exists "saved_delete_own" on public.saved_videos;
create policy "saved_delete_own" on public.saved_videos for delete using (auth.uid () = user_id);

drop policy if exists "user_awards_select_all" on public.user_awards;
create policy "user_awards_select_all" on public.user_awards for select using (true);

drop policy if exists "user_awards_insert_own" on public.user_awards;
create policy "user_awards_insert_own" on public.user_awards for insert with check (auth.uid () = user_id);

drop policy if exists "user_awards_delete_own" on public.user_awards;
create policy "user_awards_delete_own" on public.user_awards for delete using (auth.uid () = user_id);

-- Storage: 아바타
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects for select using (bucket_id = 'avatars');

drop policy if exists "avatars_authenticated_upload" on storage.objects;
create policy "avatars_authenticated_upload" on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and name like auth.uid ()::text || '/%'
);

drop policy if exists "avatars_authenticated_update" on storage.objects;
create policy "avatars_authenticated_update" on storage.objects for update to authenticated using (
  bucket_id = 'avatars'
  and name like auth.uid ()::text || '/%'
);

drop policy if exists "avatars_authenticated_delete" on storage.objects;
create policy "avatars_authenticated_delete" on storage.objects for delete to authenticated using (
  bucket_id = 'avatars'
  and name like auth.uid ()::text || '/%'
);
