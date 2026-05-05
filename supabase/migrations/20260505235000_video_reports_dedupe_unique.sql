-- 같은 사용자/같은 영상/같은 사유 중복 신고 방지
create unique index if not exists uq_video_reports_reporter_video_reason
on public.video_reports (reporter_user_id, video_id, reason);
