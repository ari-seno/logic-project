"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  taskDependencyInputSchema,
  type TaskDependencyActionState,
} from "@/lib/validation/tasks";
import { createClient } from "@/lib/supabase/server";
import { getTask } from "@/lib/tasks/queries";
import { wouldCreateDependencyCycle } from "@/lib/tasks/dependencies/queries";

function normalizeOpt(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function normalizeText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

async function assertTaskInProject(taskId: string) {
  const task = await getTask(taskId);
  if (!task) return { ok: false, error: "Task not found." } as const;
  return { ok: true, projectId: task.project_id } as const;
}

export async function addTaskDependency(
  _prev: TaskDependencyActionState | null,
  formData: FormData,
): Promise<TaskDependencyActionState> {
  const parsed = taskDependencyInputSchema.safeParse({
    depends_on_task_id: formData.get("depends_on_task_id"),
    dependency_type: formData.get("dependency_type") ?? "blocks",
    description: normalizeOpt(formData.get("description")),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as TaskDependencyActionState["fieldErrors"],
    };
  }

  const taskId = formData.get("taskId");
  if (typeof taskId !== "string" || !taskId) {
    return { error: "Missing task reference." };
  }
  const ownership = await assertTaskInProject(taskId);
  if (!ownership.ok) return { error: ownership.error };

  const dependsOn = await getTask(parsed.data.depends_on_task_id);
  if (!dependsOn || dependsOn.project_id !== ownership.projectId) {
    return { error: "Selected task is not part of this project." };
  }
  if (dependsOn.id === taskId) {
    return { error: "A task cannot depend on itself." };
  }
  if (parsed.data.dependency_type === "blocks") {
    if (await wouldCreateDependencyCycle(taskId, parsed.data.depends_on_task_id)) {
      return { error: "Adding this dependency would create a cycle." };
    }
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase.from("task_dependencies").insert({
    project_id: ownership.projectId,
    task_id: taskId,
    depends_on_task_id: parsed.data.depends_on_task_id,
    dependency_type: parsed.data.dependency_type as never,
    description: normalizeText(formData.get("description")) ?? null,
  });
  if (error) {
    if (error.code === "23505") {
      return { error: "That dependency already exists." };
    }
    return { error: error.message };
  }

  revalidatePath(`/projects/${ownership.projectId}/tasks/${taskId}`);
  revalidatePath(`/projects/${ownership.projectId}/tasks`);
  redirect(`/projects/${ownership.projectId}/tasks/${taskId}`);
}

export async function deleteTaskDependency(formData: FormData) {
  const id = formData.get("id");
  const taskId = formData.get("taskId");
  if (typeof id !== "string" || !id || typeof taskId !== "string" || !taskId) {
    return { error: "Invalid dependency reference" } as const;
  }
  const ownership = await assertTaskInProject(taskId);
  if (!ownership.ok) return { error: ownership.error } as const;

  const supabase = await createClient();
  const { error } = await supabase
    .from("task_dependencies")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message } as const;

  revalidatePath(`/projects/${ownership.projectId}/tasks/${taskId}`);
  revalidatePath(`/projects/${ownership.projectId}/tasks`);
  redirect(`/projects/${ownership.projectId}/tasks/${taskId}`);
}
