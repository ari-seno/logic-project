-- Project version snapshots.
-- Each row holds a full JSONB copy of a project's bundle, so a project can be
-- reviewed or rolled forward by importing a snapshot into a new project.

create table if not exists public.project_versions (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  label      text not null check (char_length(label) between 1 and 200),
  item_count integer not null default 0,
  bundle     jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists project_versions_project_id_idx
  on public.project_versions (project_id, created_at desc);

alter table public.project_versions enable row level security;

drop policy if exists "project_versions_select_owner" on public.project_versions;
create policy "project_versions_select_owner"
  on public.project_versions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_versions.project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "project_versions_insert_owner" on public.project_versions;
create policy "project_versions_insert_owner"
  on public.project_versions
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_versions.project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists "project_versions_delete_owner" on public.project_versions;
create policy "project_versions_delete_owner"
  on public.project_versions
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_versions.project_id
        and p.owner_id = auth.uid()
    )
  );
