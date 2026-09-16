-- Account invites and safer public signup.
-- Teacher and parent may self-serve. Admin needs an invite. Students join by
-- class code / QR (or a classroom-created auth user). Owner stays SQL-only.
-- Run in the Supabase SQL editor after the owner role SQL.

create table if not exists public.account_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text not null check (role in ('admin', 'teacher', 'parent')),
  token_hash text not null unique,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz
);

create index if not exists account_invites_email_idx
  on public.account_invites (lower(email));

alter table public.account_invites enable row level security;

grant select on public.account_invites to authenticated;

drop policy if exists "inviter reads own invites" on public.account_invites;
create policy "inviter reads own invites"
  on public.account_invites for select
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'owner')
    )
  );

drop policy if exists "no client writes invites" on public.account_invites;
create policy "no client writes invites"
  on public.account_invites for all
  using (false)
  with check (false);

create or replace function public.invite_token_hash(p_token text)
returns text
language sql
immutable
as $$
  select encode(extensions.digest(convert_to(p_token, 'utf8'), 'sha256'), 'hex');
$$;

create or replace function public.peek_account_invite(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.account_invites%rowtype;
begin
  if p_token is null or btrim(p_token) = '' then
    return null;
  end if;
  select * into row
  from public.account_invites i
  where i.token_hash = public.invite_token_hash(btrim(p_token))
    and i.accepted_at is null
    and i.expires_at > now();
  if not found then
    return null;
  end if;
  return jsonb_build_object(
    'email', row.email,
    'role', row.role,
    'expires_at', row.expires_at
  );
end;
$$;

create or replace function public.create_account_invite(p_email text, p_role text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller public.profiles%rowtype;
  address text;
  wanted text;
  token text;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  select * into caller from public.profiles where id = auth.uid();
  if not found then
    raise exception 'not signed in';
  end if;

  address := lower(btrim(coalesce(p_email, '')));
  if position('@' in address) = 0 then
    raise exception 'Enter an email address.';
  end if;

  wanted := lower(btrim(coalesce(p_role, '')));
  if caller.role = 'owner' or caller.role = 'admin' then
    if wanted not in ('admin', 'teacher', 'parent') then
      raise exception 'That role cannot be invited.';
    end if;
  elsif caller.role = 'teacher' then
    if wanted is distinct from 'parent' then
      raise exception 'Teachers can invite parents.';
    end if;
  else
    raise exception 'not allowed';
  end if;

  token := encode(extensions.gen_random_bytes(24), 'hex');

  insert into public.account_invites (email, role, token_hash, created_by)
  values (address, wanted, public.invite_token_hash(token), auth.uid());

  return jsonb_build_object(
    'email', address,
    'role', wanted,
    'token', token,
    'expires_at', now() + interval '14 days'
  );
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_role text;
  claimed text;
  invite_token text;
  invite public.account_invites%rowtype;
begin
  claimed := lower(coalesce(new.raw_user_meta_data->>'role', ''));
  invite_token := nullif(btrim(coalesce(new.raw_user_meta_data->>'invite_token', '')), '');

  if invite_token is not null then
    select * into invite
    from public.account_invites i
    where i.token_hash = public.invite_token_hash(invite_token)
      and i.accepted_at is null
      and i.expires_at > now()
      and lower(i.email) = lower(new.email);
    if found then
      next_role := invite.role;
      update public.account_invites
      set accepted_at = now()
      where id = invite.id;
    end if;
  end if;

  if next_role is null then
    if claimed in ('teacher', 'parent') then
      next_role := claimed;
    elsif claimed = 'student' and new.email like '%@students.example.com' then
      next_role := 'student';
    else
      next_role := 'teacher';
    end if;
  end if;

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

revoke all on function public.invite_token_hash(text) from public;
revoke all on function public.peek_account_invite(text) from public;
revoke all on function public.create_account_invite(text, text) from public;

grant execute on function public.peek_account_invite(text) to anon, authenticated;
grant execute on function public.create_account_invite(text, text) to authenticated;
