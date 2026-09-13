-- Reprintable student cards. The plaintext stays on the service role so a
-- lost card can be printed again. A new code is an explicit replace.

alter table public.class_members
  add column if not exists roster_student_id text;

create unique index if not exists class_members_roster_student_idx
  on public.class_members (class_id, roster_student_id)
  where roster_student_id is not null;

alter table public.login_tokens
  add column if not exists token_plain text;
