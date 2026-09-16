"use client";

import { useActionState } from "react";

import { addScreenComponent } from "@/lib/ui/screen-components/actions";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { UiComponent } from "@/lib/supabase/types";
import type { ScreenComponentWithComponent } from "@/lib/ui/screen-components/queries";
import type { UiScreenComponentActionState } from "@/lib/validation/ui";

const initialState: UiScreenComponentActionState | null = null;

export function AddScreenComponentForm({
  screenId,
  availableComponents,
  existingPlacements,
}: {
  screenId: string;
  availableComponents: UiComponent[];
  existingPlacements: ScreenComponentWithComponent[];
}) {
  const [state, formAction, pending] = useActionState(
    addScreenComponent,
    initialState,
  );

  if (availableComponents.length === 0) {
    return (
      <p className="text-xs text-[var(--muted-foreground)]">
        Define components in the project first to assemble screens.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}
      <input type="hidden" name="screenId" value={screenId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="component_id">Component</Label>
          <Select
            id="component_id"
            name="component_id"
            required
            aria-invalid={
              Boolean(state?.fieldErrors?.component_id?.length) || undefined
            }
          >
            <option value="">Select…</option>
            {availableComponents.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.component_type})
              </option>
            ))}
          </Select>
          <FieldError messages={state?.fieldErrors?.component_id} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="parent_id">Parent (optional)</Label>
          <Select id="parent_id" name="parent_id" defaultValue="">
            <option value="">(top level)</option>
            {existingPlacements.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label || p.component_name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="label">Label override</Label>
        <Input
          id="label"
          name="label"
          placeholder="Optional override for this placement"
        />
        <FieldError messages={state?.fieldErrors?.label} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={2} />
        <FieldError messages={state?.fieldErrors?.description} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="required"
          className="h-4 w-4 rounded border-[var(--border)]"
        />
        Required for this screen
      </label>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Add placement"}
      </Button>
    </form>
  );
}
