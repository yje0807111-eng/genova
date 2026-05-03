-- Mux direct upload: nullable Vimeo ID + Mux metadata
alter table public.videos alter column vimeo_id drop not null;

alter table public.videos add column if not exists mux_playback_id text null;
alter table public.videos add column if not exists mux_asset_id text null;
alter table public.videos add column if not exists mux_upload_id text null;
