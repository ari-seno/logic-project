"use client";

import { useActionState } from "react";

import {
  createApiGroup,
  updateApiGroup,
} from "@/lib/api/groups/actions";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiGroupActionState } from "@/lib/validation/api";
import type { ApiGroup } from "@/lib/supabase/types";

const initialState: ApiGroupActionState | null = null;

export function ApiGroupForm({
  projectId,
  group,
}: {
  projectId: string;
  group?: ApiGroup;
}) {
  const action = group ? updateApiGroup : createApiGroup;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}
      <input type="hidden" name="projectId" value={projectId} />
      {group ? <input type="hidden" name="id" value={group.id} /> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={group?.name ?? ""}
          aria-invalid={Boolean(state?.fieldErrors?.name?.length) || undefined}
        />
        <FieldError messages={state?.fieldErrors?.name} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="prefix">URL prefix</Label>
        <Input
          id="prefix"
          name="prefix"
          placeholder="/api/auth"
          defaultValue={group?.prefix ?? ""}
          aria-invalid={
            Boolean(state?.fieldErrors?.prefix?.length) || undefined
          }
        />
        <FieldError messages={state?.fieldErrors?.prefix} />
        <p className="text-xs text-[var(--muted-foreground)]">
          Optional. Used to group endpoints that share a base path (e.g.{" "}
          <code>/api/auth</code>).
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={group?.description ?? ""}
          aria-invalid={
            Boolean(state?.fieldErrors?.description?.length) || undefined
          }
        />
        <FieldError messages={state?.fieldErrors?.description} />
      </div>

      <Button type="submit" disabled={pending} className="mt-1">
        {pending ? "Saving…" : group ? "Save changes" : "Create group"}
      </Button>
    </form>
  );
}
