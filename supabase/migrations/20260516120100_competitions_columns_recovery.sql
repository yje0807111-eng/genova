-- Recovery migration: 56 columns added directly to public.competitions
-- via Supabase Dashboard SQL Editor without recording migration files.
-- Captured from a live `information_schema.columns` dump on 2026-05-16.
--
-- All `add column` statements are `if not exists`, so this migration
-- is:
--   - a no-op against the existing live DB (columns already present)
--   - a forward-creator against a fresh database
--
-- The seed.sql baseline + earlier migrations only covered: id, title,
-- genre, status, deadline, vote_end, prize_info, sponsor (seed),
-- thumbnail_url (20260510120000), is_featured (20260509180000).
-- Everything else listed below was added off-record.  CLAUDE.md's
-- "DB 스키마 주요 테이블 / competitions" documents the live shape;
-- this file finally reconciles migrations with it.

-- ---------------------------------------------------------------
-- Long-form content fields (text)
-- ---------------------------------------------------------------
alter table public.competitions add column if not exists description text;
alter table public.competitions add column if not exists rules text;
alter table public.competitions add column if not exists banner_url text;
alter table public.competitions add column if not exists concept text;
alter table public.competitions add column if not exists eligibility text;
alter table public.competitions add column if not exists judging_criteria text;
alter table public.competitions add column if not exists submission_guidelines text;
alter table public.competitions add column if not exists announcement text;
alter table public.competitions add column if not exists template_url text;
alter table public.competitions add column if not exists sponsor_logo_url text;

-- ---------------------------------------------------------------
-- Currency / scheduling / FX
-- ---------------------------------------------------------------
alter table public.competitions add column if not exists currency text default 'KRW';
alter table public.competitions add column if not exists base_currency text default 'USD';
alter table public.competitions add column if not exists start_date timestamptz;
alter table public.competitions add column if not exists exchange_rate_usd_krw numeric default 1350;
alter table public.competitions add column if not exists exchange_rate_usd_jpy numeric default 148;

-- ---------------------------------------------------------------
-- Prize tier labels + audience count
-- ---------------------------------------------------------------
alter table public.competitions add column if not exists prize_grand text;
alter table public.competitions add column if not exists prize_excellence text;
alter table public.competitions add column if not exists prize_merit text;
alter table public.competitions add column if not exists prize_audience text;
alter table public.competitions add column if not exists prize_audience_count integer default 1;

-- ---------------------------------------------------------------
-- Multilingual variants — three locales (en / ko / ja) per field.
-- The mapper picks the right column at render time based on the
-- caller's locale; the base column above remains the legacy /
-- single-language source used as fallback.
-- ---------------------------------------------------------------

-- title
alter table public.competitions add column if not exists title_en text;
alter table public.competitions add column if not exists title_ko text;
alter table public.competitions add column if not exists title_ja text;

-- prize_info
alter table public.competitions add column if not exists prize_info_en text;
alter table public.competitions add column if not exists prize_info_ko text;
alter table public.competitions add column if not exists prize_info_ja text;

-- concept
alter table public.competitions add column if not exists concept_en text;
alter table public.competitions add column if not exists concept_ko text;
alter table public.competitions add column if not exists concept_ja text;

-- rules
alter table public.competitions add column if not exists rules_en text;
alter table public.competitions add column if not exists rules_ko text;
alter table public.competitions add column if not exists rules_ja text;

-- eligibility
alter table public.competitions add column if not exists eligibility_en text;
alter table public.competitions add column if not exists eligibility_ko text;
alter table public.competitions add column if not exists eligibility_ja text;

-- judging_criteria
alter table public.competitions add column if not exists judging_criteria_en text;
alter table public.competitions add column if not exists judging_criteria_ko text;
alter table public.competitions add column if not exists judging_criteria_ja text;

-- submission_guidelines
alter table public.competitions add column if not exists submission_guidelines_en text;
alter table public.competitions add column if not exists submission_guidelines_ko text;
alter table public.competitions add column if not exists submission_guidelines_ja text;

-- announcement
alter table public.competitions add column if not exists announcement_en text;
alter table public.competitions add column if not exists announcement_ko text;
alter table public.competitions add column if not exists announcement_ja text;

-- prize_grand
alter table public.competitions add column if not exists prize_grand_en text;
alter table public.competitions add column if not exists prize_grand_ko text;
alter table public.competitions add column if not exists prize_grand_ja text;

-- prize_excellence
alter table public.competitions add column if not exists prize_excellence_en text;
alter table public.competitions add column if not exists prize_excellence_ko text;
alter table public.competitions add column if not exists prize_excellence_ja text;

-- prize_merit
alter table public.competitions add column if not exists prize_merit_en text;
alter table public.competitions add column if not exists prize_merit_ko text;
alter table public.competitions add column if not exists prize_merit_ja text;

-- prize_audience
alter table public.competitions add column if not exists prize_audience_en text;
alter table public.competitions add column if not exists prize_audience_ko text;
alter table public.competitions add column if not exists prize_audience_ja text;
