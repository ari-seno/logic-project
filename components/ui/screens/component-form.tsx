"use client";

import { useActionState } from "react";

import {
  createUiComponent,
  updateUiComponent,
} from "@/lib/ui/components/actions";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  UI_COMPONENT_TYPES,
  type UiComponent,
} from "@/lib/supabase/types";
import type { UiComponentActionState } from "@/lib/validation/ui";

const initialState: UiComponentActionState | null = null;

export function UiComponentForm({
  projectId,
  component,
}: {
  projectId: string;
  component?: UiComponent;
}) {
  const action = component ? updateUiComponent : createUiComponent;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}
      <input type="hidden" name="projectId" value={projectId} />
      {component ? <input type="hidden" name="id" value={component.id} /> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <Label htmlFor="component_type">Component type</Label>
          <Select
            id="component_type"
            name="component_type"
            defaultValue={component?.component_type ?? "card"}
            aria-invalid={
              Boolean(state?.fieldErrors?.component_type?.length) || undefined
            }
          >
            {UI_COMPONENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
          <FieldError messages={state?.fieldErrors?.component_type} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="technology">Technology</Label>
        <Input
          id="technology"
          name="technology"
          placeholder="React, Vue, vanilla…"
          defaultValue={component?.technology ?? ""}
        />
        <FieldError messages={state?.fieldErrors?.technology} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="purpose">Purpose</Label>
        <Textarea
          id="purpose"
          name="purpose"
          rows={2}
          defaultValue={component?.purpose ?? ""}
        />
        <FieldError messages={state?.fieldErrors?.purpose} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={component?.description ?? ""}
        />
        <FieldError messages={state?.fieldErrors?.description} />
      </div>

      <Button type="submit" disabled={pending} className="mt-1">
        {pending ? "Saving…" : component ? "Save changes" : "Create component"}
      </Button>
    </form>
  );
}
