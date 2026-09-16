"use client";

import { useActionState } from "react";

import { createArchitectureTechnology } from "@/lib/architecture/technologies/actions";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  ARCHITECTURE_TECHNOLOGY_CATEGORIES,
  type ArchitectureTechnology,
} from "@/lib/supabase/types";
import type { ArchitectureTechnologyActionState } from "@/lib/validation/architecture/technologies";

const initialState: ArchitectureTechnologyActionState | null = null;

export function ArchitectureTechnologyForm({
  projectId,
  technology,
}: {
  projectId: string;
  technology?: ArchitectureTechnology;
}) {
  const [state, formAction, pending] = useActionState(
    createArchitectureTechnology,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}

      <input type="hidden" name="projectId" value={projectId} />
      {technology ? <input type="hidden" name="id" value={technology.id} /> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={technology?.name ?? ""}
          aria-invalid={Boolean(state?.fieldErrors?.name?.length) || undefined}
        />
        <FieldError messages={state?.fieldErrors?.name} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category">Category</Label>
        <Select
          id="category"
          name="category"
          defaultValue={technology?.category ?? "language"}
          aria-invalid={
            Boolean(state?.fieldErrors?.category?.length) || undefined
          }
        >
          {ARCHITECTURE_TECHNOLOGY_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
        <FieldError messages={state?.fieldErrors?.category} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={technology?.description ?? ""}
          aria-invalid={
            Boolean(state?.fieldErrors?.description?.length) || undefined
          }
        />
        <FieldError messages={state?.fieldErrors?.description} />
      </div>

      <Button type="submit" disabled={pending} className="mt-1">
        {pending
          ? "Saving…"
          : technology
            ? "Save changes"
            : "Create technology"}
      </Button>
    </form>
  );
}
