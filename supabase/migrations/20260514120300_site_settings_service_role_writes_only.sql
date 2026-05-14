-- 20260514120300_site_settings_service_role_writes_only.sql
--
-- Aligns RLS on public.site_settings with the intended security model.
--
--   - SELECT: public.  The home page and films hero render via
--     server components that read settings (e.g.
--     `home_featured_competition_id`, `films_hero_eyebrow_*`) under
--     an anon session.
--   - INSERT/UPDATE/DELETE: SERVICE ROLE ONLY.
--     The admin write surface is POST /api/site-settings, which now
--     calls requireAdminWithService() and writes through the service
--     client.
--
-- Background: the prior policy was a single "Admin only" `FOR ALL`
-- policy with `using (true)` and no role restriction, meaning ANY
-- caller — including anonymous unauthenticated clients — could read
-- AND write site_settings (e.g. flip `home_featured_competition_id`
-- to any value, including non-existent IDs).  The POST API route
-- also had no auth guard, so a curl one-liner could rewrite any
-- setting.  The route fix is shipped in the same commit.

alter table public.site_settings enable row level security;

-- 1. Drop every existing policy (rebuild from scratch).
do $$
declare
  pol record;
begin
  for pol in
    select polname
    from pg_policy
    where polrelid = 'public.site_settings'::regclass
  loop
    execute format('drop policy if exists %I on public.site_settings', pol.polname);
  end loop;
end $$;

-- 2. Public-read policy.
create policy "site_settings_public_read"
  on public.site_settings
  for select
  using (true);

-- 3. Document the contract.
comment on table public.site_settings is
  'RLS contract: SELECT is public; INSERT/UPDATE/DELETE are service-role only. '
  'Admin write surface is POST /api/site-settings, which uses '
  'createServiceSupabaseClient() after isAdminEmail() verification.';
