"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteProjectButton({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);
    const { deleteProject } = await import("@/lib/projects/actions");
    const fd = new FormData();
    fd.set("id", projectId);
    startTransition(async () => {
      const result = await deleteProject(fd);
      if (result && "error" in result && result.error) {
        setError(result.error);
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="danger"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={`Delete project ${projectName}`}
      >
        Delete
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete "${projectName}"?`}
        description={
          <>
            This permanently removes the project and all its requirements,
            decisions, domains, architecture, API design, UI design, and tasks.
            This cannot be undone.
          </>
        }
        confirmLabel="Delete project"
        typeToConfirm={projectName}
        pending={pending}
        onConfirm={handleConfirm}
      />

      {error ? (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
