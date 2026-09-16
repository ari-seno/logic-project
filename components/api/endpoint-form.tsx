"use client";

import { useActionState } from "react";

import {
  createApiEndpoint,
  updateApiEndpoint,
} from "@/lib/api/endpoints/actions";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  API_HTTP_METHODS,
  type ApiEndpoint,
  type ApiGroup,
  type ApiHttpMethod,
} from "@/lib/supabase/types";
import type { ApiEndpointActionState } from "@/lib/validation/api";

const initialState: ApiEndpointActionState | null = null;

export function ApiEndpointForm({
  projectId,
  endpoint,
  groups,
}: {
  projectId: string;
  endpoint?: ApiEndpoint;
  groups: ApiGroup[];
}) {
  const action = endpoint ? updateApiEndpoint : createApiEndpoint;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}
      <input type="hidden" name="projectId" value={projectId} />
      {endpoint ? <input type="hidden" name="id" value={endpoint.id} /> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="method">Method</Label>
          <Select
            id="method"
            name="method"
            defaultValue={endpoint?.method ?? "GET"}
            aria-invalid={
              Boolean(state?.fieldErrors?.method?.length) || undefined
            }
          >
            {API_HTTP_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <FieldError messages={state?.fieldErrors?.method} />
        </div>

        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <Label htmlFor="path">Path</Label>
          <Input
            id="path"
            name="path"
            placeholder="/api/projects"
            required
            defaultValue={endpoint?.path ?? ""}
            aria-invalid={
              Boolean(state?.fieldErrors?.path?.length) || undefined
            }
          />
          <FieldError messages={state?.fieldErrors?.path} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={endpoint?.name ?? ""}
          aria-invalid={Boolean(state?.fieldErrors?.name?.length) || undefined}
        />
        <FieldError messages={state?.fieldErrors?.name} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="group_id">Group</Label>
        <Select
          id="group_id"
          name="group_id"
          defaultValue={endpoint?.group_id ?? ""}
          aria-invalid={
            Boolean(state?.fieldErrors?.group_id?.length) || undefined
          }
        >
          <option value="">Ungrouped</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
        <FieldError messages={state?.fieldErrors?.group_id} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="summary">Summary</Label>
        <Input
          id="summary"
          name="summary"
          defaultValue={endpoint?.summary ?? ""}
          aria-invalid={
            Boolean(state?.fieldErrors?.summary?.length) || undefined
          }
        />
        <FieldError messages={state?.fieldErrors?.summary} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={endpoint?.description ?? ""}
          aria-invalid={
            Boolean(state?.fieldErrors?.description?.length) || undefined
          }
        />
        <FieldError messages={state?.fieldErrors?.description} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="authentication_required"
          defaultChecked={endpoint?.authentication_required ?? true}
          className="h-4 w-4 rounded border-[var(--border)]"
        />
        Authentication required
      </label>

      <Button type="submit" disabled={pending} className="mt-1">
        {pending
          ? "Saving…"
          : endpoint
            ? "Save changes"
            : "Create endpoint"}
      </Button>
    </form>
  );
}

export function methodColor(method: ApiHttpMethod) {
  return method;
}
