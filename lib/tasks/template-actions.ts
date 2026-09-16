"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/projects/queries";
import { getRequirement } from "@/lib/requirements/queries";
import { getDecision } from "@/lib/decisions/queries";
import { getUiComponent } from "@/lib/ui/components/queries";
import { getApiEndpoint } from "@/lib/api/endpoints/queries";
import { getUiScreen } from "@/lib/ui/screens/queries";
import {
  buildTaskTemplateFromComponent,
  buildTaskTemplateFromDecision,
  buildTaskTemplateFromEndpoint,
  buildTaskTemplateFromEntity,
  buildTaskTemplateFromRequirement,
  buildTaskTemplateFromScreen,
  type ArtifactKind,
  type TaskTemplate,
} from "./templates";
import { nextTaskPosition } from "./queries";

type ArtifactRow =
  | { kind: "requirement"; row: Awaited<ReturnType<typeof getRequirement>> }
  | { kind: "decision"; row: Awaited<ReturnType<typeof getDecision>> }
  | { kind: "entity"; row: { id: string; project_id: string; name: string; description: string | null } }
  | { kind: "component"; row: Awaited<ReturnType<typeof getUiComponent>> }
  | { kind: "endpoint"; row: Awaited<ReturnType<typeof getApiEndpoint>> }
  | { kind: "screen"; row: Awaited<ReturnType<typeof getUiScreen>> };

async function loadArtifact(
  kind: ArtifactKind,
  refId: string,
): Promise<ArtifactRow | null> {
  if (kind === "requirement") {
    const r = await getRequirement(refId);
    return r ? { kind, row: r } : null;
  }
  if (kind === "decision") {
    const r = await getDecision(refId);
    return r ? { kind, row: r } : null;
  }
  if (kind === "entity") {
    const supabase = await createClient();
    type EntityJoinRow = {
      id: string;
      name: string;
      description: string | null;
      domains: { project_id: string } | null;
    };
    const { data } = await supabase
      .from("entities")
      .select("id, name, description, domains!inner(project_id)")
      .eq("id", refId)
      .maybeSingle();
    if (!data) return null;
    const joined = data as unknown as EntityJoinRow;
    if (!joined.domains) return null;
    return {
      kind,
      row: {
        id: joined.id,
        project_id: joined.domains.project_id,
        name: joined.name,
        description: joined.description,
      },
    };
  }
  if (kind === "component") {
    const r = await getUiComponent(refId);
    return r ? { kind, row: r } : null;
  }
  if (kind === "endpoint") {
    const r = await getApiEndpoint(refId);
    return r ? { kind, row: r } : null;
  }
  if (kind === "screen") {
    const r = await getUiScreen(refId);
    return r ? { kind, row: r } : null;
  }
  return null;
}

function buildTemplate(art: ArtifactRow): TaskTemplate | null {
  if (!art.row) return null;
  if (art.kind === "requirement") {
    return buildTaskTemplateFromRequirement(art.row);
  }
  if (art.kind === "decision") {
    return buildTaskTemplateFromDecision({
      id: art.row.id,
      title: art.row.title,
      rationale: art.row.rationale,
    });
  }
  if (art.kind === "entity") {
    return buildTaskTemplateFromEntity(art.row);
  }
  if (art.kind === "component") {
    return buildTaskTemplateFromComponent({
      id: art.row.id,
      name: art.row.name,
      type: art.row.component_type,
      purpose: art.row.purpose,
    });
  }
  if (art.kind === "endpoint") {
    return buildTaskTemplateFromEndpoint(art.row);
  }
  if (art.kind === "screen") {
    return buildTaskTemplateFromScreen(art.row);
  }
  return null;
}

async function attachLink(
  taskId: string,
  art: ArtifactRow,
): Promise<{ ok: boolean; error?: string }> {
  if (!art.row) return { ok: false, error: "Artifact missing" };
  const supabase = await createClient();
  if (art.kind === "requirement") {
    const { error } = await supabase.from("task_requirements").insert({
      task_id: taskId,
      requirement_id: art.row.id,
    });
    return { ok: !error, error: error?.message };
  }
  if (art.kind === "decision") {
    const { error } = await supabase.from("task_decisions").insert({
      task_id: taskId,
      decision_id: art.row.id,
    });
    return { ok: !error, error: error?.message };
  }
  if (art.kind === "entity") {
    const { error } = await supabase.from("task_domains").insert({
      task_id: taskId,
      entity_id: art.row.id,
    });
    return { ok: !error, error: error?.message };
  }
  if (art.kind === "component") {
    const { error } = await supabase.from("task_architecture_components").insert({
      task_id: taskId,
      component_id: art.row.id,
    });
    return { ok: !error, error: error?.message };
  }
  if (art.kind === "endpoint") {
    const { error } = await supabase.from("task_api_endpoints").insert({
      task_id: taskId,
      endpoint_id: art.row.id,
    });
    return { ok: !error, error: error?.message };
  }
  if (art.kind === "screen") {
    const { error } = await supabase.from("task_ui_screens").insert({
      task_id: taskId,
      screen_id: art.row.id,
    });
    return { ok: !error, error: error?.message };
  }
  return { ok: false, error: "Unknown artifact kind" };
}

const ALLOWED_KINDS: ArtifactKind[] = [
  "requirement",
  "decision",
  "entity",
  "component",
  "endpoint",
  "screen",
];

function readKind(value: FormDataEntryValue | null): ArtifactKind | null {
  if (typeof value !== "string") return null;
  return (ALLOWED_KINDS as string[]).includes(value)
    ? (value as ArtifactKind)
    : null;
}

/**
 * Create a task pre-filled from a deterministic template and automatically
 * link it to the source artifact. Single round-trip; redirects to the new
 * task detail page so the user can refine or attach more sources.
 */
export async function createTaskFromArtifact(formData: FormData) {
  const kind = readKind(formData.get("kind"));
  const refId = formData.get("refId");
  const projectId = formData.get("projectId");

  if (!kind) return { error: "Missing or invalid artifact kind" } as const;
  if (typeof refId !== "string" || !refId) {
    return { error: "Missing artifact reference" } as const;
  }
  if (typeof projectId !== "string" || !projectId) {
    return { error: "Missing project reference" } as const;
  }

  const owned = await getProject(projectId);
  if (!owned) return { error: "Project not found." } as const;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." } as const;

  const artifact = await loadArtifact(kind, refId);
  if (!artifact || !artifact.row || artifact.row.project_id !== projectId) {
    return { error: "Artifact not found in this project." } as const;
  }

  const template = buildTemplate(artifact);
  if (!template) return { error: "Failed to build task template." } as const;

  const position = await nextTaskPosition(projectId);
  const { data: created, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      title: template.title,
      description: template.description,
      task_type: template.task_type as never,
      status: template.status as never,
      priority: template.priority as never,
      acceptance_criteria: template.acceptance_criteria,
      position,
    })
    .select("id")
    .single();
  if (error || !created) {
    return { error: error?.message ?? "Failed to create task." } as const;
  }

  const attach = await attachLink(created.id, artifact);
  if (!attach.ok) {
    return {
      error: `Task created but link failed: ${attach.error ?? "unknown"}`,
    } as const;
  }

  revalidatePath(`/projects/${projectId}/tasks`);
  redirect(`/projects/${projectId}/tasks/${created.id}`);
}
