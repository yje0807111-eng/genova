-- 20260514120100_video_reports_service_role_admin_ops.sql
--
-- Tightens RLS on public.video_reports so the actual policy state
-- matches the intended security model:
--
--   - INSERT: any authenticated user can file a report against
--     themselves (`video_reports_insert_own`:
--     with check `auth.uid() = reporter_user_id`).
--   - SELECT/UPDATE/DELETE: SERVICE ROLE ONLY.
--     Admin read/triage paths in src/app/admin/page.tsx and
--     src/app/actions/reports.ts call createServiceSupabaseClient()
--     after isAdminEmail() verification.
--
-- Background: prior policies (`video_reports_select_authenticated`,
-- `..._update_authenticated`, `..._delete_authenticated`) had
-- `using (true)` predicates that let ANY signed-in user read every
-- report (including PII in `detail`), change any report's status,
-- or delete reports. The app-layer requireAdmin() guard only
-- protects the Server Action entry point; direct PostgREST hits
-- with a logged-in token bypassed it entirely.

alter table public.video_reports enable row level security;

-- 1. Drop every non-INSERT policy (regardless of name).
do $$
declare
  pol record;
begin
  for pol in
    select polname
    from pg_policy
    where polrelid = 'public.video_reports'::regclass
      and polcmd <> 'a'  -- 'a' = INSERT; drop everything else
  loop
    execute format('drop policy if exists %I on public.video_reports', pol.polname);
  end loop;
end $$;

-- 2. Re-assert the INSERT policy explicitly (idempotent).
drop policy if exists "video_reports_insert_own" on public.video_reports;
create policy "video_reports_insert_own"
  on public.video_reports
  for insert
  to authenticated
  with check (auth.uid() = reporter_user_id);

-- 3. Document the contract.
comment on table public.video_reports is
  'RLS contract: INSERT by authenticated user where reporter_user_id = auth.uid(); '
  'SELECT/UPDATE/DELETE are service-role only. Admin reads happen in '
  'src/app/admin/page.tsx and admin writes in src/app/actions/reports.ts, '
  'both using createServiceSupabaseClient() after isAdminEmail() verification.';
