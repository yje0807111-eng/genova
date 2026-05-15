-- E1: notifications.metadata column for structured i18n payload.
--
-- B3 audit finding: notifications-i18n.ts has been reading
-- `notification.metadata.video_title`, `metadata.actor_name`, etc.
-- for the comment / follow / like switch arms since the i18n system
-- was added, but the `metadata` column never existed on the table.
-- Result: every reach for `meta.video_title` returned undefined and
-- the body falls through to the generic key (e.g. "댓글이 달렸습니다"
-- instead of "{title}에 댓글이 달렸습니다").
--
-- This migration adds the column.  The plumbing in
-- src/lib/notifications.ts + the three call sites
-- (comments.ts, engagement.ts, profile.ts) populates it on insert.
-- Existing NULL rows continue to fall through to the generic key
-- which is the current (buggy) behavior — no regression for old
-- notifications, new ones get the richer copy.

alter table public.notifications
  add column if not exists metadata jsonb;

comment on column public.notifications.metadata is
  'Structured payload for i18n rendering (E1).  Shape per type: '
  'comment / like → { video_title }, follow → { actor_name }, '
  'lottery_winner → { prize_tier, prize_amount_usd, claim_token }, '
  'lottery_reminder → { prize_amount_usd, days_left, claim_token }. '
  'NULL is valid — i18n switch falls through to the generic body key.';
