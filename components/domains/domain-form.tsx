"use client";

import { useActionState } from "react";

import { createDomain, updateDomain } from "@/lib/domains/actions";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Domain } from "@/lib/supabase/types";
import type { DomainActionState } from "@/lib/validation/domains";

const initialState: DomainActionState | null = null;

export function DomainForm({
  projectId,
  domain,
}: {
  projectId: string;
  domain?: Domain;
}) {
  const isEdit = Boolean(domain);
  const action = isEdit ? updateDomain : createDomain;

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="projectId" value={projectId} />
      {isEdit && domain ? (
        <input type="hidden" name="id" value={domain.id} />
      ) : null}

      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          maxLength={200}
          defaultValue={domain?.name ?? ""}
          aria-invalid={Boolean(state?.fieldErrors?.name?.length) || undefined}
        />
        <FieldError messages={state?.fieldErrors?.name} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          maxLength={5000}
          rows={4}
          defaultValue={domain?.description ?? ""}
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
            : "Create domain"}
      </Button>
    </form>
  );
}
