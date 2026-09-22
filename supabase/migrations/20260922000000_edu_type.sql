-- Edu.Type: teacher passages, daily assignments, progress, and WPM sessions.
-- Also allow eduType in student app access checks.

alter table public.class_app_policies
  drop constraint if exists class_app_policies_app_check;

alter table public.class_app_policies
  add constraint class_app_policies_app_check check (
    app_id in (
      'arcade', 'games', 'eduType', 'mathTools', 'dictionary', 'paper',
      'earlyliteracy', 'ofTheDay', 'timer', 'slides', 'library', 'morningMeeting'
    )
  );

alter table public.student_app_overrides
  drop constraint if exists student_app_overrides_app_check;

alter table public.student_app_overrides
  add constraint student_app_overrides_app_check check (
    app_id in (
      'arcade', 'games', 'eduType', 'mathTools', 'dictionary', 'paper',
      'earlyliteracy', 'ofTheDay', 'timer', 'slides', 'library', 'morningMeeting'
    )
  );

create or replace function public.is_student_app(app_id text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select app_id in (
    'arcade', 'games', 'eduType', 'mathTools', 'dictionary', 'paper',
    'earlyliteracy', 'ofTheDay', 'timer', 'slides', 'library', 'morningMeeting'
  );
$$;

create table if not exists public.edu_type_texts (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint edu_type_texts_title_check check (char_length(trim(title)) > 0),
  constraint edu_type_texts_body_check check (char_length(trim(body)) > 0)
);

create table if not exists public.edu_type_day_assignments (
  class_id uuid not null references public.classes (id) on delete cascade,
  assign_date date not null,
  text_id uuid not null references public.edu_type_texts (id) on delete cascade,
  updated_at timestamptz not null default now(),
  primary key (class_id, assign_date)
);

create table if not exists public.edu_type_progress (
  student_id uuid not null references public.profiles (id) on delete cascade,
  content_kind text not null,
  content_id text not null,
  class_id uuid references public.classes (id) on delete set null,
  page_index int not null default 0,
  char_index int not null default 0,
  active_ms bigint not null default 0,
  correct_keystrokes int not null default 0,
  error_keystrokes int not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (student_id, content_kind, content_id),
  constraint edu_type_progress_kind_check check (content_kind in ('classic', 'text')),
  constraint edu_type_progress_page_check check (page_index >= 0),
  constraint edu_type_progress_char_check check (char_index >= 0),
  constraint edu_type_progress_active_check check (active_ms >= 0),
  constraint edu_type_progress_correct_check check (correct_keystrokes >= 0),
  constraint edu_type_progress_error_check check (error_keystrokes >= 0)
);

create table if not exists public.edu_type_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  class_id uuid references public.classes (id) on delete set null,
  content_kind text not null,
  content_id text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  active_ms bigint not null default 0,
  correct_keystrokes int not null default 0,
  error_keystrokes int not null default 0,
  wpm numeric(8, 2) not null default 0,
  accuracy numeric(5, 4) not null default 1,
  constraint edu_type_sessions_kind_check check (content_kind in ('classic', 'text')),
  constraint edu_type_sessions_active_check check (active_ms >= 0),
  constraint edu_type_sessions_correct_check check (correct_keystrokes >= 0),
  constraint edu_type_sessions_error_check check (error_keystrokes >= 0),
  constraint edu_type_sessions_wpm_check check (wpm >= 0),
  constraint edu_type_sessions_accuracy_check check (accuracy >= 0 and accuracy <= 1)
);

create index if not exists edu_type_texts_class_idx
  on public.edu_type_texts (class_id, created_at desc);

create index if not exists edu_type_sessions_class_idx
  on public.edu_type_sessions (class_id, started_at desc);

create index if not exists edu_type_sessions_student_idx
  on public.edu_type_sessions (student_id, started_at desc);

alter table public.edu_type_texts enable row level security;
alter table public.edu_type_day_assignments enable row level security;
alter table public.edu_type_progress enable row level security;
alter table public.edu_type_sessions enable row level security;

grant select, insert, update, delete on public.edu_type_texts to authenticated;
grant select, insert, update, delete on public.edu_type_day_assignments to authenticated;
grant select, insert, update, delete on public.edu_type_progress to authenticated;
grant select, insert, update, delete on public.edu_type_sessions to authenticated;

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
    'arcade', 'games', 'eduType', 'mathTools', 'dictionary', 'paper',
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

drop policy if exists "teacher manages edu type texts" on public.edu_type_texts;
create policy "teacher manages edu type texts"
  on public.edu_type_texts for all
  using (
    exists (
      select 1 from public.classes c
      where c.id = class_id and c.teacher_id = auth.uid()
    )
  )
  with check (
    teacher_id = auth.uid()
    and exists (
      select 1 from public.classes c
      where c.id = class_id and c.teacher_id = auth.uid()
    )
  );

drop policy if exists "student reads class edu type texts" on public.edu_type_texts;
create policy "student reads class edu type texts"
  on public.edu_type_texts for select
  using (
    exists (
      select 1 from public.class_members cm
      where cm.class_id = edu_type_texts.class_id
        and cm.student_id = auth.uid()
    )
  );

drop policy if exists "teacher manages edu type day assignments" on public.edu_type_day_assignments;
create policy "teacher manages edu type day assignments"
  on public.edu_type_day_assignments for all
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

drop policy if exists "student reads edu type day assignments" on public.edu_type_day_assignments;
create policy "student reads edu type day assignments"
  on public.edu_type_day_assignments for select
  using (
    exists (
      select 1 from public.class_members cm
      where cm.class_id = edu_type_day_assignments.class_id
        and cm.student_id = auth.uid()
    )
  );

drop policy if exists "student manages own edu type progress" on public.edu_type_progress;
create policy "student manages own edu type progress"
  on public.edu_type_progress for all
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

drop policy if exists "teacher reads class edu type progress" on public.edu_type_progress;
create policy "teacher reads class edu type progress"
  on public.edu_type_progress for select
  using (
    class_id is not null
    and exists (
      select 1 from public.classes c
      where c.id = class_id and c.teacher_id = auth.uid()
    )
  );

drop policy if exists "student manages own edu type sessions" on public.edu_type_sessions;
create policy "student manages own edu type sessions"
  on public.edu_type_sessions for all
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

drop policy if exists "teacher reads class edu type sessions" on public.edu_type_sessions;
create policy "teacher reads class edu type sessions"
  on public.edu_type_sessions for select
  using (
    class_id is not null
    and exists (
      select 1 from public.classes c
      where c.id = class_id and c.teacher_id = auth.uid()
    )
  );
