"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  attachComponentToTask,
  attachDecisionToTask,
  attachEndpointToTask,
  attachEntityToTask,
  attachRequirementToTask,
  attachUiScreenToTask,
} from "@/lib/tasks/traceability/actions";

type ArtifactKind =
  | "requirement"
  | "decision"
  | "entity"
  | "component"
  | "endpoint"
  | "screen";

export function AttachArtifactForm({
  kind,
  taskId,
  available,
}: {
  kind: ArtifactKind;
  taskId: string;
  available: { id: string; label: string; secondary?: string }[];
}) {
  const [, startTransition] = useTransition();
  if (available.length === 0) {
    return (
      <p className="text-xs text-[var(--muted-foreground)]">
        Nothing available to attach.
      </p>
    );
  }

  const fieldName = (() => {
    switch (kind) {
      case "requirement":
        return "requirementId";
      case "decision":
        return "decisionId";
      case "entity":
        return "entityId";
      case "component":
        return "componentId";
      case "endpoint":
        return "endpointId";
      case "screen":
        return "screenId";
    }
  })();

  function handle(formData: FormData) {
    startTransition(async () => {
      const action = (() => {
        switch (kind) {
          case "requirement":
            return attachRequirementToTask;
          case "decision":
            return attachDecisionToTask;
          case "entity":
            return attachEntityToTask;
          case "component":
            return attachComponentToTask;
          case "endpoint":
            return attachEndpointToTask;
          case "screen":
            return attachUiScreenToTask;
        }
      })();
      const r = await action(formData);
      if (r && "error" in r && r.error) {
        alert(r.error);
      }
    });
  }

  return (
    <form action={handle} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="taskId" value={taskId} />
      <div className="flex flex-col gap-1">
        <label
          className="text-xs font-medium"
          htmlFor={`attach-${kind}-select`}
        >
          {labelForKind(kind)}
        </label>
        <Select id={`attach-${kind}-select`} name={fieldName} required>
          <option value="">Select…</option>
          {available.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
              {a.secondary ? ` (${a.secondary})` : ""}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" size="sm">
        Attach
      </Button>
    </form>
  );
}

function labelForKind(k: ArtifactKind): string {
  switch (k) {
    case "requirement":
      return "Requirement";
    case "decision":
      return "Decision";
    case "entity":
      return "Domain entity";
    case "component":
      return "Architecture component";
    case "endpoint":
      return "API endpoint";
    case "screen":
      return "UI screen";
  }
}
