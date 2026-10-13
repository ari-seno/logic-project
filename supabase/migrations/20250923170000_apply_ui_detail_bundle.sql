-- Transactional apply for the UI detail AI stage (ui-detail).
--
-- Adds the secondary UI artifacts the ui stage defers: forms with their fields,
-- states, interactions with their endpoint links, and navigation items with
-- their screen links. Screens themselves are created by apply_ui_bundle, so an
-- unknown screen name here is reported as skipped/invalid rather than created.
-- Navigation parents are resolved in a second pass because a parent is
-- referenced by label and may be declared later in the same bundle. The whole
-- apply runs in one transaction; a real database error rolls everything back.

create or replace function public.apply_ui_detail_bundle(
  p_project_id uuid,
  p_screens jsonb,
  p_navigation jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_created jsonb := '[]'::jsonb;
  v_skipped jsonb := '[]'::jsonb;
  v_screen jsonb;
  v_form jsonb;
  v_field jsonb;
  v_state jsonb;
  v_interaction jsonb;
  v_link jsonb;
  v_nav jsonb;
  v_index int;
  v_screen_id uuid;
  v_form_id uuid;
  v_interaction_id uuid;
  v_endpoint_id uuid;
  v_nav_id uuid;
  v_parent_id uuid;
  v_key text;
  v_position int;
  v_created_in_item int;
  v_screen_ids jsonb := '{}'::jsonb;        -- lower(name) -> id
  v_form_ids jsonb := '{}'::jsonb;          -- screen id -> { lower(form name): id }
  v_form_next jsonb := '{}'::jsonb;         -- form id -> next field position
  v_field_names jsonb := '{}'::jsonb;       -- form id -> jsonb array of lower names
  v_state_names jsonb := '{}'::jsonb;       -- screen id -> jsonb array of lower names
  v_interaction_ids jsonb := '{}'::jsonb;   -- screen id -> { lower(name): id }
  v_endpoint_ids jsonb := '{}'::jsonb;      -- lower(method path) -> id
  v_nav_ids jsonb := '{}'::jsonb;           -- lower(name) -> id
  v_nav_by_label jsonb := '{}'::jsonb;      -- lower(label) -> id (first wins)
begin
  -- Seed endpoint lookups from existing rows.
  for v_endpoint_id, v_key in
    select id, lower(method || ' ' || path)
    from public.api_endpoints
    where project_id = p_project_id
  loop
    v_endpoint_ids := jsonb_set(v_endpoint_ids, array[v_key], to_jsonb(v_endpoint_id::text), true);
  end loop;

  -- Seed screen lookups from existing rows.
  for v_screen_id, v_key in
    select id, lower(name) from public.ui_screens where project_id = p_project_id
  loop
    v_screen_ids := jsonb_set(v_screen_ids, array[v_key], to_jsonb(v_screen_id::text), true);
  end loop;

  -- Phase 1: forms, states, and interactions for each named screen.
  for v_screen in select * from jsonb_array_elements(p_screens)
  loop
    v_index := (v_screen->>'index')::int;
    v_screen_id := nullif(v_screen_ids->>lower(v_screen->>'screen_name'), '')::uuid;

    if v_screen_id is null then
      v_skipped := v_skipped || jsonb_build_object(
        'index', v_index, 'title', v_screen->>'screen_name', 'reason', 'invalid'
      );
      continue;
    end if;

    -- Seed the per-screen caches once.
    if not v_form_ids ? v_screen_id::text then
      v_form_ids := jsonb_set(v_form_ids, array[v_screen_id::text],
        (select coalesce(jsonb_object_agg(lower(f.name), f.id::text), '{}'::jsonb)
         from public.ui_forms f where f.screen_id = v_screen_id), true);
      v_state_names := jsonb_set(v_state_names, array[v_screen_id::text],
        (select coalesce(jsonb_agg(lower(s.name)), '[]'::jsonb)
         from public.ui_states s where s.screen_id = v_screen_id), true);
      v_interaction_ids := jsonb_set(v_interaction_ids, array[v_screen_id::text],
        (select coalesce(jsonb_object_agg(lower(i.name), i.id::text), '{}'::jsonb)
         from public.ui_interactions i where i.screen_id = v_screen_id), true);
    end if;

    v_created_in_item := 0;

    -- Forms with their fields.
    for v_form in select * from jsonb_array_elements(coalesce(v_screen->'forms', '[]'::jsonb))
    loop
      v_key := lower(v_form->>'name');

      if (v_form_ids->>v_screen_id::text)::jsonb ? v_key then
        v_skipped := v_skipped || jsonb_build_object(
          'index', v_index,
          'title', (v_screen->>'screen_name') || ' → ' || (v_form->>'name'),
          'reason', 'duplicate'
        );
        continue;
      end if;

      insert into public.ui_forms (screen_id, name, description, submit_label, success_behavior)
      values (
        v_screen_id,
        v_form->>'name',
        nullif(v_form->>'description', ''),
        nullif(v_form->>'submit_label', ''),
        nullif(v_form->>'success_behavior', '')
      )
      returning id into v_form_id;

      v_form_ids := jsonb_set(v_form_ids, array[v_screen_id::text],
        (v_form_ids->>v_screen_id::text)::jsonb || jsonb_build_object(v_key, v_form_id::text), true);
      v_created_in_item := v_created_in_item + 1;

      -- Seed field caches for the new form.
      v_field_names := jsonb_set(v_field_names, array[v_form_id::text],
        (select coalesce(jsonb_agg(lower(ff.name)), '[]'::jsonb)
         from public.ui_form_fields ff where ff.form_id = v_form_id), true);
      select coalesce(max(position) + 1, 0) into v_position
      from public.ui_form_fields where form_id = v_form_id;
      v_form_next := jsonb_set(v_form_next, array[v_form_id::text], to_jsonb(v_position), true);

      for v_field in select * from jsonb_array_elements(coalesce(v_form->'fields', '[]'::jsonb))
      loop
        v_key := lower(v_field->>'name');

        if (v_field_names->>v_form_id::text)::jsonb ? v_key then
          v_skipped := v_skipped || jsonb_build_object(
            'index', v_index,
            'title', (v_screen->>'screen_name') || ' → ' || (v_form->>'name') || ' → ' || (v_field->>'name'),
            'reason', 'duplicate'
          );
          continue;
        end if;

        v_position := (v_form_next->>v_form_id::text)::int;

        insert into public.ui_form_fields (
          form_id, name, label, field_type, required, placeholder, help_text, default_value, position
        ) values (
          v_form_id,
          v_field->>'name',
          v_field->>'label',
          v_field->>'field_type',
          coalesce((v_field->>'required')::boolean, false),
          nullif(v_field->>'placeholder', ''),
          nullif(v_field->>'help_text', ''),
          nullif(v_field->>'default_value', ''),
          v_position
        );

        v_field_names := jsonb_set(v_field_names, array[v_form_id::text],
          (v_field_names->>v_form_id::text)::jsonb || to_jsonb(v_key), true);
        v_form_next := jsonb_set(v_form_next, array[v_form_id::text], to_jsonb(v_position + 1), true);
        v_created_in_item := v_created_in_item + 1;
      end loop;
    end loop;

    -- States.
    for v_state in select * from jsonb_array_elements(coalesce(v_screen->'states', '[]'::jsonb))
    loop
      v_key := lower(v_state->>'name');

      if (v_state_names->>v_screen_id::text)::jsonb ? v_key then
        v_skipped := v_skipped || jsonb_build_object(
          'index', v_index,
          'title', (v_screen->>'screen_name') || ' → ' || (v_state->>'name'),
          'reason', 'duplicate'
        );
        continue;
      end if;

      insert into public.ui_states (screen_id, name, state_type, description, behavior)
      values (
        v_screen_id,
        v_state->>'name',
        v_state->>'state_type',
        nullif(v_state->>'description', ''),
        nullif(v_state->>'behavior', '')
      );

      v_state_names := jsonb_set(v_state_names, array[v_screen_id::text],
        (v_state_names->>v_screen_id::text)::jsonb || to_jsonb(v_key), true);
      v_created_in_item := v_created_in_item + 1;
    end loop;

    -- Interactions with their endpoint links.
    for v_interaction in select * from jsonb_array_elements(coalesce(v_screen->'interactions', '[]'::jsonb))
    loop
      v_key := lower(v_interaction->>'name');

      if (v_interaction_ids->>v_screen_id::text)::jsonb ? v_key then
        v_interaction_id := ((v_interaction_ids->>v_screen_id::text)::jsonb->>v_key)::uuid;
        v_skipped := v_skipped || jsonb_build_object(
          'index', v_index,
          'title', (v_screen->>'screen_name') || ' → ' || (v_interaction->>'name'),
          'reason', 'duplicate'
        );
      else
        insert into public.ui_interactions (screen_id, name, trigger, action, description)
        values (
          v_screen_id,
          v_interaction->>'name',
          v_interaction->>'trigger',
          v_interaction->>'action',
          nullif(v_interaction->>'description', '')
        )
        returning id into v_interaction_id;

        v_interaction_ids := jsonb_set(v_interaction_ids, array[v_screen_id::text],
          (v_interaction_ids->>v_screen_id::text)::jsonb || jsonb_build_object(v_key, v_interaction_id::text), true);
        v_created_in_item := v_created_in_item + 1;
      end if;

      for v_link in select * from jsonb_array_elements(coalesce(v_interaction->'endpoint_labels', '[]'::jsonb))
      loop
        v_endpoint_id := nullif(v_endpoint_ids->>lower(v_link #>> '{}'), '')::uuid;

        if v_endpoint_id is null then
          v_skipped := v_skipped || jsonb_build_object(
            'index', v_index,
            'title', (v_screen->>'screen_name') || ' → ' || (v_interaction->>'name') || ' → ' || (v_link #>> '{}'),
            'reason', 'invalid'
          );
          continue;
        end if;

        if exists (
          select 1 from public.ui_interaction_endpoints ie
          where ie.interaction_id = v_interaction_id and ie.endpoint_id = v_endpoint_id
        ) then
          v_skipped := v_skipped || jsonb_build_object(
            'index', v_index,
            'title', (v_screen->>'screen_name') || ' → ' || (v_interaction->>'name') || ' → ' || (v_link #>> '{}'),
            'reason', 'duplicate'
          );
          continue;
        end if;

        insert into public.ui_interaction_endpoints (interaction_id, endpoint_id)
        values (v_interaction_id, v_endpoint_id);
      end loop;
    end loop;

    if v_created_in_item > 0 then
      v_created := v_created || jsonb_build_object('index', v_index, 'id', v_screen_id, 'title', v_screen->>'screen_name');
    else
      v_skipped := v_skipped || jsonb_build_object('index', v_index, 'title', v_screen->>'screen_name', 'reason', 'duplicate');
    end if;
  end loop;

  -- Phase 2: navigation items (project scoped).
  for v_nav_id, v_key in
    select id, lower(name) from public.ui_navigation_items where project_id = p_project_id
  loop
    v_nav_ids := jsonb_set(v_nav_ids, array[v_key], to_jsonb(v_nav_id::text), true);
  end loop;

  for v_nav_id, v_key in
    select id, lower(label) from public.ui_navigation_items where project_id = p_project_id
  loop
    if not v_nav_by_label ? v_key then
      v_nav_by_label := jsonb_set(v_nav_by_label, array[v_key], to_jsonb(v_nav_id::text), true);
    end if;
  end loop;

  select coalesce(max(position) + 1, 0) into v_position
  from public.ui_navigation_items where project_id = p_project_id;

  for v_nav in select * from jsonb_array_elements(p_navigation)
  loop
    v_index := (v_nav->>'index')::int;
    v_key := lower(v_nav->>'name');
    v_created_in_item := 0;

    v_nav_id := nullif(v_nav_ids->>v_key, '')::uuid;

    if v_nav_id is null then
      insert into public.ui_navigation_items (
        project_id, name, label, route, parent_id, description, position
      ) values (
        p_project_id,
        v_nav->>'name',
        v_nav->>'label',
        nullif(v_nav->>'route', ''),
        null,
        nullif(v_nav->>'description', ''),
        v_position
      )
      returning id into v_nav_id;

      v_position := v_position + 1;
      v_nav_ids := jsonb_set(v_nav_ids, array[v_key], to_jsonb(v_nav_id::text), true);
      v_created_in_item := 1;
    else
      v_skipped := v_skipped || jsonb_build_object(
        'index', v_index, 'title', v_nav->>'label', 'reason', 'duplicate'
      );
    end if;

    if not v_nav_by_label ? lower(v_nav->>'label') then
      v_nav_by_label := jsonb_set(v_nav_by_label, array[lower(v_nav->>'label')], to_jsonb(v_nav_id::text), true);
    end if;

    for v_link in select * from jsonb_array_elements(coalesce(v_nav->'screen_names', '[]'::jsonb))
    loop
      v_screen_id := nullif(v_screen_ids->>lower(v_link #>> '{}'), '')::uuid;

      if v_screen_id is null then
        v_skipped := v_skipped || jsonb_build_object(
          'index', v_index,
          'title', (v_nav->>'label') || ' → ' || (v_link #>> '{}'),
          'reason', 'invalid'
        );
        continue;
      end if;

      if exists (
        select 1 from public.ui_navigation_screens ns
        where ns.navigation_item_id = v_nav_id and ns.screen_id = v_screen_id
      ) then
        v_skipped := v_skipped || jsonb_build_object(
          'index', v_index,
          'title', (v_nav->>'label') || ' → ' || (v_link #>> '{}'),
          'reason', 'duplicate'
        );
        continue;
      end if;

      insert into public.ui_navigation_screens (navigation_item_id, screen_id)
      values (v_nav_id, v_screen_id);
    end loop;

    if v_created_in_item > 0 then
      v_created := v_created || jsonb_build_object('index', v_index, 'id', v_nav_id, 'title', v_nav->>'label');
    end if;
  end loop;

  -- Second pass: resolve navigation parents by label.
  for v_nav in select * from jsonb_array_elements(p_navigation)
  loop
    if coalesce(v_nav->>'parent_label', '') = '' then
      continue;
    end if;

    v_nav_id := nullif(v_nav_ids->>lower(v_nav->>'name'), '')::uuid;
    v_parent_id := nullif(v_nav_by_label->>lower(v_nav->>'parent_label'), '')::uuid;

    if v_nav_id is null or v_parent_id is null or v_parent_id = v_nav_id then
      continue;
    end if;

    update public.ui_navigation_items
    set parent_id = v_parent_id
    where id = v_nav_id and parent_id is null;
  end loop;

  return jsonb_build_object('created', v_created, 'skipped', v_skipped);
end;
$$;

grant execute on function public.apply_ui_detail_bundle(uuid, jsonb, jsonb) to authenticated;
