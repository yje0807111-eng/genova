alter table public.profiles add column if not exists country text;
alter table public.profiles add column if not exists main_genre text;
alter table public.profiles add column if not exists tiktok_url text;
alter table public.profiles add column if not exists vimeo_url text;
alter table public.profiles add column if not exists notify_likes boolean not null default true;
alter table public.profiles add column if not exists notify_comments boolean not null default true;
alter table public.profiles add column if not exists notify_follows boolean not null default true;
