-- One round-trip for the project overview page.
--
-- The overview previously ran ~20 separate count queries plus a full
-- loadProjectBundle() (every artifact table, select *) just to render the
-- workflow counters and the completeness score. This function returns both in a
-- single call: `counts` for the stage cards and `health` for the checks in
-- lib/projects/health.ts.
--
-- security invoker keeps RLS in force: a project the caller cannot read simply
-- yields zero counts and empty arrays.

create or replace function public.get_project_overview(p_project_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select jsonb_build_object(
    'counts', jsonb_build_object(
      'requirements', (select count(*) from requirements where project_id = p_project_id),
      'decisions', (select count(*) from decisions where project_id = p_project_id),
      'domains', (select count(*) from domains where project_id = p_project_id),
      'entities', (
        select count(*)
        from entities e
        join domains d on d.id = e.domain_id
        where d.project_id = p_project_id
      ),
      'relationships', (select count(*) from entity_relationships where project_id = p_project_id),
      'architectureComponents', (
        select count(*) from architecture_components where project_id = p_project_id
      ),
      'architectureTechnologies', (
        select count(*) from architecture_technologies where project_id = p_project_id
      ),
      'architectureDecisions', (
        select count(*) from architecture_decisions where project_id = p_project_id
      ),
      'architectureDependencies', (
        select count(*)
        from architecture_component_dependencies
        where project_id = p_project_id
      ),
      'apiGroups', (select count(*) from api_groups where project_id = p_project_id),
      'apiEndpoints', (select count(*) from api_endpoints where project_id = p_project_id),
      'uiScreens', (select count(*) from ui_screens where project_id = p_project_id),
      'uiComponents', (select count(*) from ui_components where project_id = p_project_id),
      'tasks', (
        select jsonb_build_object(
          'total', count(*),
          'todo', count(*) filter (where status = 'todo'),
          'ready', count(*) filter (where status = 'ready'),
          'in_progress', count(*) filter (where status = 'in_progress'),
          'blocked', count(*) filter (where status = 'blocked'),
          'review', count(*) filter (where status = 'review'),
          'done', count(*) filter (where status = 'done'),
          'cancelled', count(*) filter (where status = 'cancelled')
        )
        from tasks
        where project_id = p_project_id
      )
    ),
    'health', jsonb_build_object(
      'requirements', coalesce((
        select jsonb_agg(jsonb_build_object('id', id, 'type', type, 'description', description))
        from requirements
        where project_id = p_project_id
      ), '[]'::jsonb),
      'decisions', coalesce((
        select jsonb_agg(jsonb_build_object('id', id, 'status', status))
        from decisions
        where project_id = p_project_id
      ), '[]'::jsonb),
      'domains', coalesce((
        select jsonb_agg(jsonb_build_object('id', id))
        from domains
        where project_id = p_project_id
      ), '[]'::jsonb),
      'entities', coalesce((
        select jsonb_agg(jsonb_build_object('id', e.id))
        from entities e
        join domains d on d.id = e.domain_id
        where d.project_id = p_project_id
      ), '[]'::jsonb),
      'attributes', coalesce((
        select jsonb_agg(jsonb_build_object('entity_id', a.entity_id, 'is_primary_key', a.is_primary_key))
        from entity_attributes a
        join entities e on e.id = a.entity_id
        join domains d on d.id = e.domain_id
        where d.project_id = p_project_id
      ), '[]'::jsonb),
      'relationships', coalesce((
        select jsonb_agg(jsonb_build_object('id', id))
        from entity_relationships
        where project_id = p_project_id
      ), '[]'::jsonb),
      'architecture', jsonb_build_object(
        'components', coalesce((
          select jsonb_agg(jsonb_build_object('id', id))
          from architecture_components
          where project_id = p_project_id
        ), '[]'::jsonb),
        'technologies', coalesce((
          select jsonb_agg(jsonb_build_object('id', id))
          from architecture_technologies
          where project_id = p_project_id
        ), '[]'::jsonb),
        'dependencies', coalesce((
          select jsonb_agg(jsonb_build_object('id', id))
          from architecture_component_dependencies
          where project_id = p_project_id
        ), '[]'::jsonb)
      ),
      'api', jsonb_build_object(
        'endpoints', coalesce((
          select jsonb_agg(jsonb_build_object('id', id, 'group_id', group_id))
          from api_endpoints
          where project_id = p_project_id
        ), '[]'::jsonb),
        'responses', coalesce((
          select jsonb_agg(jsonb_build_object('endpoint_id', r.endpoint_id))
          from api_responses r
          join api_endpoints e on e.id = r.endpoint_id
          where e.project_id = p_project_id
        ), '[]'::jsonb)
      ),
      'ui', jsonb_build_object(
        'screens', coalesce((
          select jsonb_agg(jsonb_build_object('id', id))
          from ui_screens
          where project_id = p_project_id
        ), '[]'::jsonb),
        'screenComponents', coalesce((
          select jsonb_agg(jsonb_build_object('screen_id', sc.screen_id))
          from ui_screen_components sc
          join ui_screens s on s.id = sc.screen_id
          where s.project_id = p_project_id
        ), '[]'::jsonb),
        'interactions', coalesce((
          select jsonb_agg(jsonb_build_object('screen_id', i.screen_id))
          from ui_interactions i
          join ui_screens s on s.id = i.screen_id
          where s.project_id = p_project_id
        ), '[]'::jsonb)
      ),
      'tasks', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', id,
          'acceptance_criteria', acceptance_criteria,
          'estimated_effort', estimated_effort
        ))
        from tasks
        where project_id = p_project_id
      ), '[]'::jsonb),
      'taskLinks', jsonb_build_object(
        'requirements', coalesce((
          select jsonb_agg(jsonb_build_object('id', tr.id))
          from task_requirements tr
          join tasks t on t.id = tr.task_id
          where t.project_id = p_project_id
        ), '[]'::jsonb)
      )
    )
  );
$$;

grant execute on function public.get_project_overview(uuid) to authenticated;
