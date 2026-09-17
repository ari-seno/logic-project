-- =============================================================================
-- Part 11: INSERT policies for AI audit tables
-- Original part10 only created SELECT + UPDATE policies. INSERTs from the
-- AI suggest action were silently rejected by RLS, surfacing as a generic
-- 'new row violates row-level security policy' error in the UI.
-- =============================================================================

drop policy if exists ai_usage_owner_insert on public.ai_usage;
create policy ai_usage_owner_insert on public.ai_usage
  for insert with check (
    exists (
      select 1 from public.projects p
      where p.id = ai_usage.project_id and p.owner_id = auth.uid()
    )
    or auth.uid() = ai_usage.user_id
  );

drop policy if exists ai_suggestions_owner_insert on public.ai_suggestions;
create policy ai_suggestions_owner_insert on public.ai_suggestions
  for insert with check (
    exists (
      select 1 from public.projects p
      where p.id = ai_suggestions.project_id and p.owner_id = auth.uid()
    )
  );
