import { createClient } from "@/lib/supabase/server";
import type {
  Domain,
  Entity,
  EntityAttribute,
  EntityRelationship,
} from "@/lib/supabase/types";

export type ProjectErd = {
  domains: Domain[];
  entitiesByDomain: Record<string, Entity[]>;
  attributesByEntity: Record<string, EntityAttribute[]>;
  relationships: EntityRelationship[];
};

export async function loadProjectErd(projectId: string): Promise<ProjectErd> {
  const supabase = await createClient();

  const [{ data: domains }, { data: entities }, { data: attributes }, { data: rels }] =
    await Promise.all([
      supabase
        .from("domains")
        .select("*")
        .eq("project_id", projectId)
        .order("name", { ascending: true }),
      supabase
        .from("entities")
        .select("*, domains!inner(project_id)")
        .eq("domains.project_id", projectId)
        .order("name", { ascending: true }),
      supabase
        .from("entity_attributes")
        .select("*, entities!inner(domain_id, domains!inner(project_id))")
        .eq("entities.domains.project_id", projectId)
        .order("position", { ascending: true }),
      supabase
        .from("entity_relationships")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true }),
    ]);

  const cleanedEntities = (entities ?? []).map((row) => {
    const entity = row as Entity & { domains: { project_id: string } };
    const { domains: _drop, ...rest } = entity;
    void _drop;
    return rest;
  });

  const entitiesByDomain: Record<string, Entity[]> = {};
  for (const entity of cleanedEntities) {
    const list = entitiesByDomain[entity.domain_id] ?? [];
    list.push(entity);
    entitiesByDomain[entity.domain_id] = list;
  }

  const attributesByEntity: Record<string, EntityAttribute[]> = {};
  for (const row of attributes ?? []) {
    const rowTyped = row as EntityAttribute & {
      entities: { domain_id: string; domains: { project_id: string } };
    };
    const { entities: _drop, ...attribute } = rowTyped;
    void _drop;
    const list = attributesByEntity[attribute.entity_id] ?? [];
    list.push(attribute);
    attributesByEntity[attribute.entity_id] = list;
  }

  return {
    domains: domains ?? [],
    entitiesByDomain,
    attributesByEntity,
    relationships: rels ?? [],
  };
}
