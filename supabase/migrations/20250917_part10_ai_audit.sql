-- =============================================================================
-- Part 10: AI usage + suggestion audit tables
-- Adds: public.ai_usage (token meter) + public.ai_suggestions (review/apply)
-- Both are RLS-gated through project ownership.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ai_usage
-- One row per provider call (prompt, completion, duration). The row is
-- written even when validation/parsing fails so we can see what the model
-- produced and tune prompts.
-- ---------------------------------------------------------------------------
create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  provider text not null,
  model text not null,
  stage text not null,
  prompt_tokens integer,
  completion_tokens integer,
  duration_ms integer,
  ok boolean not null default true,
  error_code text,
  error_message text,
  created_at timestamp with time zone not null default now()
);

create index ai_usage_user_id_created_at_idx
  on public.ai_usage (user_id, created_at desc);

create index ai_usage_project_id_created_at_idx
  on public.ai_usage (project_id, created_at desc);

alter table public.ai_usage enable row level security;

drop policy if exists ai_usage_owner_select on public.ai_usage;
create policy ai_usage_owner_select on public.ai_usage
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = ai_usage.project_id and p.owner_id = auth.uid()
    )
    or auth.uid() = ai_usage.user_id
  );

drop policy if exists ai_usage_owner_insert on public.ai_usage;
create policy ai_usage_owner_insert on public.ai_usage
  for insert with check (
    exists (
      select 1 from public.projects p
      where p.id = ai_usage.project_id and p.owner_id = auth.uid()
    )
    or auth.uid() = ai_usage.user_id
  );

-- ---------------------------------------------------------------------------
-- ai_suggestions
-- One row per generated set of suggested requirements (or other artefacts in
-- later stages). The `payload` is the full structured output; `status`
-- describes the lifecycle (pending / applied / rejected).
-- ---------------------------------------------------------------------------
create table public.ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  stage text not null,
  provider text not null,
  model text not null,
  prompt_user text not null,
  payload jsonb not null,
  status text not null default 'pending',
  applied_indices integer[] not null default '{}',
  applied_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  constraint ai_suggestions_status_check check (
    status in ('pending', 'applied', 'rejected')
  )
);

create index ai_suggestions_user_id_created_at_idx
  on public.ai_suggestions (user_id, created_at desc);

create index ai_suggestions_project_id_stage_idx
  on public.ai_suggestions (project_id, stage, created_at desc);

alter table public.ai_suggestions enable row level security;

drop policy if exists ai_suggestions_owner_select on public.ai_suggestions;
create policy ai_suggestions_owner_select on public.ai_suggestions
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = ai_suggestions.project_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists ai_suggestions_owner_insert on public.ai_suggestions;
create policy ai_suggestions_owner_insert on public.ai_suggestions
  for insert with check (
    exists (
      select 1 from public.projects p
      where p.id = ai_suggestions.project_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists ai_suggestions_owner_update on public.ai_suggestions;
create policy ai_suggestions_owner_update on public.ai_suggestions
  for update using (
    exists (
      select 1 from public.projects p
      where p.id = ai_suggestions.project_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = ai_suggestions.project_id and p.owner_id = auth.uid()
    )
  );
