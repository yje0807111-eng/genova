-- Corrective migration: fix "function gen_random_bytes(integer) does not exist"
--
-- Supabase places the pgcrypto extension in the `extensions` schema, not
-- `public`. The lottery SECURITY DEFINER functions were created with
-- `set search_path = public`, so `gen_random_bytes()` / `gen_random_uuid()`
-- could not be resolved at draw time. Widen the search_path to include
-- `extensions` on the already-applied functions.

create extension if not exists pgcrypto with schema extensions;

alter function public.draw_monthly_winners(text, uuid)
  set search_path = public, extensions;

alter function public.redraw_monthly_slot(text, integer, text, uuid)
  set search_path = public, extensions;

alter function public.issue_lottery_ticket(uuid, text)
  set search_path = public, extensions;

notify pgrst, 'reload schema';
