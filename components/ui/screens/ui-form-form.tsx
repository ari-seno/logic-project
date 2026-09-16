"use client";

import { useActionState } from "react";

import {
  createUiForm,
  updateUiForm,
} from "@/lib/ui/forms/sub-actions";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UiForm } from "@/lib/supabase/types";
import type { UiFormActionState } from "@/lib/validation/ui";

const initialState: UiFormActionState | null = null;

export function UiFormForm({
  screenId,
  form,
}: {
  screenId: string;
  form?: UiForm;
}) {
  const action = form ? updateUiForm : createUiForm;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3" noValidate>
      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}
      <input type="hidden" name="screenId" value={screenId} />
      {form ? <input type="hidden" name="id" value={form.id} /> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Form name</Label>
        <Input id="name" name="name" required defaultValue={form?.name ?? ""} />
        <FieldError messages={state?.fieldErrors?.name} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="submit_label">Submit button label</Label>
        <Input
          id="submit_label"
          name="submit_label"
          placeholder="Save"
          defaultValue={form?.submit_label ?? ""}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="success_behavior">Success behavior</Label>
        <Textarea
          id="success_behavior"
          name="success_behavior"
          rows={2}
          defaultValue={form?.success_behavior ?? ""}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={form?.description ?? ""}
        />
      </div>
      <Button type="submit" disabled={pending} className="self-start" size="sm">
        {pending ? "Saving…" : form ? "Save" : "Add form"}
      </Button>
    </form>
  );
}
