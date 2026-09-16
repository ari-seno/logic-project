"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  architectureTechnologyInputSchema,
  architectureTechnologyUpdateSchema,
  type ArchitectureTechnologyActionState,
} from "@/lib/validation/architecture/technologies";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/projects/queries";

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

export async function createArchitectureTechnology(
  _prev: ArchitectureTechnologyActionState | null,
  formData: FormData,
): Promise<ArchitectureTechnologyActionState> {
  const parsed = architectureTechnologyInputSchema.safeParse({
    name: formData.get("name"),
    description: emptyToNull(formData.get("description")),
    category: formData.get("category"),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as ArchitectureTechnologyActionState["fieldErrors"],
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

  const { data, error } = await supabase
    .from("architecture_technologies")
    .insert({
      project_id: projectId,
      name: parsed.data.name,
      description: parsed.data.description?.length ? parsed.data.description : null,
      category: parsed.data.category,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create technology. Please try again." };
  }

  revalidatePath(`/projects/${projectId}/architecture`);
  revalidatePath(`/projects/${projectId}/architecture/technologies`);
  redirect(`/projects/${projectId}/architecture/technologies/${data.id}`);
}

export async function updateArchitectureTechnology(
  _prev: ArchitectureTechnologyActionState | null,
  formData: FormData,
): Promise<ArchitectureTechnologyActionState> {
  const parsed = architectureTechnologyUpdateSchema.safeParse({
    name: formData.get("name"),
    description: emptyToNull(formData.get("description")),
    category: formData.get("category"),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as ArchitectureTechnologyActionState["fieldErrors"],
    };
  }

  const id = formData.get("id");
  const projectId = formData.get("projectId");
  if (typeof id !== "string" || !id || typeof projectId !== "string" || !projectId) {
    return { error: "Missing technology reference." };
  }

  const owned = await assertOwnsProject(projectId);
  if (!owned.ok) return { error: owned.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("architecture_technologies")
    .update({
      name: parsed.data.name,
      description: parsed.data.description?.length ? parsed.data.description : null,
      category: parsed.data.category,
    })
    .eq("id", id)
    .eq("project_id", projectId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/architecture`);
  revalidatePath(`/projects/${projectId}/architecture/technologies/${id}`);
  redirect(`/projects/${projectId}/architecture/technologies/${id}`);
}

export async function deleteArchitectureTechnology(formData: FormData) {
  const id = formData.get("id");
  const projectId = formData.get("projectId");
  if (typeof id !== "string" || !id || typeof projectId !== "string" || !projectId) {
    return { error: "Invalid technology id" } as const;
  }

  const owned = await assertOwnsProject(projectId);
  if (!owned.ok) return { error: owned.error } as const;

  const supabase = await createClient();
  const { error } = await supabase
    .from("architecture_technologies")
    .delete()
    .eq("id", id)
    .eq("project_id", projectId);

  if (error) return { error: error.message } as const;

  revalidatePath(`/projects/${projectId}/architecture`);
  revalidatePath(`/projects/${projectId}/architecture/technologies`);
  redirect(`/projects/${projectId}/architecture`);
}
