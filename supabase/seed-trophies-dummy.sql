-- Dummy trophies for profile testing (Supabase SQL Editor)
-- User must exist in public.profiles (same id as auth.users).
--
-- Competition: (user_id, competition_id) is unique per competition — use 1st..5th competition
-- by deadline (or NULL if that slot has no competition row).

begin;

with
  uid as (
    select '91fb0109-87da-4483-9df6-6b5e91d2ae7f'::uuid as id
  ),
  comps as (
    select
      id,
      row_number() over (order by deadline asc nulls last, id asc) as rn
    from public.competitions
  )
insert into public.trophies (
  user_id,
  type,
  rank,
  genre,
  competition_id,
  award,
  week_start
)
  select uid.id, 'competition'::text, null::integer, null::text, (select id from comps where rn = 1 limit 1), '대상'::text, null::date
  from uid
  union all
  select uid.id, 'competition', null, null, (select id from comps where rn = 2 limit 1), '금상', null
  from uid
  union all
  select uid.id, 'competition', null, null, (select id from comps where rn = 3 limit 1), '은상', null
  from uid
  union all
  select uid.id, 'competition', null, null, (select id from comps where rn = 4 limit 1), '입선', null
  from uid
  union all
  select uid.id, 'competition', null, null, (select id from comps where rn = 5 limit 1), '장려상', null
  from uid
  union all
  select uid.id, 'weekly_genre', 1, 'short_film', null, null, '2025-01-06'::date
  from uid
  union all
  select uid.id, 'weekly_genre', 2, 'mv', null, null, '2025-01-06'::date
  from uid
  union all
  select uid.id, 'weekly_genre', 3, 'action', null, null, '2025-01-06'::date
  from uid
  union all
  select uid.id, 'weekly_genre', 1, 'short_film', null, null, '2025-01-13'::date
  from uid
  union all
  select uid.id, 'weekly_genre', 2, 'short_film', null, null, '2025-01-20'::date
  from uid;

commit;
