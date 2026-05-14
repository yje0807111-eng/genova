-- 20260514120000_competitions_service_role_writes_only.sql
--
-- Tightens RLS on public.competitions so the actual policy state
-- matches the intended security model:
--
--   - SELECT: public.  Anyone can browse competitions.
--   - INSERT/UPDATE/DELETE: SERVICE ROLE ONLY.
--     The app-layer admin guard (isAdminEmail() in
--     src/lib/auth/admin.ts) runs first in Server Actions; those
--     actions then use createServiceSupabaseClient() to perform
--     the write.
--
-- Background: an earlier "Admin"-named policy on this table had a
-- predicate that resolved to `using (true)` for any authenticated
-- user, meaning every signed-in account could insert/update/delete
-- competitions through PostgREST. This migration drops every
-- non-SELECT policy on the table, leaving only the public-read
-- policy intact, and updates src/app/actions/admin.ts to route
-- competition writes through the service-role client.

-- 1. Ensure RLS is on (idempotent — already on per
--    20260413000000_votes_unique_and_rls.sql).
alter table public.competitions enable row level security;

-- 2. Drop every policy that is NOT a SELECT policy on this table,
--    regardless of name. This is the safe way to clean up the
--    "Admin"-named policy without depending on its exact name.
do $$
declare
  pol record;
begin
  for pol in
    select polname
    from pg_policy
    where polrelid = 'public.competitions'::regclass
      and polcmd <> 'r'  -- 'r' = SELECT; drop everything else
  loop
    execute format('drop policy if exists %I on public.competitions', pol.polname);
  end loop;
end $$;

-- 3. Re-assert the public-read policy explicitly so the canonical
--    state of this table is captured in one place.
drop policy if exists "Public read competitions" on public.competitions;
create policy "Public read competitions"
  on public.competitions
  for select
  using (true);

-- 4. Document the contract for future maintainers.
comment on table public.competitions is
  'RLS contract: SELECT is public; INSERT/UPDATE/DELETE are service-role only. '
  'Admin write paths live in src/app/actions/admin.ts and must use '
  'createServiceSupabaseClient(). App-layer admin guard via isAdminEmail() '
  'is the security boundary; RLS cannot distinguish admins from other '
  'authenticated users because there is no DB-level admin role.';
