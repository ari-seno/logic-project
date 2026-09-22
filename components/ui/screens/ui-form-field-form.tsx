"use client";

import { useActionState } from "react";

import {
  createUiFormField,
  updateUiFormField,
} from "@/lib/ui/forms/sub-actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  UI_FIELD_TYPES,
  type UiFormField,
} from "@/lib/supabase/types";
import type { UiFormFieldActionState } from "@/lib/validation/ui";

const initialState: UiFormFieldActionState | null = null;

export function UiFormFieldForm({
  formId,
  field,
}: {
  formId: string;
  field?: UiFormField;
}) {
  const action = field ? updateUiFormField : createUiFormField;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3" noValidate>
      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}
      <input type="hidden" name="formId" value={formId} />
      {field ? <input type="hidden" name="id" value={field.id} /> : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="field_name">Name</Label>
          <Input id="field_name" name="name" required defaultValue={field?.name ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="field_label">Label</Label>
          <Input id="field_label" name="label" required defaultValue={field?.label ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="field_type">Type</Label>
          <Select
            id="field_type"
            name="field_type"
            defaultValue={field?.field_type ?? "text"}
          >
            {UI_FIELD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="placeholder">Placeholder</Label>
        <Input
          id="placeholder"
          name="placeholder"
          defaultValue={field?.placeholder ?? ""}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="help_text">Help text</Label>
        <Textarea
          id="help_text"
          name="help_text"
          rows={2}
          defaultValue={field?.help_text ?? ""}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="default_value">Default value</Label>
        <Input
          id="default_value"
          name="default_value"
          defaultValue={field?.default_value ?? ""}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="required"
          defaultChecked={field?.required ?? false}
          className="h-4 w-4 rounded border-[var(--border)]"
        />
        Required
      </label>
      <Button type="submit" disabled={pending} className="self-start" size="sm">
        {pending ? "Saving…" : field ? "Save" : "Add field"}
      </Button>
    </form>
  );
}
