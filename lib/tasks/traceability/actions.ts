"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getTask } from "@/lib/tasks/queries";
import { getRequirement } from "@/lib/requirements/queries";
import { getDecision } from "@/lib/decisions/queries";
import { getUiComponent } from "@/lib/ui/components/queries";
import { getApiEndpoint } from "@/lib/api/endpoints/queries";
import { getUiScreen } from "@/lib/ui/screens/queries";

async function assertTaskInProject(taskId: string) {
  const task = await getTask(taskId);
  if (!task) return { ok: false, error: "Task not found." } as const;
  return { ok: true, projectId: task.project_id } as const;
}

async function assertSameProject(
  table: "task_requirements" | "task_decisions" | "task_domains" | "task_architecture_components" | "task_api_endpoints" | "task_ui_screens",
  refId: string,
  projectId: string,
) {
  const supabase = await createClient();
  if (table === "task_requirements") {
    const r = await getRequirement(refId);
    if (!r || r.project_id !== projectId) return { ok: false, error: "Requirement not in this project." } as const;
    return { ok: true } as const;
  }
  if (table === "task_decisions") {
    const d = await getDecision(refId);
    if (!d || d.project_id !== projectId) return { ok: false, error: "Decision not in this project." } as const;
    return { ok: true } as const;
  }
  if (table === "task_domains") {
    const { data } = await supabase
      .from("entities")
      .select("id, domains!inner(project_id)")
      .eq("id", refId)
      .eq("domains.project_id", projectId)
      .maybeSingle();
    if (!data) return { ok: false, error: "Entity not in this project." } as const;
    return { ok: true } as const;
  }
  if (table === "task_architecture_components") {
    const c = await getUiComponent(refId);
    if (!c || c.project_id !== projectId) return { ok: false, error: "Architecture component not in this project." } as const;
    return { ok: true } as const;
  }
  if (table === "task_api_endpoints") {
    const e = await getApiEndpoint(refId);
    if (!e || e.project_id !== projectId) return { ok: false, error: "API endpoint not in this project." } as const;
    return { ok: true } as const;
  }
  if (table === "task_ui_screens") {
    const s = await getUiScreen(refId);
    if (!s || s.project_id !== projectId) return { ok: false, error: "UI screen not in this project." } as const;
    return { ok: true } as const;
  }
  return { ok: false, error: "Unknown link." } as const;
}

type LinkTable =
  | "task_requirements"
  | "task_decisions"
  | "task_domains"
  | "task_architecture_components"
  | "task_api_endpoints"
  | "task_ui_screens";

async function attach(
  table: LinkTable,
  taskId: string,
  refId: string,
): Promise<{ ok: boolean; error?: string }> {
  const ownership = await assertTaskInProject(taskId);
  if (!ownership.ok) return { ok: false, error: ownership.error };
  const sameProject = await assertSameProject(table, refId, ownership.projectId);
  if (!sameProject.ok) return { ok: false, error: sameProject.error };

  const supabase = await createClient();
  const insertPayload = {
    task_requirements: {
      task_id: taskId,
      requirement_id: refId,
    },
    task_decisions: {
      task_id: taskId,
      decision_id: refId,
    },
    task_domains: {
      task_id: taskId,
      entity_id: refId,
    },
    task_architecture_components: {
      task_id: taskId,
      component_id: refId,
    },
    task_api_endpoints: {
      task_id: taskId,
      endpoint_id: refId,
    },
    task_ui_screens: {
      task_id: taskId,
      screen_id: refId,
    },
  }[table] as Record<string, string>;
  const { error } = await supabase.from(table).insert(insertPayload as never);
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Already linked." };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function attachRequirementToTask(formData: FormData) {
  const taskId = formData.get("taskId");
  const requirementId = formData.get("requirementId");
  if (typeof taskId !== "string" || !taskId || typeof requirementId !== "string" || !requirementId) {
    return { error: "Missing reference" } as const;
  }
  const r = await attach("task_requirements", taskId, requirementId);
  if (!r.ok) return r;

  const ownership = await assertTaskInProject(taskId);
  if (ownership.ok) {
    revalidatePath(`/projects/${ownership.projectId}/tasks/${taskId}`);
    redirect(`/projects/${ownership.projectId}/tasks/${taskId}`);
  }
}

export async function attachDecisionToTask(formData: FormData) {
  const taskId = formData.get("taskId");
  const decisionId = formData.get("decisionId");
  if (typeof taskId !== "string" || !taskId || typeof decisionId !== "string" || !decisionId) {
    return { error: "Missing reference" } as const;
  }
  const r = await attach("task_decisions", taskId, decisionId);
  if (!r.ok) return r;
  const ownership = await assertTaskInProject(taskId);
  if (ownership.ok) {
    revalidatePath(`/projects/${ownership.projectId}/tasks/${taskId}`);
    redirect(`/projects/${ownership.projectId}/tasks/${taskId}`);
  }
}

export async function attachEntityToTask(formData: FormData) {
  const taskId = formData.get("taskId");
  const entityId = formData.get("entityId");
  if (typeof taskId !== "string" || !taskId || typeof entityId !== "string" || !entityId) {
    return { error: "Missing reference" } as const;
  }
  const r = await attach("task_domains", taskId, entityId);
  if (!r.ok) return r;
  const ownership = await assertTaskInProject(taskId);
  if (ownership.ok) {
    revalidatePath(`/projects/${ownership.projectId}/tasks/${taskId}`);
    redirect(`/projects/${ownership.projectId}/tasks/${taskId}`);
  }
}

export async function attachComponentToTask(formData: FormData) {
  const taskId = formData.get("taskId");
  const componentId = formData.get("componentId");
  if (typeof taskId !== "string" || !taskId || typeof componentId !== "string" || !componentId) {
    return { error: "Missing reference" } as const;
  }
  const r = await attach("task_architecture_components", taskId, componentId);
  if (!r.ok) return r;
  const ownership = await assertTaskInProject(taskId);
  if (ownership.ok) {
    revalidatePath(`/projects/${ownership.projectId}/tasks/${taskId}`);
    redirect(`/projects/${ownership.projectId}/tasks/${taskId}`);
  }
}

export async function attachEndpointToTask(formData: FormData) {
  const taskId = formData.get("taskId");
  const endpointId = formData.get("endpointId");
  if (typeof taskId !== "string" || !taskId || typeof endpointId !== "string" || !endpointId) {
    return { error: "Missing reference" } as const;
  }
  const r = await attach("task_api_endpoints", taskId, endpointId);
  if (!r.ok) return r;
  const ownership = await assertTaskInProject(taskId);
  if (ownership.ok) {
    revalidatePath(`/projects/${ownership.projectId}/tasks/${taskId}`);
    redirect(`/projects/${ownership.projectId}/tasks/${taskId}`);
  }
}

export async function attachUiScreenToTask(formData: FormData) {
  const taskId = formData.get("taskId");
  const screenId = formData.get("screenId");
  if (typeof taskId !== "string" || !taskId || typeof screenId !== "string" || !screenId) {
    return { error: "Missing reference" } as const;
  }
  const r = await attach("task_ui_screens", taskId, screenId);
  if (!r.ok) return r;
  const ownership = await assertTaskInProject(taskId);
  if (ownership.ok) {
    revalidatePath(`/projects/${ownership.projectId}/tasks/${taskId}`);
    redirect(`/projects/${ownership.projectId}/tasks/${taskId}`);
  }
}

async function detach(table: LinkTable, linkId: string, taskId: string) {
  const ownership = await assertTaskInProject(taskId);
  if (!ownership.ok) return { ok: false, error: ownership.error } as const;
  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq("id", linkId);
  if (error) return { ok: false, error: error.message } as const;
  revalidatePath(`/projects/${ownership.projectId}/tasks/${taskId}`);
  redirect(`/projects/${ownership.projectId}/tasks/${taskId}`);
}

export async function detachRequirementFromTask(formData: FormData) {
  const id = formData.get("id");
  const taskId = formData.get("taskId");
  if (typeof id !== "string" || !id || typeof taskId !== "string" || !taskId) {
    return { error: "Missing reference" } as const;
  }
  return detach("task_requirements", id, taskId);
}

export async function detachDecisionFromTask(formData: FormData) {
  const id = formData.get("id");
  const taskId = formData.get("taskId");
  if (typeof id !== "string" || !id || typeof taskId !== "string" || !taskId) {
    return { error: "Missing reference" } as const;
  }
  return detach("task_decisions", id, taskId);
}

export async function detachEntityFromTask(formData: FormData) {
  const id = formData.get("id");
  const taskId = formData.get("taskId");
  if (typeof id !== "string" || !id || typeof taskId !== "string" || !taskId) {
    return { error: "Missing reference" } as const;
  }
  return detach("task_domains", id, taskId);
}

export async function detachComponentFromTask(formData: FormData) {
  const id = formData.get("id");
  const taskId = formData.get("taskId");
  if (typeof id !== "string" || !id || typeof taskId !== "string" || !taskId) {
    return { error: "Missing reference" } as const;
  }
  return detach("task_architecture_components", id, taskId);
}

export async function detachEndpointFromTask(formData: FormData) {
  const id = formData.get("id");
  const taskId = formData.get("taskId");
  if (typeof id !== "string" || !id || typeof taskId !== "string" || !taskId) {
    return { error: "Missing reference" } as const;
  }
  return detach("task_api_endpoints", id, taskId);
}

export async function detachUiScreenFromTask(formData: FormData) {
  const id = formData.get("id");
  const taskId = formData.get("taskId");
  if (typeof id !== "string" || !id || typeof taskId !== "string" || !taskId) {
    return { error: "Missing reference" } as const;
  }
  return detach("task_ui_screens", id, taskId);
}
