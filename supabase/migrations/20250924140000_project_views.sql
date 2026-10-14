-- Saved views: a named filter for a project section.
-- The query column stores the raw query string (without the leading "?"),
-- so applying a view is just a link back to the section with those params.

create table if not exists public.project_views (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  scope text not null check (scope in ('requirements', 'tasks')),
  label text not null check (char_length(label) between 1 and 60),
  query text not null default '' check (char_length(query) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists project_views_project_scope_idx
  on public.project_views (project_id, scope, created_at desc);

alter table public.project_views enable row level security;

drop policy if exists project_views_select_owner on public.project_views;
create policy project_views_select_owner
  on public.project_views for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists project_views_insert_owner on public.project_views;
create policy project_views_insert_owner
  on public.project_views for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists project_views_delete_owner on public.project_views;
create policy project_views_delete_owner
  on public.project_views for delete
  to authenticated
  using (owner_id = auth.uid());
