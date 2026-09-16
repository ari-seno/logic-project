"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  architectureComponentDependencyInputSchema,
  architectureComponentDependencyUpdateSchema,
  type ArchitectureComponentDependencyActionState,
} from "@/lib/validation/architecture/dependencies";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/projects/queries";

function emptyToNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

async function assertProjectAndSharedComponents(
  projectId: string,
  sourceComponentId: string,
  targetComponentId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const project = await getProject(projectId);
  if (!project) {
    return { ok: false, error: "Project not found." };
  }

  const supabase = await createClient();
  const { data: components, error } = await supabase
    .from("architecture_components")
    .select("id, project_id")
    .in("id", [sourceComponentId, targetComponentId]);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!components || components.length !== 2) {
    return { ok: false, error: "Both components must exist." };
  }
  const allMatch = components.every(
    (c) => (c as { project_id: string }).project_id === projectId,
  );
  if (!allMatch) {
    return { ok: false, error: "Components must belong to this project." };
  }
  if (sourceComponentId === targetComponentId) {
    return { ok: false, error: "Source and target must differ." };
  }
  return { ok: true };
}

export async function createArchitectureComponentDependency(
  _prev: ArchitectureComponentDependencyActionState | null,
  formData: FormData,
): Promise<ArchitectureComponentDependencyActionState> {
  const parsed = architectureComponentDependencyInputSchema.safeParse({
    source_component_id: formData.get("source_component_id"),
    target_component_id: formData.get("target_component_id"),
    description: emptyToNull(formData.get("description")),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as ArchitectureComponentDependencyActionState["fieldErrors"],
    };
  }

  const projectId = formData.get("projectId");
  if (typeof projectId !== "string" || !projectId) {
    return { error: "Missing project reference." };
  }

  const checked = await assertProjectAndSharedComponents(
    projectId,
    parsed.data.source_component_id,
    parsed.data.target_component_id,
  );
  if (!checked.ok) return { error: checked.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data, error } = await supabase
    .from("architecture_component_dependencies")
    .insert({
      project_id: projectId,
      source_component_id: parsed.data.source_component_id,
      target_component_id: parsed.data.target_component_id,
      description: parsed.data.description?.length ? parsed.data.description : null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create dependency. Please try again." };
  }

  revalidatePath(`/projects/${projectId}/architecture`);
  revalidatePath(`/projects/${projectId}/architecture/dependencies`);
  redirect(`/projects/${projectId}/architecture/dependencies/${data.id}`);
}

export async function updateArchitectureComponentDependency(
  _prev: ArchitectureComponentDependencyActionState | null,
  formData: FormData,
): Promise<ArchitectureComponentDependencyActionState> {
  const parsed = architectureComponentDependencyUpdateSchema.safeParse({
    source_component_id: formData.get("source_component_id"),
    target_component_id: formData.get("target_component_id"),
    description: emptyToNull(formData.get("description")),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as ArchitectureComponentDependencyActionState["fieldErrors"],
    };
  }

  const id = formData.get("id");
  const projectId = formData.get("projectId");
  if (typeof id !== "string" || !id || typeof projectId !== "string" || !projectId) {
    return { error: "Missing dependency reference." };
  }

  const checked = await assertProjectAndSharedComponents(
    projectId,
    parsed.data.source_component_id,
    parsed.data.target_component_id,
  );
  if (!checked.ok) return { error: checked.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("architecture_component_dependencies")
    .update({
      source_component_id: parsed.data.source_component_id,
      target_component_id: parsed.data.target_component_id,
      description: parsed.data.description?.length ? parsed.data.description : null,
    })
    .eq("id", id)
    .eq("project_id", projectId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/architecture/dependencies/${id}`);
  redirect(`/projects/${projectId}/architecture/dependencies/${id}`);
}

export async function deleteArchitectureComponentDependency(formData: FormData) {
  const id = formData.get("id");
  const projectId = formData.get("projectId");
  if (typeof id !== "string" || !id || typeof projectId !== "string" || !projectId) {
    return { error: "Invalid dependency id" } as const;
  }

  const project = await getProject(projectId);
  if (!project) return { error: "Project not found." } as const;

  const supabase = await createClient();
  const { error } = await supabase
    .from("architecture_component_dependencies")
    .delete()
    .eq("id", id)
    .eq("project_id", projectId);

  if (error) return { error: error.message } as const;

  revalidatePath(`/projects/${projectId}/architecture`);
  redirect(`/projects/${projectId}/architecture`);
}
