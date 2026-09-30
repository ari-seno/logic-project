-- Transactional apply for the UI design AI stage.
--
-- Mirrors lib/ai/apply.ts applyUiAndComponents: components and screens are
-- create-or-reuse by lowercased name; placements, entity links, and requirement
-- links are deduped by code-side keys. Placement nesting is applied in a second
-- pass because a placement's parent is referenced by label and may be declared
-- later in the same bundle. The whole apply runs in one transaction.

create or replace function public.apply_ui_bundle(
  p_project_id uuid,
  p_components jsonb,
  p_screens jsonb
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
  v_screen jsonb;
  v_placement jsonb;
  v_link jsonb;
  v_index int;
  v_component_id uuid;
  v_screen_id uuid;
  v_placement_id uuid;
  v_parent_id uuid;
  v_entity_id uuid;
  v_requirement_id uuid;
  v_key text;
  v_seed jsonb;
  v_position int;
  v_created_in_item int;
  v_component_ids jsonb := '{}'::jsonb;      -- lower(name) -> id
  v_component_by_name jsonb := '{}'::jsonb;  -- lower(name) -> id (first wins)
  v_screen_ids jsonb := '{}'::jsonb;         -- lower(name) -> id
  v_screen_positions jsonb := '{}'::jsonb;   -- screen id -> next position
  v_placement_labels jsonb := '{}'::jsonb;   -- screen id -> { lower(label): id }
  v_placement_keys jsonb := '{}'::jsonb;     -- screen id -> jsonb array of keys
  v_entity_ids jsonb := '{}'::jsonb;         -- lower(entity name) -> id
  v_requirement_ids jsonb := '{}'::jsonb;    -- lower(title) -> id
begin
  -- Seed component + screen lookups from existing rows.
  for v_component_id, v_key in
    select id, lower(name) from public.ui_components where project_id = p_project_id
  loop
    v_component_ids := jsonb_set(v_component_ids, array[v_key], to_jsonb(v_component_id::text), true);
    if not v_component_by_name ? v_key then
      v_component_by_name := jsonb_set(v_component_by_name, array[v_key], to_jsonb(v_component_id::text), true);
    end if;
  end loop;

  for v_screen_id, v_key in
    select id, lower(name) from public.ui_screens where project_id = p_project_id
  loop
    v_screen_ids := jsonb_set(v_screen_ids, array[v_key], to_jsonb(v_screen_id::text), true);
    select coalesce(max(position) + 1, 0) into v_position
    from public.ui_screen_components where screen_id = v_screen_id;
    v_screen_positions := jsonb_set(v_screen_positions, array[v_screen_id::text], to_jsonb(v_position), true);
  end loop;

  for v_entity_id, v_key in
    select distinct on (lower(e.name)) e.id, lower(e.name)
    from public.entities e
    join public.domains d on d.id = e.domain_id
    where d.project_id = p_project_id
    order by lower(e.name)
  loop
    if not v_entity_ids ? v_key then
      v_entity_ids := jsonb_set(v_entity_ids, array[v_key], to_jsonb(v_entity_id::text), true);
    end if;
  end loop;

  for v_requirement_id, v_key in
    select distinct on (lower(title)) id, lower(title)
    from public.requirements where project_id = p_project_id
    order by lower(title)
  loop
    if not v_requirement_ids ? v_key then
      v_requirement_ids := jsonb_set(v_requirement_ids, array[v_key], to_jsonb(v_requirement_id::text), true);
    end if;
  end loop;

  -- Phase 1: components.
  select coalesce(max(position) + 1, 0) into v_position
  from public.ui_components where project_id = p_project_id;

  for v_component in select * from jsonb_array_elements(p_components)
  loop
    v_index := (v_component->>'index')::int;
    v_key := lower(v_component->>'name');

    if v_component_ids ? v_key then
      v_skipped := v_skipped || jsonb_build_object('index', v_index, 'title', v_component->>'name', 'reason', 'duplicate');
      continue;
    end if;

    insert into public.ui_components (
      project_id, name, component_type, description, purpose, technology, position
    ) values (
      p_project_id,
      v_component->>'name',
      v_component->>'component_type',
      nullif(v_component->>'description', ''),
      nullif(v_component->>'purpose', ''),
      nullif(v_component->>'technology', ''),
      v_position
    )
    returning id into v_component_id;

    v_component_ids := jsonb_set(v_component_ids, array[v_key], to_jsonb(v_component_id::text), true);
    v_component_by_name := jsonb_set(v_component_by_name, array[v_key], to_jsonb(v_component_id::text), true);
    v_position := v_position + 1;
    v_created := v_created || jsonb_build_object('index', v_index, 'id', v_component_id, 'title', v_component->>'name');
  end loop;

  -- Phase 2: screens with their placements and links.
  select coalesce(max(position) + 1, 0) into v_position
  from public.ui_screens where project_id = p_project_id;

  for v_screen in select * from jsonb_array_elements(p_screens)
  loop
    v_index := (v_screen->>'index')::int;
    v_key := lower(v_screen->>'name');
    v_screen_id := nullif(v_screen_ids->>v_key, '')::uuid;
    v_created_in_item := 0;

    if v_screen_id is null then
      insert into public.ui_screens (
        project_id, name, route, screen_type, description, purpose,
        authentication_required, position
      ) values (
        p_project_id,
        v_screen->>'name',
        nullif(v_screen->>'route', ''),
        v_screen->>'screen_type',
        nullif(v_screen->>'description', ''),
        nullif(v_screen->>'purpose', ''),
        coalesce((v_screen->>'authentication_required')::boolean, true),
        v_position
      )
      returning id into v_screen_id;

      v_screen_ids := jsonb_set(v_screen_ids, array[v_key], to_jsonb(v_screen_id::text), true);
      v_position := v_position + 1;
      v_created_in_item := v_created_in_item + 1;

      -- Position + placement caches for a brand new screen.
      v_screen_positions := jsonb_set(v_screen_positions, array[v_screen_id::text], to_jsonb(0), true);
      v_placement_keys := jsonb_set(v_placement_keys, array[v_screen_id::text], '[]'::jsonb, true);
      v_placement_labels := jsonb_set(v_placement_labels, array[v_screen_id::text], '{}'::jsonb, true);
    else
      -- Existing screen: seed its placement keys and label map once.
      if not v_placement_keys ? v_screen_id::text then
        select coalesce(jsonb_agg(
          jsonb_build_object(
            'key', sc.screen_id::text || '|' || sc.component_id::text || '|' || lower(coalesce(sc.label, '')),
            'label', lower(coalesce(sc.label, '')),
            'id', sc.id::text
          )
        ), '[]'::jsonb)
        into v_seed
        from public.ui_screen_components sc
        where sc.screen_id = v_screen_id;

        v_placement_keys := jsonb_set(v_placement_keys, array[v_screen_id::text], v_seed, true);
        select coalesce(max(position) + 1, 0) into v_position
        from public.ui_screen_components where screen_id = v_screen_id;
        v_screen_positions := jsonb_set(v_screen_positions, array[v_screen_id::text], to_jsonb(v_position), true);
        v_placement_labels := jsonb_set(v_placement_labels, array[v_screen_id::text], '{}'::jsonb, true);
      end if;
    end if;

    for v_placement in select * from jsonb_array_elements(coalesce(v_screen->'placements', '[]'::jsonb))
    loop
      v_component_id := nullif(v_component_by_name->>lower(v_placement->>'component_name'), '')::uuid;

      if v_component_id is null then
        v_skipped := v_skipped || jsonb_build_object(
          'index', v_index,
          'title', (v_screen->>'name') || ' → ' || (v_placement->>'component_name'),
          'reason', 'invalid'
        );
        continue;
      end if;

      v_key := v_screen_id::text || '|' || v_component_id::text || '|' || lower(coalesce(v_placement->>'label', ''));
      if (v_placement_keys->>v_screen_id::text)::jsonb @> jsonb_build_array(jsonb_build_object('key', v_key)) then
        v_skipped := v_skipped || jsonb_build_object(
          'index', v_index,
          'title', (v_screen->>'name') || ' → ' || (v_placement->>'component_name'),
          'reason', 'duplicate'
        );
        continue;
      end if;

      v_position := (v_screen_positions->>v_screen_id::text)::int;

      insert into public.ui_screen_components (
        screen_id, component_id, parent_id, label, description, required, position
      ) values (
        v_screen_id,
        v_component_id,
        null,
        nullif(v_placement->>'label', ''),
        nullif(v_placement->>'description', ''),
        coalesce((v_placement->>'required')::boolean, false),
        v_position
      )
      returning id into v_placement_id;

      v_placement_keys := jsonb_set(
        v_placement_keys,
        array[v_screen_id::text],
        (v_placement_keys->>v_screen_id::text)::jsonb || jsonb_build_array(jsonb_build_object('key', v_key, 'label', lower(coalesce(v_placement->>'label', '')), 'id', v_placement_id::text)),
        true
      );
      v_screen_positions := jsonb_set(v_screen_positions, array[v_screen_id::text], to_jsonb(v_position + 1), true);
      v_created_in_item := v_created_in_item + 1;
    end loop;

    -- Second pass: resolve placements' parent_id by label.
    for v_placement in select * from jsonb_array_elements(coalesce(v_screen->'placements', '[]'::jsonb))
    loop
      if coalesce(v_placement->>'parent_label', '') = '' then
        continue;
      end if;

      v_parent_id := null;
      select nullif(entry->>'id', '')::uuid into v_parent_id
      from jsonb_array_elements((v_placement_keys->>v_screen_id::text)::jsonb) entry
      where entry->>'label' = lower(v_placement->>'parent_label')
      limit 1;

      if v_parent_id is null then
        continue;
      end if;

      select nullif(entry->>'id', '')::uuid into v_placement_id
      from jsonb_array_elements((v_placement_keys->>v_screen_id::text)::jsonb) entry
      where entry->>'key' = v_screen_id::text || '|' ||
        (select cid::text from (
          select nullif(v_component_by_name->>lower(v_placement->>'component_name'), '')::uuid as cid
        ) s) || '|' || lower(coalesce(v_placement->>'label', ''))
      limit 1;

      if v_placement_id is not null and v_parent_id <> v_placement_id then
        update public.ui_screen_components set parent_id = v_parent_id where id = v_placement_id;
      end if;
    end loop;

    -- Entity links.
    for v_link in select * from jsonb_array_elements(coalesce(v_screen->'entities', '[]'::jsonb))
    loop
      v_entity_id := nullif(v_entity_ids->>lower(v_link->>'entity_name'), '')::uuid;

      if v_entity_id is null then
        v_skipped := v_skipped || jsonb_build_object(
          'index', v_index,
          'title', (v_screen->>'name') || ' → ' || (v_link->>'entity_name'),
          'reason', 'invalid'
        );
        continue;
      end if;

      if exists (
        select 1 from public.ui_screen_entities se
        where se.screen_id = v_screen_id and se.entity_id = v_entity_id and se.role = (v_link->>'role')
      ) then
        v_skipped := v_skipped || jsonb_build_object(
          'index', v_index,
          'title', (v_screen->>'name') || ' → ' || (v_link->>'entity_name'),
          'reason', 'duplicate'
        );
        continue;
      end if;

      insert into public.ui_screen_entities (screen_id, entity_id, role)
      values (v_screen_id, v_entity_id, v_link->>'role');
    end loop;

    -- Requirement links.
    for v_link in select * from jsonb_array_elements(coalesce(v_screen->'requirement_titles', '[]'::jsonb))
    loop
      v_requirement_id := nullif(v_requirement_ids->>lower(v_link #>> '{}'), '')::uuid;

      if v_requirement_id is null then
        v_skipped := v_skipped || jsonb_build_object(
          'index', v_index,
          'title', (v_screen->>'name') || ' → ' || (v_link #>> '{}'),
          'reason', 'invalid'
        );
        continue;
      end if;

      if exists (
        select 1 from public.ui_screen_requirements sr
        where sr.screen_id = v_screen_id and sr.requirement_id = v_requirement_id
      ) then
        v_skipped := v_skipped || jsonb_build_object(
          'index', v_index,
          'title', (v_screen->>'name') || ' → ' || (v_link #>> '{}'),
          'reason', 'duplicate'
        );
        continue;
      end if;

      insert into public.ui_screen_requirements (screen_id, requirement_id)
      values (v_screen_id, v_requirement_id);
    end loop;

    if v_created_in_item > 0 then
      v_created := v_created || jsonb_build_object('index', v_index, 'id', v_screen_id, 'title', v_screen->>'name');
    else
      v_skipped := v_skipped || jsonb_build_object('index', v_index, 'title', v_screen->>'name', 'reason', 'duplicate');
    end if;
  end loop;

  return jsonb_build_object('created', v_created, 'skipped', v_skipped);
end;
$$;

grant execute on function public.apply_ui_bundle(uuid, jsonb, jsonb) to authenticated;
