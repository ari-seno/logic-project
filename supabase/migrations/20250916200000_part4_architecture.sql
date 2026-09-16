-- Part 4: Architecture foundation
-- Adds components, technologies, decisions, and component dependencies,
-- all scoped to a project via Row Level Security.

set check_function_bodies = off;

create table if not exists public.architecture_components (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  description text,
  type text not null check (type in (
    'frontend',
    'backend',
    'database',
    'authentication',
    'storage',
    'external_service',
    'infrastructure',
    'worker',
    'queue',
    'cache',
    'other'
  )),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, name)
);

create index if not exists idx_architecture_components_project
  on public.architecture_components(project_id);
create index if not exists idx_architecture_components_type
  on public.architecture_components(project_id, type);
create index if not exists idx_architecture_components_position
  on public.architecture_components(project_id, position);

alter table public.architecture_components enable row level security;

drop policy if exists architecture_components_select_owner on public.architecture_components;
create policy architecture_components_select_owner
  on public.architecture_components for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = architecture_components.project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists architecture_components_insert_owner on public.architecture_components;
create policy architecture_components_insert_owner
  on public.architecture_components for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists architecture_components_update_owner on public.architecture_components;
create policy architecture_components_update_owner
  on public.architecture_components for update
  using (
    exists (
      select 1 from public.projects p
      where p.id = architecture_components.project_id
        and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists architecture_components_delete_owner on public.architecture_components;
create policy architecture_components_delete_owner
  on public.architecture_components for delete
  using (
    exists (
      select 1 from public.projects p
      where p.id = architecture_components.project_id
        and p.owner_id = auth.uid()
    )
  );

drop trigger if exists trg_architecture_components_set_updated_at on public.architecture_components;
create trigger trg_architecture_components_set_updated_at
  before update on public.architecture_components
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------

create table if not exists public.architecture_technologies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  description text,
  category text not null check (category in (
    'language',
    'framework',
    'database',
    'authentication',
    'hosting',
    'infrastructure',
    'testing',
    'package',
    'external_service',
    'other'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, name)
);

create index if not exists idx_architecture_technologies_project
  on public.architecture_technologies(project_id);
create index if not exists idx_architecture_technologies_category
  on public.architecture_technologies(project_id, category);

alter table public.architecture_technologies enable row level security;

drop policy if exists architecture_technologies_select_owner on public.architecture_technologies;
create policy architecture_technologies_select_owner
  on public.architecture_technologies for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = architecture_technologies.project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists architecture_technologies_insert_owner on public.architecture_technologies;
create policy architecture_technologies_insert_owner
  on public.architecture_technologies for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists architecture_technologies_update_owner on public.architecture_technologies;
create policy architecture_technologies_update_owner
  on public.architecture_technologies for update
  using (
    exists (
      select 1 from public.projects p
      where p.id = architecture_technologies.project_id
        and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists architecture_technologies_delete_owner on public.architecture_technologies;
create policy architecture_technologies_delete_owner
  on public.architecture_technologies for delete
  using (
    exists (
      select 1 from public.projects p
      where p.id = architecture_technologies.project_id
        and p.owner_id = auth.uid()
    )
  );

drop trigger if exists trg_architecture_technologies_set_updated_at on public.architecture_technologies;
create trigger trg_architecture_technologies_set_updated_at
  before update on public.architecture_technologies
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------

create table if not exists public.architecture_decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  context text,
  decision text,
  rationale text,
  status text not null default 'proposed' check (status in (
    'proposed',
    'accepted',
    'superseded'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_architecture_decisions_project
  on public.architecture_decisions(project_id);
create index if not exists idx_architecture_decisions_status
  on public.architecture_decisions(project_id, status);

alter table public.architecture_decisions enable row level security;

drop policy if exists architecture_decisions_select_owner on public.architecture_decisions;
create policy architecture_decisions_select_owner
  on public.architecture_decisions for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = architecture_decisions.project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists architecture_decisions_insert_owner on public.architecture_decisions;
create policy architecture_decisions_insert_owner
  on public.architecture_decisions for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists architecture_decisions_update_owner on public.architecture_decisions;
create policy architecture_decisions_update_owner
  on public.architecture_decisions for update
  using (
    exists (
      select 1 from public.projects p
      where p.id = architecture_decisions.project_id
        and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists architecture_decisions_delete_owner on public.architecture_decisions;
create policy architecture_decisions_delete_owner
  on public.architecture_decisions for delete
  using (
    exists (
      select 1 from public.projects p
      where p.id = architecture_decisions.project_id
        and p.owner_id = auth.uid()
    )
  );

drop trigger if exists trg_architecture_decisions_set_updated_at on public.architecture_decisions;
create trigger trg_architecture_decisions_set_updated_at
  before update on public.architecture_decisions
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------

create table if not exists public.architecture_component_dependencies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source_component_id uuid not null references public.architecture_components(id) on delete cascade,
  target_component_id uuid not null references public.architecture_components(id) on delete cascade,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_component_id, target_component_id),
  check (source_component_id <> target_component_id)
);

create index if not exists idx_architecture_component_dependencies_project
  on public.architecture_component_dependencies(project_id);
create index if not exists idx_architecture_component_dependencies_source
  on public.architecture_component_dependencies(source_component_id);
create index if not exists idx_architecture_component_dependencies_target
  on public.architecture_component_dependencies(target_component_id);

create or replace function public.architecture_component_dependencies_share_project()
returns trigger
language plpgsql
as $$
declare
  src_project uuid;
  tgt_project uuid;
begin
  select project_id into src_project from public.architecture_components where id = new.source_component_id;
  select project_id into tgt_project from public.architecture_components where id = new.target_component_id;
  if src_project is null or tgt_project is null or src_project <> new.project_id or tgt_project <> new.project_id then
    raise exception 'Components must belong to the same project as the dependency';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_architecture_component_dependencies_share_project_ins on public.architecture_component_dependencies;
create trigger trg_architecture_component_dependencies_share_project_ins
  before insert on public.architecture_component_dependencies
  for each row execute function public.architecture_component_dependencies_share_project();

drop trigger if exists trg_architecture_component_dependencies_share_project_upd on public.architecture_component_dependencies;
create trigger trg_architecture_component_dependencies_share_project_upd
  before update on public.architecture_component_dependencies
  for each row execute function public.architecture_component_dependencies_share_project();

alter table public.architecture_component_dependencies enable row level security;

drop policy if exists architecture_component_dependencies_select_owner on public.architecture_component_dependencies;
create policy architecture_component_dependencies_select_owner
  on public.architecture_component_dependencies for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = architecture_component_dependencies.project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists architecture_component_dependencies_insert_owner on public.architecture_component_dependencies;
create policy architecture_component_dependencies_insert_owner
  on public.architecture_component_dependencies for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists architecture_component_dependencies_update_owner on public.architecture_component_dependencies;
create policy architecture_component_dependencies_update_owner
  on public.architecture_component_dependencies for update
  using (
    exists (
      select 1 from public.projects p
      where p.id = architecture_component_dependencies.project_id
        and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.owner_id = auth.uid()
    )
  );

drop policy if exists architecture_component_dependencies_delete_owner on public.architecture_component_dependencies;
create policy architecture_component_dependencies_delete_owner
  on public.architecture_component_dependencies for delete
  using (
    exists (
      select 1 from public.projects p
      where p.id = architecture_component_dependencies.project_id
        and p.owner_id = auth.uid()
    )
  );

drop trigger if exists trg_architecture_component_dependencies_set_updated_at on public.architecture_component_dependencies;
create trigger trg_architecture_component_dependencies_set_updated_at
  before update on public.architecture_component_dependencies
  for each row execute function public.set_updated_at();
