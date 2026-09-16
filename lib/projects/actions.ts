"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  projectInputSchema,
  projectUpdateSchema,
  type ProjectActionState,
} from "@/lib/validation/projects";
import { createClient } from "@/lib/supabase/server";

export async function createProject(
  _prev: ProjectActionState | null,
  formData: FormData,
): Promise<ProjectActionState> {
  const parsed = projectInputSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as ProjectActionState["fieldErrors"],
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to create a project." };
  }

  const description =
    parsed.data.description && parsed.data.description.length > 0
      ? parsed.data.description
      : null;

  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_id: user.id,
      name: parsed.data.name,
      description,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      error: error?.message ?? "Failed to create project. Please try again.",
    };
  }

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect(`/projects/${data.id}`);
}

function normalizeText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function normalizeOpt(value: FormDataEntryValue | null): string | undefined {
  const norm = normalizeText(value);
  return norm === null ? undefined : norm;
}

export async function updateProject(
  _prev: ProjectActionState | null,
  formData: FormData,
): Promise<ProjectActionState> {
  const parsed = projectUpdateSchema.safeParse({
    name: formData.get("name"),
    description: normalizeOpt(formData.get("description")),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as ProjectActionState["fieldErrors"],
    };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Missing project reference." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  // Ownership check via RLS — also confirm owner_id == auth.uid() explicitly.
  const { data: project } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", id)
    .maybeSingle();
  if (!project) return { error: "Project not found." };
  if (project.owner_id !== user.id) {
    return { error: "You do not own this project." };
  }

  const { error } = await supabase
    .from("projects")
    .update({
      name: parsed.data.name,
      description: normalizeText(formData.get("description")) ?? null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  redirect(`/projects/${id}?updated=1`);
}

export async function deleteProject(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Invalid project id" } as const;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." } as const;
  }

  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    return { error: error.message } as const;
  }

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect("/projects");
}
