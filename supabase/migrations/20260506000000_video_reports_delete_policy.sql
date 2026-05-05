-- video_reports 삭제 허용 (관리자 대시보드 삭제 동작용)
drop policy if exists "video_reports_delete_authenticated" on public.video_reports;
create policy "video_reports_delete_authenticated"
on public.video_reports
for delete
to authenticated
using (true);
