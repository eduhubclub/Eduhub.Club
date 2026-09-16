-- Fix Demo Class setup. The previous functions used a variable named class_id,
-- which PostgreSQL cannot tell apart from the class_id column.
-- Also replace the demo password "password", which Chrome flags as breached.
-- Run in the Supabase SQL editor.

create or replace function public.ensure_demo_class()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  demo_id uuid;
  chosen_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if not public.can_edit_demo_class() and not exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner'
  ) then
    if not exists (
      select 1 from auth.users u
      where u.id = auth.uid() and lower(u.email) = lower('demo@eduhub.club')
    ) and not exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role in ('owner', 'teacher')
    ) then
      raise exception 'not allowed';
    end if;
  end if;

  demo_id := public.demo_user_id();
  if demo_id is null then
    raise exception 'Demo account is not set up yet. Open the site demo once so demo@eduhub.club exists.';
  end if;

  select c.id into chosen_id
  from public.classes c
  where c.teacher_id = demo_id
    and c.name = 'Demo Class'
  order by c.created_at
  limit 1;

  if chosen_id is null then
    insert into public.classes (teacher_id, name, join_code)
    values (
      demo_id,
      'Demo Class',
      'DEMO' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
    )
    returning id into chosen_id;
  end if;

  if chosen_id is null then
    raise exception 'Could not open the demo class.';
  end if;

  insert into public.class_members (
    class_id, student_id, display_name, auth_email, pin_hash, pin_salt
  )
  values (
    chosen_id,
    demo_id,
    'Demo Student',
    'demo@eduhub.club',
    'demo-not-a-login',
    'demo'
  )
  on conflict (class_id, student_id) do nothing;

  if exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner'
  ) and auth.uid() is distinct from demo_id then
    insert into public.class_members (
      class_id, student_id, display_name, auth_email, pin_hash, pin_salt
    )
    values (
      chosen_id,
      auth.uid(),
      'Owner',
      coalesce((select u.email from auth.users u where u.id = auth.uid()), 'owner@eduhub.club'),
      'demo-not-a-login',
      'demo'
    )
    on conflict (class_id, student_id) do nothing;
  end if;

  return chosen_id;
end;
$$;

create or replace function public.demo_class_access()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_id uuid;
begin
  if not public.can_edit_demo_class() then
    raise exception 'not allowed';
  end if;
  chosen_id := public.ensure_demo_class();
  return jsonb_build_object(
    'id', chosen_id,
    'name', 'Demo Class',
    'timezone', (
      select s.timezone from public.class_access_settings s where s.class_id = chosen_id
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
      where p.class_id = chosen_id
    ), '[]'::jsonb),
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', m.id,
        'student_id', m.student_id,
        'display_name', m.display_name
      ) order by m.display_name)
      from public.class_members m
      where m.class_id = chosen_id
    ), '[]'::jsonb),
    'overrides', coalesce((
      select jsonb_agg(jsonb_build_object(
        'student_id', o.student_id,
        'app_id', o.app_id,
        'blocked', o.blocked,
        'daily_minutes', o.daily_minutes
      ))
      from public.student_app_overrides o
      where o.class_id = chosen_id
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
  chosen_id uuid;
begin
  if not public.can_edit_demo_class() then
    raise exception 'not allowed';
  end if;
  if not public.is_student_app(p_app_id) then
    raise exception 'That app is not on the student list.';
  end if;
  chosen_id := public.ensure_demo_class();

  if p_timezone is not null and btrim(p_timezone) <> '' then
    insert into public.class_access_settings (class_id, timezone)
    values (chosen_id, p_timezone)
    on conflict (class_id) do update
      set timezone = excluded.timezone,
          updated_at = now();
  end if;

  insert into public.class_app_policies (
    class_id, app_id, enabled, weekdays, window_start, window_end, daily_minutes
  )
  values (
    chosen_id,
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
  chosen_id uuid;
begin
  if not public.can_edit_demo_class() then
    raise exception 'not allowed';
  end if;
  chosen_id := public.ensure_demo_class();

  if not exists (
    select 1 from public.class_members m
    where m.class_id = chosen_id and m.student_id = p_student_id
  ) then
    raise exception 'That student is not on the demo class.';
  end if;

  if not coalesce(p_blocked, false) and p_daily_minutes is null then
    delete from public.student_app_overrides o
    where o.class_id = chosen_id
      and o.student_id = p_student_id
      and o.app_id = p_app_id;
    return;
  end if;

  insert into public.student_app_overrides (
    class_id, student_id, app_id, blocked, daily_minutes
  )
  values (
    chosen_id, p_student_id, p_app_id, coalesce(p_blocked, false), p_daily_minutes
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
  chosen_id uuid;
begin
  if not public.can_edit_demo_class() then
    raise exception 'not allowed';
  end if;
  if p_timezone is null or btrim(p_timezone) = '' then
    return;
  end if;
  chosen_id := public.ensure_demo_class();
  insert into public.class_access_settings (class_id, timezone)
  values (chosen_id, p_timezone)
  on conflict (class_id) do update
    set timezone = excluded.timezone,
        updated_at = now();
end;
$$;

-- Demo sign-in. Not a school password. Unique enough that Chrome does not treat it as leaked.
update auth.users
set encrypted_password = extensions.crypt('EduHub-demo-2026', extensions.gen_salt('bf'))
where lower(email) = lower('demo@eduhub.club');
