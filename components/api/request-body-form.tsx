"use client";

import { useActionState } from "react";

import { upsertApiRequestBody } from "@/lib/api/endpoints/sub-actions";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiRequestBody } from "@/lib/supabase/types";
import type { ApiRequestBodyActionState } from "@/lib/validation/api";

const initialState: ApiRequestBodyActionState | null = null;

export function ApiRequestBodyForm({
  endpointId,
  body,
}: {
  endpointId: string;
  body?: ApiRequestBody | null;
}) {
  const [state, formAction, pending] = useActionState(
    upsertApiRequestBody,
    initialState,
  );

  const schemaText =
    body?.schema_definition !== undefined && body?.schema_definition !== null
      ? JSON.stringify(body.schema_definition, null, 2)
      : "";
  const exampleText =
    body?.example !== undefined && body?.example !== null
      ? JSON.stringify(body.example, null, 2)
      : "";

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}
      <input type="hidden" name="endpointId" value={endpointId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="request_body_content_type">Content type</Label>
        <Input
          id="request_body_content_type"
          name="content_type"
          required
          placeholder="application/json"
          defaultValue={body?.content_type ?? "application/json"}
        />
        <FieldError messages={state?.fieldErrors?.content_type} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="request_body_description">Description</Label>
        <Textarea
          id="request_body_description"
          name="description"
          rows={2}
          defaultValue={body?.description ?? ""}
        />
        <FieldError messages={state?.fieldErrors?.description} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="request_body_schema_definition">Schema (JSON)</Label>
        <Textarea
          id="request_body_schema_definition"
          name="schema_definition"
          rows={5}
          placeholder='{"fields":[{"name":"email","type":"string","required":true}]}'
          defaultValue={schemaText}
          className="font-mono text-xs"
        />
        <FieldError messages={state?.fieldErrors?.schema_definition} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="request_body_example">Example (JSON)</Label>
        <Textarea
          id="request_body_example"
          name="example"
          rows={5}
          placeholder='{"email":"alice@example.com"}'
          defaultValue={exampleText}
          className="font-mono text-xs"
        />
        <FieldError messages={state?.fieldErrors?.example} />
      </div>

      <Button type="submit" disabled={pending} className="mt-1">
        {pending ? "Saving…" : body ? "Save changes" : "Create request body"}
      </Button>
    </form>
  );
}
