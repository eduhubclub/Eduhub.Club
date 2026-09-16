-- Part switches live on the app rule. A missing key means the part is on
-- when the app is on. false turns that game, desk, or board off.
-- Run in the Supabase SQL editor after the student app access SQL.

alter table public.class_app_policies
  add column if not exists parts jsonb not null default '{}'::jsonb;

alter table public.class_app_policies
  drop constraint if exists class_app_policies_parts_object;

alter table public.class_app_policies
  add constraint class_app_policies_parts_object
  check (jsonb_typeof(parts) = 'object');

create or replace function public.student_app_parts(p_app text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select p.parts
    from public.class_members cm
    join public.class_app_policies p
      on p.class_id = cm.class_id
     and p.app_id = p_app
    where cm.student_id = auth.uid()
      and public.is_student_app(p_app)
    order by p.enabled desc, cm.created_at
    limit 1
  ), '{}'::jsonb);
$$;

create or replace function public.student_app_board(app_ids text[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb := '[]'::jsonb;
  app_id text;
  limited text[];
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  limited := coalesce(app_ids, array[
    'arcade', 'games', 'mathTools', 'dictionary', 'paper',
    'earlyliteracy', 'ofTheDay', 'timer', 'slides', 'library', 'morningMeeting'
  ]);
  if coalesce(array_length(limited, 1), 0) > 20 then
    limited := limited[1:20];
  end if;

  foreach app_id in array limited loop
    result := result || jsonb_build_array(
      public.eval_student_app(app_id, 0)
      || jsonb_build_object('parts', public.student_app_parts(app_id))
    );
  end loop;
  return result;
end;
$$;

create or replace function public.touch_student_app(target_app text, add_seconds int default 0)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  return public.eval_student_app(target_app, add_seconds)
    || jsonb_build_object('parts', public.student_app_parts(target_app));
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
        'daily_minutes', p.daily_minutes,
        'parts', coalesce(p.parts, '{}'::jsonb)
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

drop function if exists public.save_demo_app_policy(text, boolean, smallint[], time, time, int, text);

create function public.save_demo_app_policy(
  p_app_id text,
  p_enabled boolean,
  p_weekdays smallint[],
  p_window_start time,
  p_window_end time,
  p_daily_minutes int,
  p_timezone text,
  p_parts jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_id uuid;
  stored_parts jsonb := '{}'::jsonb;
begin
  if not public.can_edit_demo_class() then
    raise exception 'not allowed';
  end if;
  if not public.is_student_app(p_app_id) then
    raise exception 'That app is not on the student list.';
  end if;
  chosen_id := public.ensure_demo_class();

  if p_parts is not null and jsonb_typeof(p_parts) = 'object' then
    select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb)
    into stored_parts
    from jsonb_each(p_parts) as e(key, value)
    where jsonb_typeof(e.value) = 'boolean'
      and e.value = 'false'::jsonb;
  end if;

  if p_timezone is not null and btrim(p_timezone) <> '' then
    insert into public.class_access_settings (class_id, timezone)
    values (chosen_id, p_timezone)
    on conflict (class_id) do update
      set timezone = excluded.timezone,
          updated_at = now();
  end if;

  insert into public.class_app_policies (
    class_id, app_id, enabled, weekdays, window_start, window_end, daily_minutes, parts
  )
  values (
    chosen_id,
    p_app_id,
    coalesce(p_enabled, false),
    coalesce(p_weekdays, '{1,2,3,4,5}'::smallint[]),
    p_window_start,
    p_window_end,
    p_daily_minutes,
    coalesce(stored_parts, '{}'::jsonb)
  )
  on conflict (class_id, app_id) do update
    set enabled = excluded.enabled,
        weekdays = excluded.weekdays,
        window_start = excluded.window_start,
        window_end = excluded.window_end,
        daily_minutes = excluded.daily_minutes,
        parts = excluded.parts,
        updated_at = now();
end;
$$;

revoke all on function public.student_app_parts(text) from public;
revoke all on function public.student_app_board(text[]) from public;
revoke all on function public.touch_student_app(text, int) from public;
revoke all on function public.save_demo_app_policy(text, boolean, smallint[], time, time, int, text, jsonb) from public;

grant execute on function public.student_app_parts(text) to authenticated;
grant execute on function public.student_app_board(text[]) to authenticated;
grant execute on function public.touch_student_app(text, int) to authenticated;
grant execute on function public.save_demo_app_policy(text, boolean, smallint[], time, time, int, text, jsonb) to authenticated;
