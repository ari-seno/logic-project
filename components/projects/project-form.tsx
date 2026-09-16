"use client";

import { useActionState } from "react";

import { createProject } from "@/lib/projects/actions";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProjectActionState } from "@/lib/validation/projects";

const initialState: ProjectActionState | null = null;

export function ProjectForm() {
  const [state, formAction, pending] = useActionState(
    createProject,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          maxLength={120}
          aria-invalid={Boolean(state?.fieldErrors?.name?.length) || undefined}
        />
        <FieldError messages={state?.fieldErrors?.name} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          maxLength={2000}
          placeholder="What is this project about?"
          aria-invalid={
            Boolean(state?.fieldErrors?.description?.length) || undefined
          }
        />
        <FieldError messages={state?.fieldErrors?.description} />
      </div>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Creating…" : "Create project"}
      </Button>
    </form>
  );
}
