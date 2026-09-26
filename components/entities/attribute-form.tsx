"use client";

import { useActionState } from "react";

import { createAttribute, updateAttribute } from "@/lib/attributes/actions";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  ENTITY_DATA_TYPES,
  type EntityAttribute,
} from "@/lib/supabase/types";
import type { AttributeActionState } from "@/lib/validation/attributes";

const initialState: AttributeActionState | null = null;

export function AttributeForm({
  entityId,
  attribute,
}: {
  entityId: string;
  attribute?: EntityAttribute;
}) {
  const isEdit = Boolean(attribute);
  const action = isEdit ? updateAttribute : createAttribute;

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="entityId" value={entityId} />
      {isEdit && attribute ? (
        <input type="hidden" name="id" value={attribute.id} />
      ) : null}

      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          maxLength={200}
          defaultValue={attribute?.name ?? ""}
          aria-invalid={Boolean(state?.fieldErrors?.name?.length) || undefined}
        />
        <FieldError messages={state?.fieldErrors?.name} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="data_type">Data type</Label>
          <Select
            id="data_type"
            name="data_type"
            defaultValue={attribute?.data_type ?? "string"}
            aria-invalid={
              Boolean(state?.fieldErrors?.data_type?.length) || undefined
            }
          >
            {ENTITY_DATA_TYPES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
          <FieldError messages={state?.fieldErrors?.data_type} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="default_value">Default value</Label>
          <Input
            id="default_value"
            name="default_value"
            maxLength={500}
            defaultValue={attribute?.default_value ?? ""}
            aria-invalid={
              Boolean(state?.fieldErrors?.default_value?.length) || undefined
            }
          />
          <FieldError messages={state?.fieldErrors?.default_value} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Flags</Label>
          <div className="flex flex-col gap-2 rounded-md border border-[var(--border)] bg-[var(--surface-1)] p-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_required"
                defaultChecked={attribute?.is_required ?? false}
              />
              Required
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_primary_key"
                defaultChecked={attribute?.is_primary_key ?? false}
              />
              Primary key
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          maxLength={5000}
          rows={3}
          defaultValue={attribute?.description ?? ""}
          aria-invalid={
            Boolean(state?.fieldErrors?.description?.length) || undefined
          }
        />
        <FieldError messages={state?.fieldErrors?.description} />
      </div>

      <Button type="submit" disabled={pending} className="self-start">
        {pending
          ? isEdit
            ? "Saving…"
            : "Creating…"
          : isEdit
            ? "Save changes"
            : "Add attribute"}
      </Button>
    </form>
  );
}
