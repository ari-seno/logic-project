-- Transactional apply for the API design AI stage.
--
-- Mirrors the ERD/architecture bundles: the whole contract is written inside a
-- single transaction so a failure part way through no longer leaves groups,
-- endpoints, and their children half written. Unknown or invalid entries are
-- reported as skipped rather than aborting the apply; real database errors
-- raise and roll the transaction back.

create or replace function public.apply_api_bundle(
  p_project_id uuid,
  p_groups jsonb,
  p_endpoints jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_created jsonb := '[]'::jsonb;
  v_skipped jsonb := '[]'::jsonb;
  v_group jsonb;
  v_endpoint jsonb;
  v_index int;
  v_group_id uuid;
  v_endpoint_id uuid;
  v_group_key text;
  v_endpoint_key text;
  v_position int;
  v_group_position int;
  v_endpoint_position int;
  v_exists boolean;
  v_entity_id uuid;
  v_target_id uuid;
  -- Flat lookup maps, seeded from existing rows and extended as we insert.
  v_group_ids jsonb := '{}'::jsonb;
  v_endpoint_ids jsonb := '{}'::jsonb;
  v_entity_ids jsonb := '{}'::jsonb;
  v_requirement_ids jsonb := '{}'::jsonb;
  v_parameter_keys jsonb := '[]'::jsonb;
  v_request_body_ids jsonb := '[]'::jsonb;
  v_response_keys jsonb := '[]'::jsonb;
  v_error_keys jsonb := '[]'::jsonb;
  v_entity_link_keys jsonb := '[]'::jsonb;
  v_requirement_link_keys jsonb := '[]'::jsonb;
begin
  select coalesce(max(position), -1) + 1 into v_group_position
  from public.api_groups where project_id = p_project_id;
  select coalesce(max(position), -1) + 1 into v_endpoint_position
  from public.api_endpoints where project_id = p_project_id;

  for v_group_id, v_group_key in
    select id, lower(name) from public.api_groups where project_id = p_project_id
  loop
    v_group_ids := jsonb_set(v_group_ids, array[v_group_key], to_jsonb(v_group_id::text), true);
  end loop;

  for v_endpoint_id, v_endpoint_key in
    select id, method || '|' || path from public.api_endpoints where project_id = p_project_id
  loop
    v_endpoint_ids := jsonb_set(v_endpoint_ids, array[v_endpoint_key], to_jsonb(v_endpoint_id::text), true);
  end loop;

  -- Children of existing endpoints.
  select coalesce(jsonb_agg(p.endpoint_id::text || '|' || p.location || '|' || lower(p.name)), '[]'::jsonb)
  into v_parameter_keys
  from public.api_parameters p
  join public.api_endpoints e on e.id = p.endpoint_id
  where e.project_id = p_project_id;

  select coalesce(jsonb_agg(b.endpoint_id), '[]'::jsonb)
  into v_request_body_ids
  from public.api_request_bodies b
  join public.api_endpoints e on e.id = b.endpoint_id
  where e.project_id = p_project_id;

  select coalesce(jsonb_agg(r.endpoint_id::text || '|' || r.status_code), '[]'::jsonb)
  into v_response_keys
  from public.api_responses r
  join public.api_endpoints e on e.id = r.endpoint_id
  where e.project_id = p_project_id;

  select coalesce(jsonb_agg(er.endpoint_id::text || '|' || lower(er.code)), '[]'::jsonb)
  into v_error_keys
  from public.api_errors er
  join public.api_endpoints e on e.id = er.endpoint_id
  where e.project_id = p_project_id;

  select coalesce(jsonb_agg(l.endpoint_id::text || '|' || l.entity_id::text || '|' || l.role), '[]'::jsonb)
  into v_entity_link_keys
  from public.api_endpoint_entities l
  join public.api_endpoints e on e.id = l.endpoint_id
  where e.project_id = p_project_id;

  select coalesce(jsonb_agg(l.endpoint_id::text || '|' || l.requirement_id::text), '[]'::jsonb)
  into v_requirement_link_keys
  from public.api_endpoint_requirements l
  join public.api_endpoints e on e.id = l.endpoint_id
  where e.project_id = p_project_id;

  for v_entity_id, v_group_key in
    select distinct on (lower(en.name)) en.id, lower(en.name)
    from public.entities en
    join public.domains d on d.id = en.domain_id
    where d.project_id = p_project_id
    order by lower(en.name)
  loop
    if not v_entity_ids ? v_group_key then
      v_entity_ids := jsonb_set(v_entity_ids, array[v_group_key], to_jsonb(v_entity_id::text), true);
    end if;
  end loop;

  for v_target_id, v_group_key in
    select distinct on (lower(title)) id, lower(title)
    from public.requirements where project_id = p_project_id
    order by lower(title)
  loop
    if not v_requirement_ids ? v_group_key then
      v_requirement_ids := jsonb_set(v_requirement_ids, array[v_group_key], to_jsonb(v_target_id::text), true);
    end if;
  end loop;

  -- Phase 1: groups.
  for v_group in select * from jsonb_array_elements(p_groups)
  loop
    v_index := (v_group->>'index')::int;
    v_group_key := lower(v_group->>'name');

    if v_group_ids ? v_group_key then
      v_skipped := v_skipped || jsonb_build_object('index', v_index, 'title', v_group->>'name', 'reason', 'duplicate');
      continue;
    end if;

    insert into public.api_groups (project_id, name, prefix, description, position)
    values (
      p_project_id,
      v_group->>'name',
      nullif(v_group->>'prefix', ''),
      nullif(v_group->>'description', ''),
      v_group_position
    )
    returning id into v_group_id;

    v_group_ids := jsonb_set(v_group_ids, array[v_group_key], to_jsonb(v_group_id::text), true);
    v_group_position := v_group_position + 1;
    v_created := v_created || jsonb_build_object('index', v_index, 'id', v_group_id, 'title', v_group->>'name');
  end loop;

  -- Phase 2: endpoints and their children.
  for v_endpoint in select * from jsonb_array_elements(p_endpoints)
  loop
    v_index := (v_endpoint->>'index')::int;
    v_endpoint_key := (v_endpoint->>'method') || '|' || (v_endpoint->>'path');
    v_endpoint_id := nullif(v_endpoint_ids->>v_endpoint_key, '')::uuid;
    v_exists := v_endpoint_id is not null;

    if v_endpoint_id is null then
      v_group_id := null;

      if coalesce(v_endpoint->>'group_name', '') <> '' then
        v_group_key := lower(v_endpoint->>'group_name');
        v_group_id := nullif(v_group_ids->>v_group_key, '')::uuid;

        if v_group_id is null then
          insert into public.api_groups (project_id, name, position)
          values (p_project_id, v_endpoint->>'group_name', v_group_position)
          returning id into v_group_id;

          v_group_ids := jsonb_set(v_group_ids, array[v_group_key], to_jsonb(v_group_id::text), true);
          v_group_position := v_group_position + 1;
        end if;
      end if;

      insert into public.api_endpoints (
        project_id, group_id, name, method, path, summary,
        description, authentication_required, position
      ) values (
        p_project_id,
        v_group_id,
        v_endpoint->>'name',
        v_endpoint->>'method',
        v_endpoint->>'path',
        nullif(v_endpoint->>'summary', ''),
        nullif(v_endpoint->>'description', ''),
        coalesce((v_endpoint->>'authentication_required')::boolean, true),
        v_endpoint_position
      )
      returning id into v_endpoint_id;

      v_endpoint_ids := jsonb_set(v_endpoint_ids, array[v_endpoint_key], to_jsonb(v_endpoint_id::text), true);
      v_endpoint_position := v_endpoint_position + 1;
    end if;

    -- Parameters.
    for v_group in select * from jsonb_array_elements(coalesce(v_endpoint->'parameters', '[]'::jsonb))
    loop
      v_endpoint_key := v_endpoint_id::text || '|' || (v_group->>'location') || '|' || lower(v_group->>'name');
      if v_parameter_keys @> to_jsonb(v_endpoint_key) then
        v_skipped := v_skipped || jsonb_build_object(
          'index', v_index,
          'title', (v_endpoint->>'method') || ' ' || (v_endpoint->>'path') || ' → ' || (v_group->>'name'),
          'reason', 'duplicate'
        );
        continue;
      end if;

      select coalesce(max(position) + 1, 0) into v_position
      from public.api_parameters where endpoint_id = v_endpoint_id;

      insert into public.api_parameters (
        endpoint_id, name, location, data_type, required, description, example, position
      ) values (
        v_endpoint_id,
        v_group->>'name',
        v_group->>'location',
        v_group->>'data_type',
        coalesce((v_group->>'required')::boolean, false),
        nullif(v_group->>'description', ''),
        nullif(v_group->>'example', ''),
        v_position
      );

      v_parameter_keys := v_parameter_keys || to_jsonb(v_endpoint_key);
    end loop;

    -- Request body (at most one per endpoint).
    if v_endpoint ? 'request_body' and v_endpoint->'request_body' <> 'null'::jsonb then
      v_group := v_endpoint->'request_body';
      if v_request_body_ids @> to_jsonb(v_endpoint_id::text) then
        v_skipped := v_skipped || jsonb_build_object(
          'index', v_index,
          'title', (v_endpoint->>'method') || ' ' || (v_endpoint->>'path') || ' → request body',
          'reason', 'duplicate'
        );
      else
        insert into public.api_request_bodies (
          endpoint_id, content_type, description, schema_definition, example
        ) values (
          v_endpoint_id,
          v_group->>'content_type',
          nullif(v_group->>'description', ''),
          case when v_group ? 'schema' and v_group->'schema' <> 'null'::jsonb then v_group->'schema' else null end,
          case when v_group ? 'example' and v_group->'example' <> 'null'::jsonb then v_group->'example' else null end
        );
        v_request_body_ids := v_request_body_ids || to_jsonb(v_endpoint_id::text);
      end if;
    end if;

    -- Responses.
    for v_group in select * from jsonb_array_elements(coalesce(v_endpoint->'responses', '[]'::jsonb))
    loop
      v_endpoint_key := v_endpoint_id::text || '|' || (v_group->>'status_code');
      if v_response_keys @> to_jsonb(v_endpoint_key) then
        v_skipped := v_skipped || jsonb_build_object(
          'index', v_index,
          'title', (v_endpoint->>'method') || ' ' || (v_endpoint->>'path') || ' → ' || (v_group->>'status_code'),
          'reason', 'duplicate'
        );
        continue;
      end if;

      select coalesce(max(position) + 1, 0) into v_position
      from public.api_responses where endpoint_id = v_endpoint_id;

      insert into public.api_responses (
        endpoint_id, status_code, content_type, description, schema_definition, example, position
      ) values (
        v_endpoint_id,
        (v_group->>'status_code')::int,
        nullif(v_group->>'content_type', ''),
        nullif(v_group->>'description', ''),
        case when v_group ? 'schema' and v_group->'schema' <> 'null'::jsonb then v_group->'schema' else null end,
        case when v_group ? 'example' and v_group->'example' <> 'null'::jsonb then v_group->'example' else null end,
        v_position
      );

      v_response_keys := v_response_keys || to_jsonb(v_endpoint_key);
    end loop;

    -- Errors.
    for v_group in select * from jsonb_array_elements(coalesce(v_endpoint->'errors', '[]'::jsonb))
    loop
      v_endpoint_key := v_endpoint_id::text || '|' || lower(v_group->>'code');
      if v_error_keys @> to_jsonb(v_endpoint_key) then
        v_skipped := v_skipped || jsonb_build_object(
          'index', v_index,
          'title', (v_endpoint->>'method') || ' ' || (v_endpoint->>'path') || ' → ' || (v_group->>'code'),
          'reason', 'duplicate'
        );
        continue;
      end if;

      insert into public.api_errors (endpoint_id, code, message, description, http_status)
      values (
        v_endpoint_id,
        v_group->>'code',
        v_group->>'message',
        nullif(v_group->>'description', ''),
        nullif(v_group->>'http_status', '')::int
      );

      v_error_keys := v_error_keys || to_jsonb(v_endpoint_key);
    end loop;

    -- Entity links, resolved by name against the supplied or existing entities.
    for v_group in select * from jsonb_array_elements(coalesce(v_endpoint->'entities', '[]'::jsonb))
    loop
      v_target_id := nullif(v_entity_ids->>lower(v_group->>'entity_name'), '')::uuid;
      if v_target_id is null then
        v_skipped := v_skipped || jsonb_build_object(
          'index', v_index,
          'title', (v_endpoint->>'method') || ' ' || (v_endpoint->>'path') || ' → ' || (v_group->>'entity_name'),
          'reason', 'invalid'
        );
        continue;
      end if;

      v_endpoint_key := v_endpoint_id::text || '|' || v_target_id::text || '|' || (v_group->>'role');
      if v_entity_link_keys @> to_jsonb(v_endpoint_key) then
        v_skipped := v_skipped || jsonb_build_object(
          'index', v_index,
          'title', (v_endpoint->>'method') || ' ' || (v_endpoint->>'path') || ' → ' || (v_group->>'entity_name'),
          'reason', 'duplicate'
        );
        continue;
      end if;

      insert into public.api_endpoint_entities (endpoint_id, entity_id, role)
      values (v_endpoint_id, v_target_id, v_group->>'role');

      v_entity_link_keys := v_entity_link_keys || to_jsonb(v_endpoint_key);
    end loop;

    -- Requirement links, resolved by title.
    for v_group in select * from jsonb_array_elements(coalesce(v_endpoint->'requirement_titles', '[]'::jsonb))
    loop
      v_target_id := nullif(v_requirement_ids->>lower(v_group #>> '{}'), '')::uuid;
      if v_target_id is null then
        v_skipped := v_skipped || jsonb_build_object(
          'index', v_index,
          'title', (v_endpoint->>'method') || ' ' || (v_endpoint->>'path') || ' → ' || (v_group #>> '{}'),
          'reason', 'invalid'
        );
        continue;
      end if;

      v_endpoint_key := v_endpoint_id::text || '|' || v_target_id::text;
      if v_requirement_link_keys @> to_jsonb(v_endpoint_key) then
        v_skipped := v_skipped || jsonb_build_object(
          'index', v_index,
          'title', (v_endpoint->>'method') || ' ' || (v_endpoint->>'path') || ' → ' || (v_group #>> '{}'),
          'reason', 'duplicate'
        );
        continue;
      end if;

      insert into public.api_endpoint_requirements (endpoint_id, requirement_id)
      values (v_endpoint_id, v_target_id);

      v_requirement_link_keys := v_requirement_link_keys || to_jsonb(v_endpoint_key);
    end loop;

    if v_exists then
      v_skipped := v_skipped || jsonb_build_object(
        'index', v_index,
        'title', (v_endpoint->>'method') || ' ' || (v_endpoint->>'path'),
        'reason', 'duplicate'
      );
    else
      v_created := v_created || jsonb_build_object(
        'index', v_index,
        'id', v_endpoint_id,
        'title', (v_endpoint->>'method') || ' ' || (v_endpoint->>'path')
      );
    end if;
  end loop;

  return jsonb_build_object('created', v_created, 'skipped', v_skipped);
end;
$$;

grant execute on function public.apply_api_bundle(uuid, jsonb, jsonb) to authenticated;
