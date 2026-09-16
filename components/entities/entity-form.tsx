"use client";

import { useActionState } from "react";

import { createEntity, updateEntity } from "@/lib/entities/actions";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Entity } from "@/lib/supabase/types";
import type { EntityActionState } from "@/lib/validation/entities";

const initialState: EntityActionState | null = null;

export function EntityForm({
  domainId,
  entity,
}: {
  domainId: string;
  entity?: Entity;
}) {
  const isEdit = Boolean(entity);
  const action = isEdit ? updateEntity : createEntity;

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="domainId" value={domainId} />
      {isEdit && entity ? (
        <input type="hidden" name="id" value={entity.id} />
      ) : null}

      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          maxLength={200}
          defaultValue={entity?.name ?? ""}
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
          defaultValue={entity?.description ?? ""}
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
            : "Create entity"}
      </Button>
    </form>
  );
}
