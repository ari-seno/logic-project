"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  architectureDecisionInputSchema,
  architectureDecisionUpdateSchema,
  type ArchitectureDecisionActionState,
} from "@/lib/validation/architecture/decisions";
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

export async function createArchitectureDecision(
  _prev: ArchitectureDecisionActionState | null,
  formData: FormData,
): Promise<ArchitectureDecisionActionState> {
  const parsed = architectureDecisionInputSchema.safeParse({
    title: formData.get("title"),
    context: emptyToNull(formData.get("context")),
    decision: emptyToNull(formData.get("decision")),
    rationale: emptyToNull(formData.get("rationale")),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as ArchitectureDecisionActionState["fieldErrors"],
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
    .from("architecture_decisions")
    .insert({
      project_id: projectId,
      title: parsed.data.title,
      context: parsed.data.context?.length ? parsed.data.context : null,
      decision: parsed.data.decision?.length ? parsed.data.decision : null,
      rationale: parsed.data.rationale?.length ? parsed.data.rationale : null,
      status: parsed.data.status,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create decision. Please try again." };
  }

  revalidatePath(`/projects/${projectId}/architecture`);
  revalidatePath(`/projects/${projectId}/architecture/decisions`);
  redirect(`/projects/${projectId}/architecture/decisions/${data.id}`);
}

export async function updateArchitectureDecision(
  _prev: ArchitectureDecisionActionState | null,
  formData: FormData,
): Promise<ArchitectureDecisionActionState> {
  const parsed = architectureDecisionUpdateSchema.safeParse({
    title: formData.get("title"),
    context: emptyToNull(formData.get("context")),
    decision: emptyToNull(formData.get("decision")),
    rationale: emptyToNull(formData.get("rationale")),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as ArchitectureDecisionActionState["fieldErrors"],
    };
  }

  const id = formData.get("id");
  const projectId = formData.get("projectId");
  if (typeof id !== "string" || !id || typeof projectId !== "string" || !projectId) {
    return { error: "Missing decision reference." };
  }

  const owned = await assertOwnsProject(projectId);
  if (!owned.ok) return { error: owned.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("architecture_decisions")
    .update({
      title: parsed.data.title,
      context: parsed.data.context?.length ? parsed.data.context : null,
      decision: parsed.data.decision?.length ? parsed.data.decision : null,
      rationale: parsed.data.rationale?.length ? parsed.data.rationale : null,
      status: parsed.data.status,
    })
    .eq("id", id)
    .eq("project_id", projectId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}/architecture`);
  revalidatePath(`/projects/${projectId}/architecture/decisions/${id}`);
  redirect(`/projects/${projectId}/architecture/decisions/${id}`);
}

export async function deleteArchitectureDecision(formData: FormData) {
  const id = formData.get("id");
  const projectId = formData.get("projectId");
  if (typeof id !== "string" || !id || typeof projectId !== "string" || !projectId) {
    return { error: "Invalid decision id" } as const;
  }

  const owned = await assertOwnsProject(projectId);
  if (!owned.ok) return { error: owned.error } as const;

  const supabase = await createClient();
  const { error } = await supabase
    .from("architecture_decisions")
    .delete()
    .eq("id", id)
    .eq("project_id", projectId);

  if (error) return { error: error.message } as const;

  revalidatePath(`/projects/${projectId}/architecture`);
  revalidatePath(`/projects/${projectId}/architecture/decisions`);
  redirect(`/projects/${projectId}/architecture`);
}
