"use client";

import { useActionState } from "react";

import {
  createUiState,
  updateUiState,
} from "@/lib/ui/forms/sub-actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  UI_STATE_TYPES,
  type UiState,
} from "@/lib/supabase/types";
import type { UiStateActionState } from "@/lib/validation/ui";

const initialState: UiStateActionState | null = null;

export function UiStateForm({
  screenId,
  uiState,
}: {
  screenId: string;
  uiState?: UiState;
}) {
  const action = uiState ? updateUiState : createUiState;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3" noValidate>
      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}
      <input type="hidden" name="screenId" value={screenId} />
      {uiState ? <input type="hidden" name="id" value={uiState.id} /> : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="state_name">Name</Label>
          <Input id="state_name" name="name" required defaultValue={uiState?.name ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="state_type">State type</Label>
          <Select
            id="state_type"
            name="state_type"
            defaultValue={uiState?.state_type ?? "default"}
          >
            {UI_STATE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="state_description">Description</Label>
        <Textarea
          id="state_description"
          name="description"
          rows={2}
          defaultValue={uiState?.description ?? ""}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="behavior">Behavior</Label>
        <Textarea
          id="behavior"
          name="behavior"
          rows={3}
          defaultValue={uiState?.behavior ?? ""}
        />
      </div>
      <Button type="submit" disabled={pending} className="self-start" size="sm">
        {pending ? "Saving…" : uiState ? "Save" : "Add state"}
      </Button>
    </form>
  );
}
