-- =============================================================================
-- Part 3: Domain & ERD Foundation
-- Adds: domains, entities, entity_attributes, entity_relationships
-- All RLS-gated through parent ownership.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- domains
-- ---------------------------------------------------------------------------
create table public.domains (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint domains_name_length check (
    char_length(name) between 1 and 200
  ),
  constraint domains_description_length check (
    description is null or char_length(description) <= 5000
  ),
  constraint domains_name_unique_per_project unique (project_id, name)
);

create index domains_project_id_idx on public.domains (project_id);
create index domains_updated_at_idx on public.domains (updated_at desc);

drop trigger if exists set_domains_updated_at on public.domains;
create trigger set_domains_updated_at
  before update on public.domains
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- entities
-- ---------------------------------------------------------------------------
create table public.entities (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.domains(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entities_name_length check (
    char_length(name) between 1 and 200
  ),
  constraint entities_description_length check (
    description is null or char_length(description) <= 5000
  ),
  constraint entities_name_unique_per_domain unique (domain_id, name)
);

create index entities_domain_id_idx on public.entities (domain_id);
create index entities_updated_at_idx on public.entities (updated_at desc);

drop trigger if exists set_entities_updated_at on public.entities;
create trigger set_entities_updated_at
  before update on public.entities
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- entity_attributes
-- ---------------------------------------------------------------------------
create table public.entity_attributes (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  name text not null,
  data_type text not null,
  is_required boolean not null default false,
  is_primary_key boolean not null default false,
  default_value text,
  description text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entity_attributes_name_length check (
    char_length(name) between 1 and 200
  ),
  constraint entity_attributes_data_type check (
    data_type in (
      'uuid', 'string', 'text', 'integer', 'decimal',
      'boolean', 'date', 'datetime', 'json'
    )
  ),
  constraint entity_attributes_default_value_length check (
    default_value is null or char_length(default_value) <= 500
  ),
  constraint entity_attributes_description_length check (
    description is null or char_length(description) <= 5000
  ),
  constraint entity_attributes_name_unique_per_entity unique (entity_id, name)
);

create index entity_attributes_entity_id_idx on public.entity_attributes (entity_id);
create index entity_attributes_entity_position_idx
  on public.entity_attributes (entity_id, position);

drop trigger if exists set_entity_attributes_updated_at on public.entity_attributes;
create trigger set_entity_attributes_updated_at
  before update on public.entity_attributes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- entity_relationships
-- ---------------------------------------------------------------------------
create table public.entity_relationships (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source_entity_id uuid not null references public.entities(id) on delete cascade,
  target_entity_id uuid not null references public.entities(id) on delete cascade,
  relationship_type text not null,
  name text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entity_relationships_type check (
    relationship_type in (
      'one_to_one', 'one_to_many', 'many_to_one', 'many_to_many'
    )
  ),
  constraint entity_relationships_not_self check (
    source_entity_id <> target_entity_id
  ),
  constraint entity_relationships_name_length check (
    name is null or char_length(name) <= 200
  ),
  constraint entity_relationships_description_length check (
    description is null or char_length(description) <= 5000
  )
);

create index entity_relationships_project_id_idx
  on public.entity_relationships (project_id);
create index entity_relationships_source_idx
  on public.entity_relationships (source_entity_id);
create index entity_relationships_target_idx
  on public.entity_relationships (target_entity_id);

drop trigger if exists set_entity_relationships_updated_at on public.entity_relationships;
create trigger set_entity_relationships_updated_at
  before update on public.entity_relationships
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Cross-project relationship enforcement
-- A relationship must connect two entities whose domain belongs to the same
-- project as entity_relationships.project_id.
-- ---------------------------------------------------------------------------
create or replace function public.entity_relationships_share_project()
returns trigger
language plpgsql
as $$
declare
  source_project uuid;
  target_project uuid;
begin
  select d.project_id into source_project
    from public.entities e
    join public.domains d on d.id = e.domain_id
    where e.id = new.source_entity_id;

  select d.project_id into target_project
    from public.entities e
    join public.domains d on d.id = e.domain_id
    where e.id = new.target_entity_id;

  if source_project is null or target_project is null then
    raise exception 'Source or target entity does not exist';
  end if;

  if source_project <> new.project_id or target_project <> new.project_id then
    raise exception 'Relationship entities must belong to the same project as the relationship';
  end if;

  return new;
end;
$$;

drop trigger if exists entity_relationships_share_project on public.entity_relationships;
create trigger entity_relationships_share_project
  before insert or update on public.entity_relationships
  for each row execute function public.entity_relationships_share_project();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.domains enable row level security;
alter table public.entities enable row level security;
alter table public.entity_attributes enable row level security;
alter table public.entity_relationships enable row level security;

-- domains -------------------------------------------------------------------
create policy domains_select_owner on public.domains
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = domains.project_id and p.owner_id = auth.uid()
    )
  );

create policy domains_insert_owner on public.domains
  for insert with check (
    exists (
      select 1 from public.projects p
      where p.id = domains.project_id and p.owner_id = auth.uid()
    )
  );

create policy domains_update_owner on public.domains
  for update using (
    exists (
      select 1 from public.projects p
      where p.id = domains.project_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = domains.project_id and p.owner_id = auth.uid()
    )
  );

create policy domains_delete_owner on public.domains
  for delete using (
    exists (
      select 1 from public.projects p
      where p.id = domains.project_id and p.owner_id = auth.uid()
    )
  );

-- entities ------------------------------------------------------------------
create policy entities_select_owner on public.entities
  for select using (
    exists (
      select 1
      from public.domains d
      join public.projects p on p.id = d.project_id
      where d.id = entities.domain_id and p.owner_id = auth.uid()
    )
  );

create policy entities_insert_owner on public.entities
  for insert with check (
    exists (
      select 1
      from public.domains d
      join public.projects p on p.id = d.project_id
      where d.id = entities.domain_id and p.owner_id = auth.uid()
    )
  );

create policy entities_update_owner on public.entities
  for update using (
    exists (
      select 1
      from public.domains d
      join public.projects p on p.id = d.project_id
      where d.id = entities.domain_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.domains d
      join public.projects p on p.id = d.project_id
      where d.id = entities.domain_id and p.owner_id = auth.uid()
    )
  );

create policy entities_delete_owner on public.entities
  for delete using (
    exists (
      select 1
      from public.domains d
      join public.projects p on p.id = d.project_id
      where d.id = entities.domain_id and p.owner_id = auth.uid()
    )
  );

-- entity_attributes ---------------------------------------------------------
create policy entity_attributes_select_owner on public.entity_attributes
  for select using (
    exists (
      select 1
      from public.entities e
      join public.domains d on d.id = e.domain_id
      join public.projects p on p.id = d.project_id
      where e.id = entity_attributes.entity_id and p.owner_id = auth.uid()
    )
  );

create policy entity_attributes_insert_owner on public.entity_attributes
  for insert with check (
    exists (
      select 1
      from public.entities e
      join public.domains d on d.id = e.domain_id
      join public.projects p on p.id = d.project_id
      where e.id = entity_attributes.entity_id and p.owner_id = auth.uid()
    )
  );

create policy entity_attributes_update_owner on public.entity_attributes
  for update using (
    exists (
      select 1
      from public.entities e
      join public.domains d on d.id = e.domain_id
      join public.projects p on p.id = d.project_id
      where e.id = entity_attributes.entity_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.entities e
      join public.domains d on d.id = e.domain_id
      join public.projects p on p.id = d.project_id
      where e.id = entity_attributes.entity_id and p.owner_id = auth.uid()
    )
  );

create policy entity_attributes_delete_owner on public.entity_attributes
  for delete using (
    exists (
      select 1
      from public.entities e
      join public.domains d on d.id = e.domain_id
      join public.projects p on p.id = d.project_id
      where e.id = entity_attributes.entity_id and p.owner_id = auth.uid()
    )
  );

-- entity_relationships ------------------------------------------------------
create policy entity_relationships_select_owner on public.entity_relationships
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = entity_relationships.project_id and p.owner_id = auth.uid()
    )
  );

create policy entity_relationships_insert_owner on public.entity_relationships
  for insert with check (
    exists (
      select 1 from public.projects p
      where p.id = entity_relationships.project_id and p.owner_id = auth.uid()
    )
  );

create policy entity_relationships_update_owner on public.entity_relationships
  for update using (
    exists (
      select 1 from public.projects p
      where p.id = entity_relationships.project_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = entity_relationships.project_id and p.owner_id = auth.uid()
    )
  );

create policy entity_relationships_delete_owner on public.entity_relationships
  for delete using (
    exists (
      select 1 from public.projects p
      where p.id = entity_relationships.project_id and p.owner_id = auth.uid()
    )
  );
