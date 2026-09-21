"use client";

import { useActionState } from "react";

import {
  createApiError,
  updateApiError,
} from "@/lib/api/endpoints/sub-actions";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiError } from "@/lib/supabase/types";
import type { ApiErrorActionState } from "@/lib/validation/api";

const initialState: ApiErrorActionState | null = null;

export function ApiErrorForm({
  endpointId,
  apiError,
}: {
  endpointId: string;
  apiError?: ApiError;
}) {
  const action = apiError ? updateApiError : createApiError;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}
      <input type="hidden" name="endpointId" value={endpointId} />
      {apiError ? <input type="hidden" name="id" value={apiError.id} /> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="error_code">Code</Label>
          <Input
            id="error_code"
            name="code"
            required
            placeholder="VALIDATION_ERROR"
            defaultValue={apiError?.code ?? ""}
          />
          <FieldError messages={state?.fieldErrors?.code} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="error_http_status">HTTP status</Label>
          <Input
            id="error_http_status"
            name="http_status"
            type="number"
            min={100}
            max={599}
            placeholder="422"
            defaultValue={apiError?.http_status ?? ""}
          />
          <FieldError messages={state?.fieldErrors?.http_status} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="error_message">Message</Label>
        <Input
          id="error_message"
          name="message"
          required
          defaultValue={apiError?.message ?? ""}
        />
        <FieldError messages={state?.fieldErrors?.message} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="error_description">Description</Label>
        <Textarea
          id="error_description"
          name="description"
          rows={3}
          defaultValue={apiError?.description ?? ""}
        />
        <FieldError messages={state?.fieldErrors?.description} />
      </div>

      <Button type="submit" disabled={pending} className="mt-1">
        {pending ? "Saving…" : apiError ? "Save changes" : "Add error"}
      </Button>
    </form>
  );
}
