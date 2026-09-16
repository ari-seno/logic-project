"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  taskInputSchema,
  taskUpdateSchema,
  type TaskActionState,
} from "@/lib/validation/tasks";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/projects/queries";
import {
  getTask,
  nextTaskPosition,
  wouldCreateParentCycle,
} from "./queries";

async function assertOwnsProject(projectId: string) {
  const project = await getProject(projectId);
  if (!project) return { ok: false, error: "Project not found." } as const;
  return { ok: true } as const;
}

async function assertTaskSameProject(taskId: string) {
  const task = await getTask(taskId);
  if (!task) return { ok: false, error: "Task not found." } as const;
  return { ok: true, projectId: task.project_id } as const;
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

function normalizeParentedId(value: FormDataEntryValue | null): string | null {
  const norm = normalizeText(value);
  return norm === null ? null : norm;
}

export async function createTask(
  _prev: TaskActionState | null,
  formData: FormData,
): Promise<TaskActionState> {
  const parsed = taskInputSchema.safeParse({
    title: formData.get("title"),
    description: normalizeOpt(formData.get("description")),
    task_type: formData.get("task_type"),
    status: formData.get("status") ?? "todo",
    priority: formData.get("priority") ?? "medium",
    estimated_effort: formData.get("estimated_effort") ?? "",
    acceptance_criteria: normalizeOpt(formData.get("acceptance_criteria")),
    implementation_notes: normalizeOpt(formData.get("implementation_notes")),
    parent_task_id: formData.get("parent_task_id") ?? "",
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as TaskActionState["fieldErrors"],
    };
  }

  const projectId = formData.get("projectId");
  if (typeof projectId !== "string" || !projectId) {
    return { error: "Missing project reference." };
  }
  const owned = await assertOwnsProject(projectId);
  if (!owned.ok) return { error: owned.error };

  const parentId = normalizeParentedId(formData.get("parent_task_id"));
  if (parentId) {
    const parentTask = await getTask(parentId);
    if (!parentTask || parentTask.project_id !== projectId) {
      return { error: "Parent task must belong to this project." };
    }
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const position = await nextTaskPosition(projectId);
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      parent_task_id: parentId,
      title: parsed.data.title,
      description: normalizeText(formData.get("description")) ?? null,
      task_type: parsed.data.task_type as never,
      status: (parsed.data.status as never) ?? "todo",
      priority: (parsed.data.priority as never) ?? "medium",
      estimated_effort: (parsed.data.estimated_effort || null) as never,
      acceptance_criteria: normalizeText(formData.get("acceptance_criteria")) ?? null,
      implementation_notes: normalizeText(formData.get("implementation_notes")) ?? null,
      position,
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "Failed to create task." };

  revalidatePath(`/projects/${projectId}/tasks`);
  redirect(`/projects/${projectId}/tasks/${data.id}`);
}

export async function updateTask(
  _prev: TaskActionState | null,
  formData: FormData,
): Promise<TaskActionState> {
  const parsed = taskUpdateSchema.safeParse({
    title: formData.get("title"),
    description: normalizeOpt(formData.get("description")),
    task_type: formData.get("task_type"),
    status: formData.get("status") ?? "todo",
    priority: formData.get("priority") ?? "medium",
    estimated_effort: formData.get("estimated_effort") ?? "",
    acceptance_criteria: normalizeOpt(formData.get("acceptance_criteria")),
    implementation_notes: normalizeOpt(formData.get("implementation_notes")),
    parent_task_id: formData.get("parent_task_id") ?? "",
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as TaskActionState["fieldErrors"],
    };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) return { error: "Missing task reference." };
  const ownership = await assertTaskSameProject(id);
  if (!ownership.ok) return { error: ownership.error };

  const parentId = normalizeParentedId(formData.get("parent_task_id"));
  if (parentId) {
    if (parentId === id) {
      return { error: "A task cannot be its own parent." };
    }
    const parentTask = await getTask(parentId);
    if (!parentTask || parentTask.project_id !== ownership.projectId) {
      return { error: "Parent task must belong to this project." };
    }
    if (await wouldCreateParentCycle(id, parentId)) {
      return { error: "That parent choice would create a cycle." };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      title: parsed.data.title,
      description: normalizeText(formData.get("description")) ?? null,
      task_type: parsed.data.task_type as never,
      status: formData.get("status") as never,
      priority: formData.get("priority") as never,
      estimated_effort: (parsed.data.estimated_effort || null) as never,
      acceptance_criteria: normalizeText(formData.get("acceptance_criteria")) ?? null,
      implementation_notes: normalizeText(formData.get("implementation_notes")) ?? null,
      parent_task_id: parentId,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${ownership.projectId}/tasks`);
  revalidatePath(`/projects/${ownership.projectId}/tasks/${id}`);
  redirect(`/projects/${ownership.projectId}/tasks/${id}`);
}

export async function updateTaskStatus(formData: FormData) {
  const id = formData.get("id");
  const status = formData.get("status");
  if (typeof id !== "string" || !id) return { error: "Missing task reference" } as const;
  if (typeof status !== "string" || !status) return { error: "Missing status" } as const;
  const ownership = await assertTaskSameProject(id);
  if (!ownership.ok) return { error: ownership.error } as const;

  const allowed = ["todo", "ready", "in_progress", "blocked", "review", "done", "cancelled"];
  if (!allowed.includes(status)) {
    return { error: "Unsupported status" } as const;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update({ status: status as never }).eq("id", id);
  if (error) return { error: error.message } as const;
  revalidatePath(`/projects/${ownership.projectId}/tasks`);
  revalidatePath(`/projects/${ownership.projectId}/tasks/${id}`);
  return { ok: true } as const;
}

export async function deleteTask(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Invalid task reference" } as const;
  }
  const ownership = await assertTaskSameProject(id);
  if (!ownership.ok) return { error: ownership.error } as const;

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return { error: error.message } as const;
  revalidatePath(`/projects/${ownership.projectId}/tasks`);
  redirect(`/projects/${ownership.projectId}/tasks`);
}
