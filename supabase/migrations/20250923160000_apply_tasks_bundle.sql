-- Transactional apply for the tasks AI stage.
--
-- Mirrors the pattern of apply_erd_bundle / apply_architecture_bundle:
-- the whole bundle lands in one transaction or not at all. Tasks are inserted
-- first (so in-batch parent/dependency titles resolve), then parent links,
-- dependencies, and the six traceability link tables.

create or replace function public.apply_tasks_bundle(
  p_project_id uuid,
  p_tasks jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_created jsonb := '[]'::jsonb;
  v_skipped jsonb := '[]'::jsonb;
  v_task jsonb;
  v_dep jsonb;
  v_link jsonb;
  v_index int;
  v_task_id uuid;
  v_target_id uuid;
  v_parent_id uuid;
  v_position int;
  v_key text;
  v_label text;
  v_exists boolean;
  v_task_ids jsonb := '{}'::jsonb;
  v_dep_keys jsonb := '[]'::jsonb;
  v_requirement_ids jsonb := '{}'::jsonb;
  v_decision_ids jsonb := '{}'::jsonb;
  v_entity_ids jsonb := '{}'::jsonb;
  v_component_ids jsonb := '{}'::jsonb;
  v_endpoint_ids jsonb := '{}'::jsonb;
  v_screen_ids jsonb := '{}'::jsonb;
begin
  -- Seed lookup maps from existing project rows.
  for v_task_id, v_key in
    select id, lower(title) from public.tasks where project_id = p_project_id
  loop
    if not v_task_ids ? v_key then
      v_task_ids := jsonb_set(v_task_ids, array[v_key], to_jsonb(v_task_id::text), true);
    end if;
  end loop;

  select coalesce(max(position) + 1, 0) into v_position
  from public.tasks where project_id = p_project_id;

  select coalesce(jsonb_agg(to_jsonb(d.task_id::text || '|' || d.depends_on_task_id::text)), '[]'::jsonb)
  into v_dep_keys
  from public.task_dependencies d
  where d.project_id = p_project_id;

  for v_target_id, v_key in
    select id, lower(title) from public.requirements where project_id = p_project_id
  loop
    v_requirement_ids := jsonb_set(v_requirement_ids, array[v_key], to_jsonb(v_target_id::text), true);
  end loop;

  for v_target_id, v_key in
    select id, lower(title) from public.decisions where project_id = p_project_id
  loop
    v_decision_ids := jsonb_set(v_decision_ids, array[v_key], to_jsonb(v_target_id::text), true);
  end loop;

  for v_target_id, v_key in
    select e.id, lower(e.name)
    from public.entities e
    join public.domains d on d.id = e.domain_id
    where d.project_id = p_project_id
  loop
    if not v_entity_ids ? v_key then
      v_entity_ids := jsonb_set(v_entity_ids, array[v_key], to_jsonb(v_target_id::text), true);
    end if;
  end loop;

  for v_target_id, v_key in
    select id, lower(name) from public.architecture_components where project_id = p_project_id
  loop
    v_component_ids := jsonb_set(v_component_ids, array[v_key], to_jsonb(v_target_id::text), true);
  end loop;

  for v_target_id, v_key in
    select id, lower(method || ' ' || path) from public.api_endpoints where project_id = p_project_id
  loop
    v_endpoint_ids := jsonb_set(v_endpoint_ids, array[v_key], to_jsonb(v_target_id::text), true);
  end loop;

  for v_target_id, v_key in
    select id, lower(name) from public.ui_screens where project_id = p_project_id
  loop
    v_screen_ids := jsonb_set(v_screen_ids, array[v_key], to_jsonb(v_target_id::text), true);
  end loop;

  -- Phase 1: insert every new task, recording its id under its lowercased title.
  for v_task in select * from jsonb_array_elements(p_tasks)
  loop
    v_index := (v_task->>'index')::int;
    v_key := lower(v_task->>'title');

    if v_task_ids ? v_key then
      v_skipped := v_skipped || jsonb_build_object(
        'index', v_index, 'title', v_task->>'title', 'reason', 'duplicate'
      );
      continue;
    end if;

    insert into public.tasks (
      project_id, title, description, task_type, status, priority,
      estimated_effort, acceptance_criteria, implementation_notes, position
    ) values (
      p_project_id,
      v_task->>'title',
      nullif(v_task->>'description', ''),
      v_task->>'task_type',
      'todo',
      v_task->>'priority',
      nullif(v_task->>'estimated_effort', ''),
      nullif(v_task->>'acceptance_criteria', ''),
      nullif(v_task->>'implementation_notes', ''),
      v_position
    )
    returning id into v_task_id;

    v_task_ids := jsonb_set(v_task_ids, array[v_key], to_jsonb(v_task_id::text), true);
    v_position := v_position + 1;
    v_created := v_created || jsonb_build_object(
      'index', v_index, 'id', v_task_id, 'title', v_task->>'title'
    );
  end loop;

  -- Phase 2: parent links, dependencies, and traceability links.
  for v_task in select * from jsonb_array_elements(p_tasks)
  loop
    v_index := (v_task->>'index')::int;
    v_key := lower(v_task->>'title');
    v_task_id := nullif(v_task_ids->>v_key, '')::uuid;
    if v_task_id is null then
      continue;
    end if;

    -- Parent task (by title).
    v_key := lower(coalesce(v_task->>'parent_title', ''));
    if v_key <> '' then
      v_parent_id := nullif(v_task_ids->>v_key, '')::uuid;
      if v_parent_id is not null and v_parent_id <> v_task_id then
        update public.tasks set parent_task_id = v_parent_id where id = v_task_id;
      elsif v_parent_id is null then
        v_skipped := v_skipped || jsonb_build_object(
          'index', v_index, 'title', 'parent task', 'reason', 'invalid'
        );
      end if;
    end if;

    -- Dependencies (by title).
    for v_dep in select * from jsonb_array_elements(coalesce(v_task->'depends_on', '[]'::jsonb))
    loop
      v_label := (v_task->>'title') || ' → ' || (v_dep#>>'{}');
      v_target_id := nullif(v_task_ids->>lower(v_dep#>>'{}'), '')::uuid;

      if v_target_id is null or v_target_id = v_task_id then
        v_skipped := v_skipped || jsonb_build_object(
          'index', v_index, 'title', v_label, 'reason', 'invalid'
        );
        continue;
      end if;

      if v_dep_keys @> jsonb_build_array(to_jsonb(v_task_id::text || '|' || v_target_id::text)) then
        v_skipped := v_skipped || jsonb_build_object(
          'index', v_index, 'title', v_label, 'reason', 'duplicate'
        );
        continue;
      end if;

      insert into public.task_dependencies (
        project_id, task_id, depends_on_task_id, dependency_type, description
      ) values (
        p_project_id, v_task_id, v_target_id, 'blocks', null
      );

      v_dep_keys := v_dep_keys || jsonb_build_array(to_jsonb(v_task_id::text || '|' || v_target_id::text));
    end loop;

    -- Traceability links.
    for v_link in select * from jsonb_array_elements(coalesce(v_task->'links', '[]'::jsonb))
    loop
      v_label := (v_task->>'title') || ' → ' || (v_link->>'name');
      v_target_id := null;
      v_key := lower(v_link->>'name');

      if v_link->>'kind' = 'requirement' then
        v_target_id := nullif(v_requirement_ids->>v_key, '')::uuid;
      elsif v_link->>'kind' = 'decision' then
        v_target_id := nullif(v_decision_ids->>v_key, '')::uuid;
      elsif v_link->>'kind' = 'entity' then
        v_target_id := nullif(v_entity_ids->>v_key, '')::uuid;
      elsif v_link->>'kind' = 'component' then
        v_target_id := nullif(v_component_ids->>v_key, '')::uuid;
      elsif v_link->>'kind' = 'endpoint' then
        v_target_id := nullif(v_endpoint_ids->>v_key, '')::uuid;
      elsif v_link->>'kind' = 'screen' then
        v_target_id := nullif(v_screen_ids->>v_key, '')::uuid;
      end if;

      if v_target_id is null then
        v_skipped := v_skipped || jsonb_build_object(
          'index', v_index, 'title', v_label, 'reason', 'invalid'
        );
        continue;
      end if;

      if v_link->>'kind' = 'requirement' then
        insert into public.task_requirements (task_id, requirement_id)
        values (v_task_id, v_target_id)
        on conflict (task_id, requirement_id) do nothing;
      elsif v_link->>'kind' = 'decision' then
        insert into public.task_decisions (task_id, decision_id)
        values (v_task_id, v_target_id)
        on conflict (task_id, decision_id) do nothing;
      elsif v_link->>'kind' = 'entity' then
        insert into public.task_domains (task_id, entity_id)
        values (v_task_id, v_target_id)
        on conflict (task_id, entity_id) do nothing;
      elsif v_link->>'kind' = 'component' then
        insert into public.task_architecture_components (task_id, component_id)
        values (v_task_id, v_target_id)
        on conflict (task_id, component_id) do nothing;
      elsif v_link->>'kind' = 'endpoint' then
        insert into public.task_api_endpoints (task_id, endpoint_id)
        values (v_task_id, v_target_id)
        on conflict (task_id, endpoint_id) do nothing;
      elsif v_link->>'kind' = 'screen' then
        insert into public.task_ui_screens (task_id, screen_id)
        values (v_task_id, v_target_id)
        on conflict (task_id, screen_id) do nothing;
      end if;
    end loop;
  end loop;

  return jsonb_build_object('created', v_created, 'skipped', v_skipped);
end;
$$;

grant execute on function public.apply_tasks_bundle(uuid, jsonb) to authenticated;
