-- Phase 1 of the entry-lottery system: attestation flag on uploads.
--
-- When a user uploads a video, the upload form (Phase 3) renders a
-- "본인 제작" attestation checkbox.  When the user ticks it AND the
-- upload completes via Mux, the issuance function (Phase 2) reads
-- this column to gate lottery ticket creation:
--
--   issuance allowed  ⇔  original_attestation_at IS NOT NULL
--                       AND duration ≥ 30s
--                       AND user's current month_key count < 5
--
-- Nullable on purpose:
--   - Existing videos uploaded before this migration all carry NULL
--     and are ineligible for the lottery until the user re-confirms
--     attestation through a follow-up flow (out of scope for Phase 1).
--   - Future uploads where the box is unchecked stay NULL — no ticket,
--     no error, just a soft "won't enter lottery" signal.
alter table public.videos
  add column if not exists original_attestation_at timestamptz;

comment on column public.videos.original_attestation_at is
  'Timestamp the uploader checked the "본인 제작" attestation box. '
  'NOT NULL is a precondition for entry_tickets issuance (Phase 2).';
