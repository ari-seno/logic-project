import { createClient } from "@/lib/supabase/server";
import type { EntityAttribute } from "@/lib/supabase/types";

export type ListAttributesOptions = {
  entityId?: string;
  limit?: number;
};

export async function listAttributes(
  options: ListAttributesOptions,
): Promise<EntityAttribute[]> {
  const { entityId, limit } = options;
  const supabase = await createClient();

  let query = supabase
    .from("entity_attributes")
    .select("*")
    .order("position", { ascending: true });

  if (entityId) {
    query = query.eq("entity_id", entityId);
  }
  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error("listAttributes failed:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getAttribute(
  id: string,
): Promise<EntityAttribute | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entity_attributes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getAttribute failed:", error.message);
    return null;
  }
  return data ?? null;
}

export async function getAttributeWithProject(
  id: string,
): Promise<{ attribute: EntityAttribute; projectId: string } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entity_attributes")
    .select("*, entities!inner(domain_id, domains!inner(project_id))")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  const { entities, ...attribute } = data as EntityAttribute & {
    entities: { domain_id: string; domains: { project_id: string } };
  };
  return { attribute, projectId: entities.domains.project_id };
}

export async function nextAttributePosition(
  entityId: string,
): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("entity_attributes")
    .select("position")
    .eq("entity_id", entityId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return 1;
  }
  return ((data?.position ?? 0) + 1);
}

export type ReorderDirection = "up" | "down";

export async function reorderAttribute(
  attributeId: string,
  direction: ReorderDirection,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const current = await getAttribute(attributeId);
  if (!current) {
    return { ok: false, error: "Attribute not found." };
  }

  const supabase = await createClient();
  const operator = direction === "up" ? "lt" : "gt";
  const ascending = direction === "up" ? false : true;

  const { data: neighbor, error: neighborError } = await supabase
    .from("entity_attributes")
    .select("*")
    .eq("entity_id", current.entity_id)
    .filter("position", operator, current.position)
    .order("position", { ascending })
    .limit(1)
    .maybeSingle();

  if (neighborError) {
    return { ok: false, error: neighborError.message };
  }
  if (!neighbor) {
    return { ok: true };
  }

  const tempPosition = current.position;
  const { error: stageError } = await supabase
    .from("entity_attributes")
    .update({ position: -tempPosition })
    .eq("id", current.id);
  if (stageError) {
    return { ok: false, error: stageError.message };
  }
  const { error: moveError } = await supabase
    .from("entity_attributes")
    .update({ position: tempPosition })
    .eq("id", neighbor.id);
  if (moveError) {
    return { ok: false, error: moveError.message };
  }
  const { error: finalizeError } = await supabase
    .from("entity_attributes")
    .update({ position: neighbor.position })
    .eq("id", current.id);
  if (finalizeError) {
    return { ok: false, error: finalizeError.message };
  }

  return { ok: true };
}
