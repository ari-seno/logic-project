import {
  createClient,
  type SupabaseServerClient,
} from "@/lib/supabase/server";
import type { EntityRelationship } from "@/lib/supabase/types";

export type ListRelationshipsOptions = {
  projectId?: string;
  limit?: number;
};

export async function listRelationships(
  options: ListRelationshipsOptions,
): Promise<EntityRelationship[]> {
  const { projectId, limit } = options;
  const supabase = await createClient();

  let query = supabase
    .from("entity_relationships")
    .select("*")
    .order("updated_at", { ascending: false });

  if (projectId) {
    query = query.eq("project_id", projectId);
  }
  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error("listRelationships failed:", error.message);
    return [];
  }
  return data ?? [];
}

export async function countRelationshipsByProject(
  projectId: string,
  client?: SupabaseServerClient,
): Promise<number> {
  const supabase = client ?? (await createClient());
  const { count, error } = await supabase
    .from("entity_relationships")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (error) {
    console.error("countRelationshipsByProject failed:", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function getRelationship(
  id: string,
): Promise<EntityRelationship | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entity_relationships")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getRelationship failed:", error.message);
    return null;
  }
  return data ?? null;
}

export async function getRelationshipWithProject(
  id: string,
): Promise<{ relationship: EntityRelationship; projectId: string } | null> {
  const relationship = await getRelationship(id);
  if (!relationship) return null;
  return { relationship, projectId: relationship.project_id };
}
