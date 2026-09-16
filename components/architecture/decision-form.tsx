"use client";

import { useActionState } from "react";

import { createArchitectureDecision } from "@/lib/architecture/decisions/actions";
import { Alert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  ARCHITECTURE_DECISION_STATUSES,
  type ArchitectureDecision,
} from "@/lib/supabase/types";
import type { ArchitectureDecisionActionState } from "@/lib/validation/architecture/decisions";

const initialState: ArchitectureDecisionActionState | null = null;

export function ArchitectureDecisionForm({
  projectId,
  decision,
}: {
  projectId: string;
  decision?: ArchitectureDecision;
}) {
  const [state, formAction, pending] = useActionState(
    createArchitectureDecision,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state?.error ? <Alert variant="error">{state.error}</Alert> : null}

      <input type="hidden" name="projectId" value={projectId} />
      {decision ? <input type="hidden" name="id" value={decision.id} /> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={decision?.title ?? ""}
          aria-invalid={Boolean(state?.fieldErrors?.title?.length) || undefined}
        />
        <FieldError messages={state?.fieldErrors?.title} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="status">Status</Label>
        <Select
          id="status"
          name="status"
          defaultValue={decision?.status ?? "proposed"}
          aria-invalid={
            Boolean(state?.fieldErrors?.status?.length) || undefined
          }
        >
          {ARCHITECTURE_DECISION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <FieldError messages={state?.fieldErrors?.status} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="context">Context</Label>
        <Textarea
          id="context"
          name="context"
          rows={3}
          defaultValue={decision?.context ?? ""}
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
          rows={3}
          defaultValue={decision?.decision ?? ""}
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
          rows={3}
          defaultValue={decision?.rationale ?? ""}
          aria-invalid={
            Boolean(state?.fieldErrors?.rationale?.length) || undefined
          }
        />
        <FieldError messages={state?.fieldErrors?.rationale} />
      </div>

      <Button type="submit" disabled={pending} className="mt-1">
        {pending
          ? "Saving…"
          : decision
            ? "Save changes"
            : "Create decision"}
      </Button>
    </form>
  );
}
