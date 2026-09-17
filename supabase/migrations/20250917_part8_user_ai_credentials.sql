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
