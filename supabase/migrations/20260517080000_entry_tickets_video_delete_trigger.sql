-- ---------------------------------------------------------------
-- Corrective migration: ensure deleting a video revokes its
-- earned lottery ticket so it leaves the active monthly pool.
--
-- The original mechanism (FK `video_id ... on delete set null`
-- + BEFORE UPDATE trigger `entry_tickets_video_delete_trigger`)
-- was defined in 20260516150100_entry_tickets_table.sql but may
-- not have been applied to every environment. This migration is
-- idempotent and safe to re-run.
-- ---------------------------------------------------------------

-- 1. Ensure the video_id FK uses ON DELETE SET NULL so a deleted
--    video transitions entry_tickets.video_id non-NULL → NULL
--    (which the trigger below converts into a status flip).
alter table public.entry_tickets
  drop constraint if exists entry_tickets_video_id_fkey;

alter table public.entry_tickets
  add constraint entry_tickets_video_id_fkey
  foreign key (video_id) references public.videos (id)
  on delete set null;

-- 2. (Re)create the revoke-on-video-delete trigger.
create or replace function public.entry_tickets_handle_video_delete()
returns trigger
language plpgsql
as $$
begin
  if old.video_id is not null and new.video_id is null then
    new.status := 'revoked';
    new.revoked_reason := coalesce(new.revoked_reason, 'video_deleted');
    new.revoked_at := coalesce(new.revoked_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists entry_tickets_video_delete_trigger on public.entry_tickets;

create trigger entry_tickets_video_delete_trigger
  before update on public.entry_tickets
  for each row
  execute function public.entry_tickets_handle_video_delete();

-- 3. Backfill: any ticket whose source video no longer exists but
--    is still 'active' should be revoked now.
update public.entry_tickets t
set status = 'revoked',
    revoked_reason = coalesce(t.revoked_reason, 'video_deleted'),
    revoked_at = coalesce(t.revoked_at, now())
where t.status = 'active'
  and t.video_id is not null
  and not exists (
    select 1 from public.videos v where v.id = t.video_id
  );

notify pgrst, 'reload schema';
