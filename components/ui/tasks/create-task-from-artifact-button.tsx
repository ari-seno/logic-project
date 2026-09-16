"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { createTaskFromArtifact } from "@/lib/tasks/template-actions";
import type { ArtifactKind } from "@/lib/tasks/templates";

export function CreateTaskFromArtifactButton({
  kind,
  refId,
  projectId,
  children,
}: {
  kind: ArtifactKind;
  refId: string;
  projectId: string;
  children?: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();

  function handle(formData: FormData) {
    startTransition(async () => {
      const r = await createTaskFromArtifact(formData);
      if (r && "error" in r && r.error) {
        alert(r.error);
      }
    });
  }

  return (
    <form action={handle} className="inline-block">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="refId" value={refId} />
      <input type="hidden" name="projectId" value={projectId} />
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? "Creating…" : children ?? "Create task"}
      </Button>
    </form>
  );
}
