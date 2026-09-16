-- ============================================================================
-- Logic Project — Part 2 schema
-- requirements, decisions, indexes, triggers, RLS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- requirements
-- ----------------------------------------------------------------------------
create table if not exists public.requirements (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 200),
  description text check (description is null or char_length(description) <= 5000),
  type        text not null check (type in ('functional', 'non_functional')),
  status      text not null check (status in ('draft', 'approved', 'rejected', 'implemented')),
  priority    text not null check (priority in ('low', 'medium', 'high', 'critical')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists requirements_project_id_idx
  on public.requirements (project_id);

create index if not exists requirements_status_idx
  on public.requirements (status);

create index if not exists requirements_priority_idx
  on public.requirements (priority);

create index if not exists requirements_updated_at_idx
  on public.requirements (updated_at desc);

drop trigger if exists requirements_set_updated_at on public.requirements;
create trigger requirements_set_updated_at
  before update on public.requirements
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- decisions
-- ----------------------------------------------------------------------------
create table if not exists public.decisions (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 200),
  context     text check (context is null or char_length(context) <= 5000),
  decision    text not null check (char_length(decision) between 1 and 2000),
  rationale   text check (rationale is null or char_length(rationale) <= 5000),
  status      text not null check (status in ('proposed', 'accepted', 'superseded')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists decisions_project_id_idx
  on public.decisions (project_id);

create index if not exists decisions_status_idx
  on public.decisions (status);

create index if not exists decisions_updated_at_idx
  on public.decisions (updated_at desc);

drop trigger if exists decisions_set_updated_at on public.decisions;
create trigger decisions_set_updated_at
  before update on public.decisions
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Row Level Security
-- Authorization rule: a user can access a requirement / decision only if
-- they own the parent project.
-- ============================================================================
alter table public.requirements enable row level security;
alter table public.decisions     enable row level security;

-- ----------------------------------------------------------------------------
-- requirements policies
-- ----------------------------------------------------------------------------
drop policy if exists "requirements_select_owner" on public.requirements;
create policy "requirements_select_owner"
  on public.requirements
  for select
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = requirements.project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "requirements_insert_owner" on public.requirements;
create policy "requirements_insert_owner"
  on public.requirements
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.projects p
      where p.id = requirements.project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "requirements_update_owner" on public.requirements;
create policy "requirements_update_owner"
  on public.requirements
  for update
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = requirements.project_id
        and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = requirements.project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "requirements_delete_owner" on public.requirements;
create policy "requirements_delete_owner"
  on public.requirements
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = requirements.project_id
        and p.owner_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- decisions policies
-- ----------------------------------------------------------------------------
drop policy if exists "decisions_select_owner" on public.decisions;
create policy "decisions_select_owner"
  on public.decisions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = decisions.project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "decisions_insert_owner" on public.decisions;
create policy "decisions_insert_owner"
  on public.decisions
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.projects p
      where p.id = decisions.project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "decisions_update_owner" on public.decisions;
create policy "decisions_update_owner"
  on public.decisions
  for update
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = decisions.project_id
        and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = decisions.project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "decisions_delete_owner" on public.decisions;
create policy "decisions_delete_owner"
  on public.decisions
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = decisions.project_id
        and p.owner_id = auth.uid()
    )
  );
