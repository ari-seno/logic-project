"use client";

import { useActionState } from "react";

import {
  createTask,
  updateTask,
} from "@/lib/tasks/actions";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  TASK_EFFORTS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TYPES,
  type Task,
} from "@/lib/supabase/types";
import type { TaskActionState } from "@/lib/validation/tasks";

const initialState: TaskActionState | null = null;

export function TaskForm({
  projectId,
  task,
  parentOptions,
}: {
  projectId: string;
  task?: Task;
  parentOptions: { id: string; title: string }[];
}) {
  const action = task ? updateTask : createTask;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}
      <input type="hidden" name="projectId" value={projectId} />
      {task ? <input type="hidden" name="id" value={task.id} /> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={task?.title ?? ""}
          aria-invalid={Boolean(state?.fieldErrors?.title?.length) || undefined}
        />
        <FieldError messages={state?.fieldErrors?.title} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="task_type">Type</Label>
          <Select
            id="task_type"
            name="task_type"
            defaultValue={task?.task_type ?? "feature"}
          >
            {TASK_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <FieldError messages={state?.fieldErrors?.task_type} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="priority">Priority</Label>
          <Select
            id="priority"
            name="priority"
            defaultValue={task?.priority ?? "medium"}
          >
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            name="status"
            defaultValue={task?.status ?? "todo"}
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="estimated_effort">Effort</Label>
          <Select
            id="estimated_effort"
            name="estimated_effort"
            defaultValue={task?.estimated_effort ?? ""}
          >
            <option value="">(none)</option>
            {TASK_EFFORTS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="parent_task_id">Parent task</Label>
        <Select
          id="parent_task_id"
          name="parent_task_id"
          defaultValue={task?.parent_task_id ?? ""}
        >
          <option value="">(top level)</option>
          {parentOptions
            .filter((p) => p.id !== task?.id)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
        </Select>
        <FieldError messages={state?.fieldErrors?.parent_task_id} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={task?.description ?? ""}
        />
        <FieldError messages={state?.fieldErrors?.description} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="acceptance_criteria">Acceptance criteria</Label>
        <Textarea
          id="acceptance_criteria"
          name="acceptance_criteria"
          rows={4}
          defaultValue={task?.acceptance_criteria ?? ""}
        />
        <FieldError messages={state?.fieldErrors?.acceptance_criteria} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="implementation_notes">Implementation notes</Label>
        <Textarea
          id="implementation_notes"
          name="implementation_notes"
          rows={4}
          defaultValue={task?.implementation_notes ?? ""}
        />
        <FieldError messages={state?.fieldErrors?.implementation_notes} />
      </div>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : task ? "Save changes" : "Create task"}
      </Button>
    </form>
  );
}
