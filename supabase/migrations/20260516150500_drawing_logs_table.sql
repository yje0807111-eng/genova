-- Phase 1 of the entry-lottery system: draw audit log.
--
-- One row per draw event (initial or redraw).  Records the RNG seed,
-- the eligible pool size at draw time, and a JSON snapshot of the
-- winners so that:
--   - the result is auditable + reproducible from the seed,
--   - re-draws preserve the original tier-by-tier outcome even
--     after competition_winners rows mutate (invalidations, status
--     transitions, etc.).
--
-- A redraw row references the original draw it's correcting via
-- redraw_of and specifies the slot in redraw_prize_tier.  Initial
-- draws have both NULL.

create table if not exists public.drawing_logs (
  id uuid primary key default gen_random_uuid(),
  competition_id text not null
    references public.competitions (id) on delete cascade,
  drawn_at timestamptz not null default now(),
  drawn_by uuid references auth.users (id) on delete set null,
  -- The seed used to generate the draw (Phase 2 issues with
  -- gen_random_uuid()::text or hex bytes).  Re-running the same
  -- algorithm against the same pool + seed should produce the same
  -- winners — useful for any post-hoc verification.
  seed_value text not null,
  eligible_entry_count integer not null,
  eligible_user_count integer not null,
  -- Per-tier snapshot. Schema (Phase 2-defined):
  --   [{ "prize_tier": 1, "entry_id": "...", "user_id": "...",
  --      "video_id": "..." }, …]
  winners_snapshot jsonb not null,
  is_redraw boolean not null default false,
  redraw_of uuid references public.drawing_logs (id) on delete set null,
  redraw_prize_tier integer check (redraw_prize_tier between 1 and 5),
  redraw_reason text,
  constraint drawing_logs_redraw_consistency check (
    (is_redraw = false
      and redraw_of is null
      and redraw_prize_tier is null)
    or (is_redraw = true
      and redraw_of is not null
      and redraw_prize_tier is not null)
  )
);

-- Per-competition history view (admin audit page, Phase 6).
create index drawing_logs_competition_idx
  on public.drawing_logs (competition_id, drawn_at desc);

-- Redraw chain traversal.
create index drawing_logs_redraw_idx
  on public.drawing_logs (redraw_of)
  where is_redraw = true;

-- ---------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------

alter table public.drawing_logs enable row level security;

-- SELECT: anyone.  This is the transparency surface — anyone can
-- inspect the seed, pool size, and snapshot for any draw.
create policy drawing_logs_select_all on public.drawing_logs
  for select to anon, authenticated
  using (true);

-- INSERT / UPDATE / DELETE: service role only.  Phase 2's draw
-- function writes; nothing else mutates this table.

comment on table public.drawing_logs is
  'Audit log of every draw event (initial + redraws). seed_value '
  'enables reproducible re-derivation; winners_snapshot preserves '
  'the historical tier-by-tier result independent of mutations on '
  'competition_winners. Public-readable for transparency.';
