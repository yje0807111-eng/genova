-- 영상 업로드 시 "new row violates row-level security policy" 대응
-- 앱은 (1) 클라이언트 storage.objects INSERT (썸네일)
-- (2) ensureProfile → profiles INSERT
-- (3) createVideoAction → videos INSERT 만 수행 (tags/ai_tools 는 videos 컬럼)

-- 1) profiles: INSERT 는 authenticated 에만 명시 (anon 은 auth.uid() null 로 실패하기 쉬움)
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid () = id);

-- 2) videos: 레거시 "Public read videos" 가 남아 있으면 SELECT 는 중복 허용이지만,
--    정책 이름·동작을 현재 스키마와 일치시키기 위해 제거 후 재생성
drop policy if exists "Public read videos" on public.videos;

drop policy if exists "videos_select_visible" on public.videos;
create policy "videos_select_visible" on public.videos for select using (
  uploaded_by is null
  or visibility = 'public'
  or auth.uid () = uploaded_by
);

drop policy if exists "videos_insert_owner" on public.videos;
create policy "videos_insert_owner" on public.videos for insert to authenticated with check (uploaded_by = auth.uid ());

drop policy if exists "videos_update_owner" on public.videos;
create policy "videos_update_owner" on public.videos for update to authenticated using (uploaded_by = auth.uid ()) with check (uploaded_by = auth.uid ());

drop policy if exists "videos_delete_owner" on public.videos;
create policy "videos_delete_owner" on public.videos for delete to authenticated using (uploaded_by = auth.uid ());

-- 3) Storage thumbnails: 첫 경로 세그먼트 = 로그인 사용자 UUID (split_part 로 안정적으로 비교)
drop policy if exists "thumbnails_authenticated_upload" on storage.objects;
create policy "thumbnails_authenticated_upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'thumbnails'
  and split_part (name, '/', 1) = auth.uid ()::text
);

drop policy if exists "thumbnails_authenticated_update" on storage.objects;
create policy "thumbnails_authenticated_update" on storage.objects for update to authenticated using (
  bucket_id = 'thumbnails'
  and split_part (name, '/', 1) = auth.uid ()::text
);

drop policy if exists "thumbnails_authenticated_delete" on storage.objects;
create policy "thumbnails_authenticated_delete" on storage.objects for delete to authenticated using (
  bucket_id = 'thumbnails'
  and split_part (name, '/', 1) = auth.uid ()::text
);
