"use client";

import { useActionState } from "react";

import { createArchitectureComponent } from "@/lib/architecture/components/actions";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  ARCHITECTURE_COMPONENT_TYPES,
  type ArchitectureComponent,
} from "@/lib/supabase/types";
import type { ArchitectureComponentActionState } from "@/lib/validation/architecture/components";

const initialState: ArchitectureComponentActionState | null = null;

export function ArchitectureComponentForm({
  projectId,
  component,
}: {
  projectId: string;
  component?: ArchitectureComponent;
}) {
  const [state, formAction, pending] = useActionState(
    createArchitectureComponent,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}

      <input type="hidden" name="projectId" value={projectId} />
      {component ? <input type="hidden" name="id" value={component.id} /> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={component?.name ?? ""}
          aria-invalid={Boolean(state?.fieldErrors?.name?.length) || undefined}
        />
        <FieldError messages={state?.fieldErrors?.name} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="type">Type</Label>
        <Select
          id="type"
          name="type"
          defaultValue={component?.type ?? "frontend"}
          aria-invalid={Boolean(state?.fieldErrors?.type?.length) || undefined}
        >
          {ARCHITECTURE_COMPONENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
        <FieldError messages={state?.fieldErrors?.type} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={component?.description ?? ""}
          aria-invalid={
            Boolean(state?.fieldErrors?.description?.length) || undefined
          }
        />
        <FieldError messages={state?.fieldErrors?.description} />
      </div>

      <Button type="submit" disabled={pending} className="mt-1">
        {pending
          ? "Saving…"
          : component
            ? "Save changes"
            : "Create component"}
      </Button>
    </form>
  );
}
