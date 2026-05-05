-- Allow notifications.type 'like' (likes / saves)

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in ('comment', 'follow', 'competition_result', 'trophy', 'like'));
