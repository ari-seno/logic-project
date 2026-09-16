"use client";

import { useActionState } from "react";

import {
  createUiNavigationItem,
  updateUiNavigationItem,
} from "@/lib/ui/navigation/actions";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { UiNavigationItem } from "@/lib/supabase/types";
import type { UiNavigationItemActionState } from "@/lib/validation/ui";

const initialState: UiNavigationItemActionState | null = null;

export function UiNavigationItemForm({
  projectId,
  item,
  availableParents,
}: {
  projectId: string;
  item?: UiNavigationItem;
  availableParents: UiNavigationItem[];
}) {
  const action = item ? updateUiNavigationItem : createUiNavigationItem;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}
      <input type="hidden" name="projectId" value={projectId} />
      {item ? <input type="hidden" name="id" value={item.id} /> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required defaultValue={item?.name ?? ""} />
          <FieldError messages={state?.fieldErrors?.name} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="label">Label</Label>
          <Input id="label" name="label" required defaultValue={item?.label ?? ""} />
          <FieldError messages={state?.fieldErrors?.label} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="route">Route</Label>
        <Input id="route" name="route" defaultValue={item?.route ?? ""} placeholder="/dashboard" />
        <FieldError messages={state?.fieldErrors?.route} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="parent_id">Parent</Label>
        <Select id="parent_id" name="parent_id" defaultValue={item?.parent_id ?? ""}>
          <option value="">(top level)</option>
          {availableParents
            .filter((p) => p.id !== item?.id)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={item?.description ?? ""}
        />
      </div>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : item ? "Save changes" : "Create navigation item"}
      </Button>
    </form>
  );
}
