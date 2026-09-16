-- Part 6: UI Design Foundation
-- Structured planning of the user's planned application UI.
-- Blueprint only — does NOT generate actual frontend code.

-- set_updated_at() function already exists from Part 1.

-- ============================================================================
-- 1. ui_screens
-- ============================================================================
create table public.ui_screens (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  route text check (route is null or char_length(route) <= 500),
  screen_type text not null check (screen_type in (
    'page','modal','drawer','dialog','wizard','dashboard','form',
    'list','detail','settings','authentication','error','other'
  )),
  description text check (description is null or char_length(description) <= 5000),
  purpose text check (purpose is null or char_length(purpose) <= 2000),
  authentication_required boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ui_screens_project_id_idx on public.ui_screens (project_id);
create index ui_screens_project_id_position_idx on public.ui_screens (project_id, position);

drop trigger if exists set_ui_screens_updated_at on public.ui_screens;
create trigger set_ui_screens_updated_at before update on public.ui_screens
  for each row execute function public.set_updated_at();

alter table public.ui_screens enable row level security;

create policy ui_screens_owner_all on public.ui_screens
  for all using (
    exists (select 1 from public.projects p where p.id = ui_screens.project_id and p.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.projects p where p.id = ui_screens.project_id and p.owner_id = auth.uid())
  );

-- ============================================================================
-- 2. ui_components
-- ============================================================================
create table public.ui_components (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  component_type text not null check (component_type in (
    'layout','navigation','header','footer','sidebar','card','table','list',
    'form','input','textarea','select','checkbox','radio','button','modal',
    'dialog','drawer','tabs','badge','alert','notification','chart','custom','other'
  )),
  description text check (description is null or char_length(description) <= 5000),
  purpose text check (purpose is null or char_length(purpose) <= 2000),
  technology text check (technology is null or char_length(technology) <= 200),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ui_components_project_id_idx on public.ui_components (project_id);
create index ui_components_project_id_position_idx on public.ui_components (project_id, position);
create index ui_components_component_type_idx on public.ui_components (component_type);

drop trigger if exists set_ui_components_updated_at on public.ui_components;
create trigger set_ui_components_updated_at before update on public.ui_components
  for each row execute function public.set_updated_at();

alter table public.ui_components enable row level security;

create policy ui_components_owner_all on public.ui_components
  for all using (
    exists (select 1 from public.projects p where p.id = ui_components.project_id and p.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.projects p where p.id = ui_components.project_id and p.owner_id = auth.uid())
  );

-- ============================================================================
-- 3. ui_screen_components
-- ============================================================================
create table public.ui_screen_components (
  id uuid primary key default gen_random_uuid(),
  screen_id uuid not null references public.ui_screens(id) on delete cascade,
  component_id uuid not null references public.ui_components(id) on delete cascade,
  parent_id uuid references public.ui_screen_components(id) on delete cascade,
  label text check (label is null or char_length(label) <= 200),
  description text check (description is null or char_length(description) <= 5000),
  position integer not null default 0,
  required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- prevent self-parent
  check (parent_id is null or parent_id <> id)
);

create index ui_screen_components_screen_id_idx on public.ui_screen_components (screen_id);
create index ui_screen_components_component_id_idx on public.ui_screen_components (component_id);
create index ui_screen_components_parent_id_idx on public.ui_screen_components (parent_id);
create index ui_screen_components_screen_id_position_idx on public.ui_screen_components (screen_id, position);

drop trigger if exists set_ui_screen_components_updated_at on public.ui_screen_components;
create trigger set_ui_screen_components_updated_at before update on public.ui_screen_components
  for each row execute function public.set_updated_at();

alter table public.ui_screen_components enable row level security;

create policy ui_screen_components_owner_all on public.ui_screen_components
  for all using (
    exists (
      select 1 from public.ui_screens s
      join public.projects p on p.id = s.project_id
      where s.id = ui_screen_components.screen_id and p.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.ui_screens s
      join public.projects p on p.id = s.project_id
      where s.id = ui_screen_components.screen_id and p.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. ui_forms
-- ============================================================================
create table public.ui_forms (
  id uuid primary key default gen_random_uuid(),
  screen_id uuid not null references public.ui_screens(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  description text check (description is null or char_length(description) <= 5000),
  submit_label text check (submit_label is null or char_length(submit_label) <= 100),
  success_behavior text check (success_behavior is null or char_length(success_behavior) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ui_forms_screen_id_idx on public.ui_forms (screen_id);

drop trigger if exists set_ui_forms_updated_at on public.ui_forms;
create trigger set_ui_forms_updated_at before update on public.ui_forms
  for each row execute function public.set_updated_at();

alter table public.ui_forms enable row level security;

create policy ui_forms_owner_all on public.ui_forms
  for all using (
    exists (
      select 1 from public.ui_screens s
      join public.projects p on p.id = s.project_id
      where s.id = ui_forms.screen_id and p.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.ui_screens s
      join public.projects p on p.id = s.project_id
      where s.id = ui_forms.screen_id and p.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. ui_form_fields
-- ============================================================================
create table public.ui_form_fields (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.ui_forms(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  label text not null check (char_length(label) between 1 and 200),
  field_type text not null check (field_type in (
    'text','textarea','email','password','number','date','datetime',
    'select','checkbox','radio','file','hidden','other'
  )),
  required boolean not null default false,
  placeholder text check (placeholder is null or char_length(placeholder) <= 500),
  help_text text check (help_text is null or char_length(help_text) <= 2000),
  default_value text check (default_value is null or char_length(default_value) <= 2000),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ui_form_fields_form_id_idx on public.ui_form_fields (form_id);
create index ui_form_fields_form_id_position_idx on public.ui_form_fields (form_id, position);

drop trigger if exists set_ui_form_fields_updated_at on public.ui_form_fields;
create trigger set_ui_form_fields_updated_at before update on public.ui_form_fields
  for each row execute function public.set_updated_at();

alter table public.ui_form_fields enable row level security;

create policy ui_form_fields_owner_all on public.ui_form_fields
  for all using (
    exists (
      select 1 from public.ui_forms f
      join public.ui_screens s on s.id = f.screen_id
      join public.projects p on p.id = s.project_id
      where f.id = ui_form_fields.form_id and p.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.ui_forms f
      join public.ui_screens s on s.id = f.screen_id
      join public.projects p on p.id = s.project_id
      where f.id = ui_form_fields.form_id and p.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. ui_states
-- ============================================================================
create table public.ui_states (
  id uuid primary key default gen_random_uuid(),
  screen_id uuid not null references public.ui_screens(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  state_type text not null check (state_type in (
    'default','loading','empty','success','error','disabled',
    'unauthorized','forbidden','not_found','validation_error','offline','custom'
  )),
  description text check (description is null or char_length(description) <= 3000),
  behavior text check (behavior is null or char_length(behavior) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ui_states_screen_id_idx on public.ui_states (screen_id);
create index ui_states_state_type_idx on public.ui_states (state_type);

drop trigger if exists set_ui_states_updated_at on public.ui_states;
create trigger set_ui_states_updated_at before update on public.ui_states
  for each row execute function public.set_updated_at();

alter table public.ui_states enable row level security;

create policy ui_states_owner_all on public.ui_states
  for all using (
    exists (
      select 1 from public.ui_screens s
      join public.projects p on p.id = s.project_id
      where s.id = ui_states.screen_id and p.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.ui_screens s
      join public.projects p on p.id = s.project_id
      where s.id = ui_states.screen_id and p.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. ui_interactions
-- ============================================================================
create table public.ui_interactions (
  id uuid primary key default gen_random_uuid(),
  screen_id uuid not null references public.ui_screens(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  trigger text not null check (char_length(trigger) between 1 and 500),
  action text not null check (char_length(action) between 1 and 2000),
  description text check (description is null or char_length(description) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ui_interactions_screen_id_idx on public.ui_interactions (screen_id);

drop trigger if exists set_ui_interactions_updated_at on public.ui_interactions;
create trigger set_ui_interactions_updated_at before update on public.ui_interactions
  for each row execute function public.set_updated_at();

alter table public.ui_interactions enable row level security;

create policy ui_interactions_owner_all on public.ui_interactions
  for all using (
    exists (
      select 1 from public.ui_screens s
      join public.projects p on p.id = s.project_id
      where s.id = ui_interactions.screen_id and p.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.ui_screens s
      join public.projects p on p.id = s.project_id
      where s.id = ui_interactions.screen_id and p.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 8. ui_interaction_endpoints — UI ↔ API traceability
-- ============================================================================
create table public.ui_interaction_endpoints (
  id uuid primary key default gen_random_uuid(),
  interaction_id uuid not null references public.ui_interactions(id) on delete cascade,
  endpoint_id uuid not null references public.api_endpoints(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (interaction_id, endpoint_id)
);

create index ui_interaction_endpoints_interaction_id_idx on public.ui_interaction_endpoints (interaction_id);
create index ui_interaction_endpoints_endpoint_id_idx on public.ui_interaction_endpoints (endpoint_id);

alter table public.ui_interaction_endpoints enable row level security;

create policy ui_interaction_endpoints_owner_all on public.ui_interaction_endpoints
  for all using (
    exists (
      select 1 from public.ui_interactions i
      join public.ui_screens s on s.id = i.screen_id
      join public.projects p on p.id = s.project_id
      where i.id = ui_interaction_endpoints.interaction_id and p.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.ui_interactions i
      join public.ui_screens s on s.id = i.screen_id
      join public.projects p on p.id = s.project_id
      where i.id = ui_interaction_endpoints.interaction_id and p.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 9. ui_screen_requirements — UI ↔ Requirements traceability
-- ============================================================================
create table public.ui_screen_requirements (
  id uuid primary key default gen_random_uuid(),
  screen_id uuid not null references public.ui_screens(id) on delete cascade,
  requirement_id uuid not null references public.requirements(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (screen_id, requirement_id)
);

create index ui_screen_requirements_screen_id_idx on public.ui_screen_requirements (screen_id);
create index ui_screen_requirements_requirement_id_idx on public.ui_screen_requirements (requirement_id);

alter table public.ui_screen_requirements enable row level security;

create policy ui_screen_requirements_owner_all on public.ui_screen_requirements
  for all using (
    exists (
      select 1 from public.ui_screens s
      join public.projects p on p.id = s.project_id
      where s.id = ui_screen_requirements.screen_id and p.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.ui_screens s
      join public.projects p on p.id = s.project_id
      where s.id = ui_screen_requirements.screen_id and p.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 10. ui_screen_entities — UI ↔ Domain traceability
-- ============================================================================
create table public.ui_screen_entities (
  id uuid primary key default gen_random_uuid(),
  screen_id uuid not null references public.ui_screens(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  role text not null check (role in ('displayed','created','edited','deleted','filtered','selected','related')),
  created_at timestamptz not null default now(),
  unique (screen_id, entity_id, role)
);

create index ui_screen_entities_screen_id_idx on public.ui_screen_entities (screen_id);
create index ui_screen_entities_entity_id_idx on public.ui_screen_entities (entity_id);

alter table public.ui_screen_entities enable row level security;

create policy ui_screen_entities_owner_all on public.ui_screen_entities
  for all using (
    exists (
      select 1 from public.ui_screens s
      join public.projects p on p.id = s.project_id
      where s.id = ui_screen_entities.screen_id and p.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.ui_screens s
      join public.projects p on p.id = s.project_id
      where s.id = ui_screen_entities.screen_id and p.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 11. ui_navigation_items
-- ============================================================================
create table public.ui_navigation_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  label text not null check (char_length(label) between 1 and 200),
  route text check (route is null or char_length(route) <= 500),
  parent_id uuid references public.ui_navigation_items(id) on delete cascade,
  position integer not null default 0,
  description text check (description is null or char_length(description) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (parent_id is null or parent_id <> id)
);

create index ui_navigation_items_project_id_idx on public.ui_navigation_items (project_id);
create index ui_navigation_items_project_id_position_idx on public.ui_navigation_items (project_id, position);
create index ui_navigation_items_parent_id_idx on public.ui_navigation_items (parent_id);

drop trigger if exists set_ui_navigation_items_updated_at on public.ui_navigation_items;
create trigger set_ui_navigation_items_updated_at before update on public.ui_navigation_items
  for each row execute function public.set_updated_at();

alter table public.ui_navigation_items enable row level security;

create policy ui_navigation_items_owner_all on public.ui_navigation_items
  for all using (
    exists (select 1 from public.projects p where p.id = ui_navigation_items.project_id and p.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.projects p where p.id = ui_navigation_items.project_id and p.owner_id = auth.uid())
  );

-- ============================================================================
-- 12. ui_navigation_screens
-- ============================================================================
create table public.ui_navigation_screens (
  id uuid primary key default gen_random_uuid(),
  navigation_item_id uuid not null references public.ui_navigation_items(id) on delete cascade,
  screen_id uuid not null references public.ui_screens(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (navigation_item_id, screen_id)
);

create index ui_navigation_screens_navigation_item_id_idx on public.ui_navigation_screens (navigation_item_id);
create index ui_navigation_screens_screen_id_idx on public.ui_navigation_screens (screen_id);

alter table public.ui_navigation_screens enable row level security;

create policy ui_navigation_screens_owner_all on public.ui_navigation_screens
  for all using (
    exists (
      select 1 from public.ui_navigation_items n
      join public.projects p on p.id = n.project_id
      where n.id = ui_navigation_screens.navigation_item_id and p.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.ui_navigation_items n
      join public.projects p on p.id = n.project_id
      where n.id = ui_navigation_screens.navigation_item_id and p.owner_id = auth.uid()
    )
  );
