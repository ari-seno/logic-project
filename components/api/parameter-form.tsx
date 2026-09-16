"use client";

import { useActionState } from "react";

import {
  createApiParameter,
  updateApiParameter,
} from "@/lib/api/endpoints/sub-actions";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  API_PARAMETER_DATA_TYPES,
  API_PARAMETER_LOCATIONS,
  type ApiParameter,
} from "@/lib/supabase/types";
import type { ApiParameterActionState } from "@/lib/validation/api";

const initialState: ApiParameterActionState | null = null;

export function ApiParameterForm({
  endpointId,
  parameter,
}: {
  endpointId: string;
  parameter?: ApiParameter;
}) {
  const action = parameter ? updateApiParameter : createApiParameter;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}
      <input type="hidden" name="endpointId" value={endpointId} />
      {parameter ? <input type="hidden" name="id" value={parameter.id} /> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={parameter?.name ?? ""}
          />
          <FieldError messages={state?.fieldErrors?.name} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="location">Location</Label>
          <Select
            id="location"
            name="location"
            defaultValue={parameter?.location ?? "query"}
          >
            {API_PARAMETER_LOCATIONS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
          <FieldError messages={state?.fieldErrors?.location} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="data_type">Type</Label>
          <Select
            id="data_type"
            name="data_type"
            defaultValue={parameter?.data_type ?? "string"}
          >
            {API_PARAMETER_DATA_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <FieldError messages={state?.fieldErrors?.data_type} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="example">Example</Label>
        <Input
          id="example"
          name="example"
          defaultValue={parameter?.example ?? ""}
        />
        <FieldError messages={state?.fieldErrors?.example} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={parameter?.description ?? ""}
        />
        <FieldError messages={state?.fieldErrors?.description} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="required"
          defaultChecked={parameter?.required ?? false}
          className="h-4 w-4 rounded border-[var(--border)]"
        />
        Required
      </label>

      <Button type="submit" disabled={pending} className="mt-1">
        {pending
          ? "Saving…"
          : parameter
            ? "Save changes"
            : "Add parameter"}
      </Button>
    </form>
  );
}
