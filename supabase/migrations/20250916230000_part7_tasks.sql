-- Part 7: Tasks & Dependencies
-- Transforms structured planning information into executable implementation units.

-- set_updated_at() function already exists from Part 1.

-- ============================================================================
-- 1. tasks
-- ============================================================================
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  parent_task_id uuid references public.tasks(id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  description text check (description is null or char_length(description) <= 5000),
  task_type text not null check (task_type in (
    'feature','bug','refactor','database','backend','frontend',
    'infrastructure','testing','documentation','security','other'
  )),
  status text not null default 'todo' check (status in (
    'todo','ready','in_progress','blocked','review','done','cancelled'
  )),
  priority text not null default 'medium' check (priority in (
    'low','medium','high','critical'
  )),
  estimated_effort text check (estimated_effort is null or estimated_effort in (
    'xs','s','m','l','xl'
  )),
  acceptance_criteria text check (acceptance_criteria is null or char_length(acceptance_criteria) <= 10000),
  implementation_notes text check (implementation_notes is null or char_length(implementation_notes) <= 10000),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (parent_task_id is null or parent_task_id <> id)
);

create index tasks_project_id_idx on public.tasks (project_id);
create index tasks_project_id_status_idx on public.tasks (project_id, status);
create index tasks_project_id_priority_idx on public.tasks (project_id, priority);
create index tasks_project_id_position_idx on public.tasks (project_id, position);
create index tasks_parent_task_id_idx on public.tasks (parent_task_id);

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

alter table public.tasks enable row level security;

create policy tasks_owner_all on public.tasks
  for all using (
    exists (select 1 from public.projects p where p.id = tasks.project_id and p.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.projects p where p.id = tasks.project_id and p.owner_id = auth.uid())
  );

-- ============================================================================
-- 2. task_dependencies
-- ============================================================================
create table public.task_dependencies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  depends_on_task_id uuid not null references public.tasks(id) on delete cascade,
  dependency_type text not null default 'blocks' check (dependency_type in ('blocks','related')),
  description text check (description is null or char_length(description) <= 2000),
  created_at timestamptz not null default now(),
  check (task_id <> depends_on_task_id),
  unique (task_id, depends_on_task_id)
);

create index task_dependencies_project_id_idx on public.task_dependencies (project_id);
create index task_dependencies_task_id_idx on public.task_dependencies (task_id);
create index task_dependencies_depends_on_task_id_idx on public.task_dependencies (depends_on_task_id);

alter table public.task_dependencies enable row level security;

create policy task_dependencies_owner_all on public.task_dependencies
  for all using (
    exists (select 1 from public.projects p where p.id = task_dependencies.project_id and p.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.projects p where p.id = task_dependencies.project_id and p.owner_id = auth.uid())
  );

-- ============================================================================
-- 3. task_requirements
-- ============================================================================
create table public.task_requirements (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  requirement_id uuid not null references public.requirements(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (task_id, requirement_id)
);

create index task_requirements_task_id_idx on public.task_requirements (task_id);
create index task_requirements_requirement_id_idx on public.task_requirements (requirement_id);

alter table public.task_requirements enable row level security;

create policy task_requirements_owner_all on public.task_requirements
  for all using (
    exists (
      select 1 from public.tasks t
      join public.projects p on p.id = t.project_id
      where t.id = task_requirements.task_id and p.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.tasks t
      join public.projects p on p.id = t.project_id
      where t.id = task_requirements.task_id and p.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. task_decisions
-- ============================================================================
create table public.task_decisions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  decision_id uuid not null references public.decisions(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (task_id, decision_id)
);

create index task_decisions_task_id_idx on public.task_decisions (task_id);
create index task_decisions_decision_id_idx on public.task_decisions (decision_id);

alter table public.task_decisions enable row level security;

create policy task_decisions_owner_all on public.task_decisions
  for all using (
    exists (
      select 1 from public.tasks t
      join public.projects p on p.id = t.project_id
      where t.id = task_decisions.task_id and p.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.tasks t
      join public.projects p on p.id = t.project_id
      where t.id = task_decisions.task_id and p.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. task_domains
-- ============================================================================
create table public.task_domains (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (task_id, entity_id)
);

create index task_domains_task_id_idx on public.task_domains (task_id);
create index task_domains_entity_id_idx on public.task_domains (entity_id);

alter table public.task_domains enable row level security;

create policy task_domains_owner_all on public.task_domains
  for all using (
    exists (
      select 1 from public.tasks t
      join public.projects p on p.id = t.project_id
      where t.id = task_domains.task_id and p.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.tasks t
      join public.projects p on p.id = t.project_id
      where t.id = task_domains.task_id and p.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. task_architecture_components
-- ============================================================================
create table public.task_architecture_components (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  component_id uuid not null references public.architecture_components(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (task_id, component_id)
);

create index task_architecture_components_task_id_idx on public.task_architecture_components (task_id);
create index task_architecture_components_component_id_idx on public.task_architecture_components (component_id);

alter table public.task_architecture_components enable row level security;

create policy task_architecture_components_owner_all on public.task_architecture_components
  for all using (
    exists (
      select 1 from public.tasks t
      join public.projects p on p.id = t.project_id
      where t.id = task_architecture_components.task_id and p.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.tasks t
      join public.projects p on p.id = t.project_id
      where t.id = task_architecture_components.task_id and p.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. task_api_endpoints
-- ============================================================================
create table public.task_api_endpoints (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  endpoint_id uuid not null references public.api_endpoints(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (task_id, endpoint_id)
);

create index task_api_endpoints_task_id_idx on public.task_api_endpoints (task_id);
create index task_api_endpoints_endpoint_id_idx on public.task_api_endpoints (endpoint_id);

alter table public.task_api_endpoints enable row level security;

create policy task_api_endpoints_owner_all on public.task_api_endpoints
  for all using (
    exists (
      select 1 from public.tasks t
      join public.projects p on p.id = t.project_id
      where t.id = task_api_endpoints.task_id and p.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.tasks t
      join public.projects p on p.id = t.project_id
      where t.id = task_api_endpoints.task_id and p.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 8. task_ui_screens
-- ============================================================================
create table public.task_ui_screens (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  screen_id uuid not null references public.ui_screens(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (task_id, screen_id)
);

create index task_ui_screens_task_id_idx on public.task_ui_screens (task_id);
create index task_ui_screens_screen_id_idx on public.task_ui_screens (screen_id);

alter table public.task_ui_screens enable row level security;

create policy task_ui_screens_owner_all on public.task_ui_screens
  for all using (
    exists (
      select 1 from public.tasks t
      join public.projects p on p.id = t.project_id
      where t.id = task_ui_screens.task_id and p.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.tasks t
      join public.projects p on p.id = t.project_id
      where t.id = task_ui_screens.task_id and p.owner_id = auth.uid()
    )
  );
