"use client";

import { useActionState } from "react";

import {
  createApiResponse,
  updateApiResponse,
} from "@/lib/api/endpoints/sub-actions";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiResponse } from "@/lib/supabase/types";
import type { ApiResponseActionState } from "@/lib/validation/api";

const initialState: ApiResponseActionState | null = null;

export function ApiResponseForm({
  endpointId,
  response,
}: {
  endpointId: string;
  response?: ApiResponse;
}) {
  const action = response ? updateApiResponse : createApiResponse;
  const [state, formAction, pending] = useActionState(action, initialState);

  const schemaText =
    response?.schema_definition !== undefined &&
    response?.schema_definition !== null
      ? JSON.stringify(response.schema_definition, null, 2)
      : "";
  const exampleText =
    response?.example !== undefined && response?.example !== null
      ? JSON.stringify(response.example, null, 2)
      : "";

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}
      <input type="hidden" name="endpointId" value={endpointId} />
      {response ? <input type="hidden" name="id" value={response.id} /> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status_code">Status code</Label>
          <Input
            id="status_code"
            name="status_code"
            type="number"
            min={100}
            max={599}
            required
            defaultValue={response?.status_code ?? 200}
          />
          <FieldError messages={state?.fieldErrors?.status_code} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="content_type">Content type</Label>
          <Input
            id="content_type"
            name="content_type"
            placeholder="application/json"
            defaultValue={response?.content_type ?? "application/json"}
          />
          <FieldError messages={state?.fieldErrors?.content_type} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={response?.description ?? ""}
        />
        <FieldError messages={state?.fieldErrors?.description} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="schema_definition">Schema (JSON)</Label>
        <Textarea
          id="schema_definition"
          name="schema_definition"
          rows={5}
          defaultValue={schemaText}
          className="font-mono text-xs"
        />
        <FieldError messages={state?.fieldErrors?.schema_definition} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="example">Example (JSON)</Label>
        <Textarea
          id="example"
          name="example"
          rows={5}
          defaultValue={exampleText}
          className="font-mono text-xs"
        />
        <FieldError messages={state?.fieldErrors?.example} />
      </div>

      <Button type="submit" disabled={pending} className="mt-1">
        {pending
          ? "Saving…"
          : response
            ? "Save changes"
            : "Add response"}
      </Button>
    </form>
  );
}
