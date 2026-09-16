-- Part 5: API Design Foundation
-- Provides structured modeling of the user's planned project API.
-- Design-only — does NOT create real API endpoints.

-- ============================================================================
-- Utility: set_updated_at trigger function (reuses existing from Part 1)
-- ============================================================================
-- The set_updated_at() function is already present from 20250916120000_init_schema.
-- Reuse it.

-- ============================================================================
-- 1. api_groups
-- ============================================================================
create table public.api_groups (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  description text check (description is null or char_length(description) <= 5000),
  prefix text check (prefix is null or char_length(prefix) <= 200),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, name)
);

create index api_groups_project_id_idx on public.api_groups (project_id);
create index api_groups_project_id_position_idx on public.api_groups (project_id, position);

drop trigger if exists set_api_groups_updated_at on public.api_groups;
create trigger set_api_groups_updated_at
  before update on public.api_groups
  for each row execute function public.set_updated_at();

alter table public.api_groups enable row level security;

create policy api_groups_select_owner on public.api_groups
  for select using (
    exists (select 1 from public.projects p where p.id = api_groups.project_id and p.owner_id = auth.uid())
  );
create policy api_groups_insert_owner on public.api_groups
  for insert with check (
    exists (select 1 from public.projects p where p.id = api_groups.project_id and p.owner_id = auth.uid())
  );
create policy api_groups_update_owner on public.api_groups
  for update using (
    exists (select 1 from public.projects p where p.id = api_groups.project_id and p.owner_id = auth.uid())
  );
create policy api_groups_delete_owner on public.api_groups
  for delete using (
    exists (select 1 from public.projects p where p.id = api_groups.project_id and p.owner_id = auth.uid())
  );

-- ============================================================================
-- 2. api_endpoints
-- ============================================================================
create table public.api_endpoints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  group_id uuid references public.api_groups(id) on delete set null,
  name text not null check (char_length(name) between 1 and 200),
  method text not null check (method in ('GET','POST','PUT','PATCH','DELETE')),
  path text not null check (char_length(path) between 1 and 500),
  summary text check (summary is null or char_length(summary) <= 500),
  description text check (description is null or char_length(description) <= 5000),
  authentication_required boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Prevent duplicate method+path within the same project
  unique (project_id, method, path)
  -- Cross-project group membership is enforced by the application:
  -- lib/api/endpoints/actions.ts verifies the selected group's project_id
  -- matches before insert/update. PostgreSQL CHECK cannot use a subquery.
);

create index api_endpoints_project_id_idx on public.api_endpoints (project_id);
create index api_endpoints_group_id_idx on public.api_endpoints (group_id);
create index api_endpoints_project_id_method_path_idx on public.api_endpoints (project_id, method, path);
create index api_endpoints_project_id_position_idx on public.api_endpoints (project_id, position);

drop trigger if exists set_api_endpoints_updated_at on public.api_endpoints;
create trigger set_api_endpoints_updated_at
  before update on public.api_endpoints
  for each row execute function public.set_updated_at();

alter table public.api_endpoints enable row level security;

create policy api_endpoints_select_owner on public.api_endpoints
  for select using (
    exists (select 1 from public.projects p where p.id = api_endpoints.project_id and p.owner_id = auth.uid())
  );
create policy api_endpoints_insert_owner on public.api_endpoints
  for insert with check (
    exists (select 1 from public.projects p where p.id = api_endpoints.project_id and p.owner_id = auth.uid())
  );
create policy api_endpoints_update_owner on public.api_endpoints
  for update using (
    exists (select 1 from public.projects p where p.id = api_endpoints.project_id and p.owner_id = auth.uid())
  );
create policy api_endpoints_delete_owner on public.api_endpoints
  for delete using (
    exists (select 1 from public.projects p where p.id = api_endpoints.project_id and p.owner_id = auth.uid())
  );

-- ============================================================================
-- 3. api_parameters
-- ============================================================================
create table public.api_parameters (
  id uuid primary key default gen_random_uuid(),
  endpoint_id uuid not null references public.api_endpoints(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  location text not null check (location in ('path','query','header','cookie')),
  data_type text not null check (data_type in ('string','integer','number','boolean','uuid','date','datetime')),
  required boolean not null default false,
  description text check (description is null or char_length(description) <= 2000),
  example text check (example is null or char_length(example) <= 1000),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index api_parameters_endpoint_id_idx on public.api_parameters (endpoint_id);
create index api_parameters_endpoint_id_position_idx on public.api_parameters (endpoint_id, position);

drop trigger if exists set_api_parameters_updated_at on public.api_parameters;
create trigger set_api_parameters_updated_at
  before update on public.api_parameters
  for each row execute function public.set_updated_at();

alter table public.api_parameters enable row level security;

create policy api_parameters_select_owner on public.api_parameters
  for select using (
    exists (
      select 1 from public.api_endpoints e
      join public.projects p on p.id = e.project_id
      where e.id = api_parameters.endpoint_id and p.owner_id = auth.uid()
    )
  );
create policy api_parameters_insert_owner on public.api_parameters
  for insert with check (
    exists (
      select 1 from public.api_endpoints e
      join public.projects p on p.id = e.project_id
      where e.id = api_parameters.endpoint_id and p.owner_id = auth.uid()
    )
  );
create policy api_parameters_update_owner on public.api_parameters
  for update using (
    exists (
      select 1 from public.api_endpoints e
      join public.projects p on p.id = e.project_id
      where e.id = api_parameters.endpoint_id and p.owner_id = auth.uid()
    )
  );
create policy api_parameters_delete_owner on public.api_parameters
  for delete using (
    exists (
      select 1 from public.api_endpoints e
      join public.projects p on p.id = e.project_id
      where e.id = api_parameters.endpoint_id and p.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. api_request_bodies
-- ============================================================================
create table public.api_request_bodies (
  id uuid primary key default gen_random_uuid(),
  endpoint_id uuid not null unique references public.api_endpoints(id) on delete cascade,
  content_type text not null,
  description text check (description is null or char_length(description) <= 2000),
  schema_definition jsonb,
  example jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_api_request_bodies_updated_at on public.api_request_bodies;
create trigger set_api_request_bodies_updated_at
  before update on public.api_request_bodies
  for each row execute function public.set_updated_at();

alter table public.api_request_bodies enable row level security;

create policy api_request_bodies_select_owner on public.api_request_bodies
  for select using (
    exists (
      select 1 from public.api_endpoints e
      join public.projects p on p.id = e.project_id
      where e.id = api_request_bodies.endpoint_id and p.owner_id = auth.uid()
    )
  );
create policy api_request_bodies_insert_owner on public.api_request_bodies
  for insert with check (
    exists (
      select 1 from public.api_endpoints e
      join public.projects p on p.id = e.project_id
      where e.id = api_request_bodies.endpoint_id and p.owner_id = auth.uid()
    )
  );
create policy api_request_bodies_update_owner on public.api_request_bodies
  for update using (
    exists (
      select 1 from public.api_endpoints e
      join public.projects p on p.id = e.project_id
      where e.id = api_request_bodies.endpoint_id and p.owner_id = auth.uid()
    )
  );
create policy api_request_bodies_delete_owner on public.api_request_bodies
  for delete using (
    exists (
      select 1 from public.api_endpoints e
      join public.projects p on p.id = e.project_id
      where e.id = api_request_bodies.endpoint_id and p.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. api_responses
-- ============================================================================
create table public.api_responses (
  id uuid primary key default gen_random_uuid(),
  endpoint_id uuid not null references public.api_endpoints(id) on delete cascade,
  status_code integer not null check (status_code between 100 and 599),
  description text check (description is null or char_length(description) <= 2000),
  content_type text,
  schema_definition jsonb,
  example jsonb,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index api_responses_endpoint_id_idx on public.api_responses (endpoint_id);
create index api_responses_endpoint_id_status_idx on public.api_responses (endpoint_id, status_code);

drop trigger if exists set_api_responses_updated_at on public.api_responses;
create trigger set_api_responses_updated_at
  before update on public.api_responses
  for each row execute function public.set_updated_at();

alter table public.api_responses enable row level security;

create policy api_responses_select_owner on public.api_responses
  for select using (
    exists (
      select 1 from public.api_endpoints e
      join public.projects p on p.id = e.project_id
      where e.id = api_responses.endpoint_id and p.owner_id = auth.uid()
    )
  );
create policy api_responses_insert_owner on public.api_responses
  for insert with check (
    exists (
      select 1 from public.api_endpoints e
      join public.projects p on p.id = e.project_id
      where e.id = api_responses.endpoint_id and p.owner_id = auth.uid()
    )
  );
create policy api_responses_update_owner on public.api_responses
  for update using (
    exists (
      select 1 from public.api_endpoints e
      join public.projects p on p.id = e.project_id
      where e.id = api_responses.endpoint_id and p.owner_id = auth.uid()
    )
  );
create policy api_responses_delete_owner on public.api_responses
  for delete using (
    exists (
      select 1 from public.api_endpoints e
      join public.projects p on p.id = e.project_id
      where e.id = api_responses.endpoint_id and p.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. api_errors
-- ============================================================================
create table public.api_errors (
  id uuid primary key default gen_random_uuid(),
  endpoint_id uuid not null references public.api_endpoints(id) on delete cascade,
  code text not null check (char_length(code) between 1 and 100),
  message text not null check (char_length(message) between 1 and 500),
  description text check (description is null or char_length(description) <= 2000),
  http_status integer check (http_status is null or http_status between 100 and 599),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index api_errors_endpoint_id_idx on public.api_errors (endpoint_id);

drop trigger if exists set_api_errors_updated_at on public.api_errors;
create trigger set_api_errors_updated_at
  before update on public.api_errors
  for each row execute function public.set_updated_at();

alter table public.api_errors enable row level security;

create policy api_errors_select_owner on public.api_errors
  for select using (
    exists (
      select 1 from public.api_endpoints e
      join public.projects p on p.id = e.project_id
      where e.id = api_errors.endpoint_id and p.owner_id = auth.uid()
    )
  );
create policy api_errors_insert_owner on public.api_errors
  for insert with check (
    exists (
      select 1 from public.api_endpoints e
      join public.projects p on p.id = e.project_id
      where e.id = api_errors.endpoint_id and p.owner_id = auth.uid()
    )
  );
create policy api_errors_update_owner on public.api_errors
  for update using (
    exists (
      select 1 from public.api_endpoints e
      join public.projects p on p.id = e.project_id
      where e.id = api_errors.endpoint_id and p.owner_id = auth.uid()
    )
  );
create policy api_errors_delete_owner on public.api_errors
  for delete using (
    exists (
      select 1 from public.api_endpoints e
      join public.projects p on p.id = e.project_id
      where e.id = api_errors.endpoint_id and p.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. api_endpoint_entities — API ↔ Domain traceability
-- ============================================================================
create table public.api_endpoint_entities (
  id uuid primary key default gen_random_uuid(),
  endpoint_id uuid not null references public.api_endpoints(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  role text not null check (role in ('primary_resource','request_resource','response_resource','related_resource')),
  created_at timestamptz not null default now(),
  unique (endpoint_id, entity_id, role)
  -- Endpoint and entity must belong to the same project (via domains).
  -- Enforced in lib/api/endpoints/traceability-actions.ts (application
  -- layer); PostgreSQL CHECK cannot use a subquery.
);

create index api_endpoint_entities_endpoint_id_idx on public.api_endpoint_entities (endpoint_id);
create index api_endpoint_entities_entity_id_idx on public.api_endpoint_entities (entity_id);

alter table public.api_endpoint_entities enable row level security;

create policy api_endpoint_entities_select_owner on public.api_endpoint_entities
  for select using (
    exists (
      select 1 from public.api_endpoints e
      join public.projects p on p.id = e.project_id
      where e.id = api_endpoint_entities.endpoint_id and p.owner_id = auth.uid()
    )
  );
create policy api_endpoint_entities_insert_owner on public.api_endpoint_entities
  for insert with check (
    exists (
      select 1 from public.api_endpoints e
      join public.projects p on p.id = e.project_id
      where e.id = api_endpoint_entities.endpoint_id and p.owner_id = auth.uid()
    )
  );
create policy api_endpoint_entities_delete_owner on public.api_endpoint_entities
  for delete using (
    exists (
      select 1 from public.api_endpoints e
      join public.projects p on p.id = e.project_id
      where e.id = api_endpoint_entities.endpoint_id and p.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 8. api_endpoint_requirements — API ↔ Requirements traceability
-- ============================================================================
create table public.api_endpoint_requirements (
  id uuid primary key default gen_random_uuid(),
  endpoint_id uuid not null references public.api_endpoints(id) on delete cascade,
  requirement_id uuid not null references public.requirements(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (endpoint_id, requirement_id)
  -- Endpoint and requirement must belong to the same project.
  -- Enforced in lib/api/endpoints/traceability-actions.ts (application
  -- layer); PostgreSQL CHECK cannot use a subquery.
);

create index api_endpoint_requirements_endpoint_id_idx on public.api_endpoint_requirements (endpoint_id);
create index api_endpoint_requirements_requirement_id_idx on public.api_endpoint_requirements (requirement_id);

alter table public.api_endpoint_requirements enable row level security;

create policy api_endpoint_requirements_select_owner on public.api_endpoint_requirements
  for select using (
    exists (
      select 1 from public.api_endpoints e
      join public.projects p on p.id = e.project_id
      where e.id = api_endpoint_requirements.endpoint_id and p.owner_id = auth.uid()
    )
  );
create policy api_endpoint_requirements_insert_owner on public.api_endpoint_requirements
  for insert with check (
    exists (
      select 1 from public.api_endpoints e
      join public.projects p on p.id = e.project_id
      where e.id = api_endpoint_requirements.endpoint_id and p.owner_id = auth.uid()
    )
  );
create policy api_endpoint_requirements_delete_owner on public.api_endpoint_requirements
  for delete using (
    exists (
      select 1 from public.api_endpoints e
      join public.projects p on p.id = e.project_id
      where e.id = api_endpoint_requirements.endpoint_id and p.owner_id = auth.uid()
    )
  );
