create table if not exists public.hashtag_stats (
  tag text primary key,
  search_count integer not null default 0,
  click_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create or replace function public.increment_hashtag_stat(p_tag text, p_event_type text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_tag text;
begin
  normalized_tag := lower(trim(both from regexp_replace(coalesce(p_tag, ''), '^#+', '')));
  if normalized_tag = '' then
    return;
  end if;

  insert into public.hashtag_stats (tag, search_count, click_count, updated_at)
  values (
    normalized_tag,
    case when p_event_type = 'search' then 1 else 0 end,
    case when p_event_type = 'click' then 1 else 0 end,
    now()
  )
  on conflict (tag) do update
  set
    search_count = public.hashtag_stats.search_count + case when p_event_type = 'search' then 1 else 0 end,
    click_count = public.hashtag_stats.click_count + case when p_event_type = 'click' then 1 else 0 end,
    updated_at = now();
end;
$$;

grant execute on function public.increment_hashtag_stat(text, text) to anon, authenticated;
