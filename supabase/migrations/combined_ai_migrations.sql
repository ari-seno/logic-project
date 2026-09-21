-- Combined AI assist migrations. Run once in Supabase SQL Editor.
-- Generated 2026-09-17T21:46:43Z
-- Fixed: projects.user_id -> projects.owner_id in RLS policies

-- ===== BEGIN 20250917_part8_user_ai_credentials.sql =====
-- =============================================================================
-- Part 8: User-scoped AI credentials
-- Adds: public.user_ai_credentials
-- One row per (user, label). The API key is stored encrypted (lib/ai/crypto.ts
-- uses AES-256-GCM with the SETTINGS_ENC_KEY env var as the master key).
-- There is intentionally NO `is_default` column and NO partial unique index:
-- the project picks its own credential on the project row itself.
-- =============================================================================

create table public.user_ai_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  provider text not null default 'ollama',
  base_url text not null,
  api_key_encrypted text not null,
  model text not null,
  enabled boolean not null default true,
  last_tested_at timestamp with time zone,
  last_test_status text,
  last_test_message text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint user_ai_credentials_label_length check (
    char_length(label) between 1 and 80
  ),
  constraint user_ai_credentials_label_unique unique (user_id, label)
);

create index user_ai_credentials_user_id_idx
  on public.user_ai_credentials (user_id);

drop trigger if exists set_user_ai_credentials_updated_at
  on public.user_ai_credentials;
create trigger set_user_ai_credentials_updated_at
  before update on public.user_ai_credentials
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: only the owner can read/write their credentials.
-- The encrypted API key never leaves this policy boundary — no other user,
-- including service role, can read it via RLS bypass unless the policy is
-- explicitly widened (none of our views do that).
-- ---------------------------------------------------------------------------
alter table public.user_ai_credentials enable row level security;

drop policy if exists user_ai_credentials_owner_select on public.user_ai_credentials;
create policy user_ai_credentials_owner_select on public.user_ai_credentials
  for select using (auth.uid() = user_id);

drop policy if exists user_ai_credentials_owner_insert on public.user_ai_credentials;
create policy user_ai_credentials_owner_insert on public.user_ai_credentials
  for insert with check (auth.uid() = user_id);

drop policy if exists user_ai_credentials_owner_update on public.user_ai_credentials;
create policy user_ai_credentials_owner_update on public.user_ai_credentials
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists user_ai_credentials_owner_delete on public.user_ai_credentials;
create policy user_ai_credentials_owner_delete on public.user_ai_credentials
  for delete using (auth.uid() = user_id);
-- ===== END 20250917_part8_user_ai_credentials.sql =====

-- ===== BEGIN 20250917_part9_project_ai_credential.sql =====
-- =============================================================================
-- Part 9: Project-scoped AI credential pointer
-- Adds: public.projects.ai_credential_id
-- One project points to exactly one of the owner's credentials (or none).
-- ON DELETE SET NULL so removing a credential never destroys the project.
-- =============================================================================

alter table public.projects
  add column if not exists ai_credential_id uuid
  references public.user_ai_credentials(id) on delete set null;

create index if not exists projects_ai_credential_idx
  on public.projects (ai_credential_id);
-- ===== END 20250917_part9_project_ai_credential.sql =====

-- ===== BEGIN 20250917_part10_ai_audit.sql =====
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
-- ===== END 20250917_part10_ai_audit.sql =====

