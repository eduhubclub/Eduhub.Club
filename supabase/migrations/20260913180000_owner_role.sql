-- Company owner. Not a school role, and not choosable from public signup.
-- Run in the Supabase SQL editor, then mark the existing person:
--   update public.profiles
--   set role = 'owner'
--   where id = (select id from auth.users where lower(email) = lower('you@school.edu'));

do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'profiles'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%role%';

  if constraint_name is not null then
    execute format('alter table public.profiles drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'teacher', 'student', 'parent', 'owner'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_role text;
begin
  next_role := coalesce(new.raw_user_meta_data->>'role', 'teacher');
  -- Owner is assigned in the SQL editor only. Signup metadata cannot claim it.
  if next_role not in ('admin', 'teacher', 'student', 'parent') then
    next_role := 'teacher';
  end if;

  insert into public.profiles (id, role, display_name, age_band)
  values (
    new.id,
    next_role,
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data->>'age_band', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
