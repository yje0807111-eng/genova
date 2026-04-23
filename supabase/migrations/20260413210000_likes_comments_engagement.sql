-- 영상 좋아요
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  video_id text not null references public.videos (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, video_id)
);

create index if not exists idx_likes_video on public.likes (video_id);
create index if not exists idx_likes_user on public.likes (user_id);

alter table public.likes enable row level security;

drop policy if exists "likes_select_all" on public.likes;
create policy "likes_select_all" on public.likes for select using (true);

drop policy if exists "likes_insert_own" on public.likes;
create policy "likes_insert_own" on public.likes for insert to authenticated with check (auth.uid () = user_id);

drop policy if exists "likes_delete_own" on public.likes;
create policy "likes_delete_own" on public.likes for delete to authenticated using (auth.uid () = user_id);

-- 댓글
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  video_id text not null references public.videos (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  content text not null check (char_length (trim(content)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_comments_video on public.comments (video_id, created_at);
create index if not exists idx_comments_parent on public.comments (parent_id);

alter table public.comments enable row level security;

drop policy if exists "comments_select_all" on public.comments;
create policy "comments_select_all" on public.comments for select using (true);

drop policy if exists "comments_insert_auth" on public.comments;
create policy "comments_insert_auth" on public.comments for insert to authenticated with check (
  auth.uid () = user_id
);

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own" on public.comments for delete to authenticated using (auth.uid () = user_id);

-- 댓글 좋아요
create table if not exists public.comment_likes (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  comment_id uuid not null references public.comments (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, comment_id)
);

create index if not exists idx_comment_likes_comment on public.comment_likes (comment_id);

alter table public.comment_likes enable row level security;

drop policy if exists "comment_likes_select_all" on public.comment_likes;
create policy "comment_likes_select_all" on public.comment_likes for select using (true);

drop policy if exists "comment_likes_insert_own" on public.comment_likes;
create policy "comment_likes_insert_own" on public.comment_likes for insert to authenticated with check (auth.uid () = user_id);

drop policy if exists "comment_likes_delete_own" on public.comment_likes;
create policy "comment_likes_delete_own" on public.comment_likes for delete to authenticated using (auth.uid () = user_id);

-- saved_videos 정책 재적용 (본인만 SELECT/INSERT/DELETE)
drop policy if exists "saved_select_own" on public.saved_videos;
create policy "saved_select_own" on public.saved_videos for select using (auth.uid () = user_id);

drop policy if exists "saved_insert_own" on public.saved_videos;
create policy "saved_insert_own" on public.saved_videos for insert with check (auth.uid () = user_id);

drop policy if exists "saved_delete_own" on public.saved_videos;
create policy "saved_delete_own" on public.saved_videos for delete using (auth.uid () = user_id);
