"use client";

import { useActionState } from "react";

import {
  createUiScreen,
  updateUiScreen,
} from "@/lib/ui/screens/actions";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  UI_SCREEN_TYPES,
  type UiScreen,
} from "@/lib/supabase/types";
import type { UiScreenActionState } from "@/lib/validation/ui";

const initialState: UiScreenActionState | null = null;

export function UiScreenForm({
  projectId,
  screen,
}: {
  projectId: string;
  screen?: UiScreen;
}) {
  const action = screen ? updateUiScreen : createUiScreen;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}
      <input type="hidden" name="projectId" value={projectId} />
      {screen ? <input type="hidden" name="id" value={screen.id} /> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={screen?.name ?? ""}
          aria-invalid={Boolean(state?.fieldErrors?.name?.length) || undefined}
        />
        <FieldError messages={state?.fieldErrors?.name} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="screen_type">Screen type</Label>
          <Select
            id="screen_type"
            name="screen_type"
            defaultValue={screen?.screen_type ?? "page"}
            aria-invalid={
              Boolean(state?.fieldErrors?.screen_type?.length) || undefined
            }
          >
            {UI_SCREEN_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
          <FieldError messages={state?.fieldErrors?.screen_type} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="route">Route</Label>
          <Input
            id="route"
            name="route"
            placeholder="/projects/:projectId"
            defaultValue={screen?.route ?? ""}
            aria-invalid={
              Boolean(state?.fieldErrors?.route?.length) || undefined
            }
          />
          <FieldError messages={state?.fieldErrors?.route} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="purpose">Purpose</Label>
        <Textarea
          id="purpose"
          name="purpose"
          rows={2}
          defaultValue={screen?.purpose ?? ""}
        />
        <FieldError messages={state?.fieldErrors?.purpose} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={screen?.description ?? ""}
        />
        <FieldError messages={state?.fieldErrors?.description} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="authentication_required"
          defaultChecked={screen?.authentication_required ?? true}
          className="h-4 w-4 rounded border-[var(--border)]"
        />
        Authentication required
      </label>

      <Button type="submit" disabled={pending} className="mt-1">
        {pending ? "Saving…" : screen ? "Save changes" : "Create screen"}
      </Button>
    </form>
  );
}
