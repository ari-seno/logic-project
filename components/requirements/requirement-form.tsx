"use client";

import { useActionState } from "react";

import {
  REQUIREMENT_PRIORITIES,
  REQUIREMENT_STATUSES,
  REQUIREMENT_TYPES,
  type Requirement,
} from "@/lib/supabase/types";
import { createRequirement, updateRequirement } from "@/lib/requirements/actions";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { RequirementActionState } from "@/lib/validation/requirements";

const initialState: RequirementActionState | null = null;

export function RequirementForm({
  projectId,
  requirement,
}: {
  projectId: string;
  requirement?: Requirement;
}) {
  const isEdit = Boolean(requirement);
  const action = isEdit ? updateRequirement : createRequirement;

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="projectId" value={projectId} />
      {isEdit && requirement ? (
        <input type="hidden" name="id" value={requirement.id} />
      ) : null}

      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={200}
          defaultValue={requirement?.title ?? ""}
          aria-invalid={Boolean(state?.fieldErrors?.title?.length) || undefined}
        />
        <FieldError messages={state?.fieldErrors?.title} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          maxLength={5000}
          rows={5}
          defaultValue={requirement?.description ?? ""}
          aria-invalid={
            Boolean(state?.fieldErrors?.description?.length) || undefined
          }
        />
        <FieldError messages={state?.fieldErrors?.description} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="type">Type</Label>
          <Select
            id="type"
            name="type"
            defaultValue={requirement?.type ?? "functional"}
            aria-invalid={Boolean(state?.fieldErrors?.type?.length) || undefined}
          >
            {REQUIREMENT_TYPES.map((value) => (
              <option key={value} value={value}>
                {value.replace("_", " ")}
              </option>
            ))}
          </Select>
          <FieldError messages={state?.fieldErrors?.type} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            name="status"
            defaultValue={requirement?.status ?? "draft"}
            aria-invalid={
              Boolean(state?.fieldErrors?.status?.length) || undefined
            }
          >
            {REQUIREMENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
          <FieldError messages={state?.fieldErrors?.status} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="priority">Priority</Label>
          <Select
            id="priority"
            name="priority"
            defaultValue={requirement?.priority ?? "medium"}
            aria-invalid={
              Boolean(state?.fieldErrors?.priority?.length) || undefined
            }
          >
            {REQUIREMENT_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
          <FieldError messages={state?.fieldErrors?.priority} />
        </div>
      </div>

      <Button type="submit" disabled={pending} className="self-start">
        {pending
          ? isEdit
            ? "Saving…"
            : "Creating…"
          : isEdit
            ? "Save changes"
            : "Create requirement"}
      </Button>
    </form>
  );
}
