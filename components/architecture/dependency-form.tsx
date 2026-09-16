"use client";

import { useActionState } from "react";

import { createArchitectureComponentDependency } from "@/lib/architecture/dependencies/actions";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type {
  ArchitectureComponent,
  ArchitectureComponentDependency,
} from "@/lib/supabase/types";
import type { ArchitectureComponentDependencyActionState } from "@/lib/validation/architecture/dependencies";

const initialState: ArchitectureComponentDependencyActionState | null = null;

export function ArchitectureComponentDependencyForm({
  projectId,
  components,
  dependency,
}: {
  projectId: string;
  components: ArchitectureComponent[];
  dependency?: ArchitectureComponentDependency;
}) {
  const [state, formAction, pending] = useActionState(
    createArchitectureComponentDependency,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}

      <input type="hidden" name="projectId" value={projectId} />
      {dependency ? <input type="hidden" name="id" value={dependency.id} /> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="source_component_id">Source component</Label>
        <Select
          id="source_component_id"
          name="source_component_id"
          required
          defaultValue={dependency?.source_component_id ?? ""}
          aria-invalid={
            Boolean(state?.fieldErrors?.source_component_id?.length) || undefined
          }
        >
          <option value="">Select…</option>
          {components.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <FieldError messages={state?.fieldErrors?.source_component_id} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="target_component_id">Target component</Label>
        <Select
          id="target_component_id"
          name="target_component_id"
          required
          defaultValue={dependency?.target_component_id ?? ""}
          aria-invalid={
            Boolean(state?.fieldErrors?.target_component_id?.length) || undefined
          }
        >
          <option value="">Select…</option>
          {components.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <FieldError messages={state?.fieldErrors?.target_component_id} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={dependency?.description ?? ""}
        />
        <FieldError messages={state?.fieldErrors?.description} />
      </div>

      <Button type="submit" disabled={pending} className="mt-1">
        {pending
          ? "Saving…"
          : dependency
            ? "Save changes"
            : "Create dependency"}
      </Button>
    </form>
  );
}
