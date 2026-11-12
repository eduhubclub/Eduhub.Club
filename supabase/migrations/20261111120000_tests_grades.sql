-- Tests and Grades share one assessment record.
-- Class and student ids are text so demo rosters and Supabase classes can both
-- store an attempt. Scoring matches web/src/data/tests/model.js.

alter table public.class_app_policies
  drop constraint if exists class_app_policies_app_check;

alter table public.class_app_policies
  add constraint class_app_policies_app_check check (
    app_id in (
      'arcade', 'games', 'eduType', 'docs', 'mathTools', 'dictionary', 'paper',
      'earlyliteracy', 'ofTheDay', 'timer', 'slides', 'library', 'morningMeeting',
      'headspace', 'screener', 'writingBuddy', 'tests'
    )
  );

alter table public.student_app_overrides
  drop constraint if exists student_app_overrides_app_check;

alter table public.student_app_overrides
  add constraint student_app_overrides_app_check check (
    app_id in (
      'arcade', 'games', 'eduType', 'docs', 'mathTools', 'dictionary', 'paper',
      'earlyliteracy', 'ofTheDay', 'timer', 'slides', 'library', 'morningMeeting',
      'headspace', 'screener', 'writingBuddy', 'tests'
    )
  );

create or replace function public.is_student_app(app_id text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select app_id in (
    'arcade', 'games', 'eduType', 'docs', 'mathTools', 'dictionary', 'paper',
    'earlyliteracy', 'ofTheDay', 'timer', 'slides', 'library', 'morningMeeting',
    'headspace', 'screener', 'writingBuddy', 'tests'
  );
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
    'arcade', 'games', 'eduType', 'docs', 'mathTools', 'dictionary', 'paper',
    'earlyliteracy', 'ofTheDay', 'timer', 'slides', 'library', 'morningMeeting',
    'headspace', 'screener', 'writingBuddy', 'tests'
  ]);
  if coalesce(array_length(limited, 1), 0) > 40 then
    limited := limited[1:40];
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

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  subject text not null default '',
  purpose text not null default 'summative',
  score_mode text not null default 'points',
  format_template text not null default 'stage',
  shelf text not null default 'mine',
  archived boolean not null default false,
  bridge jsonb,
  items jsonb not null default '[]'::jsonb,
  results_template jsonb not null default '{"blocks":["score","missed","standards","practice","note"],"hidden":[],"note":""}'::jsonb,
  standard_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessments_title_check check (char_length(trim(title)) > 0),
  constraint assessments_purpose_check check (purpose in ('formative', 'summative')),
  constraint assessments_score_mode_check check (score_mode in ('points', 'proficiency', 'both')),
  constraint assessments_format_check check (format_template in ('stage', 'passage', 'live')),
  constraint assessments_shelf_check check (shelf in ('mine', 'district', 'community'))
);

create table if not exists public.assessment_assignments (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  class_id text not null,
  delivery text not null default 'self_paced',
  assigned_at timestamptz not null default now(),
  constraint assessment_assignments_delivery_check check (
    delivery in ('self_paced', 'teacher_paced', 'paper_entry')
  ),
  constraint assessment_assignments_class_check check (char_length(trim(class_id)) > 0)
);

create table if not exists public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assessment_assignments (id) on delete cascade,
  student_id text not null,
  status text not null default 'not_started',
  answers jsonb not null default '{}'::jsonb,
  points_earned numeric,
  points_possible numeric,
  proficiency text,
  teacher_entered boolean not null default false,
  closed_at timestamptz,
  submitted_at timestamptz,
  results_snapshot jsonb,
  updated_at timestamptz not null default now(),
  constraint assessment_attempts_student_check check (char_length(trim(student_id)) > 0),
  constraint assessment_attempts_status_check check (
    status in (
      'not_started', 'in_progress', 'submitted', 'needs_grading', 'graded', 'closed'
    )
  ),
  constraint assessment_attempts_points_check check (
    (points_earned is null or points_earned >= 0)
    and (points_possible is null or points_possible >= 0)
  ),
  unique (assignment_id, student_id)
);

create index if not exists assessments_owner_idx
  on public.assessments (owner_id, updated_at desc);

create index if not exists assessment_assignments_class_idx
  on public.assessment_assignments (class_id, assigned_at desc);

create index if not exists assessment_attempts_assignment_idx
  on public.assessment_attempts (assignment_id, updated_at desc);

alter table public.assessments enable row level security;
alter table public.assessment_assignments enable row level security;
alter table public.assessment_attempts enable row level security;

grant select, insert, update, delete on public.assessments to authenticated;
grant select, insert, update, delete on public.assessment_assignments to authenticated;
grant select, insert, update, delete on public.assessment_attempts to authenticated;

drop policy if exists "owner manages assessments" on public.assessments;
create policy "owner manages assessments"
  on public.assessments for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "student reads assigned assessments" on public.assessments;
create policy "student reads assigned assessments"
  on public.assessments for select
  using (
    exists (
      select 1
      from public.assessment_assignments a
      join public.class_members cm on cm.class_id::text = a.class_id
      where a.assessment_id = assessments.id
        and cm.student_id = auth.uid()
    )
  );

drop policy if exists "owner manages assessment assignments" on public.assessment_assignments;
create policy "owner manages assessment assignments"
  on public.assessment_assignments for all
  using (
    exists (
      select 1 from public.assessments s
      where s.id = assessment_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.assessments s
      where s.id = assessment_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists "student reads own class assignments" on public.assessment_assignments;
create policy "student reads own class assignments"
  on public.assessment_assignments for select
  using (
    exists (
      select 1 from public.class_members cm
      where cm.student_id = auth.uid()
        and cm.class_id::text = assessment_assignments.class_id
    )
  );

drop policy if exists "owner manages assessment attempts" on public.assessment_attempts;
create policy "owner manages assessment attempts"
  on public.assessment_attempts for all
  using (
    exists (
      select 1
      from public.assessment_assignments a
      join public.assessments s on s.id = a.assessment_id
      where a.id = assignment_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.assessment_assignments a
      join public.assessments s on s.id = a.assessment_id
      where a.id = assignment_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists "student reads own assessment attempts" on public.assessment_attempts;
create policy "student reads own assessment attempts"
  on public.assessment_attempts for select
  using (student_id = auth.uid()::text);

create or replace function public.assessment_text_set(value jsonb)
returns text[]
language sql
immutable
set search_path = public
as $$
  select coalesce(array(
    select distinct e
    from jsonb_array_elements_text(coalesce(value, '[]'::jsonb)) as t(e)
    where btrim(e) <> ''
    order by e
  ), '{}'::text[]);
$$;

create or replace function public.assessment_text_list(value jsonb)
returns text[]
language sql
immutable
set search_path = public
as $$
  select coalesce(array(
    select e
    from jsonb_array_elements_text(coalesce(value, '[]'::jsonb)) as t(e)
    where btrim(e) <> ''
  ), '{}'::text[]);
$$;

create or replace function public.assessment_pair_keys(value jsonb)
returns text[]
language sql
immutable
set search_path = public
as $$
  select coalesce(array(
    select (p->>'leftId') || '::' || (p->>'rightId')
    from jsonb_array_elements(coalesce(value, '[]'::jsonb)) as p
    where coalesce(p->>'leftId', '') <> ''
    order by 1
  ), '{}'::text[]);
$$;

create or replace function public.assessment_numbers_match(given text, expected text)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  g text := btrim(coalesce(given, ''));
  e text := btrim(coalesce(expected, ''));
begin
  if g = '' or e = '' then
    return false;
  end if;
  if g ~ '^-?([0-9]+(\.[0-9]*)?|\.[0-9]+)$' and e ~ '^-?([0-9]+(\.[0-9]*)?|\.[0-9]+)$' then
    return g::numeric = e::numeric;
  end if;
  return lower(g) = lower(e);
end;
$$;

create or replace function public.score_assessment_answers(items jsonb, given_answers jsonb)
returns jsonb
language plpgsql
immutable
set search_path = public
as $$
declare
  item jsonb;
  given jsonb;
  item_type text;
  item_points numeric;
  got numeric;
  correct boolean;
  auto_scored boolean;
  earned numeric := 0;
  possible numeric := 0;
  needs boolean := false;
  stored jsonb := '{}'::jsonb;
begin
  if jsonb_typeof(items) is distinct from 'array' then
    items := '[]'::jsonb;
  end if;
  if jsonb_typeof(given_answers) is distinct from 'object' then
    given_answers := '{}'::jsonb;
  end if;

  for item in select value from jsonb_array_elements(items) loop
    item_type := coalesce(item->>'type', '');
    item_points := greatest(coalesce((item->>'points')::numeric, 1), 0);
    possible := possible + item_points;
    given := coalesce(given_answers -> coalesce(item->>'id', ''), '{}'::jsonb);
    correct := false;
    auto_scored := false;
    got := 0;

    if item_type = 'choose_one' then
      auto_scored := true;
      correct := coalesce(given->>'choiceId', '') <> ''
        and given->>'choiceId' = coalesce(item->>'correctChoiceId', '');
    elsif item_type = 'number' then
      auto_scored := true;
      correct := public.assessment_numbers_match(given->>'number', item->>'correctNumber');
    elsif item_type = 'choose_many' then
      if cardinality(public.assessment_text_set(item->'correctChoiceIds')) > 0 then
        auto_scored := true;
        correct := public.assessment_text_set(item->'correctChoiceIds')
          = public.assessment_text_set(given->'choiceIds');
      end if;
    elsif item_type = 'order' then
      if cardinality(public.assessment_text_list(item->'correctOrder')) > 0 then
        auto_scored := true;
        correct := public.assessment_text_list(item->'correctOrder')
          = public.assessment_text_list(given->'orderIds');
      end if;
    elsif item_type = 'match' then
      if cardinality(public.assessment_pair_keys(item->'correctPairs')) > 0 then
        auto_scored := true;
        correct := public.assessment_pair_keys(item->'correctPairs')
          = public.assessment_pair_keys(given->'pairs');
      end if;
    end if;

    if auto_scored then
      got := case when correct then item_points else 0 end;
      earned := earned + got;
    else
      needs := true;
    end if;

    stored := stored || jsonb_build_object(
      coalesce(item->>'id', ''),
      jsonb_build_object(
        'value', given,
        'correct', correct,
        'points', got,
        'auto', auto_scored
      )
    );
  end loop;

  return jsonb_build_object(
    'answers', stored,
    'pointsEarned', earned,
    'pointsPossible', possible,
    'status', case when needs then 'needs_grading' else 'graded' end
  );
end;
$$;

create or replace function public.student_can_take_assignment(p_assignment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.assessment_assignments a
    join public.class_members cm on cm.class_id::text = a.class_id
    where a.id = p_assignment_id
      and cm.student_id = auth.uid()
  );
$$;

create or replace function public.save_assessment_progress(
  p_assignment_id uuid,
  p_answers jsonb
)
returns public.assessment_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.assessment_attempts%rowtype;
  uid text := auth.uid()::text;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if not public.student_can_take_assignment(p_assignment_id) then
    raise exception 'This test is not assigned to you.';
  end if;
  if jsonb_typeof(p_answers) is distinct from 'object' then
    p_answers := '{}'::jsonb;
  end if;

  select * into result
  from public.assessment_attempts
  where assignment_id = p_assignment_id and student_id = uid;

  if found and result.status in ('needs_grading', 'graded', 'closed') then
    return result;
  end if;

  insert into public.assessment_attempts (
    assignment_id, student_id, status, answers, updated_at
  )
  values (p_assignment_id, uid, 'in_progress', p_answers, now())
  on conflict (assignment_id, student_id) do update
    set answers = excluded.answers,
        status = 'in_progress',
        updated_at = now()
    where public.assessment_attempts.status in ('not_started', 'in_progress')
  returning * into result;

  return result;
end;
$$;

create or replace function public.submit_assessment_attempt(
  p_assignment_id uuid,
  p_answers jsonb
)
returns public.assessment_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  items jsonb;
  scored jsonb;
  result public.assessment_attempts%rowtype;
  uid text := auth.uid()::text;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if not public.student_can_take_assignment(p_assignment_id) then
    raise exception 'This test is not assigned to you.';
  end if;

  select * into result
  from public.assessment_attempts
  where assignment_id = p_assignment_id and student_id = uid;
  if result.status = 'closed' then
    raise exception 'This test is closed.';
  end if;

  select s.items into items
  from public.assessment_assignments a
  join public.assessments s on s.id = a.assessment_id
  where a.id = p_assignment_id;

  scored := public.score_assessment_answers(items, p_answers);

  insert into public.assessment_attempts (
    assignment_id,
    student_id,
    status,
    answers,
    points_earned,
    points_possible,
    proficiency,
    teacher_entered,
    submitted_at,
    updated_at
  )
  values (
    p_assignment_id,
    uid,
    scored->>'status',
    scored->'answers',
    (scored->>'pointsEarned')::numeric,
    (scored->>'pointsPossible')::numeric,
    null,
    false,
    now(),
    now()
  )
  on conflict (assignment_id, student_id) do update
    set status = excluded.status,
        answers = excluded.answers,
        points_earned = excluded.points_earned,
        points_possible = excluded.points_possible,
        teacher_entered = false,
        submitted_at = now(),
        updated_at = now()
    where public.assessment_attempts.status is distinct from 'closed'
  returning * into result;

  return result;
end;
$$;

create or replace function public.close_assessment_attempt(
  p_assignment_id uuid,
  p_student_id text,
  p_points_earned numeric,
  p_points_possible numeric
)
returns public.assessment_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.assessment_attempts%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if btrim(coalesce(p_student_id, '')) = '' then
    raise exception 'Choose a student.';
  end if;
  if p_points_earned is null or p_points_earned < 0 or p_points_possible is null or p_points_possible < 0 then
    raise exception 'Enter a score.';
  end if;
  if not exists (
    select 1
    from public.assessment_assignments a
    join public.assessments s on s.id = a.assessment_id
    where a.id = p_assignment_id and s.owner_id = auth.uid()
  ) then
    raise exception 'You cannot close this test.';
  end if;

  insert into public.assessment_attempts (
    assignment_id,
    student_id,
    status,
    points_earned,
    points_possible,
    teacher_entered,
    closed_at,
    updated_at
  )
  values (
    p_assignment_id,
    btrim(p_student_id),
    'closed',
    p_points_earned,
    p_points_possible,
    true,
    now(),
    now()
  )
  on conflict (assignment_id, student_id) do update
    set status = 'closed',
        points_earned = excluded.points_earned,
        points_possible = excluded.points_possible,
        teacher_entered = true,
        closed_at = now(),
        updated_at = now()
  returning * into result;

  return result;
end;
$$;

revoke all on function public.assessment_text_set(jsonb) from public;
revoke all on function public.assessment_text_list(jsonb) from public;
revoke all on function public.assessment_pair_keys(jsonb) from public;
revoke all on function public.assessment_numbers_match(text, text) from public;
revoke all on function public.score_assessment_answers(jsonb, jsonb) from public;
revoke all on function public.student_can_take_assignment(uuid) from public;
revoke all on function public.save_assessment_progress(uuid, jsonb) from public;
revoke all on function public.submit_assessment_attempt(uuid, jsonb) from public;
revoke all on function public.close_assessment_attempt(uuid, text, numeric, numeric) from public;

grant execute on function public.save_assessment_progress(uuid, jsonb) to authenticated;
grant execute on function public.submit_assessment_attempt(uuid, jsonb) to authenticated;
grant execute on function public.close_assessment_attempt(uuid, text, numeric, numeric) to authenticated;
