-- A1 of the operations polish: lottery notification integration.
--
-- Adds the two notification types the lottery flow needs and the
-- per-winner dispatch-tracking columns the reminder cron uses for
-- idempotency.  No function bodies change — Phase 2A's
-- draw_competition_winners / redraw_winner_slot keep their existing
-- shape; the matching server actions (Phase 6-A) gain the
-- notification + email side-effects in the next commit.

-- ===================================================================
-- 1. Extend notifications.type enum.
-- ===================================================================
-- Previous values: 'comment', 'follow', 'competition_result',
-- 'trophy', 'like' (commits 20260414090000 + 20260422120000 +
-- 20260501120000_notifications_type_like).  Adds:
--   - lottery_winner   "축하합니다!" + claim URL on initial draw +
--                       on each redraw replacement
--   - lottery_reminder D-3 / D-1 nudge while claim_status='pending'

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'comment',
    'follow',
    'competition_result',
    'trophy',
    'like',
    'lottery_winner',
    'lottery_reminder'
  ));

-- ===================================================================
-- 2. Track reminder dispatch on each winner for idempotency.
-- ===================================================================
-- The cron sweep filters on `reminder_dN_at IS NULL` AND the
-- corresponding deadline window, then UPDATEs the matching column
-- after sending.  Reminders cannot fire twice per slot.

alter table public.competition_winners
  add column if not exists reminder_d3_at timestamptz;
alter table public.competition_winners
  add column if not exists reminder_d1_at timestamptz;

comment on column public.competition_winners.reminder_d3_at is
  'Set when the D-3 deadline reminder notification + email fires. '
  'NULL means not yet sent. Cron only dispatches when NULL.';
comment on column public.competition_winners.reminder_d1_at is
  'Set when the D-1 deadline reminder notification + email fires. '
  'NULL means not yet sent. Cron only dispatches when NULL.';

-- No new index needed — competition_winners_deadline_idx
-- (Phase 1 file 7, info_deadline WHERE claim_status='pending') is
-- exactly the predicate the reminder cron filters on.
