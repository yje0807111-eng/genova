alter table public.video_reports enable row level security;

drop policy if exists "video_reports_insert_own" on public.video_reports;
create policy "video_reports_insert_own"
on public.video_reports
for insert
to authenticated
with check (auth.uid() = reporter_user_id);

drop policy if exists "video_reports_select_authenticated" on public.video_reports;
create policy "video_reports_select_authenticated"
on public.video_reports
for select
to authenticated
using (true);

drop policy if exists "video_reports_update_authenticated" on public.video_reports;
create policy "video_reports_update_authenticated"
on public.video_reports
for update
to authenticated
using (true)
with check (true);
