-- Allow the Screener app on student class rules (LETRS and later screeners).

alter table public.class_app_policies
  drop constraint if exists class_app_policies_app_check;

alter table public.class_app_policies
  add constraint class_app_policies_app_check check (
    app_id in (
      'arcade', 'games', 'eduType', 'mathTools', 'dictionary', 'paper',
      'earlyliteracy', 'ofTheDay', 'timer', 'slides', 'library', 'morningMeeting',
      'screener'
    )
  );

alter table public.student_app_overrides
  drop constraint if exists student_app_overrides_app_check;

alter table public.student_app_overrides
  add constraint student_app_overrides_app_check check (
    app_id in (
      'arcade', 'games', 'eduType', 'mathTools', 'dictionary', 'paper',
      'earlyliteracy', 'ofTheDay', 'timer', 'slides', 'library', 'morningMeeting',
      'screener'
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
    'earlyliteracy', 'ofTheDay', 'timer', 'slides', 'library', 'morningMeeting',
    'screener'
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
    'arcade', 'games', 'eduType', 'mathTools', 'dictionary', 'paper',
    'earlyliteracy', 'ofTheDay', 'timer', 'slides', 'library', 'morningMeeting',
    'screener'
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
