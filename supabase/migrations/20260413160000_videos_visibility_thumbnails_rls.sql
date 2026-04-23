-- 업로드·공개범위·썸네일 스토리지
alter table public.videos alter column creator_id drop not null;

alter table public.videos add column if not exists visibility text not null default 'public'::text
  check (visibility in ('public', 'private'));

alter table public.videos add column if not exists description text not null default ''::text;

alter table public.videos add column if not exists ai_tools text[] not null default '{}'::text[];

alter table public.videos add column if not exists submitted_competition_id text references public.competitions (id) on delete set null;

alter table public.videos
  drop constraint if exists videos_uploaded_by_fkey;

alter table public.videos
  add constraint videos_uploaded_by_fkey foreign key (uploaded_by) references public.profiles (id) on delete set null;

create index if not exists idx_videos_visibility_uploaded on public.videos (visibility, uploaded_by);

-- Storage: 썸네일
insert into storage.buckets (id, name, public)
values ('thumbnails', 'thumbnails', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "thumbnails_public_read" on storage.objects;
create policy "thumbnails_public_read" on storage.objects for select using (bucket_id = 'thumbnails');

drop policy if exists "thumbnails_authenticated_upload" on storage.objects;
create policy "thumbnails_authenticated_upload" on storage.objects for insert to authenticated
with check (
  bucket_id = 'thumbnails'
  and name like auth.uid ()::text || '/%'
);

drop policy if exists "thumbnails_authenticated_update" on storage.objects;
create policy "thumbnails_authenticated_update" on storage.objects for update to authenticated using (
  bucket_id = 'thumbnails'
  and name like auth.uid ()::text || '/%'
);

drop policy if exists "thumbnails_authenticated_delete" on storage.objects;
create policy "thumbnails_authenticated_delete" on storage.objects for delete to authenticated using (
  bucket_id = 'thumbnails'
  and name like auth.uid ()::text || '/%'
);

-- RLS: videos
alter table public.videos enable row level security;

drop policy if exists "videos_select_visible" on public.videos;
create policy "videos_select_visible" on public.videos for select using (
  uploaded_by is null
  or visibility = 'public'
  or auth.uid () = uploaded_by
);

drop policy if exists "videos_insert_owner" on public.videos;
create policy "videos_insert_owner" on public.videos for insert to authenticated
with check (uploaded_by = auth.uid ());

drop policy if exists "videos_update_owner" on public.videos;
create policy "videos_update_owner" on public.videos for update to authenticated using (uploaded_by = auth.uid ());

drop policy if exists "videos_delete_owner" on public.videos;
create policy "videos_delete_owner" on public.videos for delete to authenticated using (uploaded_by = auth.uid ());
