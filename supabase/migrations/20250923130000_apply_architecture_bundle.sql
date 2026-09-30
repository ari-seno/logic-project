-- Transactional apply for the architecture AI stage.
--
-- Mirrors the domain/ERD migration: the TypeScript path issued many separate
-- PostgREST calls, so a mid-apply failure left components, technologies,
-- decisions, and dependencies half written. Everything below happens inside a
-- single transaction.
--
-- The caller passes three already-validated groups (see lib/ai/schema.ts and
-- the row builders in lib/ai/apply.ts): components each carrying their
-- depends_on edges, technologies, and decisions.

create or replace function public.apply_architecture_bundle(
  p_project_id uuid,
  p_components jsonb,
  p_technologies jsonb,
  p_decisions jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_created jsonb := '[]'::jsonb;
  v_skipped jsonb := '[]'::jsonb;
  v_component jsonb;
  v_technology jsonb;
  v_decision jsonb;
  v_dependency jsonb;
  v_index int;
  v_component_id uuid;
  v_target_id uuid;
  v_key text;
  v_position int;
  v_dep_exists boolean;
  v_component_ids jsonb := '{}'::jsonb;
  v_component_by_name jsonb := '{}'::jsonb;
  v_technology_names jsonb := '[]'::jsonb;
  v_decision_titles jsonb := '[]'::jsonb;
begin
  select coalesce(max(c.position) + 1, 0)
  into v_position
  from public.architecture_components c
  where c.project_id = p_project_id;

  for v_component_id, v_key in
    select c.id, lower(c.name)
    from public.architecture_components c
    where c.project_id = p_project_id
    order by c.position
  loop
    v_component_ids := jsonb_set(v_component_ids, array[v_key], to_jsonb(v_component_id::text), true);
    if not v_component_by_name ? v_key then
      v_component_by_name := jsonb_set(v_component_by_name, array[v_key], to_jsonb(v_component_id::text), true);
    end if;
  end loop;

  select coalesce(jsonb_agg(to_jsonb(lower(t.name))), '[]'::jsonb)
  into v_technology_names
  from public.architecture_technologies t
  where t.project_id = p_project_id;

  select coalesce(jsonb_agg(to_jsonb(lower(d.title))), '[]'::jsonb)
  into v_decision_titles
  from public.architecture_decisions d
  where d.project_id = p_project_id;

  for v_component in select * from jsonb_array_elements(p_components)
  loop
    v_index := (v_component->>'index')::int;
    v_key := lower(v_component->>'name');
    v_component_id := nullif(v_component_ids->>v_key, '')::uuid;

    if v_component_id is null then
      insert into public.architecture_components (
        project_id, name, description, type, position
      ) values (
        p_project_id,
        v_component->>'name',
        nullif(v_component->>'description', ''),
        v_component->>'type',
        v_position
      )
      returning id into v_component_id;

      v_component_ids := jsonb_set(v_component_ids, array[v_key], to_jsonb(v_component_id::text), true);
      v_position := v_position + 1;
      v_created := v_created || jsonb_build_object(
        'index', v_index,
        'id', v_component_id,
        'title', v_component->>'name'
      );
    else
      v_skipped := v_skipped || jsonb_build_object(
        'index', v_index,
        'title', v_component->>'name',
        'reason', 'duplicate'
      );
    end if;

    if not v_component_by_name ? v_key then
      v_component_by_name := jsonb_set(v_component_by_name, array[v_key], to_jsonb(v_component_id::text), true);
    end if;
  end loop;

  -- Dependencies are resolved only after every component exists, so an edge may
  -- point at a component declared later in the same bundle.
  for v_component in select * from jsonb_array_elements(p_components)
  loop
    v_index := (v_component->>'index')::int;
    v_component_id := nullif(v_component_ids->>lower(v_component->>'name'), '')::uuid;

    if v_component_id is null then
      continue;
    end if;

    for v_dependency in select * from jsonb_array_elements(coalesce(v_component->'depends_on', '[]'::jsonb))
    loop
      v_target_id := nullif(v_component_by_name->>lower(v_dependency->>'target_component'), '')::uuid;

      if v_target_id is null or v_target_id = v_component_id then
        v_skipped := v_skipped || jsonb_build_object(
          'index', v_index,
          'title', (v_component->>'name') || ' → ' || (v_dependency->>'target_component'),
          'reason', 'invalid'
        );
        continue;
      end if;

      select exists (
        select 1 from public.architecture_component_dependencies d
        where d.source_component_id = v_component_id
          and d.target_component_id = v_target_id
      ) into v_dep_exists;

      if v_dep_exists then
        v_skipped := v_skipped || jsonb_build_object(
          'index', v_index,
          'title', (v_component->>'name') || ' → ' || (v_dependency->>'target_component'),
          'reason', 'duplicate'
        );
        continue;
      end if;

      insert into public.architecture_component_dependencies (
        project_id, source_component_id, target_component_id, description
      ) values (
        p_project_id,
        v_component_id,
        v_target_id,
        nullif(v_dependency->>'description', '')
      );
    end loop;
  end loop;

  for v_technology in select * from jsonb_array_elements(p_technologies)
  loop
    v_index := (v_technology->>'index')::int;
    v_key := lower(v_technology->>'name');

    if v_technology_names ? v_key then
      v_skipped := v_skipped || jsonb_build_object(
        'index', v_index,
        'title', v_technology->>'name',
        'reason', 'duplicate'
      );
      continue;
    end if;

    insert into public.architecture_technologies (
      project_id, name, category, description
    ) values (
      p_project_id,
      v_technology->>'name',
      v_technology->>'category',
      nullif(v_technology->>'description', '')
    );

    v_technology_names := v_technology_names || to_jsonb(v_key);
    v_created := v_created || jsonb_build_object(
      'index', v_index,
      'id', gen_random_uuid(),
      'title', v_technology->>'name'
    );
  end loop;

  for v_decision in select * from jsonb_array_elements(p_decisions)
  loop
    v_index := (v_decision->>'index')::int;
    v_key := lower(v_decision->>'title');

    if v_decision_titles ? v_key then
      v_skipped := v_skipped || jsonb_build_object(
        'index', v_index,
        'title', v_decision->>'title',
        'reason', 'duplicate'
      );
      continue;
    end if;

    insert into public.architecture_decisions (
      project_id, title, context, decision, rationale, status
    ) values (
      p_project_id,
      v_decision->>'title',
      nullif(v_decision->>'context', ''),
      v_decision->>'decision',
      nullif(v_decision->>'rationale', ''),
      coalesce(nullif(v_decision->>'status', ''), 'proposed')
    );

    v_decision_titles := v_decision_titles || to_jsonb(v_key);
    v_created := v_created || jsonb_build_object(
      'index', v_index,
      'id', gen_random_uuid(),
      'title', v_decision->>'title'
    );
  end loop;

  return jsonb_build_object('created', v_created, 'skipped', v_skipped);
end;
$$;

grant execute on function public.apply_architecture_bundle(uuid, jsonb, jsonb, jsonb) to authenticated;
