-- Shared Demo Class for building and for the site demo.
-- Run in the Supabase SQL editor after the student app access migration.
-- You do not create this class by hand. Opening Student apps calls ensure_demo_class().

create or replace function public.can_edit_demo_class()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return false;
  end if;

  if exists (
    select 1
    from auth.users
    where id = auth.uid()
      and lower(email) = lower('demo@eduhub.club')
  ) then
    return true;
  end if;

  return exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('teacher', 'owner')
  );
end;
$$;

create or replace function public.demo_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from auth.users
  where lower(email) = lower('demo@eduhub.club')
  limit 1;
$$;

create or replace function public.ensure_demo_class()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  demo_id uuid;
  class_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if not public.can_edit_demo_class() and not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'owner'
  ) then
    -- Students may join the demo class so the site demo student view can read rules.
    if not exists (
      select 1 from auth.users
      where id = auth.uid() and lower(email) = lower('demo@eduhub.club')
    ) and not exists (
      select 1 from public.profiles where id = auth.uid() and role in ('owner', 'teacher')
    ) then
      raise exception 'not allowed';
    end if;
  end if;

  demo_id := public.demo_user_id();
  if demo_id is null then
    raise exception 'Demo account is not set up yet. Open the site demo once so demo@eduhub.club exists.';
  end if;

  select c.id into class_id
  from public.classes c
  where c.teacher_id = demo_id
    and c.name = 'Demo Class'
  order by c.created_at
  limit 1;

  if class_id is null then
    insert into public.classes (teacher_id, name, join_code)
    values (
      demo_id,
      'Demo Class',
      'DEMO' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
    )
    returning id into class_id;
  end if;

  if class_id is null then
    raise exception 'Could not open the demo class.';
  end if;

  insert into public.class_members (
    class_id, student_id, display_name, auth_email, pin_hash, pin_salt
  )
  values (
    class_id,
    demo_id,
    'Demo Student',
    'demo@eduhub.club',
    'demo-not-a-login',
    'demo'
  )
  on conflict (class_id, student_id) do nothing;

  -- Owner can open the student view without a separate classroom.
  if exists (
    select 1 from public.profiles where id = auth.uid() and role = 'owner'
  ) and auth.uid() is distinct from demo_id then
    insert into public.class_members (
      class_id, student_id, display_name, auth_email, pin_hash, pin_salt
    )
    values (
      class_id,
      auth.uid(),
      'Owner',
      coalesce((select email from auth.users where id = auth.uid()), 'owner@eduhub.club'),
      'demo-not-a-login',
      'demo'
    )
    on conflict (class_id, student_id) do nothing;
  end if;

  return class_id;
end;
$$;

create or replace function public.demo_class_access()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  class_id uuid;
begin
  if not public.can_edit_demo_class() then
    raise exception 'not allowed';
  end if;
  class_id := public.ensure_demo_class();
  return jsonb_build_object(
    'id', class_id,
    'name', 'Demo Class',
    'timezone', (
      select s.timezone from public.class_access_settings s where s.class_id = class_id
    ),
    'policies', coalesce((
      select jsonb_agg(jsonb_build_object(
        'app_id', p.app_id,
        'enabled', p.enabled,
        'weekdays', p.weekdays,
        'window_start', p.window_start,
        'window_end', p.window_end,
        'daily_minutes', p.daily_minutes
      ))
      from public.class_app_policies p
      where p.class_id = class_id
    ), '[]'::jsonb),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id,
        'student_id', m.student_id,
        'display_name', m.display_name
      ) order by m.display_name)
      from public.class_members m
      where m.class_id = class_id
    ), '[]'::jsonb),
    'overrides', coalesce((
      select jsonb_agg(jsonb_build_object(
        'student_id', o.student_id,
        'app_id', o.app_id,
        'blocked', o.blocked,
        'daily_minutes', o.daily_minutes
      ))
      from public.student_app_overrides o
      where o.class_id = class_id
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.save_demo_app_policy(
  p_app_id text,
  p_enabled boolean,
  p_weekdays smallint[],
  p_window_start time,
  p_window_end time,
  p_daily_minutes int,
  p_timezone text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  class_id uuid;
begin
  if not public.can_edit_demo_class() then
    raise exception 'not allowed';
  end if;
  if not public.is_student_app(p_app_id) then
    raise exception 'That app is not on the student list.';
  end if;
  class_id := public.ensure_demo_class();

  if p_timezone is not null and btrim(p_timezone) <> '' then
    insert into public.class_access_settings (class_id, timezone)
    values (class_id, p_timezone)
    on conflict (class_id) do update
      set timezone = excluded.timezone,
          updated_at = now();
  end if;

  insert into public.class_app_policies (
    class_id, app_id, enabled, weekdays, window_start, window_end, daily_minutes
  )
  values (
    class_id,
    p_app_id,
    coalesce(p_enabled, false),
    coalesce(p_weekdays, '{1,2,3,4,5}'::smallint[]),
    p_window_start,
    p_window_end,
    p_daily_minutes
  )
  on conflict (class_id, app_id) do update
    set enabled = excluded.enabled,
        weekdays = excluded.weekdays,
        window_start = excluded.window_start,
        window_end = excluded.window_end,
        daily_minutes = excluded.daily_minutes,
        updated_at = now();
end;
$$;

create or replace function public.save_demo_student_override(
  p_student_id uuid,
  p_app_id text,
  p_blocked boolean,
  p_daily_minutes int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  class_id uuid;
begin
  if not public.can_edit_demo_class() then
    raise exception 'not allowed';
  end if;
  class_id := public.ensure_demo_class();

  if not exists (
    select 1 from public.class_members
    where class_id = class_id and student_id = p_student_id
  ) then
    raise exception 'That student is not on the demo class.';
  end if;

  if not coalesce(p_blocked, false) and p_daily_minutes is null then
    delete from public.student_app_overrides
    where class_id = class_id
      and student_id = p_student_id
      and app_id = p_app_id;
    return;
  end if;

  insert into public.student_app_overrides (
    class_id, student_id, app_id, blocked, daily_minutes
  )
  values (
    class_id, p_student_id, p_app_id, coalesce(p_blocked, false), p_daily_minutes
  )
  on conflict (class_id, student_id, app_id) do update
    set blocked = excluded.blocked,
        daily_minutes = excluded.daily_minutes,
        updated_at = now();
end;
$$;

create or replace function public.save_demo_timezone(p_timezone text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  class_id uuid;
begin
  if not public.can_edit_demo_class() then
    raise exception 'not allowed';
  end if;
  if p_timezone is null or btrim(p_timezone) = '' then
    return;
  end if;
  class_id := public.ensure_demo_class();
  insert into public.class_access_settings (class_id, timezone)
  values (class_id, p_timezone)
  on conflict (class_id) do update
    set timezone = excluded.timezone,
        updated_at = now();
end;
$$;

revoke all on function public.can_edit_demo_class() from public;
revoke all on function public.demo_user_id() from public;
revoke all on function public.ensure_demo_class() from public;
revoke all on function public.demo_class_access() from public;
revoke all on function public.save_demo_app_policy(text, boolean, smallint[], time, time, int, text) from public;
revoke all on function public.save_demo_student_override(uuid, text, boolean, int) from public;
revoke all on function public.save_demo_timezone(text) from public;

grant execute on function public.ensure_demo_class() to authenticated;
grant execute on function public.demo_class_access() to authenticated;
grant execute on function public.save_demo_app_policy(text, boolean, smallint[], time, time, int, text) to authenticated;
grant execute on function public.save_demo_student_override(uuid, text, boolean, int) to authenticated;
grant execute on function public.save_demo_timezone(text) to authenticated;
