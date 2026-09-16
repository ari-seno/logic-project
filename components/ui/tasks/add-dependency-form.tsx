"use client";

import { useActionState } from "react";

import {
  addTaskDependency,
} from "@/lib/tasks/dependencies/actions";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  TASK_DEPENDENCY_TYPES,
  type Task,
} from "@/lib/supabase/types";
import type { TaskDependencyActionState } from "@/lib/validation/tasks";

const initialState: TaskDependencyActionState | null = null;

export function AddDependencyForm({
  taskId,
  candidates,
}: {
  taskId: string;
  candidates: Task[];
}) {
  const [state, formAction, pending] = useActionState(
    addTaskDependency,
    initialState,
  );

  if (candidates.length === 0) {
    return (
      <p className="text-xs text-[var(--muted-foreground)]">
        No other tasks in this project to depend on.
      </p>
    );
  }
  return (
    <form action={formAction} className="flex flex-col gap-3" noValidate>
      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}
      <input type="hidden" name="taskId" value={taskId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="depends_on_task_id">Depends on</Label>
          <Select
            id="depends_on_task_id"
            name="depends_on_task_id"
            required
            aria-invalid={
              Boolean(state?.fieldErrors?.depends_on_task_id?.length) ||
              undefined
            }
          >
            <option value="">Select…</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </Select>
          <FieldError messages={state?.fieldErrors?.depends_on_task_id} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dependency_type">Type</Label>
          <Select
            id="dependency_type"
            name="dependency_type"
            defaultValue="blocks"
          >
            {TASK_DEPENDENCY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={2} />
      </div>
      <Button type="submit" disabled={pending} className="self-start" size="sm">
        {pending ? "Saving…" : "Add dependency"}
      </Button>
    </form>
  );
}
