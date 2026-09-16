"use client";

import { useActionState } from "react";

import {
  DECISION_STATUSES,
  type Decision,
} from "@/lib/supabase/types";
import { createDecision, updateDecision } from "@/lib/decisions/actions";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { DecisionActionState } from "@/lib/validation/decisions";

const initialState: DecisionActionState | null = null;

export function DecisionForm({
  projectId,
  decision,
}: {
  projectId: string;
  decision?: Decision;
}) {
  const isEdit = Boolean(decision);
  const action = isEdit ? updateDecision : createDecision;

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="projectId" value={projectId} />
      {isEdit && decision ? (
        <input type="hidden" name="id" value={decision.id} />
      ) : null}

      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={200}
          defaultValue={decision?.title ?? ""}
          placeholder="e.g. Choose database"
          aria-invalid={Boolean(state?.fieldErrors?.title?.length) || undefined}
        />
        <FieldError messages={state?.fieldErrors?.title} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="context">Context</Label>
        <Textarea
          id="context"
          name="context"
          maxLength={5000}
          rows={3}
          defaultValue={decision?.context ?? ""}
          placeholder="What situation prompted this decision?"
          aria-invalid={
            Boolean(state?.fieldErrors?.context?.length) || undefined
          }
        />
        <FieldError messages={state?.fieldErrors?.context} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="decision">Decision</Label>
        <Textarea
          id="decision"
          name="decision"
          required
          maxLength={2000}
          rows={3}
          defaultValue={decision?.decision ?? ""}
          placeholder="What was decided?"
          aria-invalid={
            Boolean(state?.fieldErrors?.decision?.length) || undefined
          }
        />
        <FieldError messages={state?.fieldErrors?.decision} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rationale">Rationale</Label>
        <Textarea
          id="rationale"
          name="rationale"
          maxLength={5000}
          rows={4}
          defaultValue={decision?.rationale ?? ""}
          placeholder="Why was this decision made?"
          aria-invalid={
            Boolean(state?.fieldErrors?.rationale?.length) || undefined
          }
        />
        <FieldError messages={state?.fieldErrors?.rationale} />
      </div>

      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <Label htmlFor="status">Status</Label>
        <Select
          id="status"
          name="status"
          defaultValue={decision?.status ?? "proposed"}
          aria-invalid={
            Boolean(state?.fieldErrors?.status?.length) || undefined
          }
        >
          {DECISION_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
        <FieldError messages={state?.fieldErrors?.status} />
      </div>

      <Button type="submit" disabled={pending} className="self-start">
        {pending
          ? isEdit
            ? "Saving…"
            : "Creating…"
          : isEdit
            ? "Save changes"
            : "Create decision"}
      </Button>
    </form>
  );
}
