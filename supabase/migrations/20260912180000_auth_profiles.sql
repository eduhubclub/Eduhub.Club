-- Edu.Hub role profiles and classroom sign-in.
-- Run in the Supabase SQL editor, or with `supabase db push`.
-- Classroom PIN checks and QR tokens are issued by Edge Functions (service role).
-- Clients never read pin_hash or token plaintext.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'teacher', 'student', 'parent')),
  display_name text not null default '',
  age_band text check (age_band is null or age_band in ('k2', 'grades35', 'secondary')),
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  name text not null default 'My class',
  join_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.class_members (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  display_name text not null,
  auth_email text not null,
  pin_hash text not null,
  pin_salt text not null,
  created_at timestamptz not null default now(),
  unique (class_id, student_id)
);

create table if not exists public.login_tokens (
  id uuid primary key default gen_random_uuid(),
  class_member_id uuid not null references public.class_members (id) on delete cascade,
  token_hash text not null unique,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.login_attempts (
  attempt_key text primary key,
  failures int not null default 0,
  window_start timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.login_tokens enable row level security;
alter table public.login_attempts enable row level security;

drop policy if exists "own profile select" on public.profiles;
create policy "own profile select"
  on public.profiles for select
  using (auth.uid() = id);

-- Role cannot be changed from the client. Signup metadata and apply_pending_role set it.
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

drop policy if exists "teacher reads classes" on public.classes;
create policy "teacher reads classes"
  on public.classes for select
  using (teacher_id = auth.uid());

-- Names only. pin_hash and auth_email stay on the service role.
revoke all on public.class_members from anon, authenticated;
grant select (id, class_id, display_name, created_at) on public.class_members to authenticated;

drop policy if exists "teacher reads members" on public.class_members;
create policy "teacher reads members"
  on public.class_members for select
  using (
    exists (
      select 1 from public.classes c
      where c.id = class_id and c.teacher_id = auth.uid()
    )
  );

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Student Google / Clever accounts are created as the trigger default, then
-- corrected once if the student card started the redirect.
create or replace function public.apply_pending_role(next_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if next_role is distinct from 'student' then
    raise exception 'invalid role';
  end if;

  update public.profiles
  set role = next_role
  where id = auth.uid()
    and role = 'teacher'
    and created_at > now() - interval '15 minutes';
end;
$$;

revoke all on function public.apply_pending_role(text) from public;
grant execute on function public.apply_pending_role(text) to authenticated;
