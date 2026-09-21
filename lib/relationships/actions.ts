"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/projects/queries";
import {
  relationshipInputSchema,
  relationshipUpdateSchema,
  type RelationshipActionState,
} from "@/lib/validation/relationships";

function emptyToOptional(
  value: FormDataEntryValue | null,
): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

async function assertProjectAndSharedEntities(
  projectId: string,
  sourceEntityId: string,
  targetEntityId: string,
): Promise<
  | { ok: true }
  | { ok: false; error: string }
> {
  const project = await getProject(projectId);
  if (!project) {
    return { ok: false, error: "Project not found." };
  }

  const supabase = await createClient();

  const { data: entities, error } = await supabase
    .from("entities")
    .select("id, domains!inner(project_id)")
    .in("id", [sourceEntityId, targetEntityId]);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!entities || entities.length !== 2) {
    return { ok: false, error: "Both entities must exist." };
  }

  const allMatch = entities.every(
    (row) =>
      (row as { domains: { project_id: string } }).domains.project_id ===
      projectId,
  );
  if (!allMatch) {
    return { ok: false, error: "Entities must belong to this project." };
  }

  if (sourceEntityId === targetEntityId) {
    return { ok: false, error: "Source and target must differ." };
  }

  return { ok: true };
}

export async function createRelationship(
  _prev: RelationshipActionState | null,
  formData: FormData,
): Promise<RelationshipActionState> {
  const parsed = relationshipInputSchema.safeParse({
    source_entity_id: formData.get("source_entity_id"),
    target_entity_id: formData.get("target_entity_id"),
    relationship_type: formData.get("relationship_type"),
    name: emptyToOptional(formData.get("name")),
    description: emptyToOptional(formData.get("description")),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as RelationshipActionState["fieldErrors"],
    };
  }

  const projectId = formData.get("projectId");
  if (typeof projectId !== "string" || !projectId) {
    return { error: "Missing project reference." };
  }

  const checked = await assertProjectAndSharedEntities(
    projectId,
    parsed.data.source_entity_id,
    parsed.data.target_entity_id,
  );
  if (!checked.ok) {
    return { error: checked.error };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const { data, error } = await supabase
    .from("entity_relationships")
    .insert({
      project_id: projectId,
      source_entity_id: parsed.data.source_entity_id,
      target_entity_id: parsed.data.target_entity_id,
      relationship_type: parsed.data.relationship_type,
      name: parsed.data.name,
      description: parsed.data.description,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      error: error?.message ?? "Failed to create relationship. Please try again.",
    };
  }

  revalidatePath(`/projects/${projectId}/domains/erd`);
  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}/domains/relationships/${data.id}`);
}

export async function updateRelationship(
  _prev: RelationshipActionState | null,
  formData: FormData,
): Promise<RelationshipActionState> {
  const parsed = relationshipUpdateSchema.safeParse({
    source_entity_id: formData.get("source_entity_id"),
    target_entity_id: formData.get("target_entity_id"),
    relationship_type: formData.get("relationship_type"),
    name: emptyToOptional(formData.get("name")),
    description: emptyToOptional(formData.get("description")),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as RelationshipActionState["fieldErrors"],
    };
  }

  const id = formData.get("id");
  const projectId = formData.get("projectId");
  if (
    typeof id !== "string" ||
    !id ||
    typeof projectId !== "string" ||
    !projectId
  ) {
    return { error: "Missing relationship reference." };
  }

  const checked = await assertProjectAndSharedEntities(
    projectId,
    parsed.data.source_entity_id,
    parsed.data.target_entity_id,
  );
  if (!checked.ok) {
    return { error: checked.error };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("entity_relationships")
    .update({
      source_entity_id: parsed.data.source_entity_id,
      target_entity_id: parsed.data.target_entity_id,
      relationship_type: parsed.data.relationship_type,
      name: parsed.data.name,
      description: parsed.data.description,
    })
    .eq("id", id)
    .eq("project_id", projectId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/projects/${projectId}/domains/relationships/${id}`);
  redirect(`/projects/${projectId}/domains/relationships/${id}`);
}

export async function deleteRelationship(formData: FormData) {
  const id = formData.get("id");
  const projectId = formData.get("projectId");
  if (
    typeof id !== "string" ||
    !id ||
    typeof projectId !== "string" ||
    !projectId
  ) {
    return { error: "Invalid relationship id" } as const;
  }

  const project = await getProject(projectId);
  if (!project) {
    return { error: "Project not found." } as const;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("entity_relationships")
    .delete()
    .eq("id", id)
    .eq("project_id", projectId);

  if (error) {
    return { error: error.message } as const;
  }

  revalidatePath(`/projects/${projectId}/domains/erd`);
  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}/domains/erd`);
}
