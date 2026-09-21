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
