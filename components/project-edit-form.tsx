"use client";

import { useActionState } from "react";

import {
  updateProject,
} from "@/lib/projects/actions";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProjectActionState } from "@/lib/validation/projects";

const initialState: ProjectActionState | null = null;

export function ProjectEditForm({
  projectId,
  name,
  description,
}: {
  projectId: string;
  name: string;
  description: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateProject, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}
      <input type="hidden" name="id" value={projectId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="project-name">Name</Label>
        <Input
          id="project-name"
          name="name"
          required
          defaultValue={name}
          aria-invalid={Boolean(state?.fieldErrors?.name?.length) || undefined}
        />
        <FieldError messages={state?.fieldErrors?.name} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="project-description">Description</Label>
        <Textarea
          id="project-description"
          name="description"
          rows={5}
          defaultValue={description ?? ""}
          placeholder="Describe what this project is about, goals, target users…"
          aria-invalid={
            Boolean(state?.fieldErrors?.description?.length) || undefined
          }
        />
        <FieldError messages={state?.fieldErrors?.description} />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <ButtonLink href={`/projects/${projectId}`} variant="ghost" size="md">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}
