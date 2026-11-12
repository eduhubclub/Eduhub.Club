-- Shelf and archive flags for the Tests sidebar.
-- Safe when 20261111120000 already created these columns.

alter table public.assessments
  add column if not exists shelf text not null default 'mine';

alter table public.assessments
  add column if not exists archived boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'assessments_shelf_check'
  ) then
    alter table public.assessments
      add constraint assessments_shelf_check
      check (shelf in ('mine', 'district', 'community'));
  end if;
end $$;
