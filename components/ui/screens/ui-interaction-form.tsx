"use client";

import { useActionState } from "react";

import {
  createUiInteraction,
  updateUiInteraction,
} from "@/lib/ui/forms/sub-actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UiInteraction } from "@/lib/supabase/types";
import type { UiInteractionActionState } from "@/lib/validation/ui";

const initialState: UiInteractionActionState | null = null;

export function UiInteractionForm({
  screenId,
  interaction,
}: {
  screenId: string;
  interaction?: UiInteraction;
}) {
  const action = interaction ? updateUiInteraction : createUiInteraction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3" noValidate>
      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}
      <input type="hidden" name="screenId" value={screenId} />
      {interaction ? <input type="hidden" name="id" value={interaction.id} /> : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="interaction_name">Name</Label>
        <Input id="interaction_name" name="name" required defaultValue={interaction?.name ?? ""} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="trigger">Trigger</Label>
        <Input id="trigger" name="trigger" required defaultValue={interaction?.trigger ?? ""} placeholder="Click submit" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="action">Action</Label>
        <Input id="action" name="action" required defaultValue={interaction?.action ?? ""} placeholder="POST /api/projects" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="interaction_description">Description</Label>
        <Textarea
          id="interaction_description"
          name="description"
          rows={2}
          defaultValue={interaction?.description ?? ""}
        />
      </div>
      <Button type="submit" disabled={pending} className="self-start" size="sm">
        {pending ? "Saving…" : interaction ? "Save" : "Add interaction"}
      </Button>
    </form>
  );
}
