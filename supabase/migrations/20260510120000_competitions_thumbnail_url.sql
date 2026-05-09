alter table public.competitions
  add column if not exists thumbnail_url text;

notify pgrst, 'reload schema';
