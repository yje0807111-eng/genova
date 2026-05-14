-- 20260514120200_business_inquiries_service_role_admin_ops.sql
--
-- Aligns RLS on public.business_inquiries with the intended security
-- model. Mirrors the video_reports tightening in 20260514120100.
--
--   - INSERT: anyone (anon + authenticated) can submit an inquiry
--     (`Anyone can submit inquiries`: with check `true`).
--   - SELECT/UPDATE/DELETE: SERVICE ROLE ONLY.
--     Admin read/triage paths in src/app/actions/business-inquiries.ts
--     call createServiceSupabaseClient() after isAdminEmail()
--     verification.
--
-- Background: prior policies (`Authenticated users can {read,update,
-- delete} inquiries`) had predicates `auth.uid() IS NOT NULL`, so any
-- signed-in user could read every inquiry (including PII: email,
-- phone, business notes), update any status, or delete records.

alter table public.business_inquiries enable row level security;

-- 1. Drop every non-INSERT policy (regardless of name).
do $$
declare
  pol record;
begin
  for pol in
    select polname
    from pg_policy
    where polrelid = 'public.business_inquiries'::regclass
      and polcmd <> 'a'  -- 'a' = INSERT; drop everything else
  loop
    execute format('drop policy if exists %I on public.business_inquiries', pol.polname);
  end loop;
end $$;

-- 2. Re-assert the INSERT policy explicitly (idempotent).
drop policy if exists "Anyone can submit inquiries" on public.business_inquiries;
create policy "Anyone can submit inquiries"
  on public.business_inquiries
  for insert
  with check (true);

comment on table public.business_inquiries is
  'RLS contract: INSERT public (anyone can submit); '
  'SELECT/UPDATE/DELETE are service-role only. Admin reads/writes in '
  'src/app/actions/business-inquiries.ts use createServiceSupabaseClient() '
  'after isAdminEmail() verification.';
