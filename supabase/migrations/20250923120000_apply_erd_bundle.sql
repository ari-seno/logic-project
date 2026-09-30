-- Transactional apply for the domain/ERD AI stage.
--
-- The TypeScript apply path issues many separate PostgREST calls, so a failure
-- part way through leaves domains, entities, attributes, and relationships
-- half written. This function performs the whole apply inside a single
-- transaction: either every row for the selected domains lands, or none do.
--
-- It receives the already validated bundle (see lib/ai/schema.ts and the row
-- builders in lib/ai/apply.ts) as JSONB and mirrors the same create-or-reuse
-- semantics and dedupe keys the TypeScript layer used to compute client side.
-- Unknown or invalid entries are reported as skipped rather than aborting the
-- whole apply, except for real database errors which roll the transaction back.

create or replace function public.apply_erd_bundle(
  p_project_id uuid,
  p_domains jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_created jsonb := '[]'::jsonb;
  v_skipped jsonb := '[]'::jsonb;
  v_domain jsonb;
  v_entity jsonb;
  v_attribute jsonb;
  v_relationship jsonb;
  v_index int;
  v_domain_id uuid;
  v_entity_id uuid;
  v_target_id uuid;
  v_domain_key text;
  v_entity_key text;
  v_attribute_key text;
  v_created_in_item int;
  v_position int;
  v_rel_exists boolean;
  -- Flat lookup tables built once at the start and extended as rows are added.
  v_domain_ids jsonb := '{}'::jsonb;
  v_entity_ids jsonb := '{}'::jsonb;
  v_entity_by_name jsonb := '{}'::jsonb;
  v_attribute_names jsonb := '{}'::jsonb;
  v_next_position jsonb := '{}'::jsonb;
begin
  -- Seed the lookup tables with everything that already exists for the project.
  for v_domain_id, v_domain_key in
    select id, lower(name) from public.domains where project_id = p_project_id
  loop
    v_domain_ids := jsonb_set(v_domain_ids, array[v_domain_key], to_jsonb(v_domain_id::text), true);
  end loop;

  for v_entity_id, v_entity_key in
    select e.id, d.id::text || '|' || lower(e.name)
    from public.entities e
    join public.domains d on d.id = e.domain_id
    where d.project_id = p_project_id
  loop
    v_entity_ids := jsonb_set(v_entity_ids, array[v_entity_key], to_jsonb(v_entity_id::text), true);
  end loop;

  for v_entity_id, v_entity_key in
    select distinct on (lower(e.name)) e.id, lower(e.name)
    from public.entities e
    join public.domains d on d.id = e.domain_id
    where d.project_id = p_project_id
    order by lower(e.name)
  loop
    if not v_entity_by_name ? v_entity_key then
      v_entity_by_name := jsonb_set(v_entity_by_name, array[v_entity_key], to_jsonb(v_entity_id::text), true);
    end if;
  end loop;

  for v_domain in select * from jsonb_array_elements(p_domains)
  loop
    v_index := (v_domain->>'index')::int;
    v_domain_key := lower(v_domain->>'name');

    v_domain_id := nullif(v_domain_ids->>v_domain_key, '')::uuid;
    v_created_in_item := 0;

    if v_domain_id is null then
      insert into public.domains (project_id, name, description)
      values (
        p_project_id,
        v_domain->>'name',
        nullif(v_domain->>'description', '')
      )
      returning id into v_domain_id;

      v_domain_ids := jsonb_set(v_domain_ids, array[v_domain_key], to_jsonb(v_domain_id::text), true);
      v_created_in_item := v_created_in_item + 1;
    end if;

    for v_entity in select * from jsonb_array_elements(coalesce(v_domain->'entities', '[]'::jsonb))
    loop
      v_entity_key := v_domain_id::text || '|' || lower(v_entity->>'name');
      v_entity_id := nullif(v_entity_ids->>v_entity_key, '')::uuid;

      if v_entity_id is null then
        insert into public.entities (domain_id, name, description)
        values (
          v_domain_id,
          v_entity->>'name',
          nullif(v_entity->>'description', '')
        )
        returning id into v_entity_id;

        v_entity_ids := jsonb_set(v_entity_ids, array[v_entity_key], to_jsonb(v_entity_id::text), true);
        v_created_in_item := v_created_in_item + 1;
      end if;

      v_attribute_key := lower(v_entity->>'name');
      if not v_entity_by_name ? v_attribute_key then
        v_entity_by_name := jsonb_set(v_entity_by_name, array[v_attribute_key], to_jsonb(v_entity_id::text), true);
      end if;

      -- Existing attribute names for this entity (cached per entity).
      if not v_attribute_names ? v_entity_id::text then
        select coalesce(jsonb_agg(to_jsonb(lower(a.name))), '[]'::jsonb)
        into v_attribute_key
        from public.entity_attributes a
        where a.entity_id = v_entity_id;
        v_attribute_names := jsonb_set(v_attribute_names, array[v_entity_id::text], to_jsonb(v_attribute_key::text), true);

        select coalesce(max(a.position) + 1, 0)
        into v_position
        from public.entity_attributes a
        where a.entity_id = v_entity_id;
        v_next_position := jsonb_set(v_next_position, array[v_entity_id::text], to_jsonb(v_position), true);
      end if;

      for v_attribute in select * from jsonb_array_elements(coalesce(v_entity->'attributes', '[]'::jsonb))
      loop
        v_attribute_key := lower(v_attribute->>'name');
        if (select v_attribute_names->>v_entity_id::text)::jsonb ? v_attribute_key then
          continue;
        end if;

        v_position := (v_next_position->>v_entity_id::text)::int;

        insert into public.entity_attributes (
          entity_id, name, data_type, is_required, is_primary_key,
          default_value, description, position
        ) values (
          v_entity_id,
          v_attribute->>'name',
          v_attribute->>'data_type',
          coalesce((v_attribute->>'is_required')::boolean, false),
          coalesce((v_attribute->>'is_primary_key')::boolean, false),
          nullif(v_attribute->>'default_value', ''),
          nullif(v_attribute->>'description', ''),
          v_position
        );

        v_attribute_names := jsonb_set(
          v_attribute_names,
          array[v_entity_id::text],
          (select v_attribute_names->>v_entity_id::text)::jsonb || to_jsonb(v_attribute_key),
          true
        );
        v_next_position := jsonb_set(v_next_position, array[v_entity_id::text], to_jsonb(v_position + 1), true);
        v_created_in_item := v_created_in_item + 1;
      end loop;

      -- Relationships are queued and resolved after all entities exist so that
      -- a target declared later in the same bundle still resolves by name.
      for v_relationship in select * from jsonb_array_elements(coalesce(v_entity->'relationships', '[]'::jsonb))
      loop
        v_target_id := nullif(v_entity_by_name->>lower(v_relationship->>'target_entity'), '')::uuid;

        if v_target_id is null or v_target_id = v_entity_id then
          v_skipped := v_skipped || jsonb_build_object(
            'index', v_index,
            'title', (v_domain->>'name') || ' / ' || (v_entity->>'name') || ' → ' || (v_relationship->>'target_entity'),
            'reason', 'invalid'
          );
          continue;
        end if;

        select exists (
          select 1 from public.entity_relationships r
          where r.source_entity_id = v_entity_id
            and r.target_entity_id = v_target_id
            and r.relationship_type = (v_relationship->>'relationship_type')
        ) into v_rel_exists;

        if v_rel_exists then
          v_skipped := v_skipped || jsonb_build_object(
            'index', v_index,
            'title', (v_domain->>'name') || ' / ' || (v_entity->>'name') || ' → ' || (v_relationship->>'target_entity'),
            'reason', 'duplicate'
          );
          continue;
        end if;

        insert into public.entity_relationships (
          project_id, source_entity_id, target_entity_id,
          relationship_type, name, description
        ) values (
          p_project_id,
          v_entity_id,
          v_target_id,
          v_relationship->>'relationship_type',
          nullif(v_relationship->>'name', ''),
          nullif(v_relationship->>'description', '')
        );
      end loop;
    end loop;

    if v_created_in_item > 0 then
      v_created := v_created || jsonb_build_object(
        'index', v_index,
        'id', v_domain_id,
        'title', v_domain->>'name'
      );
    else
      v_skipped := v_skipped || jsonb_build_object(
        'index', v_index,
        'title', v_domain->>'name',
        'reason', 'duplicate'
      );
    end if;
  end loop;

  return jsonb_build_object('created', v_created, 'skipped', v_skipped);
end;
$$;

grant execute on function public.apply_erd_bundle(uuid, jsonb) to authenticated;
