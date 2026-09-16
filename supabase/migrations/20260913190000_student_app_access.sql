-- Teacher rules for which apps a class can open, on which days, and for how long.
-- Run in the Supabase SQL editor, or with `supabase db push`.
-- A missing row means the app is off. Students cannot edit these rules or reset their minutes.

create table if not exists public.class_access_settings (
  class_id uuid primary key references public.classes (id) on delete cascade,
  timezone text not null default 'UTC',
  updated_at timestamptz not null default now()
);

create table if not exists public.class_app_policies (
  class_id uuid not null references public.classes (id) on delete cascade,
  app_id text not null,
  enabled boolean not null default false,
  weekdays smallint[] not null default '{1,2,3,4,5}',
  window_start time,
  window_end time,
  daily_minutes int,
  updated_at timestamptz not null default now(),
  primary key (class_id, app_id),
  constraint class_app_policies_app_check check (
    app_id in (
      'arcade', 'games', 'mathTools', 'dictionary', 'paper',
      'earlyliteracy', 'ofTheDay', 'timer', 'slides', 'library', 'morningMeeting'
    )
  ),
  constraint class_app_policies_weekdays_check check (
    weekdays <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
  ),
  constraint class_app_policies_minutes_check check (
    daily_minutes is null or daily_minutes > 0
  ),
  constraint class_app_policies_window_check check (
    (window_start is null and window_end is null)
    or (window_start is not null and window_end is not null and window_start < window_end)
  )
);

create table if not exists public.student_app_overrides (
  class_id uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  app_id text not null,
  blocked boolean not null default false,
  daily_minutes int,
  updated_at timestamptz not null default now(),
  primary key (class_id, student_id, app_id),
  constraint student_app_overrides_app_check check (
    app_id in (
      'arcade', 'games', 'mathTools', 'dictionary', 'paper',
      'earlyliteracy', 'ofTheDay', 'timer', 'slides', 'library', 'morningMeeting'
    )
  ),
  constraint student_app_overrides_minutes_check check (
    daily_minutes is null or daily_minutes > 0
  )
);

create table if not exists public.student_app_usage (
  student_id uuid not null references public.profiles (id) on delete cascade,
  app_id text not null,
  class_id uuid not null references public.classes (id) on delete cascade,
  usage_date date not null,
  seconds int not null default 0,
  primary key (student_id, app_id, usage_date),
  constraint student_app_usage_seconds_check check (seconds >= 0)
);

alter table public.class_access_settings enable row level security;
alter table public.class_app_policies enable row level security;
alter table public.student_app_overrides enable row level security;
alter table public.student_app_usage enable row level security;

grant select, insert, update, delete on public.class_access_settings to authenticated;
grant select, insert, update, delete on public.class_app_policies to authenticated;
grant select, insert, update, delete on public.student_app_overrides to authenticated;
grant select on public.student_app_usage to authenticated;

-- Teachers need the student id to set one exception. PIN and email stay hidden.
grant select (student_id) on public.class_members to authenticated;

drop policy if exists "teacher manages class access settings" on public.class_access_settings;
create policy "teacher manages class access settings"
  on public.class_access_settings for all
  using (
    exists (
      select 1 from public.classes c
      where c.id = class_id and c.teacher_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.classes c
      where c.id = class_id and c.teacher_id = auth.uid()
    )
  );

drop policy if exists "teacher manages class app policies" on public.class_app_policies;
create policy "teacher manages class app policies"
  on public.class_app_policies for all
  using (
    exists (
      select 1 from public.classes c
      where c.id = class_id and c.teacher_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.classes c
      where c.id = class_id and c.teacher_id = auth.uid()
    )
  );

drop policy if exists "teacher manages student app overrides" on public.student_app_overrides;
create policy "teacher manages student app overrides"
  on public.student_app_overrides for all
  using (
    exists (
      select 1 from public.classes c
      where c.id = class_id and c.teacher_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.classes c
      where c.id = class_id and c.teacher_id = auth.uid()
    )
  );

drop policy if exists "teacher reads class app usage" on public.student_app_usage;
create policy "teacher reads class app usage"
  on public.student_app_usage for select
  using (
    exists (
      select 1 from public.classes c
      where c.id = class_id and c.teacher_id = auth.uid()
    )
  );

drop policy if exists "student reads own app usage" on public.student_app_usage;
create policy "student reads own app usage"
  on public.student_app_usage for select
  using (student_id = auth.uid());

drop policy if exists "student reads own membership" on public.class_members;
create policy "student reads own membership"
  on public.class_members for select
  using (student_id = auth.uid());

create or replace function public.access_day_phrase(days smallint[])
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  sorted smallint[];
  names text[] := array['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  picked text[] := array[]::text[];
  d smallint;
  key text;
  last_name text;
begin
  select coalesce(array_agg(distinct x order by x), '{}'::smallint[])
    into sorted
  from unnest(coalesce(days, '{}'::smallint[])) as x
  where x between 0 and 6;

  key := array_to_string(sorted, ',');
  if key = '1,2,3,4,5' then return 'weekdays'; end if;
  if key = '0,6' then return 'weekends'; end if;
  if key = '0,1,2,3,4,5,6' then return 'every day'; end if;
  if coalesce(array_length(sorted, 1), 0) = 0 then return 'no days'; end if;

  foreach d in array sorted loop
    picked := picked || names[d + 1];
  end loop;

  if array_length(picked, 1) = 1 then
    return picked[1];
  end if;
  if array_length(picked, 1) = 2 then
    return picked[1] || ' and ' || picked[2];
  end if;

  last_name := picked[array_length(picked, 1)];
  return array_to_string(picked[1:array_length(picked, 1) - 1], ', ') || ', and ' || last_name;
end;
$$;

create or replace function public.access_clock_label(t time)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when t is null then ''
    else to_char(t, 'FMHH12:MI AM')
  end;
$$;

create or replace function public.access_schedule_label(
  days smallint[],
  window_start time,
  window_end time
)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when window_start is not null and window_end is not null then
      public.access_clock_label(window_start)
        || '–'
        || public.access_clock_label(window_end)
        || ' on '
        || public.access_day_phrase(days)
    else public.access_day_phrase(days)
  end;
$$;

create or replace function public.is_student_app(app_id text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select app_id in (
    'arcade', 'games', 'mathTools', 'dictionary', 'paper',
    'earlyliteracy', 'ofTheDay', 'timer', 'slides', 'library', 'morningMeeting'
  );
$$;

-- Decides open or locked using the database clock and the class time zone.
-- add_seconds is capped and only written when the app is already open.
create or replace function public.eval_student_app(p_app text, p_add_seconds int default 0)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  add_seconds int := least(greatest(coalesce(p_add_seconds, 0), 0), 45);
  membership record;
  policy public.class_app_policies%rowtype;
  override public.student_app_overrides%rowtype;
  tz text;
  local_ts timestamp;
  local_dow int;
  local_tod time;
  local_date date;
  used int;
  limit_minutes int;
  remaining int;
  minutes_left int;
  has_policy boolean;
  has_override boolean;
  status jsonb;
  best_open jsonb;
  best_closed jsonb;
  chosen jsonb;
  next_dow int;
  step int;
  next_label text;
begin
  if uid is null then
    raise exception 'not signed in';
  end if;

  if not public.is_student_app(p_app) then
    return jsonb_build_object(
      'app_id', p_app,
      'open', false,
      'reason', 'closed',
      'detail', 'This app is not available.',
      'minutes_left', null,
      'daily_minutes', null,
      'seconds_used', 0
    );
  end if;

  for membership in
    select cm.class_id, c.name as class_name
    from public.class_members cm
    join public.classes c on c.id = cm.class_id
    where cm.student_id = uid
    order by cm.created_at
  loop
    select s.timezone into tz
    from public.class_access_settings s
    where s.class_id = membership.class_id;
    tz := coalesce(nullif(tz, ''), 'UTC');
    policy := null;
    override := null;
    begin
      local_ts := timezone(tz, now());
    exception when others then
      tz := 'UTC';
      local_ts := timezone(tz, now());
    end;
    local_dow := extract(dow from local_ts)::int;
    local_tod := local_ts::time;
    local_date := local_ts::date;

    select * into policy
    from public.class_app_policies
    where class_id = membership.class_id and app_id = p_app;
    has_policy := found;

    select * into override
    from public.student_app_overrides
    where class_id = membership.class_id
      and student_id = uid
      and app_id = p_app;
    has_override := found;

    used := 0;
    select u.seconds into used
    from public.student_app_usage u
    where u.student_id = uid
      and u.app_id = p_app
      and u.usage_date = local_date;
    used := coalesce(used, 0);

    if not has_policy or not policy.enabled then
      status := jsonb_build_object(
        'app_id', p_app,
        'open', false,
        'reason', 'closed',
        'detail', 'Your teacher has this closed.',
        'minutes_left', null,
        'daily_minutes', null,
        'seconds_used', used,
        'class_id', membership.class_id,
        'timezone', tz
      );
    elsif has_override and override.blocked then
      status := jsonb_build_object(
        'app_id', p_app,
        'open', false,
        'reason', 'closed',
        'detail', 'Your teacher has this closed for you.',
        'minutes_left', null,
        'daily_minutes', null,
        'seconds_used', used,
        'class_id', membership.class_id,
        'timezone', tz
      );
    elsif local_dow <> all (policy.weekdays) then
      status := jsonb_build_object(
        'app_id', p_app,
        'open', false,
        'reason', 'not_today',
        'detail', 'Opens ' || public.access_schedule_label(policy.weekdays, policy.window_start, policy.window_end) || '.',
        'minutes_left', null,
        'daily_minutes', coalesce(override.daily_minutes, policy.daily_minutes),
        'seconds_used', used,
        'class_id', membership.class_id,
        'timezone', tz
      );
    elsif policy.window_start is not null
      and (local_tod < policy.window_start or local_tod >= policy.window_end)
    then
      if local_tod < policy.window_start then
        status := jsonb_build_object(
          'app_id', p_app,
          'open', false,
          'reason', 'outside_window',
          'detail', 'Opens today at ' || public.access_clock_label(policy.window_start) || '.',
          'minutes_left', null,
          'daily_minutes', coalesce(override.daily_minutes, policy.daily_minutes),
          'seconds_used', used,
          'class_id', membership.class_id,
          'timezone', tz
        );
      else
        next_dow := null;
        for step in 1..7 loop
          if ((local_dow + step) % 7) = any (policy.weekdays) then
            next_dow := (local_dow + step) % 7;
            exit;
          end if;
        end loop;
        next_label := public.access_day_phrase(array[next_dow]::smallint[]);
        if policy.window_start is not null then
          next_label := next_label || ' at ' || public.access_clock_label(policy.window_start);
        end if;
        status := jsonb_build_object(
          'app_id', p_app,
          'open', false,
          'reason', 'outside_window',
          'detail', 'Opens ' || next_label || '.',
          'minutes_left', null,
          'daily_minutes', coalesce(override.daily_minutes, policy.daily_minutes),
          'seconds_used', used,
          'class_id', membership.class_id,
          'timezone', tz
        );
      end if;
    else
      limit_minutes := coalesce(override.daily_minutes, policy.daily_minutes);
      if limit_minutes is not null and used >= limit_minutes * 60 then
        next_dow := null;
        for step in 1..7 loop
          if ((local_dow + step) % 7) = any (policy.weekdays) then
            next_dow := (local_dow + step) % 7;
            exit;
          end if;
        end loop;
        next_label := public.access_day_phrase(array[next_dow]::smallint[]);
        if policy.window_start is not null then
          next_label := next_label || ' at ' || public.access_clock_label(policy.window_start);
        end if;
        status := jsonb_build_object(
          'app_id', p_app,
          'open', false,
          'reason', 'minutes_used',
          'detail', 'Today''s time is used. Opens again ' || next_label || '.',
          'minutes_left', 0,
          'daily_minutes', limit_minutes,
          'seconds_used', used,
          'class_id', membership.class_id,
          'timezone', tz
        );
      else
        remaining := case
          when limit_minutes is null then null
          else greatest(limit_minutes * 60 - used, 0)
        end;
        minutes_left := case
          when remaining is null then null
          when remaining = 0 then 0
          else greatest(1, ceil(remaining / 60.0)::int)
        end;
        status := jsonb_build_object(
          'app_id', p_app,
          'open', true,
          'reason', 'open',
          'detail', case
            when minutes_left is null then ''
            when minutes_left = 1 then '1 minute left today.'
            else minutes_left::text || ' minutes left today.'
          end,
          'minutes_left', minutes_left,
          'daily_minutes', limit_minutes,
          'seconds_used', used,
          'class_id', membership.class_id,
          'timezone', tz,
          'usage_date', local_date
        );
      end if;
    end if;

    if (status->>'open')::boolean then
      if best_open is null
        or (status->>'daily_minutes') is null and (best_open->>'daily_minutes') is not null
        or (
          (status->>'daily_minutes') is not null
          and (best_open->>'daily_minutes') is not null
          and coalesce((status->>'minutes_left')::int, 0) > coalesce((best_open->>'minutes_left')::int, 0)
        )
      then
        best_open := status;
      end if;
    elsif best_closed is null then
      best_closed := status;
    end if;
  end loop;

  if best_open is null and best_closed is null then
    return jsonb_build_object(
      'app_id', p_app,
      'open', false,
      'reason', 'no_class',
      'detail', 'Your teacher has not added you to a class yet.',
      'minutes_left', null,
      'daily_minutes', null,
      'seconds_used', 0
    );
  end if;

  chosen := coalesce(best_open, best_closed);
  if best_open is null or add_seconds = 0 then
    return chosen;
  end if;

  insert into public.student_app_usage (student_id, app_id, class_id, usage_date, seconds)
  values (
    uid,
    p_app,
    (chosen->>'class_id')::uuid,
    (chosen->>'usage_date')::date,
    add_seconds
  )
  on conflict (student_id, app_id, usage_date)
  do update set
    seconds = public.student_app_usage.seconds + excluded.seconds,
    class_id = excluded.class_id;

  return public.eval_student_app(p_app, 0);
end;
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
    result := result || jsonb_build_array(public.eval_student_app(app_id, 0));
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
  return public.eval_student_app(target_app, add_seconds);
end;
$$;

revoke all on function public.access_day_phrase(smallint[]) from public;
revoke all on function public.access_clock_label(time) from public;
revoke all on function public.access_schedule_label(smallint[], time, time) from public;
revoke all on function public.is_student_app(text) from public;
revoke all on function public.eval_student_app(text, int) from public;
revoke all on function public.student_app_board(text[]) from public;
revoke all on function public.touch_student_app(text, int) from public;

grant execute on function public.student_app_board(text[]) to authenticated;
grant execute on function public.touch_student_app(text, int) to authenticated;
