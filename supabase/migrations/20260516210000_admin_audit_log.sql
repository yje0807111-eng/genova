-- Security #2: admin audit log.
--
-- Destructive / irreversible admin actions (competition delete,
-- winner-slot redraw, mark-paid, entry-ticket revoke, trophy
-- grant/revoke) previously left no "who did what, when" trail.
-- This table records an append-only audit row per such action so
-- accountability, incident response and debugging are possible.
--
-- Written exclusively by the server via the service-role client
-- (src/lib/audit.ts → logAdminAction).  RLS is enabled with NO
-- policies, so the table is unreadable/unwritable by anon/auth
-- clients; only the service role (which bypasses RLS) can touch it.
-- Logging is best-effort: a failure here never blocks or rolls back
-- the primary admin action.

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text not null,
  target_type text,
  target_id text,
  detail jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_log_created_at
  on public.admin_audit_log (created_at desc);
create index if not exists idx_admin_audit_log_action
  on public.admin_audit_log (action);
create index if not exists idx_admin_audit_log_actor
  on public.admin_audit_log (actor_id);

alter table public.admin_audit_log enable row level security;
-- Intentionally no policies: service-role-only access.
