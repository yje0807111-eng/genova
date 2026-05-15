-- Phase 2 of the entry-lottery system: raw duration column.
--
-- `videos.runtime` is a display text ("01:23", "12 min", "12분", etc.)
-- and isn't safely parseable for the "duration >= 30s" lottery check.
-- This column stores the raw seconds value returned by Mux at asset-
-- ready time, so the issue_lottery_ticket() function can do a clean
-- numeric comparison.
--
-- Existing rows default to 0.  Those rows are already ineligible for
-- the lottery anyway (original_attestation_at IS NULL on the same row),
-- so 0 vs the true historical duration doesn't matter — the
-- attestation check fails first.

alter table public.videos
  add column if not exists duration_seconds integer not null default 0;

comment on column public.videos.duration_seconds is
  'Raw asset duration in seconds, captured from Mux upload polling. '
  'Used by issue_lottery_ticket() to verify the >= 30s eligibility '
  'rule. Display layer continues to use the text `runtime` field.';
