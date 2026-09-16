"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  architectureComponentInputSchema,
  architectureComponentUpdateSchema,
  type ArchitectureComponentActionState,
} from "@/lib/validation/architecture/components";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/projects/queries";
import {
  nextArchitectureComponentPosition,
} from "./queries";

function emptyToNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

async function assertOwnsProject(
  projectId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const project = await getProject(projectId);
  if (!project) {
    return { ok: false, error: "Project not found." };
  }
  return { ok: true };
}

export async function createArchitectureComponent(
  _prev: ArchitectureComponentActionState | null,
  formData: FormData,
): Promise<ArchitectureComponentActionState> {
  const parsed = architectureComponentInputSchema.safeParse({
    name: formData.get("name"),
    description: emptyToNull(formData.get("description")),
    type: formData.get("type"),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as ArchitectureComponentActionState["fieldErrors"],
    };
  }

  const projectId = formData.get("projectId");
  if (typeof projectId !== "string" || !projectId) {
    return { error: "Missing project reference." };
  }

  const owned = await assertOwnsProject(projectId);
  if (!owned.ok) return { error: owned.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const position = await nextArchitectureComponentPosition(projectId);

  const { data, error } = await supabase
    .from("architecture_components")
    .insert({
      project_id: projectId,
      name: parsed.data.name,
      description: parsed.data.description?.length ? parsed.data.description : null,
      type: parsed.data.type,
      position,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create component. Please try again." };
  }

  revalidatePath(`/projects/${projectId}/architecture`);
  revalidatePath(`/projects/${projectId}/architecture/components`);
  redirect(`/projects/${projectId}/architecture/components/${data.id}`);
}

export async function updateArchitectureComponent(
  _prev: ArchitectureComponentActionState | null,
  formData: FormData,
): Promise<ArchitectureComponentActionState> {
  const parsed = architectureComponentUpdateSchema.safeParse({
    name: formData.get("name"),
    description: emptyToNull(formData.get("description")),
    type: formData.get("type"),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as ArchitectureComponentActionState["fieldErrors"],
    };
  }

  const id = formData.get("id");
  const projectId = formData.get("projectId");
  if (typeof id !== "string" || !id || typeof projectId !== "string" || !projectId) {
    return { error: "Missing component reference." };
  }

  const owned = await assertOwnsProject(projectId);
  if (!owned.ok) return { error: owned.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("architecture_components")
    .update({
      name: parsed.data.name,
      description: parsed.data.description?.length ? parsed.data.description : null,
      type: parsed.data.type,
    })
    .eq("id", id)
    .eq("project_id", projectId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/architecture`);
  revalidatePath(`/projects/${projectId}/architecture/components/${id}`);
  redirect(`/projects/${projectId}/architecture/components/${id}`);
}

export async function deleteArchitectureComponent(formData: FormData) {
  const id = formData.get("id");
  const projectId = formData.get("projectId");
  if (typeof id !== "string" || !id || typeof projectId !== "string" || !projectId) {
    return { error: "Invalid component id" } as const;
  }

  const owned = await assertOwnsProject(projectId);
  if (!owned.ok) return { error: owned.error } as const;

  const supabase = await createClient();
  const { error } = await supabase
    .from("architecture_components")
    .delete()
    .eq("id", id)
    .eq("project_id", projectId);

  if (error) return { error: error.message } as const;

  revalidatePath(`/projects/${projectId}/architecture`);
  revalidatePath(`/projects/${projectId}/architecture/components`);
  redirect(`/projects/${projectId}/architecture`);
}
