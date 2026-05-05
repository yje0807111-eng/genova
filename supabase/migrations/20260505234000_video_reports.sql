create table if not exists public.video_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  video_id text not null references public.videos (id) on delete cascade,
  reporter_user_id uuid not null references public.profiles (id) on delete cascade,
  scope text not null check (scope in ('video', 'audio', 'thumbnail', 'caption', 'comment')),
  reason text not null check (reason in ('spam', 'copyright', 'harassment', 'sexual', 'violence', 'hate', 'misinfo', 'other')),
  detail text,
  timestamp_sec integer,
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'rejected'))
);

create index if not exists idx_video_reports_video_created_at on public.video_reports (video_id, created_at desc);
create index if not exists idx_video_reports_status_created_at on public.video_reports (status, created_at desc);
create index if not exists idx_video_reports_reporter on public.video_reports (reporter_user_id, created_at desc);
